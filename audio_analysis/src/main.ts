// import './assets/main.css'
import '@layui/layui-vue/lib/index.css'
// import './assets/primer.css'
// import './assets/hero-glow.svg'
// import './assets/signup.css'
import './assets/primer.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import Layui from '@layui/layui-vue'
import "@layui/json-schema-form/lib/index.css"

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Layui)

app.mount('#app')
