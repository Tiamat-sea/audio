import { fileURLToPath } from 'node:url'        // 导入 node.js 的 fileURLToPath 方法，用于将文件 URL 转换为文件路径
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'       // 导入 vitest 库中的一些配置相关的方法和对象
import viteConfig from './vite.config'          // 导入 vite 的配置文件

export default mergeConfig(     // 导出一个合并了 vite 和 vitest 配置的对象
    viteConfig,         // 使用 vite 的配置
    defineConfig({      // 定义 vitest 的配置
        test: {         // 配置测试环境为 jsdom，即在 JSDOM 环境中进行测试
            environment: 'jsdom',
            exclude: [...configDefaults.exclude, 'e2e/*'],          // 排除指定的文件或目录，这里将默认排除的文件再加上 'e2e/*' 目录
            root: fileURLToPath(new URL('./', import.meta.url))     // 设置测试的根目录，使用 fileURLToPath 方法将 import.meta.url 转换为文件路径
        }
    })
);
