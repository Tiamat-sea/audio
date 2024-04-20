<template>
    <div class="split-panel-wrapper">
        <lay-split-panel :vertical="true">
            <lay-split-panel-item>1333333333333333333333333333333333333333333333</lay-split-panel-item>
            <lay-split-panel-item>2</lay-split-panel-item>
            <lay-split-panel-item>3</lay-split-panel-item>
        </lay-split-panel>
    </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.split-panel-wrapper {
    height: 100vh - header;
    /* width: 100vw; */
}

.lay-split-panel {
    height: auto;
    /* width: 100%; */
}
</style>
