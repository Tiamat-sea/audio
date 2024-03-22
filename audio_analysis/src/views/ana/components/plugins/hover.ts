/** 
 * 悬停插件跟随鼠标移动并显示时间戳
 */

import BasePlugin, { type BasePluginEvents } from "../base-plugin"
import createElement from "../dom"

export type HoverPluginOptions = {
    lineColor?: string
    lineWidth?: string | number
    labelColor?: string
    labelSize?: string | number
    labelBackground?: string
}

const defaultOptions = {
    lineWidth: 1,
    labelSize: 11,
}

export type HoverPluginEvents = BasePluginEvents & {
    hover: [relX: number]
}

class HoverPlugin extends BasePlugin<HoverPluginEvents, HoverPluginOptions>{
    protected options: HoverPluginOptions & typeof defaultOptions
    private wrapper: HTMLElement
    private label: HTMLElement
    private unsubscribe: () => void = () => undefined

    constructor(options?: HoverPluginOptions) {
        super(options || {})
        this.options = Object.assign({}, defaultOptions, options)

        // 创建插件元素
        this.wrapper = createElement('div', { part: 'hover' })
        this.label = createElement('span', { part: 'hover-label' }, this.wrapper)
    }

    public static create(options?: HoverPluginOptions) {
        return new HoverPlugin(options)
    }

    private addUnits(value: string | number): string {
        const units = typeof value === 'number' ? 'px' : ''
        return `${value}${units}`
    }

    /** 由 waveform 调用，不用手动调用 */
    onInit() {
        if (!this.waveform) {
            throw Error('Waveform is not initialized')
        }

        const waveformOptions = this.waveform.options
        const lineColor = this.options.lineColor || waveformOptions.cursorColor || waveformOptions.progressColor

        // 垂直线
        Object.assign(this.wrapper.style, {
            position: 'absolute',
            zIndex: 10,
            left: 0,
            top: 0,
            height: '100%',
            pointerEvents: 'none',
            borderLeft: `${this.addUnits(this.options.lineWidth)} solid ${lineColor}`,
            opacity: '0',
            transition: 'opacity .1s ease-in',
        })

        // 时间戳标注
        Object.assign(this.label.style, {
            display: 'block',
            backgroundColor: this.options.labelBackground,
            color: this.options.labelColor,
            fontSize: `${this.addUnits(this.options.labelSize)}`,
            transition: 'transform .1s ease-in',
            padding: '2px 3px',
        })

        // 添加包装器
        const container = this.waveform.getWrapper()
        container.appendChild(this.wrapper)

        // 附加指针事件
        container.addEventListener('pointermove', this.onPointerMove)
        container.addEventListener('pointerleave', this.onPointerLeave)
        container.addEventListener('wheel', this.onPointerMove)
        this.unsubscribe = () => {
            container.removeEventListener('pointermove', this.onPointerMove)
            container.removeEventListener('pointerleave', this.onPointerLeave)
            container.removeEventListener('wheel', this.onPointerLeave)
        }
    }

    private formatTime(seconds: number): string {
        const minutes = Math.floor(seconds / 60)
        const secondsRemainder = Math.floor(seconds) % 60
        const paddedSeconds = `0${secondsRemainder}`.slice(-2)
        return `${minutes}:${paddedSeconds}`
    }

    private onPointerMove = (e: PointerEvent | WheelEvent) => {
        if (!this.waveform) return

        // 位置
        const bbox = this.waveform.getWrapper().getBoundingClientRect()
        const { width } = bbox
        const offsetX = e.clientX - bbox.left
        const relX = Math.min(1, Math.max(0, offsetX / width))
        const posX = Math.min(width - this.options.lineWidth - 1, offsetX)
        this.wrapper.style.transform = `translateX(${posX}px)`
        this.wrapper.style.opacity = '1'

        // 时间戳
        const duration = this.waveform.getDuration() || 0
        this.label.textContent = this.formatTime(duration * relX)
        const labelWidth = this.label.offsetWidth
        this.label.style.transform =
            posX + labelWidth > width ? `translateX(-${labelWidth + this.options.lineWidth}px)` : ''

        // 使用相对 X 位置发射一个 hover 事件
        this.emit('hover', relX)
    }

    private onPointerLeave = () => {
        this.wrapper.style.opacity = '0'
    }

    /** 取消挂载 */
    public destroy(): void {
        super.destroy()
        this.unsubscribe()
        this.wrapper.remove()
    }
}

export default HoverPlugin