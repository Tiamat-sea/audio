<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import WaveForm from './waveform/waveform'
import SpectrogramPlugin from './waveform/plugins/spectrogram'
import Minimap from './waveform/plugins/minimap'
import HoverPlugin from './waveform/plugins/hover'
import Fetcher from './waveform/fetcher'
import Decoder from './waveform/decoder'

const audioURL = "./example.mp3"
const sampleRate = 44100
let decodeData = ref<AudioBuffer | null>(null) // 创建一个响应式引用

onMounted(async () => {
    const onProgress = (percentage: number) => { // 进度条
        // console.log(percentage)
    }
    const blob = await Fetcher.fetchBlob(audioURL, onProgress) // 获取音频文件
    const arrayBuffer = await blob.arrayBuffer() // 转换为 ArrayBuffer
    decodeData.value = await Decoder.decode(arrayBuffer, sampleRate) // 解码音频文件
    console.log(decodeData.value)
    console.log(decodeData.value.getChannelData(0))

})

</script>

<template>
    <lay-split-panel :vertical="true" style="height: 800px; width: 99.8vw">
        <lay-split-panel-item>
            <div id="waveform"></div>
        </lay-split-panel-item>
        <lay-split-panel-item>
            <label>
                缩放: <input type="range" min="10" max="1000" value="100" />
            </label>
            <button id='playPause'>播放/暂停</button>
        </lay-split-panel-item>
        <lay-split-panel-item>
            <!-- <div id="spectrogram"></div> -->
        </lay-split-panel-item>
    </lay-split-panel>
</template>