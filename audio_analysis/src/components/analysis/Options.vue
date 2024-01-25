<template>
    <el-tree :data="data" :props="defaultProps" @node-click="handleNodeClick" />
</template>

<script lang="ts" setup>
interface Tree {
    label: string
    children?: Tree[]
}

const handleNodeClick = (data: Tree) => {
    console.log(data)
}

const data: Tree[] = [
    {
        label: '音频设置',
        children: [
            {
                label: '颜色主题',
            },
            {
                label: 'FFT采样长度',
            },
            {
                label: '频率刻度',
            },
            {
                label: '视图移动方式',
            },
            {
                label: '节拍线',
            },
            {
                label: '节拍静音',
            },
        ],
    },
    {
        label: '图形配置',
        children: [
            {
                label: '图类型',
            },
            {
                label: '平滑',
            },
            {
                label: '窗口时间约',
            },
            {
                label: '显示指针',
            },
            {
                label: '同步绘制节拍',
            },
            {
                label: '跟随播放进度绘制',
            },
        ],
    },
    {
        label: '节拍',
        children: [
            {
                label: '对齐方式',
            },
            {
                label: '开始小节',
            },
            {
                label: '结束小节',
            },
            {
                label: '每节拍数',
            },
            {
                label: '小节平移',
            },
            {
                label: '拍子弱起',
            },
            {
                label: '显示拍点',
            },
            {
                label: '节拍大小',
            },
            {
                label: '节拍形状',
            },
            {
                label: '节拍颜色',
            },
        ],
    },
    {
        label: '速度',
        children: [
            {
                label: '自动涨落',
            },
            {
                label: '平均速度',
            },
            {
                label: '线条粗细',
            },
            {
                label: '线条颜色',
            },
        ],
    },
    {
        label: '力度',
        children: [
            {
                label: '力度',
            },
            {
                label: '模式',
            },
            {
                label: '力度放大',
            },
            {
                label: '透明度',
            },
            {
                label: '颜色',
            },
        ],
    },
]

const defaultProps = {
    children: 'children',
    label: 'label',
}
</script>
  