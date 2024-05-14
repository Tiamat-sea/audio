<template>
    <!-- <h2>公共分析记录</h2> -->
    <lay-row space="10">
        <lay-col md="12" sm="12" xs="24">
            <div class="grid-demo">
                <h3 style="text-align: center;">我的音乐</h3>
                <div style="height: 800px;">
                    <lay-table :page="page" :resize="true" :height="'100%'" :columns="musicColumns" :loading="loading"
                        :default-toolbar="false" :data-source="musicDataSource" :even="true" :auto-cols-width="true">
                        <template v-slot:operator="{ row }">
                            <lay-button @click="seekMusic(row.id)" size="xs" type="primary">查看</lay-button>
                        </template>
                    </lay-table>
                </div>
            </div>
        </lay-col>

        <lay-col md="12" sm="12" xs="24">
            <div class="grid-demo">
                <h3 style="text-align: center;">我的分析</h3>
                <div style="height: 800px;">
                    <lay-table :page="page" :resize="true" :height="'100%'" :columns="analysisColumns"
                        :loading="loading" :default-toolbar="false" :data-source="analysisDataSource" :even="true"
                        :auto-cols-width="true">
                        <template v-slot:operator="{ row }">
                            <lay-button @click="seekAnalysis(row.id)" size="xs" type="primary">查看</lay-button>
                        </template>
                    </lay-table>
                </div>
            </div>
        </lay-col>
    </lay-row>
</template>

<script setup lang="ts">
import { ref, reactive, onBeforeMount } from 'vue';
import Request from '@/utils/request';
import { layer } from '@layui/layui-vue';

onBeforeMount(() => {
    getDataMusic();
    getDataAnalysis();
});

const musicDataSource = ref([]);
const analysisDataSource = ref([]);

async function getDataMusic(): Promise<void> {
    try {
        const data = await Request.get('/music');
        console.log('data', data)
        musicDataSource.value = data;
        console.log(musicDataSource);
    } catch (error) {
        console.error(error);
    }
}
async function getDataAnalysis(): Promise<void> {
    try {
        const data = await Request.get('/analysisRecord');
        console.log('data', data)
        analysisDataSource.value = data;
        console.log(analysisDataSource);
    } catch (error) {
        console.error(error);
    }
}

const loading = ref(false);
const page = reactive({ current: 1, limit: 10, total: 1000 });
const musicColumns = ref([
    { title: "编号", key: "id", fixed: "left", align: "center" },
    { title: "名称", key: "name" },
    { title: "作者", key: "author" },
    { title: "内容介绍", key: "description", resize: "true" },
    { title: "查看", customSlot: "operator", key: "operator", fixed: "right", ignoreExport: true }
]);
const analysisColumns = ref([
    { title: "编号", key: "id", fixed: "left", align: "center" },
    { title: "名称", key: "name" },
    { title: "作者", key: "authorId" },
    { title: "内容介绍", key: "description", resize: "true" },
    { title: "查看", customSlot: "operator", key: "operator", fixed: "right", ignoreExport: true }
]);

function seekMusic(id: number) {
    Request.get(`/music/${id}`).then((res) => {
        layer.msg(res)
    });
}

function seekAnalysis(id: number) {
    Request.get(`/analysisRecord/${id}`).then((res) => {
        layer.msg(res)
    });
}

</script>

<style>
.grid-demo {
    margin: 5px;
    padding: 10px;
    line-height: 50px;
    border-radius: 5px;
    border: rgba(128, 128, 128, 0.6) solid 2px;
    /* text-align: center; */
    background-color: rgba(128, 128, 128, 0.3);
    color: #fff;
}
</style>