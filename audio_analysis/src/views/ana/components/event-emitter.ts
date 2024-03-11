export type GeneralEventTypes = {
    // 事件的名称及其分派的数据
    // 例如 'entryCreated': [count: 1]
    [EventName: string]: unknown[]  // eslint-disable-line @typescript-eslint/no-explicit-any
}

type EventListener<EventTypes extends GeneralEventTypes, EventName extends keyof EventTypes> = (
    ...args: EventTypes[EventName]
) => void

type EventMap<EventTypes extends GeneralEventTypes> = {
    [EventName in keyof EventTypes]: Set<EventListener<EventTypes, EventName>>
}

/** 一个简单的事件发射器，可用于侦听和发射事件 */
class EventEmitter<EventTypes extends GeneralEventTypes> {
    private listeners = {} as EventMap<EventTypes>

    /** 发起一个事件，返回一个注销事件的方法 */
    public on<EventName extends keyof EventTypes>(
        event: EventName,
        listener: EventListener<EventTypes, EventName>,
        options?: { once?: boolean },
    ): () => void {
        if (!this.listeners[event]) {
            this.listeners[event] = new Set()
        }
        this.listeners[event].add(listener)

        if (options?.once) {
            const unsubscribeOnce = () => {
                this.un(event, unsubscribeOnce)
                this.un(event, listener)
            }
            this.on(event, unsubscribeOnce)
            return unsubscribeOnce
        }

        return () => this.un(event, listener)
    }

    /** 注销事件 */
    public un<EventName extends keyof EventTypes>(
        event: EventName,
        listener: EventListener<EventTypes, EventName>,
    ): void {
        this.listeners[event]?.delete(listener)
    }

    /** 只发起一次事件 */
    public once<EventName extends keyof EventTypes>(
        event: EventName,
        listener: EventListener<EventTypes, EventName>,
    ): () => void {
        return this.on(event, listener, { once: true })
    }

    /** 清除所有事件 */
    public unAll(): void {
        this.listeners = {} as EventMap<EventTypes>
    }

    /** 发射一个事件 */
    protected emit<EventName extends keyof EventTypes>(
        eventName: EventName,
        ...args: EventTypes[EventName]
    ): void {
        if (this.listeners[eventName]) {
            this.listeners[eventName].forEach((listener) => listener(...args))
        }

        // console.log(...args)
    }
}

export default EventEmitter