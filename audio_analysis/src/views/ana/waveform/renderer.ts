import EventEmitter from "./event-emitter"
import { type WaveFormOptions } from "./waveform"
import { makeDraggable } from './draggable'

type RendererEvents = { // 渲染器事件类型
    click: [relativeX: number, relativeY: number] // 点击事件
    dblclick: [relativeX: number, relativeY: number] // 双击事件
    drag: [relativeX: number] // 拖拽事件
    scroll: [relativeStart: number, relativeEnd: number] // 滚动事件
    render: [] // 渲染事件
}

class Renderer extends EventEmitter<RendererEvents> { // 渲染器类，继承自事件发射器
    private static MAX_CANVAS_WIDTH = 4000 // 最大画布宽度
    private options: WaveFormOptions // 波形选项
    private parent: HTMLElement // 父元素
    private container: HTMLElement // 容器
    private scrollContainer: HTMLElement // 滚动容器
    private wrapper: HTMLElement // 包装器
    private canvasWrapper: HTMLElement // 画布包装器
    private progressWrapper: HTMLElement // 进度包装器
    private cursor: HTMLElement // 光标
    private timeouts: Array<{ timeout?: ReturnType<typeof setTimeout> }> = [] // 超时
    private isScrollable = false // 是否可滚动
    private audioData: AudioBuffer | null = null // 音频数据
    private resizeObserver: ResizeObserver | null = null // 调整大小观察者
    private lastContainerWidth = 0 // 上一个容器宽度
    private isDragging = false // 是否拖拽中

    constructor(options: WaveFormOptions, audioElement?: HTMLElement) { // 构造函数，传入波形选项和音频元素
        super()

        this.options = options

        const parent = this.parentFromOptionsContainer(options.container)
        this.parent = parent

        const [div, shadow] = this.initHTML()
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
            parent = document.querySelector(container) as HTMLElement | null
        } else if (container instanceof HTMLElement) {
            parent = container
        }

        if (!parent) {
            throw new Error('Container not found!')
        }

