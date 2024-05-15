<template>
    <lay-upload :onDone="handleUploadDone" :drag="true" :url="url" :data="data"></lay-upload>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
const url = "http://localhost:8081/upload"
const data = {
    name: '',
    author: JSON.parse(localStorage.getItem('user')!).name,
    upload_user_id: JSON.parse(localStorage.getItem('user')!).id,
}

const router = useRouter();

const handleUploadDone = (res: any) => {
    console.log(res);
    router.push({ name: 'analysis', params: { filename: res.data } });
}

</script>

<style>
.layui-upload {
    margin: 50px;
}

.layui-upload-drag {
    background-color: rgba(34, 36, 37, 0.6);
}
</style>