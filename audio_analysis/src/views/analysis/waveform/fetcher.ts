async function watchProgress(response: Response, progressCallback: (percentage: number) => void) {
    if (!response.body || !response.headers) return
    const reader = response.body.getReader()

    const contentLength = Number(response.headers.get('Content-Length')) || 0
    let receivedLength = 0

    // 处理数据
    const processChunk = async (value: Uint8Array | undefined) => {
        // 增加接收长度
        receivedLength += value?.length || 0
        const percentage = Math.round((receivedLength / contentLength) * 100)
        progressCallback(percentage)
    }

    const read = async () => {
        let data
        try {
            data = await reader.read()
        } catch {
            // 忽略错误，因为我们只能处理主要的响应
            return
        }

        // 继续读取数据直到完成
        if (!data.done) {
            processChunk(data.value)
            await read()
        }
    }

    read()
}

async function fetchBlob(
    url: string,
    progressCallback: (percentage: number) => void,
    requestInit?: RequestInit
): Promise<Blob> {
    // 获取资源
    const response = await fetch(url, requestInit)

    if (response.status >= 400) {
        throw new Error(`Failed to fetch ${url}: ${response.status} (${response.statusText})`)
    }

    // 读取数据以跟踪进度
    watchProgress(response.clone(), progressCallback)

    return response.blob()
}

const Fetcher = {
    fetchBlob
}

export default Fetcher
