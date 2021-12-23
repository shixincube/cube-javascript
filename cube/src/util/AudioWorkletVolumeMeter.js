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

import { Kernel } from "../core/Kernel";

/**
 * 使用 AudioWorkletNode 的音量度量工具。
 * @private
 */
export class AudioWorkletVolumeMeter {

    /**
     * @param {AudioContext} audioContext 
     * @param {MediaStream} stream 
     */
    constructor(audioContext, stream) {
        /**
         * @type {number}
         */
        this.volume = 0;

        /**
         * @type {MediaStreamAudioSourceNode}
         */
        this.microphoneSource = null;

        /**
         * @type {AudioWorkletNode}
         */
        this.node = null;

        audioContext.audioWorklet.addModule(Kernel.WORKER_URL_PATH + 'cube-volume-processor.js').then(() => {
            // 从麦克风的流创建 MediaStreamSource
            let microphone = audioContext.createMediaStreamSource(stream);

            // 创建 'volume-meter' 节点
            const node = new AudioWorkletNode(audioContext, 'volume-meter');

            node.port.postMessage({ sampleRate: audioContext.sampleRate });

            node.port.onmessage = event => {
                this.volume = event.data.volume;
            };

            microphone.connect(node).connect(audioContext.destination);

            this.node = node;
            this.microphoneSource = microphone;
        }).catch((error) => {
            console.warn(error);
        });
    }

    /**
     * 关闭。
     */
    shutdown() {
        if (null != this.microphoneSource) {
            this.microphoneSource.disconnect();
            this.node.disconnect();

            this.microphoneSource = null;
            this.node = null;
        }
    }
}
