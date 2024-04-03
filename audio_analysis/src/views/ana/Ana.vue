<script lang="ts" setup>
import { onMounted } from 'vue'
import WaveForm from './waveform/waveform'
import SpectrogramPlugin from './waveform/plugins/spectrogram'
import Minimap from './waveform/plugins/minimap'
import HoverPlugin from './waveform/plugins/hover'

const audioURL = './example.mp3'
const audio = new Audio()
audio.src = audioURL

onMounted(() => {
    const waveform = WaveForm.create({
        container: document.getElementById('waveform') as HTMLElement,
        progressColor: 'rgba(0, 0, 0, 0.7)',
        url: audioURL,
        // fillParent: false,
        // media: audio,
        sampleRate: 44100,
        normalize: true,
        waveColor: ['black', 'yellow', 'red'],
        minPxPerSec: 10,
        // height: '',
        // autoplay: true,
        // hideScrollbar: true,
        plugins: [
            SpectrogramPlugin.create({
                // container: document.getElementById('waveform') as HTMLElement,
                labels: true,
                labelsColor: 'black'
            }),
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

<template>
    <lay-split-panel :vertical="true" style="height: 800px; width: 99.8vw">
        <lay-split-panel-item>
            <div id="waveform"></div>
        </lay-split-panel-item>
        <lay-split-panel-item>
            <div id="spectrogram"></div>
        </lay-split-panel-item>
        <lay-split-panel-item>
            <label> 缩放: <input type="range" min="10" max="500" value="10" /> </label>
            <button id="playPause">播放/暂停</button>
        </lay-split-panel-item>
    </lay-split-panel>
</template>
