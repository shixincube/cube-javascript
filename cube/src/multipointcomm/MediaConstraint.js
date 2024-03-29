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

import { JSONable } from "../util/JSONable";
import { VideoDimension } from "./VideoDimension";
import { MediaDeviceDescription } from "../util/MediaDeviceDescription";

/**
 * 媒体约束。
 */
export class MediaConstraint extends JSONable {

    /**
     * @param {boolean} videoEnabled 是否使用 Video 设备。
     * @param {boolean} audioEnabled 是否使用 Audio 设备。
     */
    constructor(videoEnabled, audioEnabled) {
        super();

        /**
         * 是否使用视频流通道。
         * @type {boolean}
         */
        this.videoEnabled = videoEnabled;

        /**
         * 视频设备。
         * @type {MediaDeviceDescription}
         */
        this.videoDevice = null;

        /**
         * 是否使用音频流通道。
         * @type {boolean}
         */
        this.audioEnabled = audioEnabled;

        /**
         * 音频设备。
         * @type {MediaDeviceDescription}
         */
        this.audioDevice = null;

        /**
         * 视频画幅尺寸。
         * @private
         * @type {JSON}
         * @see VideoDimension
         */
        this.dimension = VideoDimension.VGA_IDEAL;

        /**
         * 强制限制模式。
         * @private
         * @type {boolean}
         */
        this.limitPattern = false;
    }

    /**
     * 设置视频尺寸。
     * @param {VideoDimension} dimension 指定视频尺寸规格。
     */
    setVideoDimension(dimension) {
        this.dimension = dimension;
    }

    /**
     * 获取视频尺寸。
     * @returns {VideoDimension} 返回视频尺寸。
     */
    getVideoDimension() {
        return this.dimension;
    }

    /**
     * 设置音频设备。
     * @param {MediaDeviceDescription} mediaDeviceDescription 设备的描述数据。
     * @returns {boolean} 设置成功返回 {@linkcode true} 。
     */
    setAudioDevice(mediaDeviceDescription) {
        if (!mediaDeviceDescription.isAudioInput()) {
            return false;
        }

        this.audioDevice = mediaDeviceDescription;
        return true;
    }

    /**
     * 设置视频设备。
     * @param {MediaDeviceDescription} mediaDeviceDescription 设备的描述数据。
     * @returns {boolean} 设置成功返回 {@linkcode true} 。
     */
    setVideoDevice(mediaDeviceDescription) {
        if (!mediaDeviceDescription.isVideoInput()) {
            return false;
        }

        this.videoDevice = mediaDeviceDescription;
        return true;
    }

    /**
     * 获取媒体约束描述。
     * @returns {JSON} 返回约束的 JSON 格式。
     */
    getConstraints() {
        let data = {};

        if (this.audioEnabled) {
            if (null == this.audioDevice) {
                data.audio = this.audioEnabled;
            }
            else {
                data.audio = {
                    deviceId: this.audioDevice.deviceId,
                    groupId: this.audioDevice.groupId
                };
            }
        }
        else {
            data.audio = false;
        }

        if (this.videoEnabled) {
            // 获取视频画幅约束
            data.video = this.dimension.constraints;

            if (this.limitPattern) {
                /*
                mandatory : {
                    maxWidth : 320,
                    maxFrameRate : 15,
                    minFrameRate : 15
                }
                exact: 15*/

                data.video = VideoDimension.VGA_IDEAL.constraints;
                data.video.frameRate = 15;
            }

            if (null != this.videoDevice) {
                data.video.deviceId = this.videoDevice.deviceId;
                data.video.groupId = this.videoDevice.groupId;
            }
        }
        else {
            data.video = false;
        }

        return data;
    }

    /**
     * @inheritdoc
     */
    toJSON() {
        let json = super.toJSON();
        json.audio = this.audioEnabled;
        json.video = this.videoEnabled;
        json.dimension = this.dimension;
        return json;
    }

    /**
     * 创建 {@link MediaConstraint} 实例。
     * @param {JSON} json 指定符合 {@linkcode MediaConstraint} 格式的 JSON 对象。
     * @returns {MediaConstraint} 返回 {@link MediaConstraint} 实例。
     */
    static create(json) {
        let mc = new MediaConstraint(json.video, json.audio);
        mc.dimension = json.dimension;
        return mc;
    }
}
