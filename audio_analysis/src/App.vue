<template>
	<div class="app">
		<RouterView class="router-view-custom" />
	</div>
</template>

<style scoped>
html,
body,
.app {
	width: 100%;
	height: 100%;
	margin: 0;
	padding: 0;
}

.router-view-custom {
	/* 在这里添加样式规则 */
	/* 例如：设置背景颜色和内边距 */
	background-color: #84b445;
	padding: 0px;
	width: 100%;
	height: 100%;
}
</style>

<script setup>
import { RouterLink, RouterView } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
</script>