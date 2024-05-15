/** 将数组缓冲解码为音频缓冲区 */
async function decode(audioData: ArrayBuffer, sampleRate: number): Promise<AudioBuffer> {
    const audioCtx = new AudioContext({ sampleRate })
    // console.log('audioCtx:', audioCtx, 'sampleRate:', sampleRate)
    const decode = audioCtx.decodeAudioData(audioData)
    // console.log('decode:', decode)
    return decode.finally(() => audioCtx.close())
}

/** 将峰值归一化为 -1 到 1 之间 */
// function normalize<T extends Array<Float32Array | number[]>>(channelData: T): T {
//     const firstChannel = channelData[0]
//     if (firstChannel.some((n) => n > 1 || n < -1)) {
//         const length = firstChannel.length
//         let max = 0
//         for (let i = 0; i < length; i++) {
//             const absN = Math.abs(firstChannel[i])
//             if (absN > max) max = absN
//         }
//         for (const channel of channelData) {
//             for (let i = 0; i < length; i++) {
//                 channel[i] /= max
//             }
//         }
//     }
//     return channelData
// }

/** 从预解码的音频数据创建音频缓冲区 */
// function createBuffer(channelData: Array<Float32Array | number[]>, duration: number): AudioBuffer {
//     // 如果传入的是单个数字数组，则将其转换为数组的数组
//     if (typeof channelData[0] === 'number') channelData = [channelData as unknown as number[]]

//     // 归一化为 -1 到 1 之间
//     normalize(channelData)

//     return {
//         duration,
//         length: channelData[0].length,
//         sampleRate: channelData[0].length / duration,
//         numberOfChannels: channelData.length,
//         getChannelData: (i: number) => channelData?.[i] as Float32Array,
//         copyFromChannel: AudioBuffer.prototype.copyFromChannel,
//         copyToChannel: AudioBuffer.prototype.copyToChannel
//     }
// }

const Decoder = {
    decode,
    // createBuffer
}

export default Decoder
