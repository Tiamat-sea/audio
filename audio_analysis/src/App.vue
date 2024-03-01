<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
    <header>
        <!-- <nav>
            <RouterLink to="/">Home</RouterLink>
            <RouterLink to="/about">About</RouterLink>
            <RouterLink to="/analysis">Analysis</RouterLink>
        </nav> -->

        <!-- <h3>音频频谱分析(此部分存放选项卡)</h3> -->
        <img src="/favicon.ico" width="80px" height="80px">
        <RouterLink to="/">主页</RouterLink>
        <RouterLink to="/about">了解一下</RouterLink>

        <RouterLink to="">文档与社区</RouterLink>
        <RouterLink to="/analysis">分析控制台</RouterLink>
        <!-- search 右对齐 -->
        <!-- 用户个人标识 -->
        <!-- layui 弹层 - 抽屉 -->
        <!-- 加载 -->
        

    </header>

    <lay-container fluid id="router-container-fluid">
        <div class="router-container">
            <RouterView />
        </div>
    </lay-container>
</template>

<style scoped>
.router-container {
    height: calc(100vh-header);
    width: 100vw;
}

#router-container-fluid {
    padding: 0;
}

header {
    line-height: 8;
    max-height: 100vh;
}

nav {
    width: 100%;
    font-size: 12px;
    text-align: center;
    margin-top: 2rem;
}

nav a {
    display: inline-block;
    padding: 0 1rem;
    border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
    border: 0;
}
</style>
