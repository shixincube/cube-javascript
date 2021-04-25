/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020-2021 Shixin Cube Team.
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

import cell from "@lib/cell-lib";
import { ModuleError } from "../core/error/ModuleError";
import { DeviceSpanner } from "./DeviceSpanner";
import { MediaConstraint } from "./MediaConstraint";
import { MultipointComm } from "./MultipointComm";
import { MultipointCommState } from "./MultipointCommState";

/**
 * RTC 设备。
 */
export class RTCDevice {

    /**
     * @param {string} [mode] 模式：'recvonly' ， 'sendonly' ，'sendrecv' 。
     */
    constructor(mode) {
        /**
         * @type {number}
         */
        this.sn = cell.Utils.generateSerialNumber();

        /**
         * @type {string}
         */
        this.mode = (undefined === mode) ? 'sendrecv' : mode;

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
         * @type {Array}
         */
        this.candidates = [];

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

        /**
         * 是否已启动 PeerConnection 。
         * @type {boolean}
         */
        this.started = false;

        /**
         * 是否已就绪。
         * @type {boolean}
         */
        this.ready = false;

        /**
         * 媒体数据是否已经连接。
         * @type {boolean}
         */
        this.mediaReady = false;

        /**
         * @type {Array<DeviceSpanner>}
         */
        this.spanners = [];

        /**
         * 出入栈流的状态记录。
         * @type {object}
         */
        this.streamState = {
            "in" : {
                video: true,
                audio: true,
                volume: 1.0
            },
            "out" : {
                video: true,
                audio: true
            }
        };
    }

    /**
     * 返回出站视频是否已启用。
     * @returns {boolean} 返回出站视频是否已启用。
     */
    outboundVideoEnabled() {
        if (null == this.this.outboundStream) {
            return this.streamState.out.video;
        }

        this.streamState.out.video = this.streamEnabled(this.outboundStream, 'video');
        return this.streamState.out.video;
    }

    /**
     * 返回出站音频是否已启用。
     * @returns {boolean} 返回出站音频是否已启用。
     */
    outboundAudioEnabled() {
        if (null == this.outboundStream) {
            return this.streamState.out.audio;
        }

        this.streamState.out.audio = this.streamEnabled(this.outboundStream, 'audio');
        return this.streamState.out.audio;
    }

    /**
     * 返回入站视频是否已启用。
     * @returns {boolean} 返回入站视频是否已启用。
     */
    inboundVideoEnabled() {
        if (null == this.inboundStream) {
            return this.streamState.in.video;
        }

        this.streamState.in.video = this.streamEnabled(this.inboundStream, 'video');
        return this.streamState.in.video;
    }

    /**
     * 返回入站音频是否已启用。
     * @returns {boolean} 返回入站音频是否已启用。
     */
    inboundAudioEnabled() {
        if (null == this.inboundStream) {
            return this.streamState.in.audio;
        }

        this.streamState.in.audio = this.streamEnabled(this.inboundStream, 'audio');
        return this.streamState.in.audio;
    }

    /**
     * 流是否已启动状态。
     * @private
     * @param {MediaStream} stream 
     * @param {string} kind 
     * @returns {boolean}
     */
    streamEnabled(stream, kind) {
        if (null == stream) {
            return false;
        }

        let ret = false;
        stream.getTracks().some((track) => {
            if (track.kind == kind) {
                ret = track.enabled;
                return true;
            }

            return false;
        });
        return ret;
    }

    /**
     * 启用/停用出站视频。
     * @param {boolean} enabled 指定是否启用。
     * @returns {boolean} 返回设置是否有效。
     */
    enableOutboundVideo(enabled) {
        this.streamState.out.video = enabled;
        return this.enableStream(this.outboundStream, 'video', enabled);
    }

    /**
     * 启用/停用出站音频。
     * @param {boolean} enabled 指定是否启用。
     * @returns {boolean} 返回设置是否有效。
     */
    enableOutboundAudio(enabled) {
        this.streamState.out.audio = enabled;
        return this.enableStream(this.outboundStream, 'audio', enabled);
    }

    /**
     * 启用/停用入站视频。
     * @param {boolean} enabled 指定是否启用。
     * @returns {boolean} 返回设置是否有效。
     */
    enableInboundVideo(enabled) {
        this.streamState.in.video = enabled;
        return this.enableStream(this.inboundStream, 'video', enabled);
    }

