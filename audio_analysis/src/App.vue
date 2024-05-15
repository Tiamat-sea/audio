<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
const username = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).name : '请登录...';
const status = localStorage.getItem('user') ? '退出' : '';

function quit(): any {
    localStorage.clear()
    location.reload()
}
</script>

<template>
    <div class="js-warp-hide bg-gray-dark-mktg d-flex flex-auto flex-column overflow-hidden position-relative">
        <img src="./assets/hero-glow.svg" alt="Glowing universe"
            class="js-warp-hide position-absolute overflow-hidden events-none"
            style="top: 50%; left: 50%; width: 200%; transform: translate(-50%, -50%); z-index: 0;">

        <lay-layout class="global-container">
            <lay-header>
                <img src="/favicon.ico" alt="LOGO.ico" style="width: 40px; height: 40px;" />
                <RouterLink to="/">首页</RouterLink>
                <RouterLink to="/public">记录</RouterLink>
                <!-- <RouterLink to="/private">我的记录</RouterLink> -->
                <!-- <RouterLink to="/test">WebGL测试</RouterLink> -->
                <RouterLink to="/upload">上传</RouterLink>
                <span>
                    <RouterLink to="/" @click="quit()">{{ status }}</RouterLink>
                </span>
                <span>
                    <RouterLink to="/login">{{ username }}</RouterLink>
                </span>
                <span>
                    <RouterLink to="">文档与社区</RouterLink>
                </span>
            </lay-header>

            <lay-body style="margin-top: 10px;">
                <RouterView />
            </lay-body>
        </lay-layout>
    </div>
</template>

<style>
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
    z-index: 0;
}

.global-container .layui-header {
    background-color: rgba(6, 37, 90, 1);
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
}

.global-container .layui-body {
    z-index: 0;
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
    color: rgb(220, 216, 212);
    text-decoration: none;
}

.global-container .layui-header a:hover {
    color: rgb(21, 183, 119);
    text-decoration: underline;
}

.global-container .layui-header span {
    float: right;
}

.bg-gray-dark-mktg {
    z-index: 0;
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