<script lang="ts" setup>
import { onMounted } from 'vue';
import WaveForm from './components/waveform'
const audioURL = "/example.mp3"

onMounted(() => {
    const waveform = WaveForm.create({
        container: '#waveform',
        progressColor: 'rgba(0, 0, 0, 0.5)',
        url: '/example.mp3',
        sampleRate: 44100,
        normalize: true,
        waveColor: ['black', 'yellow', 'red'],
        minPxPerSec: 100,
    })

    waveform.once('decode', () => {
        const playPause = document.getElementById('playPause')
        playPause?.addEventListener('click', () => {
            waveform.playPause()
        })
    })
})

</script>

<template>
    <lay-split-panel :vertical="true" style="height: 400px; width: 99.8vw">
        <lay-split-panel-item>
            <div id="waveform"></div>
        </lay-split-panel-item>
        <lay-split-panel-item>
            <button id='playPause'>播放/暂停</button>
        </lay-split-panel-item>
        <lay-split-panel-item>
            3
        </lay-split-panel-item>
    </lay-split-panel>
</template>