<script setup lang="ts">
import FFTTransfer from './components/FFTTransfer.vue'
// import Options from '@/components/analysis/Options.vue'
import { ref, onMounted } from 'vue'
import { LaySplitPanel, LaySplitPanelItem } from '@layui/layui-vue'

const num = ref(0)
function increment() {
    num.value++
}

onMounted(() => {
    console.log(`The initial number is ${num.value}.`)
})
</script>

<template>
    <lay-split-panel :vertical="true" style="height: 600px; width: 100%">
        <lay-split-panel-item>
            <FFTTransfer></FFTTransfer>
        </lay-split-panel-item>
        <lay-split-panel-item>
            2
        </lay-split-panel-item>
        <lay-split-panel-item>
            3
        </lay-split-panel-item>
    </lay-split-panel>


    <!-- <lay-layout class="example">
        <lay-body>
            <lay-layout>
                <lay-body>

                </lay-body>
                <lay-side>
                    Right 选项卡区域
                    <Options></Options>
                </lay-side>
            </lay-layout>
        </lay-body>
    </lay-layout> -->
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