<template>
    <lay-tree :data="data" v-model:selectedKey="selectedKey" :showLine="showLine" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import jsonData from './options.json'

const showLine = ref(false)

const data = ref(jsonData)
const selectedKey = ref(11)

</script>


