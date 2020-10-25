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

/**
 * 设备描述。
 */
export class Device extends JSONable {

    /**
     * 构造函数。
     * @param {string} name 设备名称。
     * @param {string} platform 设备平台描述。
     */
    constructor(name, platform) {
        super();

        /**
         * 设备名。
         * @type {string}
         */
        this.name = name;

        /**
         * 设备平台描述。
         * @type {string}
         */
        this.platform = null;

        if (undefined === platform) {
            if (navigator) {
                this.platform = navigator.userAgent;
            }
        }
        else {
            this.platform = platform;
        }
    }

    /**
     * 获取设备名称。
     * @returns {string} 返回设备名称。
     */
    getName() {
        return this.name;
    }

    /**
     * 获取设备平台描述。
     * @returns {string} 返回设备平台描述。
     */
    getPlatform() {
        return this.platform;
    }

    /**
     * 设置设备平台描述。
     * @param {string} platform 设备平台描述。
     */
    setPlatform(platform) {
        this.platform = platform;
    }

    /**
     * @inheritdoc
     */
    toJSON() {
        let json = super.toJSON();
        json["name"] = this.name;
        json["platform"] = this.platform;
        return json;
    }

    /**
     * 从 JSON 数据格式创建设备对象实例。
     * @param {JSON} data 设备的 JSON 数据。
     * @returns {Device} 返回设备对象实例。
     */
    static create(data) {
        return new Device(data["name"], data["platform"]);
    }
}
