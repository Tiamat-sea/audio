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

<template>
    <lay-layout class="example">
        <lay-header>
            <h3>音频频谱分析(此部分存放选项卡)</h3>
        </lay-header>
        <lay-body>
            <lay-layout>
                <lay-body>
                    Content 频谱图展示区域
                    <FFTTransfer></FFTTransfer>
                </lay-body>
                <!-- <lay-side>
                    Right 选项卡区域
                    <Options></Options>
                </lay-side> -->
            </lay-layout>
        </lay-body>
    </lay-layout>
</template>

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
    min-width: 100px;
}

.example .layui-body {
    display: block;
    background: #5FB878;
    align-items: center;
    justify-content: center;
    color: white;
    min-height: calc(100vh - 60px);
}
</style>