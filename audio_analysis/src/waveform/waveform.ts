import type { GenericPlugin } from "./base-plugin"
import Decoder from "./decoder"
import Fetcher from "./fetcher"
import Player from "./player"
import Renderer from "./renderer"
import Timer from "./timer"
import WebAudioPlayer from "./webaudio"

export type WaveFormOptions = {
    /** 必需：渲染波形的 HTML 元素或选择器 */
    container: HTMLElement | string
    /** 波形的高度，以像素为单位，或者是 "auto" 以填充容器高度 */
    height?: number | 'auto'
    /** 波形的宽度，以像素或任何 CSS 值表示，默认为 100% */
    width?: number | string
    /** 波形的颜色 */
    waveColor?: string | string[] | CanvasGradient
    /** 进度遮罩的颜色 */
    progressColor?: string | string[] | CanvasGradient
    /** 播放光标的颜色 */
    cursorColor?: string
    /** 光标宽度 */
    cursorWidth?: number
    /** 如果配置, 波形将渲染为像这样的栅栏: ▁ ▂ ▇ ▃ ▅ ▂ */
    barWidth?: number
    /** 栅栏间距（像素） */
    barGap?: number
    /** 栅栏圆角 */
    barRadius?: number
    /** 波形的垂直缩放因子 */
    barHeight?: number
    /** 栅栏垂直对齐 */
    barAlign?: 'top' | 'bottom'
    /** 每秒音频的最小像素数（即缩放级别） */
    minPxPerSec?: number
    /** 拉伸波形以填充容器，默认为true */
    fillParent?: boolean
    /** 音频URL */
    url?: string
    /** 预计算的音频数据，每个通道的浮点数组 */
    peaks?: Array<Float32Array | number[]>
    /** 预计算的音频持续时间（秒） */
    duration?: number
    /** 使用现有的媒体元素，而不是再创建一个 */
    media?: HTMLMediaElement
    /** 是否显示默认的音频元素控件 */
    mediaControls?: boolean
    /** 加载时播放音频 */
    autoplay?: boolean
    /** 传递 false 以禁用波形上的点击 */
    interact?: boolean
    /** 允许拖动光标以查找到新的位置 */
    dragToSeek?: boolean
    /** 隐藏滚动条 */
    hideScrollbar?: boolean
    /** 音频速率，即播放速度 */
    audioRate?: number
    /** 自动滚动容器以保持视图中的当前位置 */
    autoScroll?: boolean
    /** 如果启用了 autoScroll ，则在播放期间将光标保持在波形中心 */
    autoCenter?: boolean
    /** 解码采样率，不影响播放，默认8000，DVD音质44100 */
    sampleRate?: number
    /** 为每个音频通道渲染单独的波形 */
    splitChannels?: Partial<WaveFormOptions>[]
    /** 将波形拉伸到最大高度 */
    normalize?: boolean
    /** 启动时要初始化的插件列表 */
    plugins?: GenericPlugin[]
    /** 自定义渲染方法 */
    renderFunction?: (peaks: Array<Float32Array | number[]>, ctx: CanvasRenderingContext2D) => void
    /** 传递给 fetch 方法的选项 */
    fetchParams?: RequestInit
    /** 播放要使用的框架，默认为 MediaElement */
    backend?: 'WebAudio' | 'MediaElement'
}

const defaultOptions = {
    waveColor: '#999',
    progressColor: '#555',
    cursorWidth: 1,
    minPxPerSec: 0,
    fillParent: true,
    interact: true,
    dragToSeek: false,
    autoScroll: true,
    autoCenter: true,
    sampleRate: 8000,
}

