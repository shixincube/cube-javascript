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

import { Pipeline } from "../core/Pipeline";
import { CommFieldEndpoint } from "./CommFieldEndpoint";
import { MediaConstraint } from "./MediaConstraint";
import { MultipointCommAction } from "./MultipointCommAction";

/**
 * 本地 RTC 接入点。
 */
export class LocalRTCEndpoint extends CommFieldEndpoint {

    /**
     * @param {Pipeline} pipeline 信令通道。
     */
    constructor(pipeline) {
        super();

        this.pipeline = pipeline;

        this.mediaConstraint = null;

        this.pc = null;

        this.mediaStream = null;
    }

    /**
     * 正在呼叫状态。
     * @returns {boolean} 如果正在通话返回 {@linkcode true} 。
     */
    isCalling() {
        return (null != this.pc);
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

        this.mediaConstraint = mediaConstraint;
        if (mediaConstraint.audioEnabled) {
            this.audioEnabled = true;
        }
        if (mediaConstraint.videoEnabled) {
            this.videoEnabled = true;
        }

        this.pc = new RTCPeerConnection();
        this.pc.ontrack = (event) => {
            this.fireOnTrack(event);
        };

        this.pc.onicecandidate = (event) => {
            this.fireOnIceCandidate(event);
        };

        let constraints = mediaConstraint.toJSON();
        this.getUserMedia(constraints, (mediaStream) => {
            this.mediaStream = mediaStream;
            this.pc.onaddstream({stream: mediaStream});
            // 添加流
            this.pc.addStream(mediaStream);

            // 创建 Offer SDP
            this.pc.createOffer().then((offer) => {
                this.pc.setLocalDescription(new RTCSessionDescription(offer)).then(() => {
                    this.sendSignaling(MultipointCommAction.SignalingOffer, this.pc.localDescription);
                }).catch((error) => {
                    // 设置 SDP 错误
                });
            }).catch((error) => {
                // 创建 Offer 错误
            });
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

    sendSignaling(action, sdp) {

    }

    getUserMedia(constraints, handleSuccess, handleError) {
        navigator.mediaDevices.getUserMedia(constraints)
            .then(handleSuccess)
            .catch(handleError);
    }

}
