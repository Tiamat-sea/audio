<template>
    <lay-container fluid style="padding: 10px 0px 0px 0px;">
        <div id="waveform" ref="waveform"></div>
        <button id="playPause">Play/Pause</button>
        <input type="range" min="10" max="800" value="100" />
    </lay-container>
</template>

<script setup lang="ts">
import { onMounted, ref,onUnmounted } from 'vue';
import WaveForm from '@/views/ana/waveform/waveform';
import SpectrogramPlugin from '@/views/ana/waveform/plugins/spectrogram';
import Minimap from '@/views/ana/waveform/plugins/minimap';
import HoverPlugin from '@/views/ana/waveform/plugins/hover';
import RegionsPlugin from '@/views/ana/waveform/plugins/regions';

onMounted(() => {
    const waveform = WaveForm.create({
        container: document.getElementById('waveform') as HTMLElement,
        progressColor: 'rgba(255, 255, 255, 1)',
        // url: '/test-audio.mp3',        
        url: '/example.wav',
        sampleRate: 44100,
        cursorWidth: 1.2,
        cursorColor: 'red',
        height: 128,
        normalize: true,
        minPxPerSec: 100,
        hideScrollbar: true,
        plugins: [
            SpectrogramPlugin.create({
                labels: true,
                labelsColor: 'white'
            }),
            Minimap.create({
                height: 50,
                insertPosition: 'beforebegin',
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

    const wfRegion = waveform.registerPlugin(RegionsPlugin.create())
    waveform.on('decode',()=>{
        wfRegion.addRegion({
            start: 2,
            content: 'Marker',
            color: 'rgba(255, 0, 0, 1)'
        })
    })

    const keydownHandler = (e: KeyboardEvent) => {
        if (e.key === 'a' || e.key === 's' || e.key === 'd' || e.key === 'f') {
            wfRegion.addRegion({
                start: waveform.getCurrentTime(),
                content: 'Marker',
                color: 'rgba(255, 0, 0, 1)'
            })
        }
    }

    document.addEventListener('keydown', keydownHandler)

    // Cleanup the event listener when the component is unmounted
    onUnmounted(() => {
        document.removeEventListener('keydown', keydownHandler)
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
