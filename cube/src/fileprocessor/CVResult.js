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

import { DetectedObject } from "./DetectedObject";

/**
 * CV 处理结果。
 */
export class CVResult {

    constructor() {
        /**
         * 文件码。
         * @private
         * @type {string}
         */
        this.fileCode = null;
        
        /**
         * 检测到的对象。
         * @private
         * @type {Array<DetectedObject>}
         */
        this.detectedObjects = [];
    }

    /**
     * @returns {string}
     */
    getFileCode() {
        return this.fileCode;
    }

    /**
     * @returns {Array<DetectedObject>}
     */
    getDetectedObjects() {
        return this.detectedObjects;
    }

    /**
     * 创建符合 JSON 格式的 {@link CVResult} 对象实例。
     * @param {JSON} json 
     * @returns {CVResult} 返回 {@link CVResult} 对象实例。
     */
    static create(json) {
        let result = new CVResult();
        result.fileCode = json.fileCode;

        for (let i = 0; i < json.detectedObjects.length; ++i) {
            let obj = json.detectedObjects[i];
            let detecObj = DetectedObject.create(obj);
            result.detectedObjects.push(detecObj);
        }

        return result;
    }
}
