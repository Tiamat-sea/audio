import EventEmitter, { type GeneralEventTypes } from './event-emitter'

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
        // 速度
        if (options.playbackRate != null) {
            this.onMediaEvent(
                'canplay',
                () => {
                    if (options.playbackRate != null) {
                        this.media.playbackRate = options.playbackRate
                    }
                },
                { once: true }
            )
        }
    }

    protected onMediaEvent<K extends keyof HTMLElementEventMap>(
        event: K,
        callback: (ev: HTMLElementEventMap[K]) => void,
        options?: boolean | AddEventListenerOptions
    ): () => void {
        this.media.addEventListener(event, callback, options)
        return () => this.media.removeEventListener(event, callback, options)
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

    private canPlayType(type: string): boolean {
        return this.media.canPlayType(type) !== ''
    }

    protected setSrc(url: string, blob?: Blob) {
        const src = this.getSrc()
        if (src === url) return
        this.revokeSrc()
        const newSrc =
            blob instanceof Blob && this.canPlayType(blob.type) ? URL.createObjectURL(blob) : url
        this.media.src = newSrc
    }

    protected destroy() {
        this.media.pause()

        if (this.isExternalMedia) return
        this.media.remove()
        this.revokeSrc()
        this.media.src = ''
        // load() 会将媒体元素重置为初始状态
        this.media.load()
    }

    protected setMediaElement(element: HTMLMediaElement) {
        this.media = element
    }

    /** 开始播放音频 */
    public async play(): Promise<void> {
        return this.media.play()
    }

    /** 暂停音频 */
    public pause(): void {
        this.media.pause()
    }

    /** 检查音频是否正在播放 */
    public isPlaying(): boolean {
        return !this.media.paused && !this.media.ended
    }

    /** 跳转到音频的特定时间（以秒为单位） */
    public setTime(time: number) {
        this.media.currentTime = time
    }

    /** 获取音频的持续时间（以秒为单位） */
    public getDuration(): number {
        return this.media.duration
    }

    /** 获取当前音频的播放位置（以秒为单位） */
    public getCurrentTime(): number {
        return this.media.currentTime
    }

    /** 获取音频的音量 */
    public getVolume(): number {
        return this.media.volume
    }

    /** 设置音频的音量 */
    public setVolume(volume: number) {
        this.media.volume = volume
    }

    /** 获取音频的静音状态 */
    public getMuted(): boolean {
        return this.media.muted
    }

    /** 静音或取消静音音频 */
    public setMuted(muted: boolean) {
        this.media.muted = muted
    }

    /** 获取播放速度 */
    public getPlaybackRate(): number {
        return this.media.playbackRate
    }

    /** 检查音频是否正在寻找 */
    public isSeeking(): boolean {
        return this.media.seeking
    }

    /** 设置播放速度，传入可选的 false 以不保持音调 */
    public setPlaybackRate(rate: number, preservePitch?: boolean) {
        // 在大多数浏览器中，默认情况下 preservePitch 为 true
        if (preservePitch != null) {
            this.media.preservesPitch = preservePitch
        }
        this.media.playbackRate = rate
    }

    /** 获取 HTML 媒体元素 */
    public getMediaElement(): HTMLMediaElement {
        return this.media
    }

    /** 设置 sink id 来更改音频输出设备 */
    public setSinkId(sinkId: string): Promise<void> {
        // 参考 https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/setSinkId
        const media = this.media as HTMLAudioElement & {
            setSinkId: (sinkId: string) => Promise<void>
        }
        return media.setSinkId(sinkId)
    }
}

export default Player
