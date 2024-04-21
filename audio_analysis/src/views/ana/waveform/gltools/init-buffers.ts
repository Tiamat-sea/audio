function initBuffers(gl: WebGLRenderingContext) {
    const positionBuffer = initPositionBuffer(gl);

    const colorBuffer = initColorBuffer(gl);

    return {
        position: positionBuffer,
        color: colorBuffer,
    };
}

function initPositionBuffer(gl: WebGLRenderingContext) {
    // 为正方形的位置创建一个缓冲区
    const positionBuffer = gl.createBuffer();

    // 将positionBuffer设置为当前要应用缓冲区操作的缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // 现在为正方形创建一个位置数组
    const positions = [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0];

    // 现在将位置列表传递给WebGL以构建形状
    // 我们通过从JavaScript数组创建一个Float32Array，然后使用它来填充当前缓冲区来实现这一点
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    return positionBuffer;
}

function initColorBuffer(gl: WebGLRenderingContext) {
    const colors = [
        1.0,
        1.0,
        1.0,
        1.0, // 白色
        1.0,
        0.0,
        0.0,
        1.0, // 红色
        0.0,
        1.0,
        0.0,
        1.0, // 绿色
        0.0,
        0.0,
        1.0,
        1.0, // 蓝色
    ];

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    return colorBuffer;
}

export { initBuffers };