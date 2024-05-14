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
            path: '/public',
            name: 'public',
            // 路由级代码拆分
            // 这将为此路由生成一个单独的chunk（About.[hash].js）
            // 当访问该路线时，其是惰性加载的。
            component: () => import('@/views/Public.vue')
        },
        // {
        //     path: '/private',
        //     name: 'private',
        //     component: () => import('@/views/Private.vue')
        // },
        // {
        //     path: '/test',
        //     name: 'test',
        //     component: () => import('@/views/Test.vue')
        // },
        {
            path: '/analysis',
            name: 'analysis',
            component: () => import('@/views/analysis/Analysis.vue')
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('@/views/Login.vue')
        },
        {
            path: '/register',
            name: 'register',
            component: () => import('@/views/Register.vue')
        }
    ]
})

export default router
