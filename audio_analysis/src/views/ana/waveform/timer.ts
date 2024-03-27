import EventEmitter from './event-emitter'

type TimerEvents = {
    tick: []
}

/** 计时器类，用于定时触发事件 */
class Timer extends EventEmitter<TimerEvents> {
    private unsubscribe: () => void = () => undefined

    /** 启动计时器 */
    start() {
        this.unsubscribe = this.on('tick', () => {
            requestAnimationFrame(() => {
                this.emit('tick')
            })
        })
        this.emit('tick')
    }

    /** 停止计时器 */
    stop() {
        this.unsubscribe()
    }

    /** 销毁计时器 */
    destroy() {
        this.unsubscribe()
    }
}

export default Timer
