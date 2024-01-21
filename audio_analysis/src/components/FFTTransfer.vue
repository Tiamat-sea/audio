<template>
    <div id="waveform"></div>
    <label>
        Zoom: <input type="range" min="10" max="1000" value="100" />
    </label>
    <button>play/pause</button>
</template>
  
<script setup>
import { onMounted, ref, setBlockTracking } from 'vue'
import WaveSurfer from 'wavesurfer.js'
import Spectrogram from 'wavesurfer.js/dist/plugins/spectrogram.js'
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.js'

onMounted(() => {
    const sampleRateVal = 44100;

    // Create an instance of WaveSurfer
    const ws = WaveSurfer.create({
        container: '#waveform',
        waveColor: 'rgb(200, 0, 200)',
        progressColor: 'rgb(100, 0, 100)',
        url: '/example.mp3',
        sampleRate: sampleRateVal,
        normalize: true,
        waveColor: ['red', 'blue'],
        minPxPerSec: 100,
    });

    // Initialize the Spectrogram plugin
    ws.registerPlugin(
        Spectrogram.create({
            alpha: 0.5,
            labels: true,
            height: 300,
            splitChannels: false,
            fftSamples: 512,
            labelsColor: 'black',
        })
    );

    ws.once('decode', () => {
        const slider = document.querySelector('input[type="range"]')

        slider.addEventListener('input', (e) => {
            const minPxPerSec = e.target.valueAsNumber
            ws.zoom(minPxPerSec)
        })

        document.querySelector('button').addEventListener('click', () => {
            ws.playPause()
        })
    })
});
</script>