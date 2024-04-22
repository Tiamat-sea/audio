<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
    <lay-layout class="global-container">
        <lay-header>
            <!-- <h3>音频频谱分析(此部分存放选项卡)</h3> -->
            <img src="/favicon.ico" alt="LOGO.ico" style="margin-left:20px; width: 40px; height: 40px;" />
            <RouterLink to="/">主页</RouterLink>
            <RouterLink to="/about">了解一下</RouterLink>

            <RouterLink to="">文档与社区</RouterLink>
            <RouterLink to="/test">WebGL测试</RouterLink>
            <RouterLink to="/analysis1">Ana1 - 辅助</RouterLink>
            <RouterLink to="/ana3">Ana3 - 现在使用的</RouterLink>
            <!-- <lay-button type="primary" @click="openDrawer">抽屉</lay-button>
                search 右对齐
                用户个人标识
                layui 弹层 - 抽屉
                加载 -->
        </lay-header>

        <lay-body>
            <RouterView />
        </lay-body>

        <!-- <lay-footer>
            footer
        </lay-footer> -->
    </lay-layout>
</template>

<style scoped>
/* 全局高度 */
.global-container {
    height: 100vh;
}

.global-container .layui-footer,
.global-container .layui-header {
    line-height: 60px;
    background: #87ca9a;
    color: white;
}

.global-container .layui-body {
    display: block;
    background: #5FB878;
    align-items: none;
    justify-content: center;
    color: white;
}

/* RouterLink style */
.global-container .layui-header a {
    text-align: left;
    font-size: 20px;
    margin-left: 10px;
    margin-right: 10px;
    color: rgb(0, 0, 254);
    text-decoration: none;
}

.global-container .layui-header a:hover {
    color: yellow;
}
</style>
