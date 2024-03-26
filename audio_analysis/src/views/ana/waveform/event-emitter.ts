export type GeneralEventTypes = {
    // 事件的名称和它所携带的数据
    // 例如：'entryCreated': [count: 1]
    [EventName: string]: unknown[] // eslint-disable-line @typescript-eslint/no-explicit-any
}

type EventListener<EventTypes extends GeneralEventTypes, EventName extends keyof EventTypes> = ( // 事件监听器类型
    ...args: EventTypes[EventName] // 事件监听器的参数
) => void

type EventMap<EventTypes extends GeneralEventTypes> = { // 事件映射集合
    [EventName in keyof EventTypes]: Set<EventListener<EventTypes, EventName>> // 事件监听器集合
}

/** 一个简单的事件发射器，可用于监听和触发事件。 */
class EventEmitter<EventTypes extends GeneralEventTypes> {
    private listeners = {} as EventMap<EventTypes> // 事件监听器集合

    /** 订阅一个事件，返回一个取消订阅的函数。 */
    public on<EventName extends keyof EventTypes>(
        event: EventName,
        listener: EventListener<EventTypes, EventName>, // 事件监听器
        options?: { once?: boolean }
    ): () => void {
        if (!this.listeners[event]) { // 如果没有这个事件的监听器集合
            this.listeners[event] = new Set() // 创建
        }
        this.listeners[event].add(listener) // 添加监听器

        if (options?.once) { // 如果是一次性的
            const unsubscribeOnce = () => { // 取消订阅一次
                this.un(event, unsubscribeOnce)
                this.un(event, listener)
            }
            this.on(event, unsubscribeOnce) // 订阅
            return unsubscribeOnce
        }

        return () => this.un(event, listener)
    }

    /** 取消订阅一个事件 */
    public un<EventName extends keyof EventTypes>(
        event: EventName,
        listener: EventListener<EventTypes, EventName>
    ): void {
        this.listeners[event]?.delete(listener) // 删除监听器
    }

    /** 仅订阅一个事件一次 */
    public once<EventName extends keyof EventTypes>(
        event: EventName,
        listener: EventListener<EventTypes, EventName>
    ): () => void {
        return this.on(event, listener, { once: true }) // 订阅一次
    }

    /** 清除所有事件 */
    public unAll(): void {
        this.listeners = {} as EventMap<EventTypes> // 清空监听器集合
    }

    /** 触发一个事件 */
    protected emit<EventName extends keyof EventTypes>(
        eventName: EventName,
        ...args: EventTypes[EventName] // 事件的参数
    ): void {
        if (this.listeners[eventName]) {
            this.listeners[eventName].forEach((listener) => listener(...args)) // 触发事件
        }
    }
}

export default EventEmitter
