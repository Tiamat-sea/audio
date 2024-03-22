/** 将一个 array buffer 解码为一个 aduio buffer */
async function decode(audioData: ArrayBuffer, sampleRate: number): Promise<AudioBuffer> {
    const audioCtx = new AudioContext({ sampleRate })
    const decode = audioCtx.decodeAudioData(audioData)
    return decode.finally(() => audioCtx.close)
}

/** 峰值归一化到-1···1 */
function normalize<T extends Array<Float32Array | number[]>>(channelData: T): T {
    const firstChannel = channelData[0]
    if (firstChannel.some((n) => n > 1 || n < -1)) {
        const length = firstChannel.length
        let max = 0
        for (let i = 0; i < length; ++i) {
            const absN = Math.abs(firstChannel[i])
            if (absN > max) max = absN
        }
        for (const channel of channelData) {
            for (let i = 0; i < length; ++i) {
                channel[i] /= max
            }
        }
    }
    return channelData
}

/** 从预解码的音频数据创建一个 audio buffer */
function createBuffer(channelData: Array<Float32Array | number[]>, duration: number): AudioBuffer {
    // 如果传递了单个数字数组，则使它成为一个数组的子数组
    if (typeof channelData[0] === 'number') channelData = [channelData as unknown as number[]]
    // 归一化
    normalize(channelData)

    return {
        duration,
        length: channelData[0].length,
        sampleRate: channelData[0].length / duration,
        numberOfChannels: channelData.length,
        getChannelData: (i: number) => channelData?.[i] as Float32Array,
        copyFromChannel: AudioBuffer.prototype.copyFromChannel,
        copyToChannel: AudioBuffer.prototype.copyToChannel,
    }
}

const Decoder = {
    decode,
    createBuffer,
}

export default Decoder