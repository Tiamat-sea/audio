<template>
    <!-- HTML 结构 -->
    <div id="container" ref="container" style="width: 100vw">
        <canvas id="audioWaveform" ref="canvas" height="400px"></canvas>
    </div>

</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
const container = ref(document.getElementById('container') as HTMLElement);
const canvas = ref(document.getElementById('audioWaveform') as HTMLCanvasElement)

// 顶点着色器代码
const vertexShaderSource: string = `
attribute vec2 position;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}`;

// 片元着色器代码
const fragmentShaderSource = `
precision mediump float;

void main() {
  // 使用 Heaven 配色中的颜色
  vec3 icterineColor = vec3(0.96, 0.96, 0.36);
  vec3 robinEggBlueColor = vec3(0.05, 0.84, 0.74);
  vec3 waterColor = vec3(0.81, 0.94, 0.98);
  vec3 pacificBlueColor = vec3(0.05, 0.65, 0.81);
  vec3 blueSapphireColor = vec3(0.02, 0.36, 0.45);

  // 根据波形值设置颜色
  vec3 finalColor = icterineColor; // 假设默认颜色为 icterineColor

  // 设置片元颜色
  gl_FragColor = vec4(finalColor, 1.0);
}
`;

// 创建着色器函数
function createShader(
    webgl: WebGLRenderingContext,
    type: number,
    source: string
): WebGLShader | null {
    const shader: WebGLShader | null = webgl.createShader(type);

    if (shader !== null) {
        webgl.shaderSource(shader, source);
        webgl.compileShader(shader);

        if (!webgl.getShaderParameter(shader, webgl.COMPILE_STATUS)) {
            alert('着色器编译失败: ' + webgl.getShaderInfoLog(shader));
            webgl.deleteShader(shader);

            return null;
        }
    }

    return shader;
}

// 创建程序对象函数
function createProgram(
    webgl: WebGLRenderingContext,
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader
): WebGLProgram | null {
    const program: WebGLProgram | null = webgl.createProgram();

    if (program !== null) {
        webgl.attachShader(program, vertexShader);
        webgl.attachShader(program, fragmentShader);
        webgl.linkProgram(program);
        if (!webgl.getProgramParameter(program, webgl.LINK_STATUS)) {
            alert('程序链接失败: ' + webgl.getProgramInfoLog(program));
            return null;
        }
    }

    return program;
}

function drawWaveformByWebGL(webgl: WebGLRenderingContext, audioData: Float32Array) {
    // 创建顶点着色器 & 片元着色器
    const vertexShader: WebGLShader | null = createShader(webgl, webgl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader: WebGLShader | null = createShader(webgl, webgl.FRAGMENT_SHADER, fragmentShaderSource);

    // 创建程序对象
    if (vertexShader === null || fragmentShader === null) return;
    const program: WebGLProgram | null = createProgram(webgl, vertexShader, fragmentShader);

    // 创建缓冲区并上传音频数据
    const buffer: WebGLBuffer | null = webgl.createBuffer();
    webgl.bindBuffer(webgl.ARRAY_BUFFER, buffer);
    webgl.bufferData(webgl.ARRAY_BUFFER, audioData, webgl.STATIC_DRAW);

    // 获取属性位置
    if (program === null) return;
    const positionLocation: number = webgl.getAttribLocation(program, 'position');

    // 链接属性和缓冲区
    webgl.enableVertexAttribArray(positionLocation);
    webgl.vertexAttribPointer(positionLocation, 2, webgl.FLOAT, false, 0, 0);

    // 绘制波形图
    webgl.clearColor(0.0, 0.0, 0.0, 1.0); // 设置背景颜色
    webgl.clear(webgl.COLOR_BUFFER_BIT);
    webgl.useProgram(program);
    webgl.drawArrays(webgl.LINE_STRIP, 0, audioData.length / 2);
}


const resizeHandler = () => {
    if (canvas.value && container.value) {
        canvas.value.width = container.value.offsetWidth;
        const glCtx = canvas.value.getContext('webgl', { antialias: false }) as WebGLRenderingContext;

        if (glCtx) {
            // 设置视口大小
            glCtx.viewport(0, 0, glCtx.canvas.width, glCtx.canvas.height);
        }
    }
};

onMounted(() => {
    window.addEventListener('resize', resizeHandler);
    resizeHandler();

    const glCtx = canvas.value.getContext('webgl', { antialias: false }) as WebGLRenderingContext;
    canvas.value.width = container.value.offsetWidth;
    glCtx.viewport(0, 0, glCtx.canvas.width, glCtx.canvas.height);
    drawWaveformByWebGL(glCtx, new Float32Array([0, -1, 0, 0]));
})

onUnmounted(() => {
    window.removeEventListener('resize', resizeHandler);
});
</script>