<template>
    <div class="result">
        <div id="lineChart"></div>
        <button @click="draw">Draw</button>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineProps, watch } from 'vue';
import { SVG } from '@svgdotjs/svg.js'
import type { PointArrayAlias } from '@svgdotjs/svg.js';

const props = defineProps({
    speedArray: {
        type: Array,
        required: true
    }
});
const length = props.speedArray.length

function createLinearScale(domain: number[] | [any, any], range: number[] | [any, any]) {
    const [domainMin, domainMax] = domain;
    const [rangeMin, rangeMax] = range;

    const factor = (rangeMax - rangeMin) / (domainMax - domainMin);

    return function (value: number) {
        return rangeMin + (value - domainMin) * factor;
    };
}

const draw = () => {
    const lineChart = SVG().addTo('#lineChart').size(500, 300)
    const xScale = createLinearScale([0, length - 1], [0, 500]);
    const yScale = createLinearScale([Math.min(...(props.speedArray as number[])), Math.max(...(props.speedArray as number[]))], [300, 0]);

    // Draw x-axis
    lineChart.line(0, 300, 500, 300).stroke({ color: 'black', width: 2 });

    // Draw y-axis
    lineChart.line(0, 0, 0, 300).stroke({ color: 'black', width: 2 });

    const line = lineChart.polyline(props.speedArray.map((value: number, index: number) => [xScale(index), yScale(value)]) as PointArrayAlias).fill('none').stroke({ color: 'blue', width: 2 })
}

onMounted(() => {
    // Code to run on component mount
})

const show = () => {
    console.log(props.speedArray)
}
</script>

<style scoped>
.result {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 500px;
    border: 1px white solid;
    background-color: rgba(255, 255, 255, 0.2);
}
</style>
