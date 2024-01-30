import EventEmitter from "./event-emitter"
import WaveForm from "./waveform"

export type BasePluginEvents = {
    destroy: []
}

export type GenericPlugin = BasePlugin<BasePluginEvents, unknown>

/** waveform 插件的基类 */
export class BasePlugin<EventTypes extends BasePluginEvents, Options> extends EventEmitter<EventTypes> {
    protected waveform?: WaveForm
    protected subscriptions: (() => void)[] = []
    protected options: Options

    /** 创建一个插件实例 */
    constructor(options: Options) {
        super()
        this.options = options
    }

    /** 在 this.waveform 可用后被调用 */
    protected onInit() {
        return
    }

    /** 不要直接调用，仅由 waveform 内部调用 */
    public _init(waveform: WaveForm) {
        this.waveform = waveform
        this.onInit()
    }

    /** 销毁插件并注销所有事件 */
    public destory() {
        this.emit('destroy')
        this.subscriptions.forEach((unsubscribe) => unsubscribe())
    }
}

export default BasePlugin