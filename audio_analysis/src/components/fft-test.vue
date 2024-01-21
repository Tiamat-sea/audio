<template>
    <div>
        <div ref="waveform"></div>
        <div ref="spectrogram"></div>
    </div>
</template>
  
<script>
import WaveSurfer from 'wavesurfer.js';
// import 'wavesurfer.js/dist/plugin/wavesurfer.spectrogram.min.js'; // 导入频谱图插件
import Spectrogram from 'wavesurfer.js/dist/plugins/spectrogram.js'

export default {
    data() {
        return {
            wavesurfer: null
        };
    },
    mounted() {
        this.initWaveSurfer();
        this.loadAudio();
    },
    methods: {
        initWaveSurfer() {
            this.wavesurfer = WaveSurfer.create({
                container: this.$refs.waveform,
                backend: 'WebAudio',
                // 在此添加任何其他配置选项
            });

            

            // 添加频谱图插件
            this.wavesurfer.initSpectrogram({
                container: this.$refs.spectrogram,
                labels: true,
                // 在此添加频谱图插件的其他配置选项
            });
        },
        loadAudio() {
            const audioUrl = '/example.mp3'; // 替换为你的音频文件 URL
            this.wavesurfer.load(audioUrl);
        }
    }
};
</script>
  
<style>
/* 在此添加样式，定义波形图和频谱图的外观 */
</style>
  