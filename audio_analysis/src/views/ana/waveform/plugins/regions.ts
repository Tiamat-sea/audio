/**
 * Regions plugin 是波形上的视觉覆盖，可用于标记音频中的特定区域。
 * 区域可以单击、拖动和调整大小。
 * 您可以设置每个区域的颜色和内容，以及他们的 HTML 内容
 */

import BasePlugin, { type BasePluginEvents } from "../base-plugin"
import { makeDraggable } from "../draggable"
import EventEmitter from "../event-emitter"
import createElement from "../dom"

export type RegionsPluginOptions = undefined

export type RegionsPluginEvents = BasePluginEvents & {
    'region-created': [region: Region],
    'region-updated': [region: Region],
    'region-removed': [region: Region],
    'region-clicked': [region: Region, e: MouseEvent],
    'region-dblclicked': [region: Region, e: MouseEvent],
    'region-in': [region: Region],
    'region-out': [region: Region],
}

export type RegionEvents = {
    /** 删除区域之前 */
    remove: [],
    /** 更新区域参数时 */
    update: [side?: 'start' | 'end'],
    /** 完成拖动或调整大小时 */
    'update-end': [],
    /** 播放中 */
    play: [],
    /** 鼠标单击时 */
    click: [event: MouseEvent],
    /** 双击 */
    dblclick: [event: MouseEvent],
    /** 鼠标悬停 */
    over: [event: MouseEvent],
    /** 鼠标离开 */
    leave: [event: MouseEvent],
}

export type RegionParams = {
    /** 区域的 id, 任意字符串 */
    id?: string,
    /** 区域的开始位置，即时间（单位：秒） */
    start: number,
    /** 区域的结束位置，即时间（单位：秒） */
    end?: number,
    /** 允许/拒绝拖动区域 */
    drag?: boolean,
    /** 允许/拒绝调整区域大小 */
    resize?: boolean,
    /** 区域的颜色（CSS 颜色） */
    color?: string,
    /** 区域的内容或 HTML  */
    content?: string | HTMLElement,
    /** 调整大小时的最小长度（单位：秒） */
    minLength?: number,
    /** 调整大小时的最大长度（单位：秒） */
    maxLength?: number,
    /** 通道的索引 */
    channelIndex?: number,
    /** 允许/拒绝内容的内容可编辑（contenteditable）属性 */
    contentEditable?: boolean,
}

class SingleRegion extends EventEmitter<RegionEvents>{
    public element: HTMLElement
    public id: string
    public start: number
    public end: number
    public drag: boolean
    public resize: boolean
    public color: string
    public content?: HTMLElement
    public minLength = 0
    public maxLength = Infinity
    public channelIndex: number
    public contentEditable = false

    constructor(params: RegionParams, private totalDuration: number, private numberOfChannels = 0) {
        super()

        this.id = params.id || `region-${Math.random().toString(36).slice(2)}`
        this.start = this.clampPosition(params.start)
        this.end = this.clampPosition(params.end ?? params.start)
        this.drag = params.drag ?? true
        this.resize = params.resize ?? true
        this.color = params.color ?? 'rgba(0, 0, 0, 0.1)'
        this.minLength = params.minLength ?? this.minLength
        this.maxLength = params.maxLength ?? this.maxLength
        this.channelIndex = params.channelIndex ?? -1
        this.contentEditable = params.contentEditable ?? this.contentEditable
        this.element = this.initElement()
        this.setContent(params.content)
        this.setPart()

        this.renderPosition()
        this.initMouseEvents()
    }

    private clampPosition(time: number): number {
        return Math.max(0, Math.min(this.totalDuration, time))
    }

    private setPart() {
        const isMarker = this.start === this.end
        this.element.setAttribute('part', `${isMarker ? 'marker' : 'region'} ${this.id}`)
    }

    private addResizeHandles(element: HTMLElement) {
        const handleStyle = {
            position: 'absolute',
            zIndex: '2',
            width: '6px',
            height: '100%',
            top: '0',
            cursor: 'ew-resize',
            wordBreak: 'keep-all',
        }

        const leftHandle = createElement(
            'div',
            {
                part: 'region-handle region-handle-left',
                style: {
                    ...handleStyle,
                    left: '0',
                    borderLeft: '2px solid rgba(0, 0, 0, 0.5)',
                    borderRadius: '2px 0 0 2px',
                },
            },
            element,
        )

        const rightHandle = createElement(
            'div',
            {
                part: 'region-handle region-handle-right',
                style: {
                    ...handleStyle,
                    right: '0',
                    borderRight: '2px solid rgba(0, 0, 0, 0.5)',
                    borderRadius: '0 2px 2px 0',
                },
            },
            element,
        )

        // 调整大小
        const resizeThreshold = 1
        makeDraggable(
            leftHandle,
            (dx) => this.onResize(dx, 'start'),
            () => null,
            () => this.onEndResizing(),
            resizeThreshold,
        )
        makeDraggable(
            rightHandle,
            (dx) => this.onResize(dx, 'end'),
            () => null,
            () => this.onEndResizing(),
            resizeThreshold,
        )
    }

