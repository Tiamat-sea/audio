<template>
    <lay-form :model="options" :pane="pane" :size="size">
        <lay-form-item label="颜色主题" mode="inline">
            <lay-select v-model="options.color">
                <lay-select-option value="1" label="彩虹 rainbow"></lay-select-option>
                <lay-select-option value="2" label="灰色 gray"></lay-select-option>
            </lay-select>
        </lay-form-item>

        <lay-form-item label="FFT-SIZE" prop="fftSize" mode="inline">
            <lay-select v-model="options.fftSize">
                <lay-select-option value="256 " label="256 "></lay-select-option>
                <lay-select-option value="512 " label="512 "></lay-select-option>
                <lay-select-option value="1024" label="1024"></lay-select-option>
                <lay-select-option value="2048" label="2048"></lay-select-option>
                <lay-select-option value="4096" label="4096"></lay-select-option>
                <lay-select-option value="8192" label="8192"></lay-select-option>
            </lay-select>
        </lay-form-item>

        <lay-form-item label="视图移动方式" mode="inline">
            <lay-select v-model="options.scrollStyle">
                <lay-select-option value="auto" label="自动居中"></lay-select-option>
                <lay-select-option value="manual" label="手动"></lay-select-option>
            </lay-select>
        </lay-form-item>

        <lay-form-item label="节拍线" mode="inline">
            <lay-select v-model="options.beatLine">
                <lay-select-option value="default" label="默认"></lay-select-option>
            </lay-select>
        </lay-form-item>

        <lay-form-item label="节拍静音" mode="inline">
            <lay-checkbox-group v-model="options.muteBeat">
                <lay-checkbox name="like" skin="primary" value="1"></lay-checkbox>
            </lay-checkbox-group>
        </lay-form-item>

        <lay-form-item label="开始小节" prop="startSection" mode="inline">
            <lay-slider :showDots="false" :step="1" :max="100" v-model="options.startSection"
                :disabled="false"></lay-slider>
        </lay-form-item>

        <lay-form-item label="结束小节" prop="endSection" mode="inline">
            <lay-slider :showDots="false" :step="1" :max="100" v-model="options.endSection"
                :disabled="false"></lay-slider>
        </lay-form-item>

        <lay-form-item label="每节拍数" prop="beatsPerBeat" mode="inline">
            <lay-slider :showDots="false" :step="1" :min="1" :max="10" v-model="options.beatsPerBeat"
                :disabled="false"></lay-slider>
        </lay-form-item>

        <lay-form-item>
            <!-- <lay-button type="primary" @click="">提交</lay-button>
            <lay-button type="default" @click="">重置</lay-button> -->
        </lay-form-item>
    </lay-form>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watchEffect } from 'vue'
import { layer } from '@layui/layer-vue'
import { defineEmits } from 'vue';
// import { watchEffect }

const size = ref("xs");
const pane = ref(false);
const emit = defineEmits(['update:options']);

const options = reactive({
    color: "1",
    fftSize: "1024",
    scrollStyle: "auto",
    beatLine: "default",
    muteBeat: [],
    startSection: 0,
    endSection: 100,
    beatsPerBeat: 4
})

watchEffect(() => {
    // console.log(options);
    emit('update:options', options);
})

const handleChange = (newOptions) => {
    options = newOptions;
    emit('update:options', options);
}
</script>

<style>
/* .layui-form-pane .layui-form-label {
    background-color: rgb(196, 3, 3);
} */

/* .layui-select,
.layui-form-item .layui-slider-horizontal {
    width: 130px;
} */

/* .layui-form-item .layui-input-inline {
    width: 200px !important;
} */
</style>
