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

/**
 * 数据通道的数据包。
 */
export class Packet {

    /**
     * 构造函数。
     * @param {string} name 指定包名。
     * @param {object} data 指定包负载数据。
     * @param {number} [sn] 包的序号，可选参数。
     */
    constructor(name, data, sn) {
        /**
         * 包名。
         * @type {string}
         */
        this.name = name;

        /**
         * 包负载数据。
         * @type {object}
         */
        this.data = data;

        /**
         * 包序号。
         * @type {number}
         */
        if (undefined === sn) {
            this.sn = cell.Utils.generateSerialNumber();
        }
        else {
            this.sn = sn;
        }

        /**
         * 服务器返回的状态。
         * @private
         * @type {object}
         */
        this.state = null;

        /**
         * 数据应答类型。
         * @type {string}
         */
        this.responseType = 'json';

        /**
         * 数据应答超时时长。
         * @type {number}
         */
        this.responseTimeout = 0;
    }

    /**
     * 获取状态码。
     * @returns {number} 尝试获得状态码。
     */
    getStateCode() {
        if (null != this.state) {
            return this.state.code;
        }

        return -1;
    }

    /**
     * 返回负载数据。
     * @returns {JSON} 返回负载数据。
     */
    getPayload() {
        return this.data;
    }

    /**
     * 提取服务的状态码。
     * @returns {number}
     */
    extractServiceStateCode() {
        return this.data.code;
    }

    /**
     * 提取服务模块的数据。
     * @returns {JSON}
     */
    extractServiceData() {
        return this.data.data;
    }

    /**
     * 从 JSON 格式创建 {@link Packet} 实例。
     * @param {JSON} json 符合格式的 JSON 对象。
     * @returns {Packet} 返回 {@link Packet} 对象实例。
     */
    static create(json) {
        let packet = new Packet(json.name, json.data, json.sn);
        return packet;
    }
}
