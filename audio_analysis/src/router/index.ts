import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView
        },
        {
            path: '/about',
            name: 'about',
            //路由级代码拆分
            //这将为此路由生成一个单独的chunk（About.[hash].js）
            //当访问该路线时，其是惰性加载的。
            component: () => import('@/views/AboutView.vue')
        },
        {
            path: '/analysis1',
            name: 'analysis1',
            component: () => import('@/views/analysis/Analysis.vue')
        },
        {
            path: '/analysis2',
            name: 'analysis2',
            component: () => import('@/views/ana/Ana.vue')
        },
        {
            path: '/test',
            name: 'test',
            component: () => import('@/views/Test.vue')
        }
    ]
})

export default router
