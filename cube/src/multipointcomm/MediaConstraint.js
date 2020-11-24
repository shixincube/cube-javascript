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

import { VideoDimension } from "./VideoDimension";
import { JSONable } from "../util/JSONable";

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
        this.videoEnabled = videoEnabled;
        this.audioEnabled = audioEnabled;
        this.dimension = VideoDimension.VGA;
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
     * 获取媒体约束描述。
     * @returns {JSON}
     */
    getConstraints() {
        let json = {};
        json.audio = this.audioEnabled;
        if (this.videoEnabled) {
            json.video = this.dimension.constraints;
        }
        else {
            json.video = false;
        }
        return json;
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
     * 
     * @param {JSON} json 
     */
    static create(json) {
        let mc = new MediaConstraint(json.video, json.audio);
        mc.dimension = json.dimension;
        return mc;
    }
}
