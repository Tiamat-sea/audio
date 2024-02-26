<script setup lang="ts">
import { onMounted, ref } from 'vue'
import WaveForm from '@/waveform/waveform'
import SpectrogramPlugin from '@/waveform/plugins/spectrogram'
import Minimap from '@/waveform/plugins/minimap'
import HoverPlugin from '@/waveform/plugins/hover'

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
        minPxPerSec: 100,
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
            HoverPlugin.create({

            })
        ]
    });

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