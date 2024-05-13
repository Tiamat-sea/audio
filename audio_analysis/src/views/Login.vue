<script setup lang="ts">
import Request from '@/utils/request';
import { ref, reactive } from 'vue'
import { RouterLink } from 'vue-router'
import { layer } from '@layui/layer-vue'

const model = reactive({
    username: '',
    password: ''
})

const login = async () => {
    try {
        const response = await Request.post('/login', {
            name: model.username,
            password: model.password
        });
        console.log(response);
        if (response === "login failed") {
            layer.msg('登录失败', { time: 2000 });
        } else if (response.name !== null) {
            layer.msg(`登录成功`, { time: 2000 });
        }


    } catch (error) {
        console.error(error);
    }
};

const register = () => {
    layer.msg(`${JSON.stringify(model)}`, { time: 2000 });
};
</script>

<template>
    <div class="login">
        <lay-field title="用户登录">
            <lay-form :model="model" style="margin: 50px;">
                <lay-form-item label="账号" prop="username" placeholder="账户是您的登录凭据，可以在注册电子邮件中找到">
                    <lay-input v-model="model.username"></lay-input>
                </lay-form-item>
                <lay-form-item label="密码" prop="password" tips="密码应当包含字母、数字和特殊符号中的任意两种">
                    <lay-input v-model="model.password" type="password"></lay-input>
                </lay-form-item>
                <lay-form-item style="text-align: center;">
                    <lay-button type="primary" @click="login">登录</lay-button>
                </lay-form-item>
            </lay-form>
            <RouterLink to="/register" style="color:white; float:right;margin-bottom: 5px">
                没有账号？去注册</RouterLink>
        </lay-field>
    </div>
</template>

<style>
.layui-input input {
    color: rgba(222, 220, 217, 0.85)
}

.layui-input-wrapper {
    background-color: rgb(34, 36, 37);
}

.login {
    width: 800px;
    min-width: 600px;
    margin: auto;
    padding: 90px;
}

.layui-input-block {
    margin: 20px;
}

/* .layui-form .layui-form-item .layui-input-block .layui-btn {
    width: 120px;
} */

/* .layui-field-box .layui-form .layui-form-item .layui-input-block a:hover {
    color: yellow;
} */
</style>