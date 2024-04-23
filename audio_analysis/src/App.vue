<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'

</script>

<template>
    <div class="js-warp-hide bg-gray-dark-mktg d-flex flex-auto flex-column overflow-hidden position-relative">
        <img src="./assets/hero-glow.svg" alt="Glowing universe"
            class="js-warp-hide position-absolute overflow-hidden events-none"
            style="top: 50%; left: 50%; width: 200%; transform: translate(-50%, -50%); z-index: 0;">

    <lay-layout class="global-container">
        <lay-header>
            <!-- <h3>音频频谱分析(此部分存放选项卡)</h3> -->
            <img src="/favicon.ico" alt="LOGO.ico" style="width: 40px; height: 40px;" />
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
    </div>
</template>

<style scoped>
/* 全局高度 */
.global-container {
    height: 100vh;
}

.global-container .layui-footer,
.global-container .layui-header {
    padding: 0 20px;
    line-height: 60px;
    background: none;
    color: white;
    z-index: 1;
}

.global-container .layui-body {
    z-index: 1;
    padding: 0 5px;
    display: block;
    background: none;
    align-items: none;
    justify-content: center;
    color: white;
}

/* RouterLink style */
.global-container .layui-header a {
    text-align: left;
    font-size: 17px;
    margin-left: 10px;
    margin-right: 10px;
    color: rgb(255, 255, 255);
    text-decoration: none;
}

.global-container .layui-header a:hover {
    color: yellow;
}

.bg-gray-dark-mktg {
    height: 100vh;
    background-color: #040d21
}

.height-full {
    height: 100vw !important
}

.d-flex {
    display: flex !important
}

.flex-auto {
    flex: auto !important
}

.flex-column {
    flex-direction: column !important
}

.flex-column-reverse {
    flex-direction: column-reverse !important
}

.overflow-hidden {
    overflow: hidden !important
}

.position-relative {
    position: relative !important
}

.signup-space,
.signup-stars {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    overflow: hidden
} 
</style>
