/**
 * Minimap is a tiny copy of the main waveform serving as a navigation tool.
 */

import BasePlugin, { type BasePluginEvents } from '../base-plugin'
import WaveForm, { type WaveFormOptions } from '../waveform'
import createElement from '../dom'

export type MinimapPluginOptions = {
    overlayColor?: string
    insertPosition?: InsertPosition
} & Partial<WaveFormOptions>

const defaultOptions = {
    height: 50,
    overlayColor: 'rgba(100, 100, 100, 0.1)',
    insertPosition: 'afterend'
}

export type MinimapPluginEvents = BasePluginEvents & {
    ready: []
    interaction: []
}

class MinimapPlugin extends BasePlugin<MinimapPluginEvents, MinimapPluginOptions> {
    protected options: MinimapPluginOptions & typeof defaultOptions
    private minimapWrapper: HTMLElement
    private miniWaveform: WaveForm | null = null
    private overlay: HTMLElement
    private container: HTMLElement | null = null

    constructor(options: MinimapPluginOptions) {
        super(options)
        this.options = Object.assign({}, defaultOptions, options)

        this.minimapWrapper = this.initMinimapWrapper()
        this.overlay = this.initOverlay()
    }

    public static create(options: MinimapPluginOptions) {
        return new MinimapPlugin(options)
    }

    /** Called by waveform, don't call manually */
    onInit() {
        if (!this.waveform) {
            throw Error('WaveForm is not initialized')
        }

        if (this.options.container) {
            if (typeof this.options.container === 'string') {
                this.container = document.querySelector(this.options.container) as HTMLElement
            } else if (this.options.container instanceof HTMLElement) {
                this.container = this.options.container
            }
            this.container?.appendChild(this.minimapWrapper)
        } else {
            this.container = this.waveform.getWrapper().parentElement
            this.container?.insertAdjacentElement(this.options.insertPosition, this.minimapWrapper)
        }

        this.initWaveFormEvents()
    }

    private initMinimapWrapper(): HTMLElement {
        return createElement('div', {
            part: 'minimap',
            style: {
                position: 'relative'
            }
        })
    }

    private initOverlay(): HTMLElement {
        return createElement(
            'div',
            {
                part: 'minimap-overlay',
                style: {
                    position: 'absolute',
                    zIndex: '2',
                    left: '0',
                    top: '0',
                    bottom: '0',
                    transition: 'left 100ms ease-out',
                    pointerEvents: 'none',
                    backgroundColor: this.options.overlayColor
                }
            },
            this.minimapWrapper
        )
    }

    private initMinimap() {
        if (this.miniWaveform) {
            this.miniWaveform.destroy()
            this.miniWaveform = null
        }

        if (!this.waveform) return

        const data = this.waveform.getDecodedData()
        const media = this.waveform.getMediaElement()
        if (!data || !media) return

        const peaks = []
        for (let i = 0; i < data.numberOfChannels; i++) {
            peaks.push(data.getChannelData(i))
        }

        this.miniWaveform = WaveForm.create({
            ...this.options,
            container: this.minimapWrapper,
            minPxPerSec: 0,
            fillParent: true,
            media,
            peaks,
            duration: data.duration
        })

        this.subscriptions.push(
            this.miniWaveform.on('ready', () => {
                this.emit('ready')
            }),

            this.miniWaveform.on('interaction', () => {
                this.emit('interaction')
            })
        )
    }

    private getOverlayWidth(): number {
        const waveformWidth = this.waveform?.getWrapper().clientWidth || 1
        return Math.round((this.minimapWrapper.clientWidth / waveformWidth) * 100)
    }

    private onRedraw() {
        const overlayWidth = this.getOverlayWidth()
        this.overlay.style.width = `${overlayWidth}%`
    }

    private onScroll(startTime: number) {
        if (!this.waveform) return
        const duration = this.waveform.getDuration()
        this.overlay.style.left = `${(startTime / duration) * 100}%`
    }

    private initWaveFormEvents() {
        if (!this.waveform) return

        this.subscriptions.push(
            this.waveform.on('decode', () => {
                this.initMinimap()
            }),

            this.waveform.on('scroll', (startTime: number) => {
                this.onScroll(startTime)
            }),

            this.waveform.on('redraw', () => {
                this.onRedraw()
            })
        )
    }

    /** Unmount */
    public destroy() {
        this.miniWaveform?.destroy()
        this.minimapWrapper.remove()
        super.destroy()
    }
}

export default MinimapPlugin