export type WaveFormEvents = {
    /** 波形图创建之后 */
    init: []
    /** 当音频开始加载 */
    load: [url: string]
    /** 音频加载期间 */
    loading: [percent: number]
    /** 当音频解码完成 */
    decode: [duration: number]
    /** 当音频解码完成且可以播放 */
    ready: [duration: number]
    /** 当波形绘制完成 */
    redraw: []
    /** 当音频开始播放 */
    play: []
    /** 当音频暂停时 */
    pause: []
    /** 当音频播放完毕 */
    finish: []
    /** 当音频位置发生变化时，在播放过程中连续触发 */
    timeupdate: [currentTime: number]
    /** timeupdate 的别名，但仅在音频播放时使用 */
    audioprocess: [currentTime: number]
    /** 当用户寻找新位置时 */
    seeking: [currentTime: number]
    /** 当用户与波形交互时（如：单击、双击或者拖动） */
    interaction: [newTime: number]
    /** 当用户在波形上单击时 */
    click: [relativeX: number, relativeY: number]
    /** 当用户在波形上双击时 */
    dbclick: [relativeX: number, relativeY: number]
    /** 当用户拖动指针时 */
    drag: [relativeX: number]
    /** 当波形滚动（平移）时 */
    scroll: [visibleStartTime: number, visibleEndTime: number]
    /** 当缩放级别改变时 */
    zoom: [minPxPerSec: number]
    /** 就在波形被销毁前，以便可以清理事件 */
    destroy: []
}

class WaveForm extends Player<WaveFormEvents>{
    public options: WaveFormOptions & typeof defaultOptions
    private renderer: Renderer
    private timer: Timer
    private plugins: GenericPlugin[] = []
    private decodedData: AudioBuffer | null = null
    protected subscriptions: Array<() => void> = []
    protected mediaSubscriptions: Array<() => void> = []

    /** 创建一个新的 WaveForm 实例 */
    public static create(options: WaveFormOptions) {
        return new WaveForm(options)
    }

    /** 创建一个新的 WaveForm 实例 */
    constructor(options: WaveFormOptions) {
        const media =
            options.media ||
            (options.backend === 'WebAudio' ? (new WebAudioPlayer() as unknown as HTMLAudioElement) : undefined)

        super({
            media,
            mediaControls: options.mediaControls,
            autoplay: options.autoplay,
            playbackRate: options.audioRate,
        })

        this.options = Object.assign({}, defaultOptions, options)
        this.timer = new Timer()

        const audioElement = media ? undefined : this.getMediaElement()
        this.renderer = new Renderer(this.options, audioElement)

        this.initPlayerEvents()
        this.initRendererEvents()
        this.initTimerEvents()
        this.initPlugins()

        // 初始化并加载异步以允许注册外部事件
        Promise.resolve().then(() => {
            this.emit('init')

            // 如果传递了 URL 或带有 src 的外部媒体，则加载音频
            // 如果提供了预解码的峰值和持续时间，则渲染 w/o 音频
            const url = this.options.url || this.getSrc() || ''
            if (url || (this.options.peaks && this.options.duration)) {
                this.load(url, this.options.peaks, this.options.duration)
            }
        })
    }

    private initTimerEvents() {
        // 计时器每 16ms 启动一次，以获得流畅的动画效果
        this.subscriptions.push(
            this.timer.on('tick', () => {
                const currentTime = this.getCurrentTime()
                this.renderer.renderProgress(currentTime / this.getDuration(), true)
                this.emit('timeupdate', currentTime)
                this.emit('audioprocess', currentTime)
            }),
        )
    }

    private initPlayerEvents() {
        if (this.isPlaying()) {
            this.emit('play')
            this.timer.start()
        }

        this.mediaSubscriptions.push(
            this.onMediaEvent('timeupdate', () => {
                const currentTime = this.getCurrentTime()
                this.renderer.renderProgress(currentTime / this.getDuration(), this.isPlaying())
                this.emit('timeupdate', currentTime)
            }),

            this.onMediaEvent('play', () => {
                this.emit('play')
                this.timer.start()
            }),

            this.onMediaEvent('pause', () => {
                this.emit('pause')
                this.timer.stop()
            }),

            this.onMediaEvent('emptied', () => {
                this.timer.stop()
            }),

            this.onMediaEvent('ended', () => {
                this.emit('finish')
            }),

            this.onMediaEvent('seeking', () => {
                this.emit('seeking', this.getCurrentTime())
            }),
        )
    }

