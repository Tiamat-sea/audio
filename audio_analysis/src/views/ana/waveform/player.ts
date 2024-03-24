import EventEmitter, { type GeneralEventTypes } from "./event-emitter" // 通用事件类型

type PlayerOptions = { // 播放器选项
    media?: HTMLMediaElement // 媒体元素
    mediaControls?: boolean // 是否显示控件
    autoplay?: boolean // 是否自动播放
    playbackRate?: number // 播放速度
}

class Player<T extends GeneralEventTypes> extends EventEmitter<T> { // 播放器，继承事件发射器，且两个类都使用了泛型参数 T，T 必须是 GeneralEventTypes 的子类
    protected media: HTMLMediaElement // 媒体元素
    private isExternalMedia = false // 是否是外部媒体

    constructor(options: PlayerOptions) { // 构造函数
        super() // 调用父类 EventEmitter 的构造函数

        if (options.media) { // 如果传入了媒体元素
            this.media = options.media // 使用传入的媒体元素
            this.isExternalMedia = true // 设置为外部媒体
        } else { // 如果没有传入媒体元素
            this.media = document.createElement('audio') // 创建一个音频元素
        }

        // 显示控件
        if (options.mediaControls) {
            this.media.controls = true
        }
        // 自动播放
        if (options.autoplay) {
            this.media.autoplay = true
        }
        // 播放速度
        if (options.playbackRate != null) { // 如果传入了播放速度
            this.onceMediaEvent('canplay', () => { // 当媒体可以播放时
                if (options.playbackRate != null) { // 如果传入了播放速度
                    this.media.playbackRate = options.playbackRate // 设置播放速度
                }
            })
        }
    }

    protected onMediaEvent( // 监听媒体事件
        event: keyof HTMLMediaElementEventMap, // 事件名，类型是 HTMLMediaElementEventMap 的键
        callback: () => void, // 回调函数
        options?: AddEventListenerOptions, // 选项
    ): () => void {
        this.media.addEventListener(event, callback, options) // 添加事件监听
        return () => this.media.removeEventListener(event, callback) // 返回一个函数，用于移除事件监听
    }

    protected onceMediaEvent(event: keyof HTMLMediaElementEventMap, callback: () => void): () => void { // 只监听一次媒体事件
        return this.onMediaEvent(event, callback, { once: true }) // 调用 onMediaEvent，传入 { once: true }
    }

    protected getSrc() { // 获取媒体元素的 src 属性
        return this.media.currentSrc || this.media.src || '' // 返回当前 src 或 src 或空字符串
    }

    private revokeSrc() { // 撤销 src
        const src = this.getSrc() // 获取 src
        if (src.startsWith('blob:')) { // 如果是 blob
            URL.revokeObjectURL(src) // 撤销
        }
    }

    protected setSrc(url: string, blob?: Blob) { // 设置 src
        const src = this.getSrc() // 获取 src
        if (src === url) return // 如果相同，直接返回
        this.revokeSrc() // 撤销 src
        const newSrc = blob instanceof Blob ? URL.createObjectURL(blob) : url // 如果是 blob，创建 URL
        this.media.src = newSrc // 设置 src
    }

    protected destroy() { // 销毁
        this.media.pause() // 暂停

        if (this.isExternalMedia) return // 如果是外部媒体，直接返回
        this.media.remove() // 移除媒体元素
        this.revokeSrc() // 撤销 src
        this.media.src = '' // 清空 src
        this.media.load() // 重新加载将媒体元素重置为初始状态
    }

    protected setMediaElement(element: HTMLMediaElement) { // 设置媒体元素
        this.media = element // 设置媒体元素
    }

    /** 开始播放音频 */
    public play(): Promise<void> { // 返回一个 Promise
        return this.media.play() // 调用媒体元素的 play 方法
    }

    /** 暂停播放音频 */
    public pause(): void {
        this.media.pause() // 调用媒体元素的 pause 方法
    }

    /** 判断音频是否正在播放 */
    public isPlaying(): boolean { // 判断音频是否正在播放
        return !this.media.paused && !this.media.ended // paused 和 ended 都为 false 时，表示正在播放
    }

    /** 跳到音频中指定时间的位置（秒） */
    public setTime(time: number) {
        this.media.currentTime = time // 设置 currentTime
    }

    /** 获取音频时长（秒） */
    public getDuration(): number {
        return this.media.duration // 获取 duration
    }

    /** 获取当前音频位置（秒） */
    public getCurrentTime(): number {
        return this.media.currentTime // 获取 currentTime
    }

    /** 获取音量 */
    public getVolume(): number {
        return this.media.volume // 获取 volume
    }

    /** 设置音量 */
    public setVolume(volume: number) {
        this.media.volume = volume // 设置 volume
    }

    /** 获取音频静音状态 */
    public getMuted(): boolean {
        return this.media.muted // 获取 muted
    }

    /** 静音/解除 */
    public setMuted(muted: boolean) {
        this.media.muted = muted // 设置 muted
    }

    /** 获取播放速度 */
    public getPlaybackRate(): number {
        return this.media.playbackRate // 获取 playbackRate
    }

    /** 设置播放速度，通过一个可选参数来不保留音高 */
    public setPlaybackRate(rate: number, preservePitch?: boolean) {
        // 在主流浏览器中 preservePitch 默认为 true
        if (preservePitch != null) { // 如果传入了 preservePitch
            this.media.preservesPitch = preservePitch // 设置 preservesPitch
        }
        this.media.playbackRate = rate // 设置 playbackRate
    }

    /** 获取 HTML 媒体元素 */
    public getMediaElement(): HTMLMediaElement {
        return this.media // 返回媒体元素
    }

    /** 设置接收器 id 以更改音频输出设备 */
    public setSinkId(sinkId: string): Promise<void> {
        // See https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/setSinkId
        /** 假设 this.media 是一个音频元素，并且它有一个 setSinkId 方法，可以用这个方法将音频输出到指定的设备 */
        const media = this.media as HTMLAudioElement & { setSinkId: (sinkId: string) => Promise<void> } // 设置媒体元素类型
        return media.setSinkId(sinkId) // 调用 setSinkId
    }
}

export default Player // 导出 Player 类