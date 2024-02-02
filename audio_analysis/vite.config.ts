import { fileURLToPath, URL } from 'node:url'   // 导入 node.js 中的 fileURLToPath 和 URL 方法
import { defineConfig } from 'vite'             // 导入 vite 中的 defineConfig 方法
import vue from '@vitejs/plugin-vue'            // 导入 vite 插件：Vue
import vueJsx from '@vitejs/plugin-vue-jsx'     // 导入 vite 插件：Vue JSX

// https://vitejs.dev/config/
export default defineConfig({   // 导出 Vite 项目的配置对象
    plugins: [      // 配置插件列表，这里包括了 Vue 和 Vue JSX 插件
        vue(),      // Vue 插件
        vueJsx(),   // Vue Jsx 插件
    ],
    resolve: {      // 配置解析选项
        alias: {    // 配置别名，用于将 '@' 指向项目中的 'src' 目录
            '@': fileURLToPath(new URL('./src', import.meta.url))   // 将 '@' 别名映射到项目的 'src' 目录
        }
    }
})