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

/**
 * 媒体设备描述。
 */
export class MediaDeviceDescription {

    /**
     * @param {string} deviceId 设备 ID 描述。
     * @param {string} groupId 设备所在群组 ID 。
     * @param {string} kind 设备类型。
     * @param {string} label 设备的标签。
     */
    constructor(deviceId, groupId, kind, label) {
        this.deviceId = deviceId;
        this.groupId = groupId;
        this.kind = kind;
        this.label = label;
    }

    /**
     * 返回设备 ID 描述。
     * @returns {string} 返回设备 ID 描述。
     */
    getDeviceId() {
        return this.deviceId;
    }

    /**
     * 返回设备所在群组 ID 描述。
     * @returns {string} 返回设备所在群组 ID 描述。
     */
    getGroupId() {
        return this.groupId;
    }

    /**
     * 返回设备标签名。
     * @returns {string} 返回设备标签名。
     */
    getLabel() {
        return this.label;
    }

    /**
     * 返回是否是视频输入设备。
     * @returns {boolean} 返回是否是视频设备。
     */
    isVideoInput() {
        return this.kind.toLowerCase() == 'videoinput';
    }

    /**
     * 返回是否是音频输入设备。
     * @returns {boolean} 返回是否是音频设备。
     */
    isAudioInput() {
        return this.kind.toLowerCase() == 'audioinput';
    }
}
