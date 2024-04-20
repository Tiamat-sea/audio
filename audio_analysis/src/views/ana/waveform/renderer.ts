import { makeDraggable } from './draggable'
import EventEmitter from './event-emitter'
import type { WaveFormOptions } from './waveform'
import { drawWaveformByWebGL } from './webgl'

type RendererEvents = {
    click: [relativeX: number, relativeY: number]
    dblclick: [relativeX: number, relativeY: number]
    drag: [relativeX: number]
    dragstart: [relativeX: number]
    dragend: [relativeX: number]
    scroll: [relativeStart: number, relativeEnd: number]
    render: []
    rendered: []
}

class Renderer extends EventEmitter<RendererEvents> {
    private static MAX_CANVAS_WIDTH = 4000
    private options: WaveFormOptions
    private parent: HTMLElement
    private container: HTMLElement
    private scrollContainer: HTMLElement
    private wrapper: HTMLElement
    private canvasWrapper: HTMLElement
    private progressWrapper: HTMLElement
    private cursor: HTMLElement
    private timeouts: Array<() => void> = []
    private isScrollable = false
    private audioData: AudioBuffer | null = null
    private resizeObserver: ResizeObserver | null = null
    private lastContainerWidth = 0
    private isDragging = false

    constructor(options: WaveFormOptions, audioElement?: HTMLElement) {
        super()

        this.options = options

        const parent = this.parentFromOptionsContainer(options.container)
        this.parent = parent

        const [div, shadow] = this.initHtml()
        parent.appendChild(div)
        this.container = div
        this.scrollContainer = shadow.querySelector('.scroll') as HTMLElement
        this.wrapper = shadow.querySelector('.wrapper') as HTMLElement
        this.canvasWrapper = shadow.querySelector('.canvases') as HTMLElement
        this.progressWrapper = shadow.querySelector('.progress') as HTMLElement
        this.cursor = shadow.querySelector('.cursor') as HTMLElement

        if (audioElement) {
            shadow.appendChild(audioElement)
        }

        this.initEvents()
    }

    private parentFromOptionsContainer(container: WaveFormOptions['container']) {
        let parent
        if (typeof container === 'string') {
            parent = document.querySelector(container) satisfies HTMLElement | null
        } else if (container instanceof HTMLElement) {
            parent = container
        }

        if (!parent) {
            throw new Error('Container not found')
        }

        return parent
    }

    private initEvents() {
        const getClickPosition = (e: MouseEvent): [number, number] => {
            const rect = this.wrapper.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            const relativeX = x / rect.width
            const relativeY = y / rect.height
            return [relativeX, relativeY]
        }

        // 添加点击事件监听器
        this.wrapper.addEventListener('click', (e) => {
            const [x, y] = getClickPosition(e)
            this.emit('click', x, y)
        })

        // 添加双击事件监听器
        this.wrapper.addEventListener('dblclick', (e) => {
            const [x, y] = getClickPosition(e)
            this.emit('dblclick', x, y)
        })

        // 拖动
        if (this.options.dragToSeek === true || typeof this.options.dragToSeek === 'object') {
            this.initDrag()
        }

        // 添加滚动事件监听器
        this.scrollContainer.addEventListener('scroll', () => {
            const { scrollLeft, scrollWidth, clientWidth } = this.scrollContainer
            const startX = scrollLeft / scrollWidth
            const endX = (scrollLeft + clientWidth) / scrollWidth
            this.emit('scroll', startX, endX)
        })

        // 在容器大小改变时重新渲染波形图
        const delay = this.createDelay(100)
        this.resizeObserver = new ResizeObserver(() => {
            delay()
                .then(() => this.onContainerResize())
                .catch(() => undefined)
        })
        this.resizeObserver.observe(this.scrollContainer)
    }

    private onContainerResize() {
        const width = this.parent.clientWidth
        if (width === this.lastContainerWidth && this.options.height !== 'auto') return
        this.lastContainerWidth = width
        this.reRender()
    }

    private initDrag() {
        makeDraggable(
            this.wrapper,
            // 拖拽时
            (_, __, x) => {
                this.emit(
                    'drag',
                    Math.max(0, Math.min(1, x / this.wrapper.getBoundingClientRect().width))
                )
            },
            // 开始拖拽时
            (x) => {
                this.isDragging = true
                this.emit(
                    'dragstart',
                    Math.max(0, Math.min(1, x / this.wrapper.getBoundingClientRect().width))
                )
            },
            // 结束拖拽时
            (x) => {
                this.isDragging = false
                this.emit(
                    'dragend',
                    Math.max(0, Math.min(1, x / this.wrapper.getBoundingClientRect().width))
                )
            }
        )
    }

