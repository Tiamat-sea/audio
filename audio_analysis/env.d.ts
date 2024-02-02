// 引入 vite/client 类型定义，使得在 Vite 环境下能够正常使用 Vite 提供的类型提示和功能
/// <reference types="vite/client" />

declare module "*.vue" {    // 声明一个模块，表示导入以 .vue 结尾的文件时的模块解析规则
    import type { DefineComponent } from "vue"; // 引入 DefineComponent 类型，用于定义 Vue 组件
    const vueComponent: DefineComponent<{}, {}, any>;   // 声明一个名为 vueComponent 的常量，并指定其类型为 DefineComponent，这样可以确保 Vue 单文件组件在编译后能够正确地被识别为 Vue 组件

    export default vueComponent;    // 导出 vueComponent，使得其他模块可以正确导入 Vue 组件
}

declare module "@rushstack/eslint-patch/modern-module-resolution" { }