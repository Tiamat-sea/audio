<template>
    <div style="height: 800px;">
        <lay-table :page="page" :resize="true" :height="'100%'" :columns="columns" :loading="loading"
            :default-toolbar="true" :data-source="dataSource" v-model:selected-keys="selectedKeys" @change="change"
            @sortChange="sortChange">
            <template #status="{ row }">
                <lay-switch :model-value="row.status" @change="changeStatus($event, row)"></lay-switch>
            </template>
            <template v-slot:toolbar>
                <lay-button size="sm" type="primary">新增</lay-button>
                <lay-button size="sm" @click="remove">删除</lay-button>
            </template>
            <template v-slot:operator="{ row }">
                <lay-button size="xs" type="primary">编辑</lay-button>
                <lay-button size="xs">查看</lay-button>
            </template>
        </lay-table>
    </div>
</template>

<script>
import { ref, watch, reactive } from 'vue';
import { layer } from '@layui/layui-vue';


</script>