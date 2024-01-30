<template>
    <div class="common-layout">
        <el-container>
            <el-header> <!--header-->
                <!-- <div id="waveform"></div> -->
            </el-header>

            <el-container>
                <el-main>
                    <FFTTransfer></FFTTransfer>
                </el-main> <!--main-->

                <el-aside width="200px">
                    <Options></Options>
                </el-aside> <!--aside-->
            </el-container>

        </el-container>
    </div>
</template>

<style scoped>
#waveform {
    position: adsolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
}

el-header {
    position: relative;
    height: 0;
    padding-top: 56.25%;
    overflow: hidden;
}
</style>

<script setup>
import { onMounted } from 'vue'
import 'element-plus/dist/index.css'
import Options from '@/components/analysis/Options.vue'
import FFTTransfer from '@/components/analysis/FFTTransfer.vue'

// onMounted(() => {
//     const wavesurfer = WaveSurfer.create({
//         container: '#waveform',
//         waveColor: 'rgb(200, 0, 200)',
//         progressColor: 'rgb(100, 0, 100)',
//         url: '/example.mp3',
//     });

//     wavesurfer.on('click', () => {
//         wavesurfer.play();
//     });
// });
</script>


