/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020 Shixin Cube Team.
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

import { FieldEndpoint } from "./FieldEndpoint";
import { MediaConstraint } from "./MediaConstraint";

/**
 * 本地 RTC 接入点。
 */
export class LocalRTCEndpoint extends FieldEndpoint {

    /**
     * 构造函数。
     */
    constructor(pipeline) {
        super();

        this.pipeline = pipeline;

        this.pc = null;

        this.mediaStream = null;
    }

    /**
     * 启动 RTC 终端。
     * @param {MediaConstraint} mediaConstraint 媒体约束。
     * @param {function} handleSuccess 启动成功回调函数。
     * @param {function} handleError 启动失败回调函数。
     */
    open(mediaConstraint, handleSuccess, handleError) {
        if (null != this.pc) {
            handleError();
            return;
        }

        this.pc = new RTCPeerConnection();
        this.pc.ontrack = (event) => {
            this.fireOnTrack(event);
        };

        this.pc.onicecandidate = (event) => {
            this.fireOnIceCandidate(event);
        };

        let constraints = mediaConstraint.toJSON();

        if (mediaConstraint.audioEnabled) {
            this.audioEnabled = true;
        }
        if (mediaConstraint.videoEnabled) {
            this.videoEnabled = true;
        }

        this.getUserMedia(constraints, (mediaStream) => {
            this.mediaStream = mediaStream;
        }, (e) => {
            this.mediaStream = null;
            // TODO 错误处理
        });
    }

    /**
     * 关闭 RTC 终端。
     */
    close() {
        if (null != this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => {
                track.stop();
            });
        }

        if (null != this.pc) {
            this.pc.close();
            this.pc = null;
        }
    }

    resumeVideoStream() {

    }

    pauseVideoStream() {

    }

    fireOnTrack(event) {

    }

    fireOnIceCandidate(event) {

    }

    getUserMedia(constraints, handleSuccess, handleError) {
        navigator.mediaDevices.getUserMedia(constraints)
            .then(handleSuccess)
            .catch(handleError);
    }

}