    private getHeight(optionsHeight?: WaveFormOptions['height']): number {
        const defaultHeight = 128
        if (optionsHeight == null) return defaultHeight
        if (!isNaN(Number(optionsHeight))) return Number(optionsHeight)
        if (optionsHeight === 'auto') return this.parent.clientHeight || defaultHeight
        return defaultHeight
    }

    private initHtml(): [HTMLElement, ShadowRoot] {
        const div = document.createElement('div')
        const shadow = div.attachShadow({ mode: 'open' })

        shadow.innerHTML = `
            <style>
                :host {
                    user-select: none;
                    min-width: 1px;
                }
                :host audio {
                    display: block;
                    width: 100%;
                }
                :host .scroll {
                    overflow-x: auto;
                    overflow-y: hidden;
                    width: 100%;
                    position: relative;
                }
                :host .noScrollbar {
                    scrollbar-color: transparent;
                    scrollbar-width: none;
                }
                :host .noScrollbar::-webkit-scrollbar {
                    display: none;
                    -webkit-appearance: none;
                }
                :host .wrapper {
                    position: relative;
                    overflow: visible;
                    z-index: 2;
                }
                :host .canvases {
                    min-height: ${this.getHeight(this.options.height)}px;
                }
                :host .canvases > div {
                    position: relative;
                }
                :host canvas {
                    display: block;
                    position: absolute;
                    top: 0;
                    image-rendering: pixelated;
                }
                :host .progress {
                    pointer-events: none;
                    position: absolute;
                    z-index: 2;
                    top: 0;
                    left: 0;
                    width: 0;
                    height: 100%;
                    overflow: hidden;
                }
                :host .progress > div {
                    position: relative;
                }
                :host .cursor {
                    pointer-events: none;
                    position: absolute;
                    z-index: 5;
                    top: 0;
                    left: 0;
                    height: 100%;
                    border-radius: 2px;
                }
            </style>

            <div class="scroll" part="scroll">
                <div class="wrapper" part="wrapper">
                    <div class="canvases"></div>
                    <div class="progress" part="progress"></div>
                    <div class="cursor" part="cursor"></div>
                </div>
            </div>
        `

        return [div, shadow]
    }

    /** 波形本身调用此方法。请勿手动调用。 */
    setOptions(options: WaveFormOptions) {
        if (this.options.container !== options.container) {
            const newParent = this.parentFromOptionsContainer(options.container)
            newParent.appendChild(this.container)

            this.parent = newParent
        }

        if (options.dragToSeek === true || typeof this.options.dragToSeek === 'object') {
            this.initDrag()
        }

        this.options = options

        // 重新渲染波形
        this.reRender()
    }

    getWrapper(): HTMLElement {
        return this.wrapper
    }

    getScroll(): number {
        return this.scrollContainer.scrollLeft
    }

    private setScroll(pixels: number) {
        this.scrollContainer.scrollLeft = pixels
    }

    setScrollPercentage(percent: number) {
        const { scrollWidth } = this.scrollContainer
        const scrollStart = scrollWidth * percent
        this.setScroll(scrollStart)
    }

    destroy() {
        this.container.remove()
        this.resizeObserver?.disconnect()
    }

    private createDelay(delayMs = 10): () => Promise<void> {
        let timeout: ReturnType<typeof setTimeout> | undefined
        let reject: (() => void) | undefined

        const onClear = () => {
            if (timeout) clearTimeout(timeout)
            if (reject) reject()
        }

        this.timeouts.push(onClear)

        return () => {
            return new Promise((resolveFn, rejectFn) => {
                onClear()
                reject = rejectFn
                timeout = setTimeout(() => {
                    timeout = undefined
                    reject = undefined
                    resolveFn()
                }, delayMs)
            })
        }
    }

