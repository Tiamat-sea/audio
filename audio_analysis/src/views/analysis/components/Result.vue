<template>
    <div class="result">
        <h1>Result</h1>
        <svg :width="width" :height="height" style="background-color: burlywood;">
            <path :d="pathData" fill="none" stroke="white" />
        </svg>
        <div class="legend">
            <div class="legend-item">
                <div class="legend-color" style="background-color: red;"></div>
                <div class="legend-label">Speed</div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const width = 600;
const height = 400;
const vertexData = ref([10, 20, 30, 40, 50, 60, 80, 100]); // Replace with your vertex data

const pathData = ref('');

onMounted(() => {
    // Calculate path data using bezier curve
    const path = calculateBezierPath(vertexData.value);
    pathData.value = path;
});

function calculateBezierPath(vertices: number[]): string {
    if (vertices.length < 2) {
        return '';
    }

    const pathSegments = [];
    for (let i = 0; i < vertices.length - 1; i += 2) {
        const x1 = vertices[i];
        const y1 = vertices[i + 1];
        const x2 = vertices[i + 2];
        const y2 = vertices[i + 3];

        const cx1 = x1 + (x2 - x1) / 3;
        const cy1 = y1;
        const cx2 = x1 + (x2 - x1) * 2 / 3;
        const cy2 = y2;

        pathSegments.push(`M ${x1},${y1} C ${cx1},${cy1} ${cx2},${cy2} ${x2},${y2}`);
    }

    return pathSegments.join(' ');
}
</script>

<style scoped>
.result {
    display: flex;
    flex-direction: column;
    align-items: center;
    border: 2px white solid;
    /* background-color: black; */
}

svg {
    border: 1px solid black;
}

.legend {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
}

.legend-item {
    display: flex;
    align-items: center;
    margin-left: 10px;
}

.legend-color {
    width: 10px;
    height: 10px;
    margin-right: 5px;
}

.legend-label {
    font-size: 12px;
}
</style>
