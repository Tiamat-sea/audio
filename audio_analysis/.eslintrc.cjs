/* eslint-env node */
// 设置 ESLint 环境为 Node.js，确保在 Node.js 环境下能够正确运行 ESLint

// 引入 @rushstack/eslint-patch 模块，用于修复现代模块解析的问题
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {  // 导出 ESLint 配置对象
    root: true,     // 根目录标识，表示该配置文件是根目录下的 ESLint 配置文件
    'extends': [    // 继承的 ESLint 规则
        'plugin:vue/vue3-essential',    // 使用 Vue.js 官方提供的 Vue 3 相关的基本配置
        'eslint:recommended',           // 使用 ESLint 推荐的规则
        '@vue/eslint-config-typescript',    // 使用 Vue 官方提供的 TypeScript 相关配置
        '@vue/eslint-config-prettier/skip-formatting'   // 使用 Vue 官方提供的 ESLint 配置，但跳过 Prettier 格式化相关的规则
    ],
    parserOptions: {    // 解析选项
        ecmaVersion: 'latest'   // 指定 ECMAScript 版本为最新版本
    }
}