    private initRendererEvents() {
        this.subscriptions.push(
            // 单击查找
            this.renderer.on('click', (relativeX, relativeY) => {
                if (this.options.interact) {
                    this.seekTo(relativeX)
                    this.emit('interaction', relativeX * this.getDuration())
                    this.emit('click', relativeX, relativeY)
                }
            }),

            // 双击
            this.renderer.on('dblclick', (relativeX, relativeY) => {
                this.emit('dbclick', relativeX, relativeY)
            }),

            // 滚动
            this.renderer.on('scroll', (startX, endX) => {
                const duration = this.getDuration()
                this.emit('scroll', startX * duration, endX * duration)
            }),

            // 重新绘制
            this.renderer.on('render', () => {
                this.emit('redraw')
            }),
        )

        // 拖动
        {
            let debounce: ReturnType<typeof setTimeout>
            this.subscriptions.push(
                this.renderer.on('drag', (relativeX) => {
                    if (!this.options.interact) return

                    // 更新可视位置
                    this.renderer.renderProgress(relativeX)

                    // 用防抖设置音频位置
                    clearTimeout(debounce)
                    debounce = setTimeout(
                        () => {
                            this.seekTo(relativeX)
                        },
                        this.isPlaying() ? 0 : 200
                    )

                    this.emit('interaction', relativeX * this.getDuration())
                    this.emit('drag', relativeX)
                }),
            )
        }
    }

    private initPlugins() {
        if (!this.options.plugins?.length) return

        this.options.plugins.forEach((plugin) => {
            this.registerPlugin(plugin)
        })
    }

    private unsubscribePlayerEvents() {
        this.mediaSubscriptions.forEach((unsubscribe) => unsubscribe())
        this.mediaSubscriptions = []
    }

    /** 设置新的 waveform 选项且重新渲染 */
    public setOptions(options: Partial<WaveFormOptions>) {
        this.options = Object.assign({}, this.options, options)
        this.renderer.setOptions(this.options)

        if (options.audioRate) {
            this.setPlaybackRate(options.audioRate)
        }
        if (options.mediaControls != null) {
            this.getMediaElement().controls = options.mediaControls
        }
    }

    /** 注册一个 waveform 插件 */
    public registerPlugin<T extends GenericPlugin>(plugin: T): T {
        plugin._init(this)
        this.plugins.push(plugin)

        // 销毁时注销插件
        this.subscriptions.push(
            plugin.once('destroy', () => {
                this.plugins = this.plugins.filter((p) => p !== plugin)
            }),
        )

        return plugin
    }

    /** 仅限插件：获取波形 wrapper div */
    public getWrapper(): HTMLElement {
        return this.renderer.getWrapper()
    }

    /** 获取当前滚动位置（像素） */
    public getScroll(): number {
        return this.renderer.getScroll()
    }

    /** 获取全部已注册的插件 */
    public getActivePlugins() {
        return this.plugins
    }

    private async loadAudio(url: string, blob?: Blob, channelData?: WaveFormOptions['peaks'], duration?: number) {
        this.emit('load', url)

        if (!this.options.media && this.isPlaying()) this.pause()

        this.decodedData = null

        // 如果未提供预解码数据，则将整个音频提取为 blob
        if (!blob && !channelData) {
            const onProgress = (percentage: number) => this.emit('loading', percentage)
            blob = await Fetcher.fetchBlob(url, onProgress, this.options.fetchParams)
        }

        // 设置媒体元素来源
        this.setSrc(url, blob)

        // 等待音频持续时间
        const audioDuration =
            duration ||
            this.getDuration() ||
            (await new Promise((resolve) => {
                this.onceMediaEvent('loadedmetadata', () => resolve(this.getDuration()))
            }))

        // 解码音频数据或使用用户提供的峰值
        if (channelData) {
            this.decodedData = Decoder.createBuffer(channelData, audioDuration || 0)
        } else if (blob) {
            const arrayBuffer = await blob.arrayBuffer()
            this.decodedData = await Decoder.decode(arrayBuffer, this.options.sampleRate)
        }

        if (this.decodedData) {
            this.emit('decode', this.getDuration())
            this.renderer.render(this.decodedData)
        }

        this.emit('ready', this.getDuration())
    }

    /** 通过 url 加载音频文件，包括可选的预解码音频数据 */
    public async load(url: string, channelData?: WaveFormOptions['peaks'], duration?: number) {
        await this.loadAudio(url, undefined, channelData, duration)
    }