    private removeResizeHandles(element: HTMLElement) {
        const leftHandle = element.querySelector('[part*="region-handle-left"]')
        const rightHandle = element.querySelector('[part*="region-handle-right"]')
        if (leftHandle) {
            element.removeChild(leftHandle)
        }
        if (rightHandle) {
            element.removeChild(rightHandle)
        }
    }

    private initElement() {
        const isMarker = this.start === this.end

        let elementTop = 0
        let elementHeight = 100

        if (this.channelIndex >= 0 && this.channelIndex < this.numberOfChannels) {
            elementHeight = 100 / this.numberOfChannels
            elementTop = elementHeight * this.channelIndex
        }

        const element = createElement('div', {
            style: {
                position: 'absolute',
                top: `${elementTop}%`,
                height: `${elementHeight}%`,
                backgroundColor: isMarker ? 'none' : this.color,
                borderLeft: isMarker ? '2px solid ' + this.color : 'none',
                borderRadius: '2px',
                boxSizing: 'border-box',
                transition: 'background-color 0.2s ease',
                cursor: this.drag ? 'grab' : 'default',
                pointerEvents: 'all',
            },
        })

        // 添加调整大小的控件
        if (!isMarker && this.resize) {
            this.addResizeHandles(element)
        }

        return element
    }

    private renderPosition() {
        const start = this.start / this.totalDuration
        const end = (this.totalDuration - this.end) / this.totalDuration
        this.element.style.left = `${start * 100}%`
        this.element.style.right = `${end * 100}%`
    }

    private toggleCursor(toggle: boolean) {
        if (!this.drag || !this.element?.style) return
        this.element.style.cursor = toggle ? 'grabbing' : 'grab'
    }

    private initMouseEvents() {
        const { element } = this
        if (!element) return

        element.addEventListener('click', (e) => this.emit('click', e))
        element.addEventListener('mouseenter', (e) => this.emit('over', e))
        element.addEventListener('mouseleave', (e) => this.emit('leave', e))
        element.addEventListener('dblclick', (e) => this.emit('dblclick', e))
        element.addEventListener('pointerdown', () => this.toggleCursor(true))
        element.addEventListener('pointerup', () => this.toggleCursor(false))

        // 拖动
        makeDraggable(
            element,
            (dx) => this.onMove(dx),
            () => this.toggleCursor(true),
            () => {
                this.toggleCursor(false)
                this.drag && this.emit('update-end')
            },
        )

        if (this.contentEditable && this.content) {
            this.content.addEventListener('click', (e) => this.onContentClick(e))
            this.content.addEventListener('blur', () => this.onContentBlur())
        }
    }

    public _onUpdate(dx: number, side?: 'start' | 'end') {
        if (!this.element.parentElement) return
        const { width } = this.element.parentElement.getBoundingClientRect()
        const deltaSeconds = (dx / width) * this.totalDuration
        const newStart = !side || side === 'start' ? this.start + deltaSeconds : this.start
        const newEnd = !side || side === 'end' ? this.end + deltaSeconds : this.end
        const length = newEnd - newStart

        if (
            newStart >= 0 &&
            newEnd <= this.totalDuration &&
            newStart <= newEnd &&
            length >= this.minLength &&
            length <= this.maxLength
        ) {
            this.start = newStart
            this.end = newEnd

            this.renderPosition()
            this.emit('update', side)
        }
    }

    private onMove(dx: number) {
        if (!this.drag) return
        this._onUpdate(dx)
    }

    private onResize(dx: number, side: 'start' | 'end') {
        if (!this.resize) return
        this._onUpdate(dx, side)
    }

    private onEndResizing() {
        if (!this.resize) return
        this.emit('update-end')
    }

    private onContentClick(event: MouseEvent) {
        event.stopPropagation()
        const contentContainer = event.target as HTMLDivElement
        contentContainer.focus()
        this.emit('click', event)
    }

    public onContentBlur() {
        this.emit('update-end')
    }

    public _setTotalDuration(totalDuration: number) {
        this.totalDuration = totalDuration
        this.renderPosition()
    }

