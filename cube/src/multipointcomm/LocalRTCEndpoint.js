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

import { CommFieldEndpoint } from "./CommFieldEndpoint";
import { MediaConstraint } from "./MediaConstraint";
import { MultipointCommState } from "./MultipointCommState";

/**
 * 本地 RTC 接入点。
 */
export class LocalRTCEndpoint extends CommFieldEndpoint {

    /**
     * @param {string} name 节点名。
     * @param {Contact} contact 联系人。
     */
    constructor(name, contact) {
        super(name, contact);

        /**
         * @type {MediaConstraint}
         */
        this.mediaConstraint = null;

        /**
         * @type {RTCPeerConnection}
         */
        this.pc = null;

        /**
         * @type {HTMLElement}
         */
        this.videoElem = null;

        /**
         * @type {MediaStream}
         */
        this.inboundStream = null;
    }

    /**
     * 当前本地 RTC 连接是否正在工作。
     * @returns {boolean} 如果正在通话返回 {@linkcode true} 。
     */
    isWorking() {
        return (null != this.pc);
    }

    /**
     * 启动 RTC 终端。
     * @param {MediaConstraint} mediaConstraint 媒体约束。
     * @param {function} handleSuccess 启动成功回调函数。
     * @param {function} handleError 启动失败回调函数。
     */
    openOffer(mediaConstraint, handleSuccess, handleError) {
        if (null != this.pc) {
            handleError({ code: MultipointCommState.ConnRepeated, data: this });
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

        // Bind event
        this.pc.ontrack = (event) => {
            this.fireOnTrack(event);
        };
        this.pc.onicecandidate = (event) => {
            this.fireOnIceCandidate(event);
        };

        let constraints = mediaConstraint.toJSON();

        (async () => {
            let stream = await this.getUserMedia(constraints);
            if (null == stream) {
                handleError({ code: MultipointCommState.MediaPermissionDenied, data: this });
                this.pc = null;
                return;
            }

            // 添加 track
            for (const track of stream.getTracks()) {
                this.pc.addTrack(track);
            }

            // 创建 Offer SDP
            this.pc.createOffer().then((offer) => {
                this.pc.setLocalDescription(new RTCSessionDescription(offer)).then(() => {
                    handleSuccess(this.pc.localDescription);
                }).catch((error) => {
                    // 设置 SDP 错误
                    handleError({ code: MultipointCommState.LocalDescriptionFault, data: this, error: error });
                    this.pc = null;
                });
            }).catch((error) => {
                // 创建 Offer 错误
                handleError({ code: MultipointCommState.CreateOfferFailed, data: this, error: error });
                this.pc = null;
            });
        })();
    }

    openAnswer(mediaConstraint, handleSuccess, handleError) {

    }

    /**
     * 关闭 RTC 终端。
     */
    close() {
        if (null != this.inboundStream) {
            this.inboundStream.getTracks().forEach((track) => {
                track.stop();
            });
            this.inboundStream = null;
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
        if (event.streams && event.streams[0]) {
            this.inboundStream = event.streams[0];
            this.videoElem.srcObject = this.inboundStream;
        }
        else {
            if (null == this.inboundStream) {
                this.inboundStream = new MediaStream();
                this.videoElem.srcObject = this.inboundStream;
            }

            this.inboundStream.addTrack(event.track);
        }
    }

    fireOnIceCandidate(event) {

    }

    getUserMedia(constraints, handleSuccess, handleError) {
        return navigator.mediaDevices.getUserMedia(constraints);
    }

}
