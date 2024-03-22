async function watchProgress(response: Response, progressCallback: (percentage: number) => void) {
    if (!response.body || !response.headers) return
    const reader = response.body.getReader()
    const contentLength = Number(response.headers.get('Content-Length')) || 0
    let receivedLength = 0

    // 数据处理
    const processChunk = async (value: Uint8Array | undefined) => {
        // 加到 receivedLength
        receivedLength += value?.length || 0
        const percentage = Math.round((receivedLength / contentLength) * 100)
        progressCallback(percentage)
    }

    const read = async () => {
        let data
        try {
            data = await reader.read()
        } catch {
            // 忽视错误，因为我们只处理主要的响应
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