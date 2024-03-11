import WebAudioPlayer from "@/waveform/webaudio"
import { type GenericPlugin } from "./base-plugin"
import Player from "./player"
import Renderer from "./renderer"
import Timer from "./timer"
import Fetcher from "./fetcher"
import Decoder from "./decoder"

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
    public options: WaveFormOptions & typeof defaultOptions // WaveFormOptions 和 defaultOptions 类型的交集
    private renderer: Renderer
    private timer: Timer
    private decodedData: AudioBuffer | null = null // AudioBuffer 类型的变量，初始值为 null
    protected subscriptions: Array<() => void> = [] // 元素为无参函数返回类型 void 的数组
    protected mediaSubscriptions: Array<() => void> = [] // 元素为无参函数返回类型 void 的数组

    /** 创建一个新的 WaveForm 实例 */
    public static create(options: WaveFormOptions) {
        return new WaveForm(options)
    }

    /** 创建一个新的 WaveForm 实例 */
    constructor(options: WaveFormOptions) {
        const media =
            options.media ||
            (options.backend === 'WebAudio' ? (new WebAudioPlayer() as unknown as HTMLMediaElement) : undefined) // 类型断言，如果失败则类型为 undefined

        super({
            media,
            mediaControls: options.mediaControls,
            autoplay: options.autoplay,
            playbackRate: options.audioRate,
        })

        this.options = Object.assign({}, defaultOptions, options) // 合并默认配置和传入配置
        this.timer = new Timer() // 创建计时器

        const audioElement = media ? undefined : this.getMediaElement() // 获取媒体元素
        this.renderer = new Renderer(this.options, audioElement) // 创建渲染器

        // 初始化并加载异步以允许注册外部事件
        Promise.resolve().then(() => { // 确保后续的代码在当前同步代码块之后执行 | 异步执行
            this.emit('init')

            // 如果传递了 URL 或带有 src 的外部媒体，则加载音频
            // 如果提供了预解码的峰值和持续时间，则渲染 w/o 音频
            const url = this.options.url || this.getSrc() || ''
            if (url || (this.options.peaks && this.options.duration)) {
                this.load(url)
            }
        })
    }

    /** 通过 url 加载音频文件，包括可选的预解码音频数据 */
    public async load(url: string) {
        await this.loadAudio(url, undefined) // 加载音频
    }

    private async loadAudio(url: string, blob?: Blob) { // 加载音频
        this.emit('load', url) // 发送 load 事件

        if (!this.options.media && this.isPlaying()) this.pause() // 如果没有媒体元素并且正在播放，则暂停

        // 如果未提供预解码数据，则将整个音频提取为 blob
        if (!blob) {
            const onProgress = (percentage: number) => this.emit('loading', percentage) // 发送 loading 事件
            blob = await Fetcher.fetchBlob(url, onProgress, this.options.fetchParams) // 获取音频文件
        }

        // 设置媒体元素来源
        this.setSrc(url, blob)

        if (blob) {
            const arrayBuffer = await blob.arrayBuffer() // 获取音频文件的 ArrayBuffer
            this.decodedData = await Decoder.decode(arrayBuffer, this.options.sampleRate) // 解码音频
        }

        if (this.decodedData) {
            this.emit('decode', this.getDuration()) // 发送 decode 事件
            this.renderer.render(this.decodedData) // 渲染波形
        }

        this.emit('ready', this.getDuration()) // 发送 ready 事件
    }

    /** 播放或暂停音频 */
    public async playPause(): Promise<void> {
        return this.isPlaying() ? this.pause() : this.play()
    }

}

export default WaveForm