<script setup lang="ts">
import TheWelcome from '../components/TheWelcome.vue'
</script>

<template>
    <main>
        <TheWelcome />
    </main>
</template>

<style scoped>
main {
    padding: 20px;
    height: calc(100vh-header);
    /* width: 100vw; */
}
</style>
