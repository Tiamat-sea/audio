export type GeneralEventTypes = { // 通用事件类型
    // 事件的名称及其分派的数据
    // 例如 'entryCreated': [count: 1]
    [EventName: string]: unknown[]  // eslint-disable-line @typescript-eslint/no-explicit-any
}

type EventListener<EventTypes extends GeneralEventTypes, EventName extends keyof EventTypes> = ( // 事件监听器
    ...args: EventTypes[EventName] // 事件的数据
) => void

type EventMap<EventTypes extends GeneralEventTypes> = { // 事件映射
    [EventName in keyof EventTypes]: Set<EventListener<EventTypes, EventName>> // 事件监听器集合
}

/** 一个简单的事件发射器，可用于侦听和发射事件 */
class EventEmitter<EventTypes extends GeneralEventTypes> { // 事件发射器
    private listeners = {} as EventMap<EventTypes> // 事件映射

    /** 发起一个事件，返回一个注销事件的方法 */
    public on<EventName extends keyof EventTypes>( // 注册事件
        event: EventName, // 事件名称
        listener: EventListener<EventTypes, EventName>, // 事件监听器
        options?: { once?: boolean }, // 选项
    ): () => void { // 返回注销事件的方法
        if (!this.listeners[event]) { // 如果没有该事件
            this.listeners[event] = new Set() // 创建一个新的事件集合
        }
        this.listeners[event].add(listener) // 添加事件监听器

        if (options?.once) { // 如果是一次性事件
            const unsubscribeOnce = () => { // 注销一次性事件
                this.un(event, unsubscribeOnce) // 注销事件
                this.un(event, listener) // 注销事件
            }
            this.on(event, unsubscribeOnce) // 注册事件
            return unsubscribeOnce // 返回注销事件的方法
        }

        return () => this.un(event, listener) // 返回注销事件的方法
    }

    /** 注销事件 */
    public un<EventName extends keyof EventTypes>( // 注销事件
        event: EventName, // 事件名称
        listener: EventListener<EventTypes, EventName>, // 事件监听器
    ): void { // 返回注销事件的方法
        this.listeners[event]?.delete(listener) // 删除事件监听器
    }

    /** 只发起一次事件 */
    public once<EventName extends keyof EventTypes>( // 一次性事件
        event: EventName, // 事件名称
        listener: EventListener<EventTypes, EventName>, // 事件监听器
    ): () => void {
        return this.on(event, listener, { once: true }) // 注册一次性事件
    }

    /** 清除所有事件 */
    public unAll(): void {
        this.listeners = {} as EventMap<EventTypes> // 清空事件映射
    }

    /** 发射一个事件 */
    protected emit<EventName extends keyof EventTypes>( // 发射事件
        eventName: EventName, // 事件名称
        ...args: EventTypes[EventName] // 事件的数据
    ): void {
        if (this.listeners[eventName]) { // 如果有该事件
            this.listeners[eventName].forEach((listener) => listener(...args)) // 遍历事件监听器
        }

        // console.log(eventName, ...args)
        // console.log(this.listeners)
    }
}

export default EventEmitter // 导出事件发射器