    // 将颜色值数组转换为线性渐变
    private convertColorValues(color?: WaveFormOptions['waveColor']): string | CanvasGradient {
        if (!Array.isArray(color)) return color || ''
        if (color.length < 2) return color[0] || ''

        const canvasElement = document.createElement('canvas')
        const ctx = canvasElement.getContext('2d') as CanvasRenderingContext2D
        const gradientHeight = canvasElement.height * (window.devicePixelRatio || 1)
        const gradient = ctx.createLinearGradient(0, 0, 0, gradientHeight)

        const colorStopPercentage = 1 / (color.length - 1)
        color.forEach((color, index) => {
            const offset = index * colorStopPercentage
            gradient.addColorStop(offset, color)
        })

        return gradient
    }

    private renderLineWaveform(
        channelData: Array<Float32Array | number[]>,
        _options: WaveFormOptions,
        ctx: WebGLRenderingContext,
        vScale: number // 垂直缩放
    ) {
        const drawChannel = (index: number) => {
            const channel = channelData[index] || channelData[0]
            const length = channel.length
            const { height } = ctx.canvas
            const halfHeight = height / 2
            const hScale = ctx.canvas.width / length

            ctx.moveTo(0, halfHeight)

            let prevX = 0
            let max = 0
            for (let i = 0; i <= length; i++) {
                const x = Math.round(i * hScale)

                if (x > prevX) {
                    const h = Math.round(max * halfHeight * vScale) || 1
                    const y = halfHeight + h * (index === 0 ? -1 : 1)
                    ctx.lineTo(prevX, y)
                    prevX = x
                    max = 0
                }

                const value = Math.abs(channel[i] || 0)
                if (value > max) max = value
            }

            ctx.lineTo(prevX, halfHeight)
        }
        console.log('channelData', channelData)

        ctx.beginPath()

        drawChannel(0)
        drawChannel(1)

        // ctx.stroke()
        ctx.fill()
        ctx.closePath()
    }

    private renderWaveform(
        channelData: Array<Float32Array | number[]>,
        options: WaveFormOptions,
        glCtx: WebGLRenderingContext
    ) {
        // 检查 WebGL 支持
        if (!glCtx) {
            alert('您的浏览器不支持 WebGL');
        }

        // 原来的 canvas 渲染波形颜色配置
        // glCtx.fillStyle = this.convertColorValues(options.waveColor)
        // glCtx.strokeStyle = this.convertColorValues(options.waveColor)

        // 自定义渲染函数
        if (options.renderFunction) {
            options.renderFunction(channelData, glCtx)
            return
        }

        // 垂直缩放
        let vScale = 1
        if (options.normalize) {
            const max = Array.from(channelData[0]).reduce( // reduce() 方法对数组中的每个元素执行一个由您提供的reducer函数(升序执行)，将其结果汇总为单个返回值。
                (max, value) => Math.max(max, Math.abs(value)),
                0
            )
            vScale = max ? 1 / max : 1
        }

        // 将波形渲染为折线
        this.renderLineWaveform(channelData, options, glCtx, vScale)
    }

    private renderSingleCanvas(
        channelData: Array<Float32Array | number[]>,
        options: WaveFormOptions,
        width: number,
        height: number,
        start: number,
        end: number,
        canvasContainer: HTMLElement,
        progressContainer: HTMLElement
    ) {
        const pixelRatio = window.devicePixelRatio || 1
        const canvas = document.createElement('canvas')
        const length = channelData[0].length
        canvas.width = Math.round((width * (end - start)) / length)
        canvas.height = height * pixelRatio
        canvas.style.width = `${Math.floor(canvas.width / pixelRatio)}px`
        canvas.style.height = `${height}px`
        canvas.style.left = `${Math.floor((start * width) / pixelRatio / length)}px`
        canvasContainer.appendChild(canvas)

        const glCtx = canvas.getContext('webgl') as WebGLRenderingContext

        this.renderWaveform(
            channelData.map((channel) => channel.slice(start, end)), // 截取波形数据，返回数组的一个部分的副本。
            options,
            glCtx
        )

        // 绘制进度画布
        if (canvas.width > 0 && canvas.height > 0) {
            const progressCanvas = canvas.cloneNode() as HTMLCanvasElement
            const progressCtx = progressCanvas.getContext('2d') as CanvasRenderingContext2D
            progressCtx.drawImage(canvas, 0, 0)
            // 将组合方法设置为仅在绘制波形的位置绘制
            progressCtx.globalCompositeOperation = 'source-in' // source-in: 只在源图像和目标图像重叠的地方绘制源图像。目标图像保留。
            progressCtx.fillStyle = this.convertColorValues(options.progressColor)
            // 这个矩形作为一个遮罩，得益于合成方法
            progressCtx.fillRect(0, 0, canvas.width, canvas.height)
            progressContainer.appendChild(progressCanvas)
        }
    }

