<template>
    <div ref="container" style="width: 100vw;">
        <canvas id="audioWaveform" ref="canvas" height="400px"></canvas>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const container = ref(null);
const canvas = ref(null);

const resizeHandler = () => {
    if (canvas.value && container.value) {
        canvas.value.width = container.value.offsetWidth;
        const gl = canvas.value.getContext('webgl');

        if (gl) {
            // 设置视口大小
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        }
    }
};

onMounted(() => {
    window.addEventListener('resize', resizeHandler);
    resizeHandler();
});

onUnmounted(() => {
    window.removeEventListener('resize', resizeHandler);
});
</script>