    /** 区域从头开始播放 */
    public play() {
        this.emit('play')
    }

    /** 设置区域的 HTML 内容 */
    public setContent(content: RegionParams['content']) {
        this.content?.remove()
        if (!content) {
            this.content = undefined
            return
        }
        if (typeof content === 'string') {
            const isMarker = this.start === this.end
            this.content = createElement('div', {
                style: {
                    padding: '0.2em ${isMarker ? 0.2 : 0.4}em',
                    display: 'inline-block',
                },
                textContent: content,
            })
        } else {
            this.content = content
        }
        if (this.contentEditable) {
            this.content.contentEditable = 'true'
        }
        this.content.setAttribute('part', 'region-content')
        this.element.appendChild(this.content)
    }

    /** 更新区域的选项 */
    public setOptions(options: Omit<RegionParams, 'minLength' | 'maxLength'>) {
        if (options.color) {
            this.color = options.color
            this.element.style.backgroundColor = options.color
        }

        if (options.drag !== undefined) {
            this.drag = options.drag
            this.element.style.cursor = options.drag ? 'grab' : 'default'
        }

        if (options.start !== undefined || options.end !== undefined) {
            const isMarker = this.start === this.end
            this.start = this.clampPosition(options.start ?? this.start)
            this.end = this.clampPosition(options.end ?? (isMarker ? this.start : this.end))
            this.renderPosition()
            this.setPart()
        }

        if (options.content) {
            this.setContent(options.content)
        }

        if (options.id) {
            this.id = options.id
            this.setPart()
        }

        if (options.resize !== undefined && options.resize !== this.resize) {
            const isMarker = this.start === this.end
            this.resize = options.resize
            if (this.resize && !isMarker) {
                this.addResizeHandles(this.element)
            } else {
                this.removeResizeHandles(this.element)
            }
        }
    }

    /** 删除区域 */
    public remove() {
        this.emit('remove')
        this.element.remove()
        // 这违反了类型限制，但是我们希望清除 DOM 引用
        // 对于这个元素，w/o 必须包含一个可空的类型
        this.element = null as unknown as HTMLElement
    }
}

class RegionsPlugin extends BasePlugin<RegionsPluginEvents, RegionsPluginOptions>{
    private regions: Region[] = []
    private regionsContainer: HTMLElement

    /** 创建一个 RegionsPlugin 实例 */
    constructor(options?: RegionsPluginOptions) {
        super(options)
        this.regionsContainer = this.initRegionsContainer()
    }

    /** 创建一个 RegionsPlugin 实例 */
    public static create(options?: RegionsPluginOptions) {
        return new RegionsPlugin(options)
    }

    /** 由 waveform 调用，不要手动调用 */
    onInit() {
        if (!this.waveform) {
            throw new Error('Waveform is not defined')
        }
        this.waveform.getWrapper().appendChild(this.regionsContainer)

        let activeRegions: Region[] = []
        this.subscriptions.push(
            this.waveform.on('timeupdate', (currentTime) => {
                // 播放区域时检测
                const playedRegions = this.regions.filter(
                    (region) =>
                        region.start <= currentTime &&
                        (region.end === region.start ? region.start + 0.05 : region.end) >= currentTime,
                )

                // 当 activeRegions 不包括 playedRegions 时，触发 region-in 事件
                playedRegions.forEach((region) => {
                    if (!activeRegions.includes(region)) {
                        this.emit('region-in', region)
                    }
                })

                // 当 activeRegions 包括 un-playedRegions 时，触发 region-out 事件
                activeRegions.forEach((region) => {
                    if (!playedRegions.includes(region)) {
                        this.emit('region-out', region)
                    }
                })

                // 仅 playedRegions 更新 activeRegions
                activeRegions = playedRegions
            }),
        )
    }

    private initRegionsContainer(): HTMLElement {
        return createElement('div', {
            style: {
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                zIndex: '3',
                pointerEvents: 'none',
            },
        })
    }

    /** 获取所有被创建了的区域 */
    public getRegions(): Region[] {
        return this.regions
    }

    private avoidOverlapping(region: Region) {
        if (!region.content) return

        // 检查是否有标签重叠
        // 如果有，把它往下推，直到没有重叠标签
        const div = region.content as HTMLElement
        const box = div.getBoundingClientRect()

        const overlap = this.regions
            .map((reg) => {
                if (reg === region || !reg.content) return 0

                const otherBox = reg.content.getBoundingClientRect()
                if (box.left < otherBox.left + otherBox.left && box.left + box.width) {
                    return otherBox.height
                }
                return 0
            })
            .reduce((sum, val) => sum + val, 0)

        div.style.marginTop = `${overlap}px`
    }

