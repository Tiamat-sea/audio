<script setup lang="ts">
import Request from '@/utils/request';
import { ref, reactive } from 'vue'
import { layer } from '@layui/layer-vue'
import { RouterLink } from 'vue-router'

const model = reactive({
    username: '',
    password: '',
    email: '',
    password2: ''
})

const register = async () => {
    if (model.username === '' || model.password === '' || model.password2 === '') {
        layer.msg('请填写完整信息', { time: 2000 });
        return;
    }
    if (model.password != model.password2) {
        layer.msg('密码不一致，请核对后再试', { time: 2000 });
        return;
    }
    try {
        const response = await Request.post('/user', {
            name: model.username,
            password: model.password,
            email: model.email,
        });
        console.log(response);
        if (response === "添加OK") {
            layer.msg('注册成功', { time: 2000 });
        } else {
            layer.msg(`注册失败`, { time: 2000 });
        }
    } catch (error) {
        console.error(error);
    }
};
</script>

<template>
    <div class="login">
        <lay-field title="用户注册">
            <!-- <h1 style="text-align: center;">登录</h1> -->
            <lay-form :model="model" style="margin: 50px;">
                <lay-form-item label="账号" prop="username" tips="账户是您的登录凭据，可以在注册电子邮件中找到">
                    <lay-input v-model="model.username"></lay-input>
                </lay-form-item>
                <lay-form-item label="邮箱" prop="email" tips="账户是您的登录凭据，可以在注册电子邮件中找到">
                    <lay-input v-model="model.email"></lay-input>
                </lay-form-item>
                <lay-form-item label="密码" prop="password" tips="密码应当包含字母、数字和特殊符号中的任意两种">
                    <lay-input v-model="model.password" type="password"></lay-input>
                </lay-form-item>
                <lay-form-item label="确认密码" prop="password2" tips="密码应当包含字母、数字和特殊符号中的任意两种">
                    <lay-input v-model="model.password2" type="password"></lay-input>
                </lay-form-item>
                <lay-form-item style="text-align: center;">
                    <lay-button type="primary" @click="register">注册</lay-button>
                </lay-form-item>
            </lay-form>
            <RouterLink to="/login" style="color:white; float:right;margin-bottom: 5px">
                已有账号？去登录</RouterLink>
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
</style>