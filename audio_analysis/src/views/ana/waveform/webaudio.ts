import EventEmitter from "./event-emitter"

type WebAudioPlayerEvents = {
    loadedmetadata: []
    canplay: []
    play: []
    pause: []
    seeking: []
    timeupdate: []
    volumechange: []
    empited: []
    ended: []
}

/** 一个 Web 音频缓冲播放器，模拟 HTML5 音频元素的行为 */
class WebAudioPlayer extends EventEmitter<WebAudioPlayerEvents>{
    private audioContext: AudioContext
    private gainNode: GainNode
    private bufferNode: AudioBufferSourceNode | null = null
    private autoplay = false
    private playStartTime = 0
    private playedDuration = 0
    private _muted = false
    private buffer: AudioBuffer | null = null
    public currentSrc = ''
    public paused = true
    public crossOrigin: string | null = null

    constructor(audioContext = new AudioContext()) {
        super()
        this.audioContext = audioContext
        this.gainNode = this.audioContext.createGain()
        this.gainNode.connect(this.audioContext.destination)
    }

    /** 订阅一个事件，返回一个取消订阅的方法 */
    addEventListener = this.on

    /** 从一个事件取消订阅 */
    removeEventListener = this.un

    async load() {
        return
    }

    get src() {
        return this.currentSrc
    }

    set src(value: string) {
        this.currentSrc = value

        if (!value) {
            this.buffer = null
            this.emit('empited')
            return
        }

        fetch(value)
            .then((response) => response.arrayBuffer())
            .then((arrayBuffer) => {
                if (this.currentSrc !== value) return null
                return this.audioContext.decodeAudioData(arrayBuffer)
            })
            .then((audioBuffer) => {
                if (this.currentSrc !== value) return

                this.buffer = audioBuffer

                this.emit('loadedmetadata')
                this.emit('canplay')

                if (this.autoplay) this.play()
            })
    }

    private _play() {
        if (!this.paused) return
        this.paused = false

        this.bufferNode?.disconnect()
        this.bufferNode = this.audioContext.createBufferSource()
        this.bufferNode.buffer = this.buffer
        this.bufferNode.connect(this.gainNode)

        if (this.playedDuration >= this.duration) {
            this.playedDuration = 0
        }

        this.bufferNode.start(this.audioContext.currentTime, this.playedDuration)
        this.playStartTime = this.audioContext.currentTime

        this.bufferNode.onended = () => {
            if (this.currentTime >= this.duration) {
                this.pause()
                this.emit('ended')
            }
        }
    }

    private _pause() {
        if (this.paused) return
        this.paused = true
        this.bufferNode?.stop()
        this.playedDuration += this.audioContext.currentTime - this.playStartTime
    }

    async play() {
        this._play()
        this.emit('play')
    }

    pause() {
        this._pause()
        this.emit('pause')
    }

    stopAt(timeSeconds: number) {
        const delay = timeSeconds - this.currentTime
        this.bufferNode?.stop(this.audioContext.currentTime + delay)

        this.bufferNode?.addEventListener(
            'ended',
            () => {
                this.bufferNode = null
                this.pause()
            },
            { once: true },
        )
    }

    async setSinkId(deviceId: string) {
        const ac = this.audioContext as AudioContext & { setSinkId: (id: string) => Promise<void> }
        return ac.setSinkId(deviceId)
    }

    get playbackRate() {
        return this.bufferNode?.playbackRate.value ?? 1
    }

    set playbackRate(value) {
        if (this.bufferNode) {
            this.bufferNode.playbackRate.value = value
        }
    }

    get currentTime() {
        return this.paused ? this.playedDuration : this.playedDuration + this.audioContext.currentTime - this.playStartTime
    }

    set currentTime(value) {
        this.emit('seeking')

        if (this.paused) {
            this.playedDuration = value
        } else {
            this._pause()
            this.playedDuration = value
            this._play()
        }

        this.emit('timeupdate')
    }

    get duration() {
        return this.buffer?.duration || 0
    }

    get volume() {
        return this.gainNode.gain.value
    }

    set volume(value) {
        this.gainNode.gain.value = value
        this.emit('volumechange')
    }

    get muted() {
        return this._muted
    }

    set muted(value: boolean) {
        if (this._muted === value) return
        this._muted = value

        if (this._muted) {
            this.gainNode.disconnect()
        } else {
            this.gainNode.connect(this.audioContext.destination)
        }
    }

    /** 获取用于播放音频的 GainNode ，可用于连接过滤器 */
    public getGainNode(): GainNode {
        return this.gainNode
    }

    /** 获取解码的音频 */
    public getChannelData(): Float32Array[] {
        const channels: Float32Array[] = []
        if (!this.buffer) return channels
        const numChannels = this.buffer.numberOfChannels
        for (let i = 0; i < numChannels; ++i) {
            channels.push(this.buffer.getChannelData(i))
        }
        return channels
    }
}

export default WebAudioPlayer