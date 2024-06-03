<template>
    <h2>音乐信号可视化分析平台 - 功能展示</h2>
    <br />
    <h3>波形图绘制</h3>
    <img src="/img/img-waveform.jpg" />
    <br />

    <h3>波形缩略图绘制</h3>
    <img src="/img/img-mini.jpg" />
    <br />

    <h3>频谱图绘制</h3>
    <img src="/img/img-spectrum.jpg" />
    <br />

    <h3>手动标记</h3>
    <img src="/img/img-marker.jpg" />
    <br />

    <h3>速度 - 力度曲线生成</h3>
    <img src="/img/img-result.jpg" />
    <br />
</template>

<script>
import { ref } from 'vue'

export default {
    setup() {

        const active3 = ref("1")

        return {
            active3
        }
    }
}
</script>

<style>
img {
    margin-left: 50px;
    width: 70%;
    height: auto;
}
</style>