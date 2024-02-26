<template>
    <div ref="minimapContainer"></div>
    <div id="waveform"></div>
    <label>
        缩放: <input type="range" min="10" max="1000" value="100" />
    </label>
    <button>播放/暂停</button>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import WaveForm from '@/waveform/waveform'
import SpectrogramPlugin from '@/waveform/plugins/spectrogram'
import Minimap from '@/waveform/plugins/minimap'

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