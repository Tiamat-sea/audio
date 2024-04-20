<template>
    <div>
        <canvas id="canvas"></canvas>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

// 创建 AudioContext 和 AnalyserNode
const audioContext = new AudioContext();
const analyser = audioContext.createAnalyser();

function createWebGLProgram(gl: WebGLRenderingContext) {
    // 创建顶点着色器
    const vertexShaderSource = `
        attribute vec2 position;
        void main() {
            gl_Position = vec4(position, 0.0, 1.0);
        }
    `;
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    if (vertexShader) {
        gl.shaderSource(vertexShader, vertexShaderSource);
        gl.compileShader(vertexShader);
    }

    // 创建片元着色器
    const fragmentShaderSource = `
        precision mediump float;
        void main() {
            gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        }
    `;
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (fragmentShader) {
        gl.shaderSource(fragmentShader, fragmentShaderSource);
        gl.compileShader(fragmentShader);
    }

    // 创建程序
    const program = gl.createProgram();
    if (program) {
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.useProgram(program);
    }

    // 设置顶点数据
    const positionAttributeLocation = gl.getAttribLocation(program, 'position');
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
        -1.0, -1.0,
        1.0, -1.0,
        -1.0, 1.0,
        1.0, 1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    return program;
}

function passDataToWebGLProgram(gl, program, data) {
    // 获取属性的位置
    const location = gl.getAttribLocation(program, 'aFrequencyData');

    // 创建一个新的缓冲区
    const buffer = gl.createBuffer();

    // 绑定缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    // 将数据传递给缓冲区
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

    // 启用属性
    gl.enableVertexAttribArray(location);

    // 指定属性的数据格式
    gl.vertexAttribPointer(location, 1, gl.FLOAT, false, 0, 0);
}

// 获取音频文件
fetch('example.mp3')
    .then(response => response.arrayBuffer())
    .then(buffer => audioContext.decodeAudioData(buffer))
    .then(audioBuffer => {
        // 创建音频源并连接到 AnalyserNode
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(analyser);
        source.start();

        // 创建 WebGL 上下文和程序
        const canvas = document.getElementById('canvas') as HTMLCanvasElement;
        const gl = canvas?.getContext('webgl');
        if (gl) {
            const program = createWebGLProgram(gl);

            // 创建一个用于存储频谱数据的数组
            const data = new Uint8Array(analyser.frequencyBinCount);

            // 在动画循环中绘制频谱图
            function draw() {
                // 获取频谱数据
                analyser.getByteFrequencyData(data);

                // 将频谱数据传递给 WebGL 程序
                passDataToWebGLProgram(gl, program, data); // 将数据传递给 WebGL 程序的函数需要你自己实现

                // 绘制频谱图
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, data.length);

                // 请求下一帧
                requestAnimationFrame(draw);
            }

            draw();
        }
    });
</script>
