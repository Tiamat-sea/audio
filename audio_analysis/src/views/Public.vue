<template>
    <div class="public">
        <h1>公共分析记录</h1>
        <lay-field style="margin-top: 20px;" title="最新记录">
            <lay-col style="" md="6" sm="12" xs="24">
                <div class="grid-demo">记录名称</div>
            </lay-col>
            <lay-col style="" md="10" sm="12" xs="24">
                <div class="grid-demo">音频名称</div>
            </lay-col>
            <lay-col style="" md="6" sm="12" xs="24">
                <div class="grid-demo">用户</div>
            </lay-col>


            <lay-col style="" md="6" sm="12" xs="24">
                <div class="grid-demo">基本分析</div>
            </lay-col>
            <lay-col style="" md="10" sm="12" xs="24">
                <div class="grid-demo">天秀</div>
            </lay-col>
            <lay-col style="" md="6" sm="12" xs="24">
                <div class="grid-demo">tiamat</div>
            </lay-col>
        </lay-field>
    </div>
</template>

<script>
import Table from '../components/Table.vue'

export default {
    components: {
        Table
    }
}
</script>

<style>
.public {
    padding: 20px 100px 0;
}

.grid-demo {
    margin: 5px;
    line-height: 50px;
    border-radius: 5px;
    border: rgba(128, 128, 128, 0.6) solid 2px;
    text-align: center;
    background-color: rgba(128, 128, 128, 0.3);
    color: #fff;
}
</style>