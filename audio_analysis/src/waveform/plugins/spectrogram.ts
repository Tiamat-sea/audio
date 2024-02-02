/**
 * Spectrogram plugin
 *
 * Render a spectrogram visualisation of the audio.
 *
 * @author Pavel Denisov (https://github.com/akreal)
 * @see https://github.com/wavesurfer-js/wavesurfer.js/pull/337
 *
 * @example
 * // ... initialising wavesurfer with the plugin
 * var wavesurfer = WaveSurfer.create({
 *   // wavesurfer options ...
 *   plugins: [
 *     SpectrogramPlugin.create({
 *       // plugin options ...
 *     })
 *   ]
 * });
 */

// @ts-nocheck

/**
 * Calculate FFT - Based on https://github.com/corbanbrook/dsp.js
 */
function FFT(bufferSize: number, sampleRate: number, windowFunc: string, alpha: number) {
    this.bufferSize = bufferSize
    this.sampleRate = sampleRate
    this.bandwidth = (2 / bufferSize) * (sampleRate / 2)

    this.sinTable = new Float32Array(bufferSize)
    this.cosTable = new Float32Array(bufferSize)
    this.windowValues = new Float32Array(bufferSize)
    this.reverseTable = new Uint32Array(bufferSize)

    this.peakBand = 0
    this.peak = 0

    var i
    switch (windowFunc) {

    }
}