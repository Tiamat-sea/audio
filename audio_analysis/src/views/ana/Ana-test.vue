<template>
    <lay-container fluid style="padding: 0;">
        <div id="waveform" ref="waveform"></div>
        <button id="playPause">Play/Pause</button>
        <input type="range" min="10" max="800" value="100" />
    </lay-container>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import WaveForm from '@/views/ana/waveform/waveform';
import SpectrogramPlugin from '@/views/ana/waveform/plugins/spectrogram';
import Minimap from '@/views/ana/waveform/plugins/minimap';
import HoverPlugin from '@/views/ana/waveform/plugins/hover';

onMounted(() => {
    const waveform = WaveForm.create({
        container: document.getElementById('waveform') as HTMLElement,
        progressColor: 'rgba(0, 0, 0, 0.7)',
        url: '/example.mp3',
        sampleRate: 44100,
        height: 256,
        normalize: true,
        waveColor: ['black', 'yellow', 'red'],
        minPxPerSec: 200,
        hideScrollbar: false,
        plugins: [
            // SpectrogramPlugin.create({
            //     labels: true,
            //     labelsColor: 'black'
            // }),
            Minimap.create({
                height: 60,
                insertPosition: 'beforebegin',
                waveColor: ['black', 'yellow', 'red'],
                progressColor: '#999'
            }),
            HoverPlugin.create()
        ]
    })

    waveform.once('decode', () => {
        const playPause = document.getElementById('playPause')
        playPause?.addEventListener('click', () => {
            waveform.playPause()
        })
    })

    waveform.once('decode', () => {
        const slider = document.querySelector('input[type="range"]')

        slider?.addEventListener('input', (e) => {
            const zoomLevel = Number((e.target as HTMLInputElement).value)
            waveform.zoom(zoomLevel)
        })
    })
})
</script>

<style scoped>
.container {
    width: 100%;
    height: auto;
    padding: 0px;
    background: #79c48c;
}
</style>
