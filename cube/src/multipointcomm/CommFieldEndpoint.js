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

import cell from "@lib/cell-lib";
import { Entity } from "../core/Entity";
import { Contact } from "../contact/Contact";
import { CommFieldEndpointState } from "./CommFieldEndpointState";
import { MultipointCommEvent } from "./MultipointCommEvent";
import { Device } from "../contact/Device";
import { StringUtil } from "../util/StringUtil";
import { CommField } from "./CommField";
import { RTCDevice } from "./RTCDevice";

/**
 * 通讯场域里的媒体节点。
 */
export class CommFieldEndpoint extends Entity {

    /**
     * @param {number} id 节点 ID 。
     * @param {Contact} contact 联系人。
     * @param {Device} device 联系人使用的设备。
     */
    constructor(id, contact, device) {
        super(id);

        /**
         * 节点名称。
         * @type {string}
         */
        this.name = ([contact.getId(), '_', contact.getDomain(), '_',
                    device.getName(), '_', device.getPlatform()]).join('');

        if (this.id == 0) {
            this.id = StringUtil.fastHash(this.name);
        }

        /**
         * 关联的联系人。
         * @type {Contact}
         */
        this.contact = contact;

        /**
         * 关联的联系人的设备。
         * @type {Device}
         */
        this.device = device;

        /**
         * 对应的 CommField
         * @type {CommField}
         */
        this.field = null;

        /**
         * 对应的 RTC 设备。
         * @private
         * @type {RTCDevice}
         */
        this.rtcDevice = null;

        /**
         * 当前状态。
         * @type {number}
         * @see CommFieldEndpointState
         */
        this.state = CommFieldEndpointState.Normal;

        /**
         * 实时麦克风音量。
         * @type {number}
         */
        this.volume = 0;

        /**
         * 客户端是否启用视频设备。
         * @type {boolean}
         */
        this.videoEnabled = false;
        /**
         * 客户端视频流是否激活。
         * @type {boolean}
         */
        this.videoStreamEnabled = false;

        /**
         * 客户端是否启用音频设备。
         * @type {boolean}
         */
        this.audioEnabled = false;
        /**
         * 客户端音频流是否激活。
         * @type {boolean}
         */
        this.audioStreamEnabled = false;

        /**
         * 视频上行带宽。
         * @type {number}
         */
        this.videoUpstreamBandwidth = 0;
        /**
         * 视频下行带宽。
         * @type {number}
         */
        this.videoDownstreamBandwidth = 0;

        /**
         * 音频上行带宽。
         * @type {number}
         */
        this.audioUpstreamBandwidth = 0;
        /**
         * 音频下行带宽。
         * @type {number}
         */
        this.audioDownstreamBandwidth = 0;

        /**
         * 会话描述。
         * @type {object}
         */
        this.sessionDescription = null;
    }

    /**
     * 获取终端名称。
     * @returns {string} 返回终端名称。
     */
    getName() {
        return this.name;
    }

    /**
     * 获取联系人实例。
     * @returns {Contact} 返回联系人实例。
     */
    getContact() {
        return this.contact;
    }

    /**
     * 获取设备实例。
     * @returns {Device} 返回设备实例。
     */
    getDevice() {
        return this.device;
    }

    /**
     * 视频流是否被停用。
     * @returns {boolean} 返回视频流是否被停用。
     */
    isVideoMuted() {
        if (null != this.rtcDevice) {
            this.videoStreamEnabled = this.rtcDevice.outboundVideoEnabled();
        }

        return !this.videoStreamEnabled;
    }

    /**
     * 停用视频流。
     */
    muteVideo() {
        this.videoStreamEnabled = false;

        if (null != this.rtcDevice) {
            this.rtcDevice.enableOutboundVideo(false);
        }

        if (null != this.field) {
            this.field.sendBroadcast(this, {
                event: MultipointCommEvent.VideoMuted,
                value: true,
                timestamp: window.performance.now()
            });
        }
    }

    /**
     * 恢复视频流。
     */
    unmuteVideo() {
        this.videoStreamEnabled = true;

        if (null != this.rtcDevice) {
            this.rtcDevice.enableOutboundVideo(true);
        }

        if (null != this.field) {
            this.field.sendBroadcast(this, {
                event: MultipointCommEvent.VideoMuted,
                value: false,
                timestamp: window.performance.now()
            });
        }
    }

    /**
     * 音频流是否被停用。
     * @returns {boolean} 返回音频流是否被停用。
     */
    isAudioMuted() {
        if (null != this.rtcDevice) {
            this.audioStreamEnabled = this.rtcDevice.outboundAudioEnabled();
        }

        return !this.audioStreamEnabled;
    }

    /**
     * 停用音频流。
     */
    muteAudio() {
        this.audioStreamEnabled = false;

        if (null != this.rtcDevice) {
            this.rtcDevice.enableOutboundAudio(false);
        }

        if (null != this.field) {
            this.field.sendBroadcast(this, {
                event: MultipointCommEvent.AudioMuted,
                value: true,
                timestamp: window.performance.now()
            });
        }
    }

    /**
     * 恢复音频流。
     */
    unmuteAudio() {
        this.audioStreamEnabled = true;

        if (null != this.rtcDevice) {
            this.rtcDevice.enableOutboundAudio(true);
        }

        if (null != this.field) {
            this.field.sendBroadcast(this, {
                event: MultipointCommEvent.AudioMuted,
                value: false,
                timestamp: window.performance.now()
            });
        }
    }

    /**
     * @private
     */
    toJSON() {
        let json = super.toJSON();
        json.id = this.id;
        json.domain = this.contact.getDomain();
        json.contact = this.contact.toCompactJSON();
        json.device = this.device.toJSON();
        json.state = this.state;
        json.name = this.name;
        json.video = {
            enabled: this.videoEnabled,
            streamEnabled: this.videoStreamEnabled
        };
        json.audio = {
            enabled: this.audioEnabled,
            streamEnabled: this.audioStreamEnabled
        };
        return json;
    }

    /**
     * @private
     */
    toCompactJSON() {
        let json = super.toCompactJSON();
        json.id = this.id;
        json.domain = this.contact.getDomain();
        json.contact = this.contact.toCompactJSON();
        json.device = this.device.toCompactJSON();
        json.state = this.state;
        json.name = this.name;
        return json;
    }

    /**
     * 创建 {@link CommFieldEndpoint} 实例。
     * @param {JSON} json 符合 {@linkcode CommFieldEndpoint} 格式的 JSON 对象。
     * @returns {CommFieldEndpoint} 返回 {@link CommFieldEndpoint} 实例。
     */
    static create(json) {
        let endpoint = new CommFieldEndpoint(json.id, Contact.create(json.contact, json.domain), Device.create(json.device));
        endpoint.state = json.state;
        endpoint.name = json.name;
        endpoint.videoEnabled = json.video.enabled;
        endpoint.videoStreamEnabled = json.video.streamEnabled;
        endpoint.audioEnabled = json.audio.enabled;
        endpoint.audioStreamEnabled = json.audio.streamEnabled;
        return endpoint;
    }
}
