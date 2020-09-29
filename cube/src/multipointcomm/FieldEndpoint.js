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

import { JSONable } from "../util/JSONable";
import { Endpoint } from "../util/Endpoint";
import { Aggregation } from "../util/Aggregation";

/**
 * 通信域里的媒体节点。
 */
export class FieldEndpoint extends Aggregation(Endpoint, JSONable) {

    /**
     * 构造函数。
     */
    constructor() {
        super();

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
    }

    /**
     * @inheritdoc
     */
    toJSON() {
        let json = super.toJSON();
        return json;
    }
}
