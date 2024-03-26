import EventEmitter from './event-emitter'
import type WaveForm from './waveform'

export type BasePluginEvents = { // 基础插件事件
    destroy: []
}

export type GenericPlugin = BasePlugin<BasePluginEvents, unknown> // 通用插件

/** 波形插件的基类 */
export class BasePlugin<
    EventTypes extends BasePluginEvents,
    Options
> extends EventEmitter<EventTypes> {
    protected waveform?: WaveForm
    protected subscriptions: (() => void)[] = [] // 订阅
    protected options: Options

    /** 创建一个插件实例 */
    constructor(options: Options) {
        super()
        this.options = options
    }

    /** 在 this.waveform 可用之后调用 */
    protected onInit() {
        return
    }

    /** 不要直接调用，仅由 WavesSurfer 内部调用 */
    public _init(waveform: WaveForm) {
        this.waveform = waveform
        this.onInit()
    }

    /** 销毁插件并取消订阅所有事件 */
    public destroy() {
        this.emit('destroy')
        this.subscriptions.forEach((unsubscribe) => unsubscribe()) // 取消订阅
    }
}

export default BasePlugin
