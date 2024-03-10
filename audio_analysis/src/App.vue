<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { layer } from "@layui/layui-vue"

const openDrawer = function () {
    layer.drawer({
        title: "选项卡",
        content: "内容"
    })
}
</script>

<template>
    <header>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <nav>
            <!-- <h3>音频频谱分析(此部分存放选项卡)</h3> -->
            <img src="/favicon.ico" alt="LOGO.ico">
            <RouterLink to="/">主页</RouterLink>
            <RouterLink to="/about">了解一下</RouterLink>

            <RouterLink to="">文档与社区</RouterLink>
            <RouterLink to="/test">测试</RouterLink>
            <RouterLink to="/analysis1">Ana1</RouterLink>
            <RouterLink to="/analysis2">Ana2</RouterLink>
            <!-- <lay-button type="primary" @click="openDrawer">抽屉</lay-button> -->
            <!-- search 右对齐 -->
            <!-- 用户个人标识 -->
            <!-- layui 弹层 - 抽屉 -->
            <!-- 加载 -->
        </nav>
    </header>

    <div class="router-container">
        <RouterView />
    </div>
</template>

<style scoped>
.router-container {
    padding: 1px;
    min-height: calc(100vh-header);
    /* width: 100vw; */
    background-color: rgba(41, 196, 111, 0.306);
}

header {
    /* max-height: 30px; */
    line-height: 4;
    max-height: 100vh;
}

nav {
    width: 100%;
    font-size: 18px;
    /* text-align: center; */
    margin-top: 0;
}

nav a {
    display: inline-block;
    padding: 0 1rem;
    border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
    border: 0;
}

img {
    width: 50px;
    height: 50px;
}
</style>
