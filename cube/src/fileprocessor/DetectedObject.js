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

import { Entity } from "../core/Entity";
import { BoundingBox } from "../util/BoundingBox";

/**
 * 检测到的物体描述。
 */
export class DetectedObject extends Entity {

    /**
     * @param {string} className 
     * @param {number} probability 
     * @param {BoundingBox} bbox 
     */
    constructor(className, probability, bbox) {
        super();

        /**
         * 类型名。
         * @type {string}
         */
        this.className = className;

        /**
         * 检测的匹配概率。取值范围：0 到 1.0 。
         * @type {number}
         */
        this.probability = probability;

        /**
         * 所在图像的空间信息。
         * @type {BoundingBox}
         */
        this.bbox = bbox;
    }

    getClassName() {
        return this.className;
    }

    getProbability() {
        return this.probability;
    }

    getBoundingBox() {
        return this.bbox;
    }

    /**
     * 创建 JSON 格式描述的 {@link DetectedObject} 对象实例。
     * @param {JSON} json 
     */
    static create(json) {
        let obj = new DetectedObject(json.class, json.probability,
            new BoundingBox(json.bound));
        return obj;
    }
}
