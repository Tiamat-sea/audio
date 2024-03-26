<script setup lang="ts">
import FFTTransfer from './components/FFTTransfer.vue'
import { ref, onMounted } from 'vue'
import { LaySplitPanel, LaySplitPanelItem } from '@layui/layui-vue'

const num = ref(0)
function increment() {
    num.value++
}

onMounted(() => {
    // console.log(`The initial number is ${num.value}.`)
})
</script>

<template>
    <lay-split-panel :vertical="true" style="height: 800px; width: 99.8vw">
        <lay-split-panel-item>
            <FFTTransfer></FFTTransfer>
        </lay-split-panel-item>
        <lay-split-panel-item> 2 </lay-split-panel-item>
        <lay-split-panel-item> 3 </lay-split-panel-item>
    </lay-split-panel>
</template>

<style scoped></style>