    /** 加载音频 blob */
    public async loadBlob(blob: Blob, channelData?: WaveFormOptions['peaks'], duration?: number) {
        await this.loadAudio('blob', blob, channelData, duration)
    }

    /** 按给定的每秒像素数缩放波形 */
    public zoom(minPxPerSec: number) {
        if (!this.decodedData) {
            throw new Error('No audio loaded')
        }
        this.renderer.zoom(minPxPerSec)
        this.emit('zoom', minPxPerSec)
    }

    /** 获取解码后的音频数据 */
    public getDecodedData(): AudioBuffer | null {
        return this.decodedData
    }

    /** 获取解码后的峰值 */
    public exportPeaks({ channels = 2, maxLength = 8000, precision = 10_000 } = {}): Array<number[]> {
        if (!this.decodedData) {
            throw new Error('The audio has not been decoded yet!')
        }
        const maxChannels = Math.min(channels, this.decodedData.numberOfChannels)
        const peaks = []
        for (let i = 0; i < maxChannels; ++i) {
            const channel = this.decodedData.getChannelData(i)
            const data = []
            const sampleSize = Math.round(channel.length / maxLength)
            for (let i = 0; i < maxLength; ++i) {
                const sample = channel.slice(i * sampleSize, (i + 1) * sampleSize)
                let max = 0
                for (let x = 0; x < sample.length; ++x) {
                    const n = sample[x]
                    if (Math.abs(n) > Math.abs(max)) max = n
                }
                data.push(Math.round(max * precision) / precision)
            }
            peaks.push(data)
        }
        return peaks
    }

    /** 获取音频时长（秒） */
    public getDuration(): number {
        let duration = super.getDuration() || 0
        // 如果媒体时长不正确，则回退到解码数据的时长
        if ((duration === 0 || duration === Infinity) && this.decodedData) {
            duration = this.decodedData.duration
        }
        return duration
    }

    /** 切换波形是否对点击作反应 */
    public toggleInteraction(isInteractive: boolean) {
        this.options.interact = isInteractive
    }

    /** 查找音频的百分比为 [0...1] (0 = 开始，1 = 结束) */
    public seekTo(progress: number) {
        const time = this.getDuration() * progress
        this.setTime(time)
    }

    /** 播放或暂停音频 */
    public async playPause(): Promise<void> {
        return this.isPlaying() ? this.pause() : this.play()
    }

    /** 停止播放音频并跳转到开始 */
    public stop() {
        this.pause()
        this.setTime(0)
    }

    /** 从当前位置跳过 N 或 -N 秒 */
    public skip(seconds: number) {
        this.setTime(this.getCurrentTime() + seconds)
    }

    /** 清空波形 */
    public empty() {
        this.load('', [[0]], 0.001)
    }

    /** 设置 HTML 媒体元素 */
    public setMediaElement(element: HTMLMediaElement) {
        this.unsubscribePlayerEvents()
        super.setMediaElement(element)
        this.initPlayerEvents()
    }

    /**
     * 将波形图像导出为 data-URL 或 blob
     * 
     * @param format 导出图像的格式，可以是 `image/png`, `image/jpeg`, `image/webp`，或任意浏览器支持的其他格式
     * @param quality 导出图像的质量，如 `image/jpeg`, `image/webp`，必须为 0 和 1 之间
     * @param type 导出图像的类型，可以是 `dataURL` (default) 或 `blob`
     * @returns 一个 promise ，使用一组 data-URLs 或 blobs，每个 canvas 元素对应一个 URL 或 blob
     */
    public async exportImage(format: string, quality: number, type: 'dataURL'): Promise<string[]>
    public async exportImage(format: string, quality: number, type: 'blob'): Promise<Blob[]>
    public async exportImage(
        format = 'image/png',
        quality = 1,
        type: 'dataURL' | 'blob' = 'dataURL',
    ): Promise<string[] | Blob[]> {
        return this.renderer.exportImage(format, quality, type)
    }

    /** 取消挂载 waveform */
    public destroy() {
        this.emit('destroy')
        this.plugins.forEach((plugin) => plugin.destroy())
        this.subscriptions.forEach((unsubscribe) => unsubscribe())
        this.unsubscribePlayerEvents()
        this.timer.destroy()
        this.renderer.destroy()
        super.destroy()
    }
}

export default WaveForm