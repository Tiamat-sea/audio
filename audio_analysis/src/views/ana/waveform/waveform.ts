import BasePlugin, { type GenericPlugin } from './base-plugin'
import Decoder from './decoder'
import * as dom from './dom'
import Fetcher from './fetcher'
import Player from './player'
import Renderer from './renderer'
import Timer from './timer'
// import WebAudioPlayer from './webaudio'

export type WaveFormOptions = {
    /** 必填项：渲染波形的 HTML 元素或选择器 */
    container: HTMLElement | string
    /** 波形的高度（以像素为单位），或者使用 "auto" 来填充容器的高度 */
    height?: number | 'auto'
    /** 波形的宽度（以像素为单位）或任何 CSS 值；默认为 100% */
    width?: number | string
    /** 波形的颜色 */
    waveColor?: string | string[] | CanvasGradient
    /** 进度遮罩的颜色 */
    progressColor?: string | string[] | CanvasGradient
    /** 播放光标的颜色 */
    cursorColor?: string
    /** 光标的宽度 */
    cursorWidth?: number
    /** 音频的最小像素每秒（即缩放级别） */
    minPxPerSec?: number
    /** 将波形拉伸以填充容器，默认为 true */
    fillParent?: boolean
    /** 音频 URL */
    url?: string
    /** 使用现有的媒体元素而不是创建一个新的 */
    media?: HTMLMediaElement
    /** 是否显示默认的音频元素控件 */
    mediaControls?: boolean
    /** 加载时播放音频 */
    autoplay?: boolean
    /** 是否允许点击波形 */
    interact?: boolean
    /** 允许拖动光标以寻找新位置。如果提供了一个带有 `debounceTime` 的对象，则 `dragToSeek` 也将为 true。如果为 `true`，默认值为 200ms */
    dragToSeek?: boolean | { debounceTime: number }
    /** 隐藏滚动条 */
    hideScrollbar?: boolean
    /** 音频速率，即播放速度 */
    audioRate?: number
    /** 自动滚动容器以保持当前位置在视口中可见 */
    autoScroll?: boolean
    /** 如果启用了 autoScroll，在播放期间将光标保持在波形的中心 */
    autoCenter?: boolean
    /** 解码采样率。不影响播放。默认为 8000 */
    sampleRate?: number
    /** 将每个音频通道渲染为单独的波形 */
    splitChannels?: Partial<WaveFormOptions>[]
    /** 将波形拉伸到全高度 */
    normalize?: boolean
    /** 要在启动时初始化的插件列表 */
    plugins?: GenericPlugin[]
    /** 自定义渲染函数 */
    renderFunction?: (peaks: Array<Float32Array | number[]>, ctx: WebGLRenderingContext) => void
    /** 传递给 fetch 方法的选项 */
    fetchParams?: RequestInit
    /** 使用的播放 "后端"，默认为 MediaElement */
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
    sampleRate: 8000
}

export type WaveFormEvents = {
    /** 波形创建完成后 */
    init: []
    /** 音频开始加载时 */
    load: [url: string]
    /** 音频加载过程中 */
    loading: [percent: number]
    /** 音频解码完成时 */
    decode: [duration: number]
    /** 音频解码并可以播放时 */
    ready: [duration: number]
    /** 可见波形绘制时 */
    redraw: []
    /** 所有音频通道块绘制完成时 */
    redrawcomplete: []
    /** 音频开始播放时 */
    play: []
    /** 音频暂停时 */
    pause: []
    /** 音频播放完成时 */
    finish: []
    /** 音频位置改变时，持续触发 */
    timeupdate: [currentTime: number]
    /** 与 timeupdate 相同，但仅在音频播放时触发 */
    audioprocess: [currentTime: number]
    /** 用户寻找到新位置时 */
    seeking: [currentTime: number]
    /** 用户与波形交互时（例如点击或拖动） */
    interaction: [newTime: number]
    /** 用户点击波形时 */
    click: [relativeX: number, relativeY: number]
    /** 用户双击波形时 */
    dblclick: [relativeX: number, relativeY: number]
    /** 用户拖动光标时 */
    drag: [relativeX: number]
    /** 用户开始拖动光标时 */
    dragstart: [relativeX: number]
    /** 用户结束拖动光标时 */
    dragend: [relativeX: number]
    /** 波形滚动时 */
    scroll: [visibleStartTime: number, visibleEndTime: number]
    /** 缩放级别改变时 */
    zoom: [minPxPerSec: number]
    /** 波形即将销毁时，用于清理事件 */
    destroy: []
    /** 当源文件无法获取、解码或媒体元素抛出错误时 */
    error: [error: Error]
}

