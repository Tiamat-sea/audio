<template>
    <lay-container fluid style="padding: 10px 0px 0px 0px;">
        <div id="waveform" ref="waveform"></div>
    </lay-container>

    <lay-layout class="example">
        <lay-body>
            <lay-container fluid style="padding: 10px 0px 0px 0px;">
                <Result :speedArray="speedArray"></Result>
            </lay-container>
        </lay-body>

        <lay-side width="340px" style="margin-top: 20px; padding-top: 12px; ">
            <!-- <lay-radio-button name="action" value="1" @change="">添加</lay-radio-button>
            <lay-radio-button name="action" value="2" @change="">擦除</lay-radio-button>
            <lay-radio-button name="action" value="3" @change="">撤销</lay-radio-button> -->

            <button id="playPause">Play/Pause</button>
            <button id="getRegions">getRegions</button>
            <button id="clearRegions">clearRegions</button>
            <LayButton></LayButton>

            <div>
                缩放：
                <input type="range" min="10" max="800" value="100"></input>
            </div>
            <Options v-model:options="myOptions"></Options>
        </lay-side>
    </lay-layout>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { layer } from '@layui/layer-vue'
import { onMounted, ref, onUnmounted, onBeforeMount, reactive, watchEffect } from 'vue';
import WaveForm from '@/views/analysis/waveform/waveform';
import SpectrogramPlugin from '@/views/analysis/waveform/plugins/spectrogram';
import Minimap from '@/views/analysis/waveform/plugins/minimap';
import HoverPlugin from '@/views/analysis/waveform/plugins/hover';
import RegionsPlugin from '@/views/analysis/waveform/plugins/regions';
import Options from './components/Options.vue';
import Result from './components/Result.vue';

const route = useRoute();
let musicFileName = route.params.filename;
let bitCount
let speedArray: number[] = []

let myOptions = reactive({
    color: "1",
    fftSize: "1024",
    scrollStyle: "auto",
    beatLine: "default",
    muteBeat: [],
    startSection: 0,
    endSection: 100,
    beatsPerBeat: 4
})

function getStartTimeInRegions(wfRegion: any): number[] {
    const regions = wfRegion.getRegions();
    let startTime = [];
    for (let i = 0; i < regions.length; i++) {
        startTime.push(regions[i].start)
    }
    return startTime;
}

function caculateSpeed(startTime: number, endTime: number): number {
    const speed = 60.0 / (endTime - startTime)
    return speed
}

onMounted(() => {
    const waveform = WaveForm.create({
        container: document.getElementById('waveform') as HTMLElement,
        progressColor: 'rgba(255, 255, 255, 1)',
        // url: `http://localhost:8081/files/${musicFileName}`,
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
    const wfRegion = waveform.registerPlugin(RegionsPlugin.create())

    waveform.once('decode', () => {
        const playPause = document.getElementById('playPause')
        playPause?.addEventListener('click', () => {
            waveform.playPause()
            // console.log(getStartTimeInRegions(wfRegion))
        })
        const slider = document.querySelector('input[type="range"]')
        slider?.addEventListener('input', (e) => {
            const zoomLevel = Number((e.target as HTMLInputElement).value)
            waveform.zoom(zoomLevel)
        })
        const getRegions = document.getElementById('getRegions')
        getRegions?.addEventListener('click', () => {
            console.log(wfRegion)
        })
        const clearRegions = document.getElementById('clearRegions')
        clearRegions?.addEventListener('click', () => {
            wfRegion.clearRegions()
            lastBitPosition = 0
            bitCount = 0
        })
    })

    let bitCount = 0
    let lastBitPosition = 0
    const keydownHandler = (e: KeyboardEvent) => {
        if (e.key === 'a' || e.key === 's' || e.key === 'd' || e.key === 'f') {
            const currentTime = waveform.getCurrentTime();
            const speed = caculateSpeed(lastBitPosition, currentTime)
            speedArray.push(speed)
            // console.log(speedArray)
            lastBitPosition = currentTime
            if (bitCount < myOptions.beatsPerBeat) {
                bitCount = myOptions.beatsPerBeat
            }
            // console.log('bit', bitCount)
            const bit = Math.floor(bitCount / myOptions.beatsPerBeat)
            const beat = Math.floor(bitCount % myOptions.beatsPerBeat) + 1
            // console.log(bit, beat)
            wfRegion.addRegion({
                start: currentTime,
                content: bit.toString() + '-' + beat.toString() + '\n' + waveform.getCurrentTime().toPrecision(3) + '\n' + speed.toPrecision(3),
                color: 'rgba(240, 212, 0, 0.85)',
                drag: false,
            });
            bitCount++;
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
