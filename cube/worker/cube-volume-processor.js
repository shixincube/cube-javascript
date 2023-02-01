/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020-2023 Cube Team.
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
 * 音量检测。
 */
class VolumeProcessor extends AudioWorkletProcessor {

    constructor() {
        super();

        this.volume = 0;

        this.smoothingFactor = 0.95;

        this.clipLag = 25;

        this.nextUpdateFrame = this.clipLag;

        this.sampleRate = 44100;

        this.port.onmessage = event => {
            if (event.data.sampleRate) {
                this.sampleRate = event.data.sampleRate;
            }
        };
    }

    get intervalInFrames() {
        return this.clipLag / 1000 * this.sampleRate;
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];

        if (input.length > 0) {
            const samples = input[0];
            let sum = 0;
            let rms = 0;

            // 计算平方和
            for (let i = 0; i < samples.length; ++i) {
                sum += samples[i] * samples[i];
            }

            // 计算 RMS 等级
            rms = Math.sqrt(sum / samples.length);

            // 现在用上一次的采样的平均因子来平滑数值：在这里取最大值，因为我们想要“快速攻击，缓慢释放”
            this.volume = Math.max(rms, this.volume * this.smoothingFactor);

            this.nextUpdateFrame -= samples.length;
            if (this.nextUpdateFrame < 0) {
                this.nextUpdateFrame += this.intervalInFrames;
                this.port.postMessage({ volume: this.volume });
            }
        }

        return true;
    }
}

registerProcessor('volume-meter', VolumeProcessor);
