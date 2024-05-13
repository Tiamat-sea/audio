<template>
    <lay-carousel v-model="active3" indicator="outside">
        <lay-carousel-item id="1">
            <div
                style="color: white;text-align: center;width:100%;height:300px;line-height:300px;background-color:#009688;">
                条目一</div>
        </lay-carousel-item>
        <lay-carousel-item id="2">
            <div
                style="color: white;text-align: center;width:100%;height:300px;line-height:300px;background-color:#5FB878;">
                条目二</div>
        </lay-carousel-item>
        <lay-carousel-item id="3">
            <div
                style="color: white;text-align: center;width:100%;height:300px;line-height:300px;background-color:#FFB800;">
                条目三</div>
        </lay-carousel-item>
        <lay-carousel-item id="4">
            <div
                style="color: white;text-align: center;width:100%;height:300px;line-height:300px;background-color:#FF5722;">
                条目四</div>
        </lay-carousel-item>
    </lay-carousel>
</template>

<script>
import { ref } from 'vue'

export default {
    setup() {

        const active3 = ref("1")

        return {
            active3
        }
    }
}
</script>