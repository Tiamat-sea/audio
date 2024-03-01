<script setup lang="ts">
import { onMounted, ref } from 'vue'
import WaveForm from '@/waveform/waveform'
import SpectrogramPlugin from '@/waveform/plugins/spectrogram'
import Minimap from '@/waveform/plugins/minimap'
import HoverPlugin from '@/waveform/plugins/hover'
import RegionsPlugin from '@/waveform/plugins/regions'
import chroma from 'chroma-js'

const minimapContainer = ref(null)

onMounted(() => {
    const sampleRateVal = 44100;

    // 生成一个从蓝色到白色，再到黄色的颜色映射
    const colorMapHex = chroma.scale(['blue', 'white', 'yellow']).colors(256)
    // 将颜色从十六进制格式转换为 [r, g, b, alpha] 格式，并将 r, g, b 值转换为 0-1 的范围
    const colorMap = colorMapHex.map(color => {
        const [r, g, b] = chroma(color).rgb()
        return [r / 255, g / 255, b / 255, 1]
    })
    // 现在 colorMap 是一个符合要求的颜色映射数组

    console.log('colorMap', colorMap)

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
                labelsColor: 'black',
                // colorMap: colorMap,
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
#waveform::part(wrapper) {
    overflow: visible;
    height: 200px;
    width: 100%;
    background: #000000;
    position: relative;
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