    private async renderChannel(
        channelData: Array<Float32Array | number[]>,
        options: WaveFormOptions,
        width: number
    ): Promise<void> {
        // 一个用于画布的容器
        const canvasContainer = document.createElement('div')
        const height = this.getHeight(options.height)
        canvasContainer.style.height = `${height}px`
        this.canvasWrapper.style.minHeight = `${height}px`
        this.canvasWrapper.appendChild(canvasContainer)

        // 一个用于进度画布的容器
        const progressContainer = canvasContainer.cloneNode() as HTMLElement
        this.progressWrapper.appendChild(progressContainer)

        const dataLength = channelData[0].length

        // 从起始峰值到结束峰值绘制波形的一部分
        const draw = (start: number, end: number) => {
            this.renderSingleCanvas(
                channelData,
                options,
                width,
                height,
                Math.max(0, start),
                Math.min(end, dataLength),
                canvasContainer,
                progressContainer
            )
        }

        // 绘制整个波形
        if (!this.isScrollable) {
            draw(0, dataLength)
            return
        }

        // 确定当前可见的波形部分
        const { scrollLeft, scrollWidth, clientWidth } = this.scrollContainer
        const scale = dataLength / scrollWidth

        let viewportWidth = Math.min(Renderer.MAX_CANVAS_WIDTH, clientWidth)

        const start = Math.floor(Math.abs(scrollLeft) * scale)
        const end = Math.floor(start + viewportWidth * scale)
        const viewportLen = end - start

        if (viewportLen <= 0) {
            return
        }

        // 绘制可见部分的波形，修正：传入 0 及 dataLength 直接绘制整个波形
        draw(0, dataLength)

        // 将波形分块绘制，每块大小与视口相同，从视口位置开始绘制波形
        // await Promise.all([
        //     // 在视口左侧绘制块
        //     (async () => {
        //         if (start === 0) return
        //         const delay = this.createDelay()
        //         for (let i = start; i >= 0; i -= viewportLen) {
        //             await delay()
        //             draw(Math.max(0, i - viewportLen), i)
        //         }
        //     })(),
        //     // 在视口右侧绘制块
        //     (async () => {
        //         if (end === dataLength) return
        //         const delay = this.createDelay()
        //         for (let i = end; i < dataLength; i += viewportLen) {
        //             await delay()
        //             draw(i, Math.min(dataLength, i + viewportLen))
        //         }
        //     })()
        // ])
    }

    async render(audioData: AudioBuffer) {
        // 清除先前的定时器
        this.timeouts.forEach((clear) => clear())
        this.timeouts = []

        // 清除画布内容
        this.canvasWrapper.innerHTML = ''
        this.progressWrapper.innerHTML = ''

        // 宽度
        if (this.options.width != null) {
            this.scrollContainer.style.width =
                typeof this.options.width === 'number'
                    ? `${this.options.width}px`
                    : this.options.width
        }

        // 确定波形的宽度
        const pixelRatio = window.devicePixelRatio || 1
        const parentWidth = this.scrollContainer.clientWidth
        const scrollWidth = Math.ceil(audioData.duration * (this.options.minPxPerSec || 0))

        // 容器是否应该滚动
        this.isScrollable = scrollWidth > parentWidth
        const useParentWidth = this.options.fillParent && !this.isScrollable
        // 波形的像素宽度
        const width = (useParentWidth ? parentWidth : scrollWidth) * pixelRatio

        // 设置包装器的宽度
        this.wrapper.style.width = useParentWidth ? '100%' : `${scrollWidth}px`

        // 设置额外的样式
        this.scrollContainer.style.overflowX = this.isScrollable ? 'auto' : 'hidden'
        this.scrollContainer.classList.toggle('noScrollbar', !!this.options.hideScrollbar)
        this.cursor.style.backgroundColor = `${this.options.cursorColor || this.options.progressColor}`
        this.cursor.style.width = `${this.options.cursorWidth}px`

        this.audioData = audioData

        this.emit('render')

        // 渲染波形
        try {
            if (this.options.splitChannels) {   // 分通道绘制
                // 为每个通道渲染单独的波形
                await Promise.all(
                    Array.from({ length: audioData.numberOfChannels }).map((_, i) => {
                        const options = { ...this.options, ...this.options.splitChannels?.[i] }
                        return this.renderChannel([audioData.getChannelData(i)], options, width)
                    })
                )
            } else {    // 单图像走 else 分支，正常情况下只会走这个分支
                // 渲染第一和第二个通道（左声道和右声道）的单个波形
                const channels = [audioData.getChannelData(0)]
                if (audioData.numberOfChannels > 1) channels.push(audioData.getChannelData(1))
                await this.renderChannel(channels, this.options, width)
            }
        } catch {
            // 另一个渲染导致取消渲染
            return
        }

        this.emit('rendered')
    }

