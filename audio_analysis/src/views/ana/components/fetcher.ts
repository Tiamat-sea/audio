async function watchProgress(response: Response, progressCallback: (percentage: number) => void) { // 监听进度
    if (!response.body || !response.headers) return // 如果没有响应体或响应头则返回
    const reader = response.body.getReader() // 获取响应体的读取器
    const contentLength = Number(response.headers.get('Content-Length')) || 0 // 获取响应头的 Content-Length，如果没有则为 0
    let receivedLength = 0 // 已接收长度

    // 数据处理
    const processChunk = async (value: Uint8Array | undefined) => { // 处理数据块
        // 加到 receivedLength
        receivedLength += value?.length || 0 // 如果 value 为 undefined 则为 0
        const percentage = Math.round((receivedLength / contentLength) * 100) // 计算百分比
        progressCallback(percentage) // 回调
    }

    const read = async () => {
        let data
        try {
            data = await reader.read() // 读取数据
        } catch {
            // 忽视错误，因为我们只处理主要的响应
            return
        }

        // 继续读取数据直到完成
        if (!data.done) {
            processChunk(data.value) // 处理数据块
            await read()
        }
    }

    read()
}

async function fetchBlob(
    url: string,
    progressCallback: (percentage: number) => void,
    requestInit?: RequestInit,
): Promise<Blob> {
    // 取得资源
    const response = await fetch(url, requestInit)

    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status} (${response.statusText})`)
    }

    // 读取数据以跟踪进度
    watchProgress(response.clone(), progressCallback)

    return response.blob()
}

const Fetcher = {
    fetchBlob,
}

export default Fetcher