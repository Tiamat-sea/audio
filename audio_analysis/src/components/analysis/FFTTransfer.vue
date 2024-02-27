<script setup lang="ts">
import { onMounted, ref } from 'vue'
import WaveForm from '@/waveform/waveform'
import SpectrogramPlugin from '@/waveform/plugins/spectrogram'
import Minimap from '@/waveform/plugins/minimap'
import HoverPlugin from '@/waveform/plugins/hover'
import RegionsPlugin from '@/waveform/plugins/regions'

const minimapContainer = ref(null)

onMounted(() => {
    const sampleRateVal = 44100;

    // 创建一个 waveform 实例
    const waveform = WaveForm.create({
        container: '#waveform',
        progressColor: 'rgba(0, 0, 0, 0.5)',
        url: '/example.mp3',
        sampleRate: sampleRateVal,
        normalize: true,
        waveColor: ['black', 'yellow', 'red'],
        minPxPerSec: 20,
        mediaControls: true,
        plugins: [
            SpectrogramPlugin.create({
                labels: true,
                labelsColor: 'black'
            }),
            Minimap.create({
                height: 60,
                insertPosition: 'beforebegin',
                waveColor: '#ddd',
                progressColor: '#999',
            }),
            HoverPlugin.create(),
        ]
    });
    const waveformRegions = waveform.registerPlugin(RegionsPlugin.create())

    // 在创建区域时给它们随机颜色
    const random = (min: number, max: number) => Math.random() * (max - min) + min
    const randomColor = () => `rgba(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)}, 0.5)`


    waveform.once('decode', () => {
        const slider = document.querySelector('input[type="range"]')

        slider?.addEventListener('input', (e) => {
            const zoomLevel = Number((e.target as HTMLInputElement).value)
            waveform.zoom(zoomLevel)
        })

        document.querySelector('button')?.addEventListener('click', () => {
            waveform.playPause()
        })
    })

    waveform.on('decode', () => {
        // 区域
        waveformRegions.addRegion({
            start: 0,
            end: 10,
            color: randomColor(),
            drag: true,
            resize: true,
        }),
            waveformRegions.addRegion({
                start: 9,
                end: 10,
                content: 'Cramped region',
                color: randomColor(),
                minLength: 1,
                maxLength: 10,
            })
        waveformRegions.addRegion({
            start: 12,
            end: 17,
            content: 'Drag me',
            color: randomColor(),
            resize: false,
        })

        // Markers (zero-length regions)
        waveformRegions.addRegion({
            start: 19,
            content: 'Marker',
            color: randomColor(),
        })
        waveformRegions.addRegion({
            start: 20,
            content: 'Second marker',
            color: randomColor(),
        })
    })

    waveformRegions.enableDragSelection({
        color: 'rgba(255, 0, 0, 0.1)',
    })

    waveformRegions.on('region-updated', (region) => {
        console.log('Updated region', region)
    })
});
</script>

<template>
    <div id="waveform"></div>
    <label>
        缩放: <input type="range" min="10" max="1000" value="100" />
    </label>
    <button>播放/暂停</button>
</template>

<style scoped>
#waveformc::part(wrapper) {
    height: 200px;
    width: 100%;
    background: #000000;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    user-select: none;
    touch-action: none;
    -webkit-tap-highlight-color: transparent;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    -khtml-user-select: none;
    -webkit-touch-callout: none;
    -webkit-user-drag: none;
    -webkit-user-modify: none;
    -webkit-highlight: none;
    -webkit-tap-highlight-color: transparent;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
}
</style>