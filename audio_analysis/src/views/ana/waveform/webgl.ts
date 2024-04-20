import exp from "constants";

// 顶点着色器代码
const vertexShaderSource: string = `
attribute vec2 position;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}`;

// 片元着色器代码
const fragmentShaderSource: string = `
void main() {
    gl_FragColor = vec4(0.0, 0.5, 0.0, 1.0); // 设置波形图颜色
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

export function drawWaveformByWebGL(webgl: WebGLRenderingContext, audioData: Float32Array) {
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