class WaveForm extends Player<WaveFormEvents> { // 继承 Player 播放器类
    public options: WaveFormOptions & typeof defaultOptions
    private renderer: Renderer
    private timer: Timer
    private plugins: GenericPlugin[] = []
    private decodedData: AudioBuffer | null = null
    protected subscriptions: Array<() => void> = []
    protected mediaSubscriptions: Array<() => void> = []

    public static readonly BasePlugin = BasePlugin
    public static readonly dom = dom

    /** 创建一个新的 WaveForm 实例 */
    public static create(options: WaveFormOptions) {
        return new WaveForm(options)
    }

    /** 创建一个新的 WaveForm 实例 */
    constructor(options: WaveFormOptions) {
        const media = options.media

        super({
            media,
            mediaControls: options.mediaControls,
            autoplay: options.autoplay,
            playbackRate: options.audioRate
        })

        this.options = Object.assign({}, defaultOptions, options) // assign 将所有可枚举自身属性的值从一个或多个源对象复制到目标对象
        this.timer = new Timer()

        const audioElement = media ? undefined : this.getMediaElement()
        this.renderer = new Renderer(this.options, audioElement) // 创建渲染器，传入配置和媒体元素

        this.initPlayerEvents() // 初始化播放器事件
        this.initRendererEvents() // 初始化渲染器事件
        this.initTimerEvents() // 初始化计时器事件
        this.initPlugins() // 初始化插件

        // 初始化和异步加载，以允许注册外部事件
        Promise.resolve().then(() => {
            this.emit('init')

            // 如果传递了 URL 或具有 src 的外部媒体，则加载音频，
            const url = this.options.url || this.getSrc() || ''
            if (url) {
                // 忽视异步错误，因为它们无法从构造函数调用中捕获。
                // 订阅波形的错误事件来处理它们。
                this.load(url).catch(() => null)
            }
        })
    }

    private updateProgress(currentTime = this.getCurrentTime()): number { // 更新进度
        this.renderer.renderProgress(currentTime / this.getDuration(), this.isPlaying()) // 渲染进度，传入进度百分比和是否正在播放
        return currentTime
    }

    private initTimerEvents() {
        // 计时器每16毫秒触发一次，用于平滑流畅的进度动画
        this.subscriptions.push(
            this.timer.on('tick', () => {
                if (!this.isSeeking()) {
                    const currentTime = this.updateProgress()
                    this.emit('timeupdate', currentTime)
                    this.emit('audioprocess', currentTime)
                }
            })
        )
    }