    reRender() {
        // 如果波形尚未渲染完成，则返回
        if (!this.audioData) return

        // 记住当前指针位置
        const { scrollWidth } = this.scrollContainer
        const { right: before } = this.progressWrapper.getBoundingClientRect()

        // 重新渲染波形
        this.render(this.audioData)

        // 调整滚动位置，使光标保持在同一位置
        if (this.isScrollable && scrollWidth !== this.scrollContainer.scrollWidth) {
            const { right: after } = this.progressWrapper.getBoundingClientRect()
            let delta = after - before
            // 为了限制浮点数累积误差
            // 我们需要四舍五入到离0最远的半个像素
            delta *= 2
            delta = delta < 0 ? Math.floor(delta) : Math.ceil(delta)
            delta /= 2
            this.scrollContainer.scrollLeft += delta
        }
    }

    zoom(minPxPerSec: number) {
        this.options.minPxPerSec = minPxPerSec
        this.reRender()
    }

    private scrollIntoView(progress: number, isPlaying = false) {
        const { scrollLeft, scrollWidth, clientWidth } = this.scrollContainer
        const progressWidth = progress * scrollWidth
        const startEdge = scrollLeft
        const endEdge = scrollLeft + clientWidth
        const middle = clientWidth / 2

        if (this.isDragging) {
            // 当拖动接近视口边缘时滚动
            const minGap = 30
            if (progressWidth + minGap > endEdge) {
                this.scrollContainer.scrollLeft += minGap
            } else if (progressWidth - minGap < startEdge) {
                this.scrollContainer.scrollLeft -= minGap
            }
        } else {
            if (progressWidth < startEdge || progressWidth > endEdge) {
                this.scrollContainer.scrollLeft =
                    progressWidth - (this.options.autoCenter ? middle : 0)
            }

            // 在播放时保持光标居中
            const center = progressWidth - scrollLeft - middle
            if (isPlaying && this.options.autoCenter && center > 0) {
                this.scrollContainer.scrollLeft += Math.min(center, 10)
            }
        }

        // 触发滚动事件
        {
            const newScroll = this.scrollContainer.scrollLeft
            const startX = newScroll / scrollWidth
            const endX = (newScroll + clientWidth) / scrollWidth
            this.emit('scroll', startX, endX)
        }
    }

    renderProgress(progress: number, isPlaying?: boolean) {
        if (isNaN(progress)) return
        const percents = progress * 100
        this.canvasWrapper.style.clipPath = `polygon(${percents}% 0, 100% 0, 100% 100%, ${percents}% 100%)`
        this.progressWrapper.style.width = `${percents}%`
        this.cursor.style.left = `${percents}%`
        this.cursor.style.transform = `translateX(-${Math.round(percents) === 100 ? this.options.cursorWidth : 0}px)`

        if (this.isScrollable && this.options.autoScroll) {
            this.scrollIntoView(progress, isPlaying)
        }
    }

    async exportImage(
        format: string,
        quality: number,
        type: 'dataURL' | 'blob'
    ): Promise<string[] | Blob[]> {
        const canvases = this.canvasWrapper.querySelectorAll('canvas')
        if (!canvases.length) {
            throw new Error('No waveform data')
        }

        // Data URLs
        if (type === 'dataURL') {
            const images = Array.from(canvases).map((canvas) => canvas.toDataURL(format, quality))
            return Promise.resolve(images)
        }

        // Blobs
        return Promise.all(
            Array.from(canvases).map((canvas) => {
                return new Promise<Blob>((resolve, reject) => {
                    canvas.toBlob(
                        (blob) => {
                            blob ? resolve(blob) : reject(new Error('Could not export image'))
                        },
                        format,
                        quality
                    )
                })
            })
        )
    }
}

export default Renderer
