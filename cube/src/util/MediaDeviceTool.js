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

import { MediaDeviceDescription } from "./MediaDeviceDescription";

/**
 * 媒体设备工具。
 */
export class MediaDeviceTool {

    constructor() {
    }

    /**
     * 枚举所有设备。
     * @param {Array<MediaDeviceDescription>} callback 
     */
    static enumDevices(callback) {
        let list = [];
        navigator.mediaDevices.enumerateDevices().then((devices) => {
            devices.forEach((device) => {
                list.push(new MediaDeviceDescription(device.deviceId,
                    device.groupId, device.kind, device.label));
            });
            callback(list);
        }).catch((error) => {
            callback(list);
        });
    }

    /**
     * 获取用户媒体设备流。
     * @param {JSON} constraints 
     * @param {function} successCallback 
     * @param {function} failureCallback 
     */
    static getUserMedia(constraints, successCallback, failureCallback) {
        navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
            successCallback(stream);
        }).catch((error) => {
            failureCallback(error);
        });
    }

    /**
     * 加载指定设备的媒体流到指定的视频标签显示。
     * @param {HTMLElement} videoEl 指定视频的 DOM 元素。
     * @param {MediaDeviceDescription} deviceDesc 指定媒体设备描述。
     * @param {boolean} enableAudio 是否启用设备的音频通道。
     * @param {function} successCallback 加载数据成功回调。参数：({@linkcode videoEl}:{@linkcode HTMLElement}, {@linkcode deviceDesc}:{@linkcode MediaDeviceDescription}, {@linkcode stream}:{@linkcode MediaStream}) 。
     * @param {function} failureCallback 加载数据失败回调。参数：({@linkcode error}:{@linkcode Error}) 。
     */
    static loadVideoDeviceStream(videoEl, deviceDesc, enableAudio, successCallback, failureCallback) {
        let constraints = {
            audio: enableAudio,
            video: {
                deviceId: deviceDesc.deviceId,
                groupId: deviceDesc.groupId
            }
        };

        MediaDeviceTool.getUserMedia(constraints, (stream) => {
            MediaDeviceTool.bindVideoStream(videoEl, stream, () => {
                successCallback(videoEl, deviceDesc, stream);
            });
        }, (error) => {
            failureCallback(error);
        })
    }

    /**
     * 将视频标签和流进行绑定。
     * @param {HTMLElement} videoEl 
     * @param {MediaStream} stream 
     * @param {function} playCallback 
     */
    static bindVideoStream(videoEl, stream, playCallback) {
        if (playCallback) {
            videoEl.addEventListener('play', playCallback);
        }
        videoEl.setAttribute('autoplay', 'autoplay');
        videoEl.srcObject = stream;
    }

    /**
     * 停止视频流。
     * @param {MediaStream} stream 
     * @param {HTMLElement} videoEl 
     */
    static stopStream(stream, videoEl) {
        if (videoEl) {
            videoEl.pause();
        }

        let tracks = [];
        stream.getTracks().forEach((track) => {
            track.stop();
            tracks.push(track);
        });
        for (let i = 0; i < tracks.length; ++i) {
            stream.removeTrack(tracks[i]);
        }
    }
}
