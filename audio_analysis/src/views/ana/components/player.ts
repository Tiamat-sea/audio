import EventEmitter, { type GeneralEventTypes } from "./event-emitter"

type PlayerOptions = {
    media?: HTMLMediaElement
    mediaControls?: boolean
    autoplay?: boolean
    playbackRate?: number
}

class Player<T extends GeneralEventTypes> extends EventEmitter<T> {
    protected media: HTMLMediaElement
    private isExternalMedia = false

    constructor(options: PlayerOptions) {
        super()

        if (options.media) {
            this.media = options.media
            this.isExternalMedia = true
        } else {
            this.media = document.createElement('audio')
        }

        // 控件
        if (options.mediaControls) {
            this.media.controls = true
        }
        // 自动播放
        if (options.autoplay) {
            this.media.autoplay = true
        }
        // 播放速度
        if (options.playbackRate != null) {
            this.onceMediaEvent('canplay', () => {
                if (options.playbackRate != null) {
                    this.media.playbackRate = options.playbackRate
                }
            })
        }
    }

    protected onMediaEvent(
        event: keyof HTMLMediaElementEventMap,
        callback: () => void,
        options?: AddEventListenerOptions,
    ): () => void {
        this.media.addEventListener(event, callback, options)
        return () => this.media.removeEventListener(event, callback)
    }

    protected onceMediaEvent(event: keyof HTMLMediaElementEventMap, callback: () => void): () => void {
        return this.onMediaEvent(event, callback, { once: true })
    }

    protected getSrc() {
        return this.media.currentSrc || this.media.src || ''
    }

    private revokeSrc() {
        const src = this.getSrc()
        if (src.startsWith('blob:')) {
            URL.revokeObjectURL(src)
        }
    }

    protected setSrc(url: string, blob?: Blob) {
        const src = this.getSrc()
        if (src === url) return
        this.revokeSrc()
        const newSrc = blob instanceof Blob ? URL.createObjectURL(blob) : url // 创建一个指向该对象的 URL
        this.media.src = newSrc
    }

    protected destroy() {
        this.media.pause()

        if (this.isExternalMedia) return
        this.media.remove()
        this.revokeSrc()
        this.media.src = ''
        // 重新加载将媒体元素重置为初始状态
        this.media.load()
    }

    protected setMediaElement(element: HTMLMediaElement) {
        this.media = element
    }

    /** 开始播放音频 */
    public play(): Promise<void> {
        return this.media.play()
    }

    /** 暂停播放音频 */
    public pause(): void {
        this.media.pause()
    }

    /** 判断音频是否正在播放 */
    public isPlaying(): boolean {
        return !this.media.paused && !this.media.ended
    }

    /** 跳到音频中指定时间的位置（秒） */
    public setTime(time: number) {
        this.media.currentTime = time
    }

    /** 获取音频时长（秒） */
    public getDuration(): number {
        return this.media.duration
    }

    /** 获取当前音频位置（秒） */
    public getCurrentTime(): number {
        return this.media.currentTime
    }

    /** 获取音量 */
    public getVolume(): number {
        return this.media.volume
    }

    /** 设置音量 */
    public setVolume(volume: number) {
        this.media.volume = volume
    }

    /** 获取音频静音状态 */
    public getMuted(): boolean {
        return this.media.muted
    }

    /** 静音/解除 */
    public setMuted(muted: boolean) {
        this.media.muted = muted
    }

    /** 获取播放速度 */
    public getPlaybackRate(): number {
        return this.media.playbackRate
    }

    /** 设置播放速度，通过一个可选参数来不保留音高 */
    public setPlaybackRate(rate: number, preservePitch?: boolean) {
        // 在主流浏览器中 preservePitch 默认为 true
        if (preservePitch != null) {
            this.media.preservesPitch = preservePitch
        }
        this.media.playbackRate = rate
    }

    /** 获取 HTML 媒体元素 */
    public getMediaElement(): HTMLMediaElement {
        return this.media
    }

    /** 设置接收器 id 以更改音频输出设备 */
    public setSinkId(sinkId: string): Promise<void> {
        // See https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/setSinkId
        const media = this.media as HTMLAudioElement & { setSinkId: (sinkId: string) => Promise<void> }
        return media.setSinkId(sinkId)
    }
}

export default Player