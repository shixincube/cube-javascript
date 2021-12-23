/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020-2022 Cube Team.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * 音量度量工具。
 * @private
 */
export class VolumeMeter {

    /**
     * @param {AudioContext} audioContext 音频上下文。
     * @param {MediaStream} stream 媒体流。
     * @param {number} [clipLevel=0.98] 剪裁级别，数值范围：{@linkcode 0} - {@linkcode 1} 。
     * @param {number} [smoothingFactor=0.95] 平均采样平滑系数，数值范围：{@linkcode 0} - {@linkcode 1} 。
     * @param {number} [clipLag=750] 剪裁数据时，剪裁数据的长度，单位：毫秒。
     */
    constructor(audioContext, stream, clipLevel, smoothingFactor, clipLag) {
        /**
         * @type {number}
         */
        this.volume = 0;

        /**
         * @private
         * @type {boolean}
         */
        this.clipping = false;

        /**
         * 上一次剪裁时间戳
         * @private
         * @type {number}
         */
        this.lastClip = 0;

        /**
         * @private
         * @type {number}
         */
        this.clipLevel = clipLevel || 0.98;

        /**
         * @private
         * @type {number}
         */
        this.smoothingFactor = smoothingFactor || 0.95;

        /**
         * @private
         * @type {number}
         */
        this.clipLag = clipLag || 750;

        let mediaStreamSource = audioContext.createMediaStreamSource(stream);

        let processor = audioContext.createScriptProcessor(512);
        processor.onaudioprocess = (event) => {
            this.volumeAudioProcess(event);
        };

        // 对上下文没有影响，不复制输入到输出
        processor.connect(audioContext.destination);

        // 媒体流连接到处理器
        mediaStreamSource.connect(processor);

        /**
         * @private
         * @type {ScriptProcessorNode}
         */
        this.processor = processor;
    }

    /**
     * 获取音频音量。
     * @returns {number} 返回音频音量。
     */
    getVolume() {
        return this.volume;
    }

    /**
     * @private
     * @returns {boolean}
     */
    checkClipping() {
        if (!this.clipping)
            return false;

        if ((this.lastClip + this.clipLag) < window.performance.now())
            this.clipping = false;

        return this.clipping;
    }

    /**
     * 关闭。
     */
    shutdown() {
        this.processor.disconnect();
        this.processor.onaudioprocess = null;
    }

    /**
     * @private
     * @param {*} event 
     */
    volumeAudioProcess(event) {
        let buf = event.inputBuffer.getChannelData(0);
        let bufLength = buf.length;
        let sum = 0;
        let x = 0;

        // 计算平方和
        for (let i = 0; i < bufLength; ++i) {
            x = buf[i];
            if (Math.abs(x) >= this.clipLevel) {
                this.clipping = true;
    		    this.lastClip = window.performance.now();
            }

            sum += x * x;
        }

        // 取和的平方根
        let rms =  Math.sqrt(sum / bufLength);

        // 现在用上一次的采样的平均因子来平滑数值：在这里取最大值，因为我们想要“快速攻击，缓慢释放”
        this.volume = Math.max(rms, this.volume * this.smoothingFactor);
    }
}