    private initPlayerEvents() {
        if (this.isPlaying()) {
            this.emit('play')
            this.timer.start()
        }

        this.mediaSubscriptions.push(
            this.onMediaEvent('timeupdate', () => {
                const currentTime = this.updateProgress()
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

            this.onMediaEvent('error', (err) => {
                this.emit('error', err.error)
            })
        )
    }

    private initRendererEvents() {
        this.subscriptions.push(
            // 单击时进行跳转
            this.renderer.on('click', (relativeX, relativeY) => {
                if (this.options.interact) {
                    this.seekTo(relativeX)
                    this.emit('interaction', relativeX * this.getDuration())
                    this.emit('click', relativeX, relativeY)
                }
            }),

            // 双击
            this.renderer.on('dblclick', (relativeX, relativeY) => {
                this.emit('dblclick', relativeX, relativeY)
            }),

            // 滚动
            this.renderer.on('scroll', (startX, endX) => {
                const duration = this.getDuration()
                this.emit('scroll', startX * duration, endX * duration)
            }),

            // 重绘
            this.renderer.on('render', () => {
                this.emit('redraw')
            }),

            // 重绘完成
            this.renderer.on('rendered', () => {
                this.emit('redrawcomplete')
            }),

            // 拖动开始
            this.renderer.on('dragstart', (relativeX) => {
                this.emit('dragstart', relativeX)
            }),

            // 拖动结束
            this.renderer.on('dragend', (relativeX) => {
                this.emit('dragend', relativeX)
            })
        )

        // 拖动
        {
            let debounce: ReturnType<typeof setTimeout> // 防抖，用于拖动时设置音频位置，避免频繁调用
            this.subscriptions.push(
                this.renderer.on('drag', (relativeX) => {
                    if (!this.options.interact) return // 如果不允许交互，则直接返回

                    // 更新可视位置
                    this.renderer.renderProgress(relativeX)

                    // 使用防抖设置音频位置
                    clearTimeout(debounce)
                    let debounceTime

                    if (this.isPlaying()) {
                        debounceTime = 0
                    } else if (this.options.dragToSeek === true) {
                        debounceTime = 200
                    } else if (
                        typeof this.options.dragToSeek === 'object' &&
                        this.options.dragToSeek !== undefined
                    ) {
                        debounceTime = this.options.dragToSeek['debounceTime']
                    }

                    debounce = setTimeout(() => {
                        this.seekTo(relativeX)
                    }, debounceTime)

                    this.emit('interaction', relativeX * this.getDuration())
                    this.emit('drag', relativeX)
                })
            )
        }
    }

    private initPlugins() {
        if (!this.options.plugins?.length) return // 如果没有插件，则直接返回

        this.options.plugins.forEach((plugin) => {
            this.registerPlugin(plugin) // 遍历注册插件
        })
    }

    private unsubscribePlayerEvents() { // 取消订阅播放器事件
        this.mediaSubscriptions.forEach((unsubscribe) => unsubscribe()) // 遍历取消
        this.mediaSubscriptions = [] // 重置
    }

    /** 设置新的波形选项并重新渲染 */
    public setOptions(options: Partial<WaveFormOptions>) { // Partial<T> 将给定类型 T 的所有属性转换为可选属性
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

        // 在销毁时取消注册插件
        this.subscriptions.push(
            plugin.once('destroy', () => {
                this.plugins = this.plugins.filter((p) => p !== plugin)
            })
        )

        return plugin
    }

    /** 仅供插件使用：获取波形包装器 div 元素 */
    public getWrapper(): HTMLElement {
        return this.renderer.getWrapper()
    }

    /** 获取当前滚动位置（以像素为单位） */
    public getScroll(): number {
        return this.renderer.getScroll()
    }

    /** 将视图窗口的起始位置移动到音频中的特定时间（以秒为单位） */
    public setScrollTime(time: number) {
        const percentage = time / this.getDuration()
        this.renderer.setScrollPercentage(percentage)
    }

    /** 获取所有已注册的插件 */
    public getActivePlugins() {
        return this.plugins
    }

    private async loadAudio(url: string, blob?: Blob) {
        this.emit('load', url)

        if (!this.options.media && this.isPlaying()) this.pause()

        this.decodedData = null

        // 将整个音频作为 Blob 进行获取
        if (!blob) {
            const onProgress = (percentage: number) => this.emit('loading', percentage)
            blob = await Fetcher.fetchBlob(url, onProgress, this.options.fetchParams)
        }

        // 设置媒体元素的源
        this.setSrc(url, blob)

        // 等待音频的持续时间（时长）
        const audioDuration = this.getDuration() ||
            (await new Promise((resolve) => {
                this.onMediaEvent('loadedmetadata', () => resolve(this.getDuration()), {
                    once: true
                })
            }))

        // 解码音频数据
        if (blob) {
            const arrayBuffer = await blob.arrayBuffer()
            this.decodedData = await Decoder.decode(arrayBuffer, this.options.sampleRate)
        }

        if (this.decodedData) {
            this.emit('decode', this.getDuration())
            this.renderer.render(this.decodedData) // 渲染波形
        }

        this.emit('ready', this.getDuration())
    }

    /** 通过 URL 加载音频文件 */
    public async load(url: string) {
        try {
            return await this.loadAudio(url, undefined)
        } catch (err) {
            this.emit('error', err as Error)
            throw err
        }
    }

    /** 加载音频 Blob */
    // public async loadBlob(blob: Blob) {
    //     try {
    //         return await this.loadAudio('blob', blob)
    //     } catch (err) {
    //         this.emit('error', err as Error)
    //         throw err
    //     }
    // }

    /** 通过给定的每秒像素数因子缩放波形 */
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
    // public exportPeaks({ channels = 2, maxLength = 8000, precision = 10_000 } = {}): Array<number[]> {
    //     if (!this.decodedData) {
    //         throw new Error('The audio has not been decoded yet')
    //     }
    //     const maxChannels = Math.min(channels, this.decodedData.numberOfChannels)
    //     const peaks = []
    //     for (let i = 0; i < maxChannels; i++) {
    //         const channel = this.decodedData.getChannelData(i)
    //         const data = []
    //         const sampleSize = Math.round(channel.length / maxLength)
    //         for (let i = 0; i < maxLength; i++) {
    //             const sample = channel.slice(i * sampleSize, (i + 1) * sampleSize)
    //             let max = 0
    //             for (let x = 0; x < sample.length; x++) {
    //                 const n = sample[x]
    //                 if (Math.abs(n) > Math.abs(max)) max = n
    //             }
    //             data.push(Math.round(max * precision) / precision)
    //         }
    //         peaks.push(data)
    //     }
    //     return peaks
    // }

    /** 获取音频的持续时间（以秒为单位） */
    public getDuration(): number {
        let duration = super.getDuration() || 0
        // 如果媒体持续时间不正确，则回退到解码数据的持续时间
        if ((duration === 0 || duration === Infinity) && this.decodedData) {
            duration = this.decodedData.duration
        }
        return duration
    }

    /** 切换波形是否响应点击事件 */
    public toggleInteraction(isInteractive: boolean) {
        this.options.interact = isInteractive
    }

    /** 跳转到音频中的特定时间（以秒为单位） */
    public setTime(time: number) {
        super.setTime(time)
        this.updateProgress(time)
        this.emit('timeupdate', time)
    }

    /** 将音频跳转到指定百分比位置（0 到 1，0 表示开头，1 表示结尾） */
    public seekTo(progress: number) {
        const time = this.getDuration() * progress
        this.setTime(time)
    }

    /** 播放或暂停音频 */
    public async playPause(): Promise<void> {
        return this.isPlaying() ? this.pause() : this.play()
    }

    /** 停止音频并返回开头 */
    public stop() {
        this.pause()
        this.setTime(0)
    }

    /** 从当前位置向前或向后跳过 N 秒 */
    public skip(seconds: number) {
        this.setTime(this.getCurrentTime() + seconds)
    }

    /** 清空波形 */
    public empty() {
        this.load('')
    }

    /** 设置 HTML 媒体元素 */
    public setMediaElement(element: HTMLMediaElement) {
        this.unsubscribePlayerEvents()
        super.setMediaElement(element)
        this.initPlayerEvents()
    }

    /**
     * 将波形图像导出为数据URI或Blob。
     *
     * @param format 导出图像的格式，可以是`image/png`、`image/jpeg`、`image/webp`或浏览器支持的其他格式。
     * @param quality 导出图像的质量，适用于`image/jpeg`或`image/webp`。必须介于0和1之间。
     * @param type 导出图像的类型，可以是`dataURL`（默认）或`blob`。
     * @returns 一个解析为数据URI或Blob数组的Promise，每个canvas元素对应一个。
     */
    public async exportImage(format: string, quality: number, type: 'dataURL'): Promise<string[]>
    public async exportImage(format: string, quality: number, type: 'blob'): Promise<Blob[]>
    public async exportImage(
        format = 'image/png',
        quality = 1,
        type: 'dataURL' | 'blob' = 'dataURL'
    ): Promise<string[] | Blob[]> {
        return this.renderer.exportImage(format, quality, type)
    }

    /** 卸载波形图 */
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