    private adjustScroll(region: Region) {
        const scrollContainer = this.waveform?.getWrapper()?.parentElement
        if (!scrollContainer) return
        const { clientWidth, scrollWidth } = scrollContainer
        if (scrollWidth <= clientWidth) return
        const scrollBbox = scrollContainer.getBoundingClientRect()
        const bbox = region.element.getBoundingClientRect()
        const left = bbox.left - scrollBbox.left
        const right = bbox.right - scrollBbox.right
        if (left < 0) {
            scrollContainer.scrollLeft += left
        } else if (right > clientWidth) {
            scrollContainer.scrollLeft += right - clientWidth
        }
    }

    private saveRegion(region: Region) {
        this.regionsContainer.appendChild(region.element)
        this.avoidOverlapping(region)
        this.regions.push(region)

        const regionSubscriptions = [
            region.on('update', (side) => {
                // 未定义的边表明我们是在拖动而不是调整大小
                if (!side) {
                    this.adjustScroll(region)
                }
            }),

            region.on('update-end', () => {
                this.avoidOverlapping(region)
                this.emit('region-updated', region)
            }),

            region.on('play', () => {
                this.waveform?.play()
                this.waveform?.setTime(region.start)
            }),

            region.on('click', (e) => {
                this.emit('region-clicked', region, e)
            }),

            region.on('dblclick', (e) => {
                this.emit('region-dblclicked', region, e)
            }),

            // 删除区域后将其从列表中删除
            region.once('remove', () => {
                regionSubscriptions.forEach((unsubscribe) => unsubscribe())
                this.regions = this.regions.filter((reg) => reg !== region)
                this.emit('region-removed', region)
            }),
        ]

        this.subscriptions.push(...regionSubscriptions)

        this.emit('region-created', region)
    }

    /** 使用给定的参数创建一个区域 */
    public addRegion(options: RegionParams): Region {
        if (!this.waveform) {
            throw new Error('Waveform is not initialized')
        }

        const duration = this.waveform.getDuration()
        const numberOfChannels = this.waveform?.getDecodedData()?.numberOfChannels
        const region = new SingleRegion(options, duration, numberOfChannels)

        if (!duration) {
            this.subscriptions.push(
                this.waveform.on('ready', (duration) => {
                    region._setTotalDuration(duration)
                    this.saveRegion(region)
                }),
            )
        } else {
            this.saveRegion(region)
        }

        return region
    }

    /** 
     * 通过拖动波形上的空白区域，可以创建区域
     * 返回一个函数以禁用拖动选择
     */
    public enableDragSelection(options: Omit<RegionParams, 'start' | 'end'>, threshold = 3): () => void {
        const wrapper = this.waveform?.getWrapper()
        if (!wrapper || !(wrapper instanceof HTMLElement)) return () => undefined

        const initialSize = 5
        let region: Region | null = null
        let startX = 0

        return makeDraggable(
            wrapper,

            // 开始拖动
            (dx, _dy, x) => {
                if (region) {
                    // 更新区域的结束位置
                    // 如果我们正在向左拖动，我们需要更新开始位置
                    region._onUpdate(dx, x > startX ? 'end' : 'start')
                }
            },

            // 拖动开始，拖动阈值
            (x) => {
                startX = x
                if (!this.waveform) return
                const duration = this.waveform.getDuration()
                const numberOfChannels = this.waveform?.getDecodedData()?.numberOfChannels
                const { width } = this.waveform.getWrapper().getBoundingClientRect()
                // 计算区域的开始时间
                const start = (x / width) * duration
                // 给区域一个较小的初始大小
                const end = ((x + initialSize) / width) * duration

                // 创建区域，但在拖动结束之前不要保存
                region = new SingleRegion(
                    {
                        ...options,
                        start,
                        end,
                    },
                    duration,
                    numberOfChannels,
                )
                // 现在只需将它添加到 DOM 中
                this.regionsContainer.appendChild(region.element)
            },

            // 拖动结束
            () => {
                if (region) {
                    this.saveRegion(region)
                    region = null
                }
            },

            threshold,
        )
    }

    /** 删除所有区域 */
    public clearRegions() {
        this.regions.forEach((region) => region.remove())
    }

    /** 销毁插件并清理干净 */
    public destroy() {
        this.clearRegions()
        this.regionsContainer.remove()
        super.destroy()
    }
}

export default RegionsPlugin

export type Region = InstanceType<typeof SingleRegion>