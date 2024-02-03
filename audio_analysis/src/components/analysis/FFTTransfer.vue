<template>
    <div id="waveform"></div>
    <label>
        Zoom: <input type="range" min="10" max="1000" value="100" />
    </label>
    <button>play/pause</button>
</template>

<script setup lang="ts">
import { onMounted, ref, setBlockTracking } from 'vue'
// import Spectrogram from 'wavesurfer.js/dist/plugins/spectrogram.js'
import WaveForm from '@/waveform/waveform'

onMounted(() => {
    const sampleRateVal = 44100;

    // Create an instance of WaveSurfer
    const waveform = WaveForm.create({
        container: '#waveform',
        waveColor: 'rgb(200, 0, 200)',
        progressColor: 'rgb(100, 0, 100)',
        url: '/example-normal.wav',
        sampleRate: sampleRateVal,
        normalize: true,
        waveColor: ['black'],
        minPxPerSec: 3,
    });

    // Initialize the Spectrogram plugin
    // ws.registerPlugin(
    //     Spectrogram.create({
    //         alpha: 0.5,
    //         labels: true,
    //         height: 300,
    //         splitChannels: false,
    //         fftSamples: 512,
    //         labelsColor: 'black',
    //     })
    // );

    waveform.once('decode', () => {
        const slider = document.querySelector('input[type="range"]')

        slider.addEventListener('input', (e) => {
            const minPxPerSec = e.target.valueAsNumber
            waveform.zoom(minPxPerSec)
        })

        document.querySelector('button').addEventListener('click', () => {
            waveform.playPause()
        })
    })
});
</script>