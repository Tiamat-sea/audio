/**
 * 缩放插件
 *
 * 滚动鼠标滚轮时放大或缩小波形
 *
 * @author HoodyHuo (https://github.com/HoodyHuo)
 * @author Chris Morbitzer (https://github.com/cmorbitzer)
 * @author Sam Hulick (https://github.com/ffxsam)
 *
 * @example
 * // ... 通过这个插件初始化 waveform
 * var waveform = WaveForm.create({
 *   // waveform options ...
 *   plugins: [
 *     ZoomPlugin.create({
 *       // plugin options ...
 *     })
 *   ]
 * });
 */

// @ts-nocheck

import { BasePlugin, BasePluginEvents } from '../base-plugin'

export type ZoomPluginOptions = {
    /**
     * 每个滚动步进的缩放量，例如 0.5, 意味着每次滚动放大或缩小 50%
     *
     * @default 0.5
     */
    scale?: number
    maxZoom?: number // 缩放时每秒最大像素数
    /**
     * 缩放波形之前，轮子或触控板需要移动的量。
     * 将该值设置为 0 可实现完全流畅的缩放（这会导致很高的 CPU 成本）
     * 
     * @default 0
     */
    deltaThreshold?: number
}
const defaultOptions = {
    scale: 0.5,
    deltaThreshold: 0,
}

export type ZoomPluginEvents = BasePluginEvents

class ZoomPlugin extends BasePlugin<ZoomPluginEvents, ZoomPluginEvents>{
    protected options: ZoomPluginOptions & typeof defaultOptions
    private wrapper: HTMLElement | undefined = undefined
    private container: HTMLElement | null = null
    private accumulatedDelta = 0

    constructor(options?: ZoomPluginOptions) {
        super(options || {})
        this.options = Object.assign({}, defaultOptions, options)
    }

    public static create(options?: ZoomPluginOptions) {
        return new ZoomPlugin(options)
    }

    onInit() {
        this.wrapper = this.waveform?.getWrapper()
        if (!this.wrapper) {
            return
        }
        this.container = this.wrapper.parentElement as HTMLElement
        this.wrapper.addEventListener('wheel', this.onWheel)
    }

    private onWheel = (e: WheelEvent) => {
        if (!this.waveform || !this.container || Math.abs(e.deltaX) >= Math.abs(e.deltaY)) {
            return
        }
        // 禁止在缩放时滚动侧边栏
        e.preventDefault()

        // 更新累计的增量 delta...
        this.accumulatedDelta += -e.deltaY

        // ... 只有当我们达到阈值的时候才滚动
        if (this.options.deltaThreshold === 0 || Math.abs(this.accumulatedDelta) >= this.options.deltaThreshold) {
            const duration = this.waveform.getDuration()
            const oldMinPxPerSec = this.waveform.options.minPxPerSec
            const x = e.clientX
            const width = this.container.clientWidth
            const scrollX = this.waveform.getScroll()
            const pointerTime = (scrollX + x) / oldMinPxPerSec
            const newMinPxPerSec = this.calculateNewZoom(oldMinPxPerSec, this.accumulatedDelta)
            const newLeftSec = (width / newMinPxPerSec) * (x / width)

            if (newMinPxPerSec * duration < width) {
                this.waveform.zoom(width / duration)
                this.container.scrollLeft = 0
            } else {
                this.waveform.zoom(newMinPxPerSec)
                this.container.scrollLeft = (pointerTime - newLeftSec) * newMinPxPerSec
            }

            // 重新设置累计的增量 delta
            this.accumulatedDelta = 0
        }
    }

    private calculateNewZoom = (oldZoom: number, delta: number) => {
        const newZoom = Math.max(0, oldZoom + delta * this.options.scale)
        return typeof this.options.maxZoom === 'undefined' ? newZoom : Math.min(newZoom, this.options.maxZoom)
    }

    destroy() {
        if (this.wrapper) {
            this.wrapper.removeEventListener('wheel', this.onWheel)
        }
        super.destroy()
    }
}

export default ZoomPlugin