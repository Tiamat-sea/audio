<template>
    <lay-layout class="example">
        <lay-header>
            Header 用于显示时间轴的缩小版
            <!-- <button @click="increment">number is: {{ num }}</button> -->
        </lay-header>
        <lay-body>
            <lay-layout>
                <lay-body>
                    <!-- Content 频谱图展示区域 -->
                    <FFTTransfer></FFTTransfer>
                </lay-body>
                <lay-side>
                    Right 选项卡区域
                    <Options></Options>
                </lay-side>
            </lay-layout>
        </lay-body>
    </lay-layout>
</template>

<script setup lang="ts">
import FFTTransfer from '@/components/analysis/FFTTransfer.vue'
import Options from '@/components/analysis/Options.vue'
import { ref, onMounted } from 'vue'

const num = ref(0)
function increment() {
    num.value++
}

onMounted(() => {
    console.log(`The initial number is ${num.value}.`)
})

</script>

<style scoped>
.example .layui-header {
    line-height: 60px;
    text-align: center;
    background: #87ca9a;
    color: black;
}

.example .layui-side {
    display: block;
    background: #77c38c;
    align-items: center;
    justify-content: center;
    color: white;
}

.example .layui-body {
    display: block;
    background: #5FB878;
    align-items: center;
    justify-content: center;
    color: white;
    height: 100%;
}
</style>