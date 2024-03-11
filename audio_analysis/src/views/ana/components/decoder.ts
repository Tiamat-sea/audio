/** 将一个 array buffer 解码为一个 aduio buffer */
async function decode(audioData: ArrayBuffer, sampleRate: number): Promise<AudioBuffer> {
    const audioCtx = new AudioContext({ sampleRate })
    const decode = audioCtx.decodeAudioData(audioData)
    return decode.finally(() => audioCtx.close)
}

const Decoder = {
    decode,
}

export default Decoder