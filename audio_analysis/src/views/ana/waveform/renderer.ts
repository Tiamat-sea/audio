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
    private lastContainerWidth = 0 // 最后一次（个）容器宽度
    private isDragging = false // 是否拖拽中

    constructor(options: WaveFormOptions, audioElement?: HTMLElement) { // 构造函数，传入波形选项和音频元素
        super() // 调用父类构造函数

        this.options = options // 波形选项

        const parent = this.parentFromOptionsContainer(options.container) // 从选项中获取父元素
        this.parent = parent // 父元素赋值

        const [div, shadow] = this.initHTML() // 初始化 HTML
        parent.appendChild(div) // 将 div 附加到父元素
        this.container = div // 容器赋值
        this.scrollContainer = shadow.querySelector('.scroll') as HTMLElement // 滚动容器赋值
        this.wrapper = shadow.querySelector('.wrapper') as HTMLElement // 包装器赋值
        this.canvasWrapper = shadow.querySelector('.canvases') as HTMLElement // 画布包装器赋值
        this.progressWrapper = shadow.querySelector('.progress') as HTMLElement // 进度包装器赋值
        this.cursor = shadow.querySelector('.cursor') as HTMLElement // 光标赋值

        if (audioElement) {
            shadow.appendChild(audioElement) // 将音频元素附加到 shadow
        }

        this.initEvents() // 初始化事件
    }

    private parentFromOptionsContainer(container: WaveFormOptions['container']) { // 从选项中获取父元素，传入容器
        let parent
        if (typeof container === 'string') { // 如果容器是字符串
            parent = document.querySelector(container) as HTMLElement | null // 从文档中获取容器
        } else if (container instanceof HTMLElement) { // 如果容器是元素
            parent = container // 直接赋值
        }

        if (!parent) { // 如果没有父元素
            throw new Error('Container not found!') // 抛出错误
        }

        return parent // 返回父元素
    }

    private initEvents() { // 初始化事件
        const getClickPosition = (e: MouseEvent): [number, number] => { // 获取点击位置
            const rect = this.wrapper.getBoundingClientRect() // 获取包装器的矩形，方法返回一个 DOMRect 对象，其提供了元素的大小及其相对于视口的位置
            const x = e.clientX - rect.left // 获取 x 坐标
            const y = e.clientX - rect.left // 获取 y 坐标
            const relativeX = x / rect.width // 相对 x 坐标
            const relativeY = y / rect.height // 相对 y 坐标
            return [relativeX, relativeY] // 返回相对坐标
        }

        // 单击侦听器
        this.wrapper.addEventListener('click', (e) => { // 添加点击事件
            const [x, y] = getClickPosition(e) // 获取点击位置
            this.emit('click', x, y) // 发射点击事件
        })

        // 双击侦听器
        this.wrapper.addEventListener('dblclick', (e) => { // 添加双击事件
            const [x, y] = getClickPosition(e) // 获取点击位置
            this.emit('dblclick', x, y) // 发射双击事件
        })

        // 拖拽
        if (this.options.dragToSeek) { // 如果拖拽到搜索
            this.initDrag() // 初始化拖拽
        }

        // 滚动侦听器
        this.scrollContainer.addEventListener('scroll', () => { // 添加滚动事件
            const { scrollLeft, scrollWidth, clientWidth } = this.scrollContainer // 获取滚动左侧、滚动宽度、客户端宽度
            const startX = scrollLeft / scrollWidth // 开始 X
            const endX = (scrollLeft + clientWidth) / scrollWidth // 结束 X
            this.emit('scroll', startX, endX) // 发射滚动事件
        })

        // 容器调整大小时重新渲染波形
        const delay = this.createDelay(200) // 创建延迟，200 毫秒
        this.resizeObserver = new ResizeObserver(() => { // 创建调整大小观察者
            delay(() => this.onContainerResize()) // 延迟调整大小
        })
        this.resizeObserver.observe(this.scrollContainer) // 观察滚动容器
    }

    private onContainerResize() { // 容器调整大小
        const width = this.parent.clientWidth // 获取父元素宽度
        if (width === this.lastContainerWidth && this.options.height !== 'auto') return // 如果宽度相同且高度不是自动，返回
        this.lastContainerWidth = width // 最后一次容器宽度赋值
        this.reRender() // 重新渲染
    }

    private initDrag() { // 初始化拖拽
        makeDraggable( // 使可拖动
            this.wrapper, // 包装器
            // 拖拽
            (_, __, x) => {
                this.emit('drag', Math.max(0, Math.min(1, x / this.wrapper.getBoundingClientRect().width))) // 发射拖拽事件，限制在 0 到 1 之间，即相对位置，0 为左边，1 为右边，0.5 为中间
            },
            // 开始拖拽
            () => (this.isDragging = true), // 设置拖拽为 true，即拖拽中
            // 结束拖拽
            () => (this.isDragging = false), // 设置拖拽为 false，即拖拽结束
        )
    }

    private getHeight(optionsHeight?: WaveFormOptions['height']): number { // 获取高度
        const defaultHeight = 128 // 默认高度
        if (optionsHeight == null) return defaultHeight // 如果没有配置高度，返回默认高度
        if (!isNaN(Number(optionsHeight))) return Number(optionsHeight) // 如果是数字，返回数字
        if (optionsHeight === 'auto') return this.parent.clientHeight || defaultHeight // 如果是自动，返回父元素高度或默认高度
        return defaultHeight // 返回默认高度
    }

    private initHTML(): [HTMLElement, ShadowRoot] { // 初始化 HTML
        const div = document.createElement('div') // 创建 div 元素
        const shadow = div.attachShadow({ mode: 'open' }) // 创建 shadow 元素，附加到 div 上，模式为 open，定义了 shadow root 的内部实现是否可被 JavaScript 访问及修改 — 也就是说，该实现是否公开。

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
        ` // 设置样式，设置 HTML，包括滚动容器、包装器、画布包装器、进度包装器、光标

        return [div, shadow] // 返回 div 和 shadow
    }

    /** WaveForm 自己调用此方法，不要手动调用 */
    setOptions(options: WaveFormOptions) { // 设置选项
        if (this.options.container !== options.container) { // 如果容器不同
            const newParent = this.parentFromOptionsContainer(options.container) // 从选项中获取父元素
            newParent.appendChild(this.container) // 将容器附加到新父元素

            this.parent = newParent // 新父元素赋值
        }

        if (options.dragToSeek && !this.options.dragToSeek) { // 如果拖拽到搜索并且选项中没有拖拽到搜索
            this.initDrag() // 初始化拖拽
        }

        this.options = options // 选项赋值

        this.reRender() // 重新渲染波形
    }

    getWrapper(): HTMLElement { // 获取包装器
        return this.wrapper // 返回包装器
    }

    getScroll(): number { // 获取滚动
        return this.scrollContainer.scrollLeft // 返回滚动左侧
    }

    destroy() { // 销毁
        this.container.remove() // 移除容器
        this.resizeObserver?.disconnect() // 断开调整大小观察者
    }

    private createDelay(delayMs = 10): (fn: () => void) => void { // 创建延迟，传入延迟时间，默认 10 毫秒，返回一个函数，传入一个函数
        const context: { timeout?: ReturnType<typeof setTimeout> } = {} // 上下文，超时，延迟，设置为一个空对象
        this.timeouts.push(context) // 超时数组添加上下文
        return (callback: () => void) => { // 返回一个函数，传入一个回调函数
            context.timeout && clearTimeout(context.timeout) // 如果超时存在，清除超时
            context.timeout = setTimeout(callback, delayMs) // 超时设置为延迟时间
        }
    }

    // 将颜色值数组转换为线性渐变
    private convertColorValues(color?: WaveFormOptions['waveColor']): string | CanvasGradient { // 将颜色值转换为线性渐变
        if (!Array.isArray(color)) return color || '' // 如果不是数组，返回颜色或空字符串
        if (color.length < 2) return color[0] || '' // 如果长度小于 2，返回第 0 个颜色或空字符串

        const canvasElement = document.createElement('canvas') // 创建画布元素
        const ctx = canvasElement.getContext('2d') as CanvasRenderingContext2D // 获取 2d 上下文
        const gradientHeight = canvasElement.height * (window.devicePixelRatio || 1) // 渐变高度
        const gradient = ctx.createLinearGradient(0, 0, 0, gradientHeight) // 创建线性渐变

        const colorStopPercentage = 1 / (color.length - 1) // 颜色停止百分比
        color.forEach((color, index) => { // 遍历颜色
            const offset = index * colorStopPercentage // 偏移，颜色停止百分比，即每个颜色的偏移
            gradient.addColorStop(offset, color) // 添加颜色停止
        })

        return gradient // 返回线性渐变颜色
    }

    private renderLineWaveForm( // 渲染多段线样式的波形
        channelData: Array<Float32Array | number[]>, // 通道数据
        _options: WaveFormOptions, // 选项
        ctx: CanvasRenderingContext2D, // canvas 2d 上下文
        vScale: number, // 垂直缩放
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