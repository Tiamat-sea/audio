<template>
    <div class="result">
        <h4>速度&nbsp;&nbsp;-&nbsp;&nbsp;力度&nbsp;&nbsp;曲线</h4>
        <!-- <button @click="redraw">Log</button> -->
        <div id="lineChart" v-on:parentEvent="redraw" style="font-size: 14px; color: azure;"></div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { LineChart } from 'metrics-graphics'

const props = defineProps({
    speedArray: {
        type: Array as () => Array<[number, number]>,
        required: true
    }
})

function redraw() {
    const confidence = props.speedArray.map(([beat, speed]) => ({
        speed: speed,
        beat: beat,
    }))

    new LineChart({
        confidenceBand: ['l', 'u'],
        data: [
            confidence.map((entry) => ({
                ...entry,
                beat: entry.beat,
                speed: entry.speed,
                l: entry.speed - 10,
                u: entry.speed + 10,
            })),
        ],
        area: [],
        xAxis: {
            label: 'Beat',
        },
        yAxis: {
            label: 'Speed(BPM)',
            tickCount: 4,
            extendedTicks: true,
        },
        yScale: {
            minValue: 0,
            maxValue: 300,
        },
        xAccessor: 'beat',
        yAccessor: 'speed',
        width: 1500,
        height: 400,
        target: '#lineChart',
        tooltipFunction: (point) => `beat: ${point.beat} - speed: ${point.speed.toFixed(2)}`,
        margin: { top: 20, right: 20, bottom: 50, left: 60 },
    })
}

onMounted(() => {
})

defineExpose({ redraw })
</script>

<style>
.result {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 400px;
    /* border: 0.2px white solid; */
    background-color: rgba(200, 200, 200, 0.1);
}

/* .Label,
.label {
    font-size: 1.2rem;
    color: red;
} */

.mg-area {
    z-index: -1;
    fill: rgba(200, 200, 200, 0.1);
    stroke-width: 0.5px;
    stroke: rgba(169, 169, 169, 0.7);
}

.mg-line {
    z-index: 10;
    fill: none;
    /* stroke: white; */
    stroke-width: 2px;
}

.mg-content g text {
    fill: white;
}

.mg-content g g text,
.mg-content g text {
    font-size: 14px;
}

h4 {
    margin-top: 10px;
    font-size: 16px;
}
</style>
