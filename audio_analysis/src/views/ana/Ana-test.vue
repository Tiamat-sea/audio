<template>
    <lay-container fluid style="padding: 10px 0px 0px 0px;">
        <div id="waveform" ref="waveform"></div>
    </lay-container>

    <lay-layout class="example">
        <lay-body>
            <lay-container fluid style="padding: 10px 0px 0px 0px;">
                <Result></Result>
            </lay-container>
        </lay-body>

        <lay-side width="340px" style="margin-top: 20px; padding-top: 12px; ">
            <!-- <lay-radio-button name="action" value="1" @change="">添加</lay-radio-button>
            <lay-radio-button name="action" value="2" @change="">擦除</lay-radio-button>
            <lay-radio-button name="action" value="3" @change="">撤销</lay-radio-button> -->
            <button id="playPause">Play/Pause</button>
            <button id="getRegions">getRegions</button>
            <div>
                缩放：
                <input type="range" min="10" max="800" value="100"></input>
            </div>
            <Options @update="handleUpdate"></Options>
        </lay-side>
    </lay-layout>
</template>

<script setup lang="ts">
import { layer } from '@layui/layer-vue'
import { onMounted, ref, onUnmounted } from 'vue';
import WaveForm from '@/views/ana/waveform/waveform';
import SpectrogramPlugin from '@/views/ana/waveform/plugins/spectrogram';
import Minimap from '@/views/ana/waveform/plugins/minimap';
import HoverPlugin from '@/views/ana/waveform/plugins/hover';
import RegionsPlugin from '@/views/ana/waveform/plugins/regions';
import Options from './components/Options.vue';
import Result from './components/Result.vue';

let beatsPerBeat: number;
const handleUpdate = (Options: any) => {
    beatsPerBeat = Options.beatsPerBeat
}

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
                labelsColor: 'black'
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

    handleUpdate(Options);
    let bitCount = 4;
    const keydownHandler = (e: KeyboardEvent) => {
        if (e.key === 'a' || e.key === 's' || e.key === 'd' || e.key === 'f') {
            const currentTime = waveform.getCurrentTime();

            const bit = Math.floor(bitCount / beatsPerBeat)
            const beat = Math.floor(bitCount % beatsPerBeat) + 1
            console.log(bit, beat)

            wfRegion.addRegion({
                start: currentTime,
                content: bit.toString() + '-' + beat.toString() + '\n' + waveform.getCurrentTime().toPrecision(3),
                color: 'rgba(240, 212, 0, 1)'
            });
            bitCount++;
        }
    }
    document.addEventListener('keydown', keydownHandler)

    const playPause = document.getElementById('getRegions')
    playPause?.addEventListener('click', () => {
        layer.msg(`${JSON.stringify(wfRegion.getRegions())}`, { time: 2000 });
        console.log(wfRegion.getRegions())
    })
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