    /**
     * 启用/停用入站音频。
     * @param {boolean} enabled 指定是否启用。
     * @returns {boolean} 返回设置是否有效。
     */
    enableInboundAudio(enabled) {
        this.streamState.in.audio = enabled;
        return this.enableStream(this.inboundStream, 'audio', enabled);
    }

    /**
     * 启用/停用指定流。
     * @private
     * @param {MediaStream} stream 指定媒体流。
     * @param {string} kind 指定 Track kind 。
     * @param {boolean} enabled 指定是否启用。
     * @returns {boolean} 返回设置是有效的设置。
     */
    enableStream(stream, kind, enabled) {
        if (null == stream) {
            return false;
        }

        let ret = false;
        stream.getTracks().some((track) => {
            if (track.kind == kind) {
                track.enabled = enabled;
                ret = true;
                return true;
            }

            return false;
        });
        return ret;
    }

    /**
     * @private
     * @param {MediaStream} stream 
     * @param {JSON} state 
     */
    syncStreamState(stream, state) {
        stream.getTracks().forEach((track) => {
            if (track.kind == 'audio') {
                track.enabled = state.audio;
            }
            else if (track.kind == 'video') {
                track.enabled = state.video;
            }
        });
    }

    /**
     * 设置扬声器音量。
     * @param {number} value 音量值，从 0.0 (静音) 到 1.0 (最大声)。
     */
    setVolume(value) {
        this.streamState.in.volume = value;
        if (null != this.remoteVideoElem) {
            this.remoteVideoElem.volume = value;
        }
    }

