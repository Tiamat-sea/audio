// 顶点着色器代码
const vertexShaderSource: string = `
attribute vec2 position;
varying float v_y;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
    v_y = position.y;
}`;

// 片元着色器代码
const fragmentShaderSource: string = `
precision mediump float;
varying float v_y;

// 将HSV颜色转换为RGB颜色
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    // 计算HSV颜色
    float min = -0.5;
    float max = 0.5;
    float h = (v_y - min) / (max - min); // 将v_y从[min,max]映射到[0,1]
    vec3 hsvColor = vec3(h, 0.6, 0.7);  // 饱和度、亮度

    // 将HSV颜色转换为RGB颜色
    vec3 rgbColor = hsv2rgb(hsvColor);

    // 设置片元颜色
    gl_FragColor = vec4(rgbColor, 1.0);
}`;

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
    webgl.clearColor(31 / 255, 31 / 255, 31 / 255, 1.0); // 设置背景颜色
    webgl.clear(webgl.COLOR_BUFFER_BIT);
    webgl.useProgram(program);
    webgl.drawArrays(webgl.LINE_STRIP, 0, audioData.length / 2);
}

function convertToWebGLData(channelData: Float32Array | number[]): Float32Array {
    const length = channelData.length;
    const webGLData = new Float32Array(length * 2).fill(-1);

    for (let i = 0; i < length; i++) {
        webGLData[i * 2] = i * 2 / length + webGLData[i * 2];
        webGLData[i * 2 + 1] = channelData[i];
    }

    return webGLData;
}

/* 查询通道数据最大值与最小值 工具函数 */
function findMinMax(channelData: Float32Array | number[]): { min: number, max: number } {
    let min = Number.MAX_VALUE;
    let max = Number.MIN_VALUE;

    for (let i = 0; i < channelData.length; i++) {
        const value = channelData[i];
        if (value < min) {
            min = value;
        }
        if (value > max) {
            max = value;
        }
    }

    return { min, max };
}

const WebGL = {
    drawWaveformByWebGL,
    convertToWebGLData
};

export default WebGL;