        return parent
    }

    private initEvents() {
        const getClickPosition = (e: MouseEvent): [number, number] => {
            const rect = this.wrapper.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientX - rect.left
            const relativeX = x / rect.width
            const relativeY = y / rect.height
            return [relativeX, relativeY]
        }

        // 单击侦听器
        this.wrapper.addEventListener('click', (e) => {
            const [x, y] = getClickPosition(e)
            this.emit('click', x, y)
        })

        // 双击侦听器
        this.wrapper.addEventListener('dblclick', (e) => {
            const [x, y] = getClickPosition(e)
            this.emit('dblclick', x, y)
        })

        // 拖拽
        if (this.options.dragToSeek) {
            this.initDrag()
        }

        // 滚动侦听器
        this.scrollContainer.addEventListener('scroll', () => {
            const { scrollLeft, scrollWidth, clientWidth } = this.scrollContainer
            const startX = scrollLeft / scrollWidth
            const endX = (scrollLeft + clientWidth) / scrollWidth
            this.emit('scroll', startX, endX)
        })

        // 容器调整大小时重新渲染波形
        const delay = this.createDelay(100)
        this.resizeObserver = new ResizeObserver(() => {
            delay(() => this.onContainerResize())
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
            // 拖拽
            (_, __, x) => {
                this.emit('drag', Math.max(0, Math.min(1, x / this.wrapper.getBoundingClientRect().width)))
            },
            // 开始拖拽
            () => (this.isDragging = true),
            // 结束拖拽
            () => (this.isDragging = false),
        )
    }

    private getHeight(optionsHeight?: WaveFormOptions['height']): number {
        const defaultHeight = 128
        if (optionsHeight == null) return defaultHeight
        if (!isNaN(Number(optionsHeight))) return Number(optionsHeight)
        if (optionsHeight === 'auto') return this.parent.clientHeight || defaultHeight
        return defaultHeight
    }

    private initHTML(): [HTMLElement, ShadowRoot] {
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

    /** WaveForm 自己调用此方法，不要手动调用 */
    setOptions(options: WaveFormOptions) {
        if (this.options.container !== options.container) {
            const newParent = this.parentFromOptionsContainer(options.container)
            newParent.appendChild(this.container)

            this.parent = newParent
        }

        if (options.dragToSeek && !this.options.dragToSeek) {
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

    destroy() {
        this.container.remove()
        this.resizeObserver?.disconnect()
    }

    private createDelay(delayMs = 10): (fn: () => void) => void {
        const context: { timeout?: ReturnType<typeof setTimeout> } = {}
        this.timeouts.push(context)
        return (callback: () => void) => {
            context.timeout && clearTimeout(context.timeout)
            context.timeout = setTimeout(callback, delayMs)
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

    private renderLineWaveForm(
        channelData: Array<Float32Array | number[]>,
        _options: WaveFormOptions,
        ctx: CanvasRenderingContext2D,
        vScale: number,
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
            for (let i = 0; i <= length; ++i) {
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

        ctx.beginPath()

        drawChannel(0)
        drawChannel(1)

        ctx.stroke()
        ctx.fill()
        ctx.closePath()
    }

    private renderWaveform(
        channelData: Array<Float32Array | number[]>,
        options: WaveFormOptions,
        ctx: CanvasRenderingContext2D,
    ) {
        ctx.fillStyle = this.convertColorValues(options.waveColor)

        // 自定义渲染方法
        if (options.renderFunction) {
            options.renderFunction(channelData, ctx)
            return
        }

        // 垂直缩放
        let vScale = 1
        if (options.normalize) {
            const max = Array.from(channelData[0]).reduce((max, value) => Math.max(max, Math.abs(value)), 0)
            vScale = max ? 1 / max : 1
        }

        // 渲染波形为多段线
        this.renderLineWaveForm(channelData, options, ctx, vScale)
    }

    private renderSingleCanvas(
        channelData: Array<Float32Array | number[]>,
        options: WaveFormOptions,
        width: number,
        height: number,
        start: number,
        end: number,
        canvasContainer: HTMLElement,
        progressContainer: HTMLElement,
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

        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

        this.renderWaveform(
            channelData.map((channel) => channel.slice(start, end)),
            options,
            ctx,
        )

        // 绘制进度画布
        if (canvas.width > 0 && canvas.height > 0) {
            const progressCanvas = canvas.cloneNode() as HTMLCanvasElement
            const progressCtx = progressCanvas.getContext('2d') as CanvasRenderingContext2D
            progressCtx.drawImage(canvas, 0, 0)
            // 将合成方法设置为仅在绘制波形的位置绘制
            progressCtx.globalCompositeOperation = 'source-in'
            progressCtx.fillStyle = this.convertColorValues(options.progressColor)
            // 矩形因合成方法起到了遮罩的作用
            progressCtx.fillRect(0, 0, canvas.width, canvas.height)
            progressContainer.appendChild(progressCanvas)
        }
    }

    private renderChannel(channelData: Array<Float32Array | number[]>, options: WaveFormOptions, width: number) {
        // canvases 容器
        const canvasContainer = document.createElement('div')
        const height = this.getHeight(options.height)
        canvasContainer.style.height = `${height}px`
        this.canvasWrapper.style.minHeight = `${height}px`
        this.canvasWrapper.appendChild(canvasContainer)

        // 进度 canvases 容器
        const progressContainer = canvasContainer.cloneNode() as HTMLElement
        this.progressWrapper.appendChild(progressContainer)

        // 决定当前能够看到的波形部分
        const { scrollLeft, scrollWidth, clientWidth } = this.scrollContainer
        const len = channelData[0].length
        const scale = len / scrollWidth

        let viewportWidth = Math.min(Renderer.MAX_CANVAS_WIDTH, clientWidth)

        const start = Math.floor(Math.abs(scrollLeft) * scale)
        const end = Math.floor(start + viewportWidth * scale)
        const viewportLen = end - start

        // 从开始峰值到结束峰值绘制一部分波形
        const draw = (start: number, end: number) => {
            this.renderSingleCanvas(
                channelData,
                options,
                width,
                height,
                Math.max(0, start),
                Math.min(end, len),
                canvasContainer,
                progressContainer,
            )
        }

        // 在视图块中绘制波形，每个块都有延迟
        const headDelay = this.createDelay()
        const tailDelay = this.createDelay()
        const renderHead = (fromIndex: number, toIndex: number) => {
            draw(fromIndex, toIndex)
            if (fromIndex > 0) {
                headDelay(() => {
                    renderHead(fromIndex - viewportLen, toIndex - viewportLen)
                })
            }
        }
        const renderTail = (fromIndex: number, toIndex: number) => {
            draw(fromIndex, toIndex)
            if (toIndex < len) {
                tailDelay(() => {
                    renderTail(fromIndex + viewportLen, toIndex + viewportLen)
                })
            }
        }

        renderHead(start, end)
        if (end < len) {
            renderTail(end, end + viewportLen)
        }
    }

    render(audioData: AudioBuffer) {
        // 清除先前的超时设定
        this.timeouts.forEach((context) => context.timeout && clearTimeout(context.timeout))
        this.timeouts = []

        // 清除 canvases
        this.canvasWrapper.innerHTML = ''
        this.progressWrapper.innerHTML = ''

        // 宽度
        if (this.options.width != null) {
            this.scrollContainer.style.width =
                typeof this.options.width === 'number' ? `${this.options.width}px` : this.options.width
        }

        // 决定 waveform 的宽度
        const pixelRatio = window.devicePixelRatio || 1
        const parentWidth = this.scrollContainer.clientWidth
        const scrollWidth = Math.ceil(audioData.duration * (this.options.minPxPerSec || 0))

        // 容器是否能够滚动
        this.isScrollable = scrollWidth > parentWidth
        const useParentWidth = this.options.fillParent && !this.isScrollable
        // 波形的宽度（像素）
        const width = (useParentWidth ? parentWidth : scrollWidth) * pixelRatio

        // 设置 wrapper 的宽度
        this.wrapper.style.width = useParentWidth ? '100%' : `${scrollWidth}px`

        // 设置附加样式
        this.scrollContainer.style.overflowX = this.isScrollable ? 'auto' : 'hidden'
        this.scrollContainer.classList.toggle('noScrollbar', !!this.options.hideScrollbar)
        this.cursor.style.backgroundColor = `${this.options.cursorColor || this.options.progressColor}`
        this.cursor.style.width = `${this.options.cursorWidth}px`

        // 渲染波形
        if (this.options.splitChannels) {
            // 为每个通道渲染一个波形
            for (let i = 0; i < audioData.numberOfChannels; ++i) {
                const options = { ...this.options, ...this.options.splitChannels[i] }
                this.renderChannel([audioData.getChannelData(i)], options, width)
            }
        } else {
            // 为前两个通道渲染一个的波形（通常是左右声道），即将两个通道渲染在一个波形图中
            const channels = [audioData.getChannelData(0)]
            if (audioData.numberOfChannels > 1) channels.push(audioData.getChannelData(1))
            this.renderChannel(channels, this.options, width)
        }

        this.audioData = audioData

        this.emit('render')
    }

    reRender() {
        // 如果波形尚未渲染则return
        if (!this.audioData) return

        // 记住当前指针位置
        const { scrollWidth } = this.scrollContainer
        const oldCursorPosition = this.progressWrapper.clientWidth

        // 重新渲染波形
        this.render(this.audioData)

        // 调整滚动位置，使光标保持在同一位置
        if (this.isScrollable && scrollWidth !== this.scrollContainer.scrollWidth) {
            const newCursorPosition = this.progressWrapper.clientWidth
            this.scrollContainer.scrollLeft += newCursorPosition - oldCursorPosition
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
            // 拖动靠近视图边缘时滚动
            const minGap = 30
            if (progressWidth + minGap > endEdge) {
                this.scrollContainer.scrollLeft += minGap
            } else if (progressWidth - minGap < startEdge) {
                this.scrollContainer.scrollLeft -= minGap
            }
        } else {
            if (progressWidth < startEdge || progressWidth > endEdge) {
                this.scrollContainer.scrollLeft = progressWidth - (this.options.autoCenter ? middle : 0)
            }

            // 播放时保持光标居中
            const center = progressWidth - scrollLeft - middle
            if (isPlaying && this.options.autoCenter && center > 0) {
                this.scrollContainer.scrollLeft += Math.min(center, 10)
            }
        }

        // 发射 scroll 事件
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
        this.canvasWrapper.style.clipPath = `polygon(${percents}%0, 100% 0, 100% 100%,${percents}% %100)`
        this.progressWrapper.style.width = `${percents}%`
        this.cursor.style.left = `${percents}%`
        this.cursor.style.marginLeft = Math.round(percents) === 100 ? `-${this.options.cursorWidth}px` : ''

        if (this.isScrollable && this.options.autoScroll) {
            this.scrollIntoView(progress, isPlaying)
        }
    }

    async exportImage(format: string, quality: number, type: 'dataURL' | 'blob'): Promise<string[] | Blob[]> {
        const canvases = this.canvasWrapper.querySelectorAll('canvas')
        if (!canvases.length) {
            throw new Error('No waveform data!')
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
                            blob ? resolve(blob) : reject(new Error('Could not export image!'))
                        },
                        format,
                        quality,
                    )
                })
            }),
        )
    }
}

export default Renderer