    /**
     * 返回音量。
     * @returns {number} 返回音量值，从 0.0 (静音) 到 1.0 (最大声)。
     */
    getVolume() {
        if (null != this.remoteVideoElem) {
            return this.remoteVideoElem.volume;
        }
        return this.streamState.in.volume;
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
    enableICE(iceServers) {
        if (null == iceServers) {
            return;
        }

        this.configuration = {
            iceServers: iceServers
        };
    }

    /**
     * @private
     */
    disableICE() {
        this.configuration = null;
    }

    /**
     * @private
     */
    onIceCandidate(candidate, device) {
        // Nothing
    }

    /**
     * @private
     */
    onMediaConnected(device) {
        // Nothing
    }

    /**
     * @private
     */
    onMediaDisconnected(device) {
        // Nothing
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

        this.pc = (null != this.configuration) ? new RTCPeerConnection(this.configuration) : new RTCPeerConnection();

        // binding event
        this.pc.ontrack = (event) => {
            this.fireOnTrack(event);
        };
        this.pc.onicecandidate = (event) => {
            this.fireOnIceCandidate(event);
        };
        this.pc.oniceconnectionstatechange = (event) => {
            this.fireOnIceConnectionStateChange(event);
        };

        (async () => {
            if (this.mode === 'recvonly') {
                let useAudio = this.mediaConstraint.audioEnabled;
                let useVideo = this.mediaConstraint.videoEnabled;

                if (useAudio) {
                    this.pc.addTransceiver('audio', {
                        direction: 'recvonly'
                    });
                }

                if (useVideo) {
                    this.pc.addTransceiver('video', {
                        direction: 'recvonly'
                    });
                }
            }
            else {
                // 如果出站流为空，则从媒体设备上获取
                if (null == this.outboundStream) {
                    // 设备约束
                    let constraints = this.mediaConstraint.getConstraints();

                    let stream = await this.getUserMedia(constraints);
                    if (!(stream instanceof MediaStream)) {
                        handleFailure(new ModuleError(MultipointComm.NAME, MultipointCommState.MediaPermissionDenied, this, stream));
                        this.close();
                        return;
                    }

                    if (null != this.localVideoElem) {
                        // 设置本地视频流
                        this.localVideoElem.autoplay = true;
                        this.localVideoElem.srcObject = stream;
                    }

                    // 设置出站流
                    this.outboundStream = stream;
                }
                else {
                    if (null != this.localVideoElem) {
                        // 设置本地视频流
                        this.localVideoElem.autoplay = true;
                        this.localVideoElem.srcObject = this.outboundStream;
                    }
                }

                // 添加 track
                this.outboundStream.getTracks().forEach((track) => {
                    this.pc.addTrack(track, this.outboundStream);
                });

                // 设置 sendonly 状态
                if (this.mode == 'sendonly') {
                    this.pc.getTransceivers().forEach((transceiver) => {
                        transceiver.direction = "sendonly";
                    });
                }
            }

            // this.pc.onnegotiationneeded = (event) => {};

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

            this.started = true;
        })();
    }

    /**
     * 主叫执行 Answer 应答。
     * @param {JSON} description 
     * @param {function} handleSuccess 
     * @param {function} handleFailure 
     */
    doAnswer(description, handleSuccess, handleFailure) {
        this.pc.setRemoteDescription(new RTCSessionDescription(description)).then(() => {
            handleSuccess();
            this.doReady();
        }).catch((error) => {
            // 设置 SDP 错误
            handleFailure(new ModuleError(MultipointComm.NAME, MultipointCommState.RemoteDescriptionFault, this, error));
            this.close();
        });
    }

    /**
     * 启动 RTC 终端为被叫。
     * @param {JSON} description 主叫的 Session Description 。
     * @param {MediaConstraint} mediaConstraint 媒体约束，设置为 {@linkcode null} 值时不使用用户媒体设备。
     * @param {function} handleSuccess 启动成功回调函数。
     * @param {function} handleFailure 启动失败回调函数。
     */
    openAnswer(description, mediaConstraint, handleSuccess, handleFailure) {
        if (null != this.pc) {
            handleFailure(new ModuleError(MultipointComm.NAME, MultipointCommState.ConnRepeated, this));
            return;
        }

        this.mediaConstraint = mediaConstraint;

        this.pc = (null != this.configuration) ? new RTCPeerConnection(this.configuration) : new RTCPeerConnection();

        // Bind event
        this.pc.ontrack = (event) => {
            this.fireOnTrack(event);
        };
        this.pc.onicecandidate = (event) => {
            this.fireOnIceCandidate(event);
        };
        this.pc.oniceconnectionstatechange = (event) => {
            this.fireOnIceConnectionStateChange(event);
        };

        this.pc.setRemoteDescription(new RTCSessionDescription(description)).then(() => {
            (async () => {
                let constraints = mediaConstraint.getConstraints();

                // 判断是否已经设置了出站流
                if (null == this.outboundStream) {
                    let stream = await this.getUserMedia(constraints);
                    if (!(stream instanceof MediaStream)) {
                        handleFailure(new ModuleError(MultipointComm.NAME, MultipointCommState.MediaPermissionDenied, this));
                        this.close();
                        return;
                    }

                    if (null != this.localVideoElem) {
                        // 设置本地视频流
                        this.localVideoElem.autoplay = true;
                        this.localVideoElem.srcObject = stream;
                    }

                    // 设置出站流
                    this.outboundStream = stream;
                }
                else {
                    if (null != this.localVideoElem) {
                        // 设置本地视频流
                        this.localVideoElem.autoplay = true;
                        this.localVideoElem.srcObject = this.outboundStream;
                    }
                }

                // 添加 track
                for (const track of this.outboundStream.getTracks()) {
                    this.pc.addTrack(track, this.outboundStream);
                }

                this.pc.createAnswer().then((answer) => {
                    this.pc.setLocalDescription(new RTCSessionDescription(answer)).then(() => {
                        handleSuccess(this.pc.localDescription);
                        this.doReady();
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

                this.started = true;
            })();
        }).catch((error) => {
            // 设置 SDP 错误
            handleFailure(new ModuleError(MultipointComm.NAME, MultipointCommState.RemoteDescriptionFault, this, error));
            this.close();
        });
    }

    /**
     * @private
     */
    doCandidate(candidate) {
        if (null == this.pc) {
            return;
        }

        if (!this.ready) {
            this.candidates.push(candidate);
            return;
        }

        if (this.candidates.length > 0) {
            for (let i = 0; i < this.candidates.length; ++i) {
                let candidate = this.candidates[i];
                let iceCandidate = new RTCIceCandidate(candidate);
                this.pc.addIceCandidate(iceCandidate).catch((error) => {
                    cell.Logger.e('RTCDevice', 'Ice Candidate error: ' + error);
                });

                cell.Logger.d('RTCDevice', '#doCandidate [array] add candidate: ' + candidate.sdpMid);
            }
            this.candidates.splice(0, this.candidates.length);
        }

        let iceCandidate = new RTCIceCandidate(candidate);
        this.pc.addIceCandidate(iceCandidate).catch((error) => {
            cell.Logger.e('RTCDevice', 'Ice Candidate error: ' + error);
        });

        cell.Logger.d('RTCDevice', '#doCandidate add candidate: ' + candidate.sdpMid);
    }

    /**
     * @private
     */
    doReady() {
        this.ready = true;

        for (let i = 0; i < this.candidates.length; ++i) {
            let candidate = this.candidates[i];
            let iceCandidate = new RTCIceCandidate(candidate);
            this.pc.addIceCandidate(iceCandidate).catch((error) => {
                cell.Logger.e('RTCDevice', 'Ice Candidate error: ' + error);
            });

            cell.Logger.d('RTCDevice', '#doReady() add candidate: ' + candidate.sdpMid);
        }

        this.candidates.splice(0, this.candidates.length);

        // 同步流状态
        setTimeout(() => {
            if (null != this.outboundStream) {
                this.syncStreamState(this.outboundStream, this.streamState.out);
            }
        }, 33);
    }

    /**
     * 关闭 RTC 终端。
     * @private
     */
    close() {
        this.started = false;

        this.candidates = [];

        if (null != this.inboundStream) {
            let tracks = [];
            this.inboundStream.getTracks().forEach((track) => {
                track.stop();
                tracks.push(track);
            });
            for (let i = 0; i < tracks.length; ++i) {
                this.inboundStream.removeTrack(tracks[i]);
            }
            this.inboundStream = null;
        }

        if (null != this.outboundStream) {
            let tracks = [];
            this.outboundStream.getTracks().forEach((track) => {
                track.stop();
                tracks.push(track);
            });
            for (let i = 0; i < tracks.length; ++i) {
                this.outboundStream.removeTrack(tracks[i]);
            }
            this.outboundStream = null;
        }

        if (null != this.pc) {
            this.pc.close();
            this.pc = null;
        }

        this.disableICE();

        if (null != this.localVideoElem) {
            this.localVideoElem.pause();
        }
        if (null != this.remoteVideoElem) {
            this.remoteVideoElem.pause();
        }

        this.ready = false;
        this.mediaReady = false;
    }

    /**
     * @private
     */
    fireOnTrack(event) {
        if (event.streams && event.streams[0]) {
            this.inboundStream = event.streams[0];

            if (null != this.remoteVideoElem) {
                this.remoteVideoElem.autoplay = true;
                this.remoteVideoElem.srcObject = this.inboundStream;
            }
        }
        else {
            if (null == this.inboundStream) {
                this.inboundStream = new MediaStream();

                if (null != this.remoteVideoElem) {
                    this.remoteVideoElem.autoplay = true;
                    this.remoteVideoElem.srcObject = this.inboundStream;
                }
            }

            this.inboundStream.addTrack(event.track);
        }

        // 同步流状态
        setTimeout(() => {
            if (null != this.inboundStream) {
                this.syncStreamState(this.inboundStream, this.streamState.in);
                this.remoteVideoElem.volume = this.streamState.in.volume;
            }
        }, 33);
    }

    /**
     * @private
     */
    fireOnIceCandidate(event) {
        if (event.candidate) {
            this.onIceCandidate(event.candidate, this);
        }
    }

    /**
     * @private
     */
    fireOnIceConnectionStateChange(event) {
        let state = this.pc.iceConnectionState;
        cell.Logger.d('RTCDevice', 'ICE state : ' + state);

        if (state === "failed" ||
            state === "disconnected" ||
            state === "closed") {
            this.mediaReady = false;
            this.onMediaDisconnected(this);
        }
        else if (state === "connected") {
            this.mediaReady = true;
            this.onMediaConnected(this);
        }
    }

    /**
     * @private
     */
    getUserMedia(constraints) {
        return new Promise((resolve, reject) => {
            navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
                resolve(stream);
            }).catch((error) => {
                resolve(error);
            });
        });
    }
}
