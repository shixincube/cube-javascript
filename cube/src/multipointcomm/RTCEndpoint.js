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

import { Device } from "../contact/Device";
import { ModuleError } from "../core/error/ModuleError";
import { CommFieldEndpoint } from "./CommFieldEndpoint";
import { MediaConstraint } from "./MediaConstraint";
import { MultipointComm } from "./MultipointComm";
import { MultipointCommState } from "./MultipointCommState";

/**
 * 本地 RTC 接入点。
 */
export class RTCEndpoint extends CommFieldEndpoint {

    /**
     * @param {Contact} contact 联系人。
     * @param {Device} device 对应的设备。
     */
    constructor(contact, device) {
        super(null, contact, device);

        /**
         * @type {MediaConstraint}
         */
        this.mediaConstraint = null;

        /**
         * @type {object}
         */
        this.configuration = null;

        /**
         * @type {RTCPeerConnection}
         */
        this.pc = null;

        /**
         * @type {HTMLElement}
         */
        this.localVideoElem = null;

        /**
         * @type {HTMLElement}
         */
        this.remoteVideoElem = null;

        /**
         * @type {MediaStream}
         */
        this.outboundStream = null;

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
     * @private
     */
    enableICE() {
        this.configuration = {
            iceServers: [{
                urls: "turn:52.83.195.35:3478",
                username: "cube",
                credential: "cube887"
            }]
        };
    }

    /**
     * @private
     */
    disableICE() {
        this.configuration = null;
    }

    /**
     * 启动 RTC 终端为主叫。
     * @param {MediaConstraint} mediaConstraint 媒体约束。
     * @param {function} handleSuccess 启动成功回调函数。
     * @param {function} handleFailure 启动失败回调函数。
     */
    openOffer(mediaConstraint, handleSuccess, handleFailure) {
        if (null != this.pc) {
            handleFailure(new ModuleError(MultipointComm.NAME, MultipointCommState.ConnRepeated, this));
            return;
        }

        this.mediaConstraint = mediaConstraint;
        if (mediaConstraint.audioEnabled) {
            this.audioEnabled = true;
            this.audioStreamEnabled = true;
        }
        if (mediaConstraint.videoEnabled) {
            this.videoEnabled = true;
            this.videoStreamEnabled = true;
        }

        this.pc = (null != this.configuration) ? new RTCPeerConnection(this.configuration) : new RTCPeerConnection();

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
                handleFailure(new ModuleError(MultipointComm.NAME, MultipointCommState.MediaPermissionDenied, this));
                this.close();
                return;
            }

            // 设置本地视频流
            this.localVideoElem.autoplay = true;
            this.localVideoElem.srcObject = stream;
            this.outboundStream = stream;

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
                    handleFailure(new ModuleError(MultipointComm.NAME, MultipointCommState.LocalDescriptionFault, this, error));
                    this.close();
                });
            }).catch((error) => {
                // 创建 Offer 错误
                handleFailure(new ModuleError(MultipointComm.NAME, MultipointCommState.CreateOfferFailed, this, error));
                this.close();
            });
        })();
    }

    /**
     * 启动 RTC 终端为被叫。
     * @param {string} offer 主叫的 SDP 。
     * @param {MediaConstraint} mediaConstraint 媒体约束。
     * @param {function} handleSuccess 启动成功回调函数。
     * @param {function} handleFailure 启动失败回调函数。
     */
    openAnswer(offer, mediaConstraint, handleSuccess, handleFailure) {
        if (null != this.pc) {
            handleFailure(new ModuleError(MultipointComm.NAME, MultipointCommState.ConnRepeated, this));
            return;
        }

        this.mediaConstraint = mediaConstraint;
        if (mediaConstraint.audioEnabled) {
            this.audioEnabled = true;
            this.audioStreamEnabled = true;
        }
        if (mediaConstraint.videoEnabled) {
            this.videoEnabled = true;
            this.videoStreamEnabled = true;
        }

        this.pc = (null != this.configuration) ? new RTCPeerConnection(this.configuration) : new RTCPeerConnection();

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
                handleFailure(new ModuleError(MultipointComm.NAME, MultipointCommState.MediaPermissionDenied, this));
                this.close();
                return;
            }

            // 设置本地视频流
            this.localVideoElem.autoplay = true;
            this.localVideoElem.srcObject = stream;
            this.outboundStream = stream;

            // 添加 track
            for (const track of stream.getTracks()) {
                this.pc.addTrack(track);
            }

            this.pc.setRemoteDescription(new RTCSessionDescription(offer)).then(() => {
                this.pc.createAnswer().then((answer) => {
                    this.pc.setLocalDescription(new RTCSessionDescription(answer)).then(() => {
                        handleSuccess(this.pc.localDescription);
                    }).catch((error) => {
                        // 设置 SDP 错误
                        handleFailure(new ModuleError(MultipointComm.NAME, MultipointCommState.LocalDescriptionFault, this, error));
                        this.close();
                    });
                }).catch((error) => {
                    // 创建 Answer 错误
                    handleFailure(new ModuleError(MultipointComm.NAME, MultipointCommState.CreateAnswerFailed, this, error));
                    this.close();
                });
            }).catch((error) => {
                // 设置 SDP 错误
                handleFailure(new ModuleError(MultipointComm.NAME, MultipointCommState.RemoteDescriptionFault, this, error));
                this.close();
            });
        })();
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

        if (null != this.outboundStream) {
            this.outboundStream.getTracks().forEach((track) => {
                track.stop();
            });
            this.outboundStream = null;
        }

        if (null != this.pc) {
            this.pc.close();
            this.pc = null;
        }

        this.disableICE();
    }

    fireOnTrack(event) {
        if (event.streams && event.streams[0]) {
            this.inboundStream = event.streams[0];
            this.remoteVideoElem.autoplay = true;
            this.remoteVideoElem.srcObject = this.inboundStream;
        }
        else {
            if (null == this.inboundStream) {
                this.inboundStream = new MediaStream();
                this.remoteVideoElem.autoplay = true;
                this.remoteVideoElem.srcObject = this.inboundStream;
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