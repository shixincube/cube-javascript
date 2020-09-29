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
 * 主访问主机信息。
 */
export class PrimaryDescription extends JSONable {

    /**
     * 构造函数。
     * @param {string} address 
     * @param {JSON} primaryContent 
     */
    constructor(address, primaryContent) {
        super();

        /**
         * 主机主地址。
         * @type {string}
         */
        this.address = address;

        /**
         * 文件存储描述。
         * @type {JSON}
         */
        this.primaryContent = primaryContent;
    }

    /**
     * 获取主服务器地址。
     * @returns {string} 返回主服务器地址。
     */
    getAddress() {
        return this.address;
    }

    /**
     * 获取主描述内容。
     * @returns {JSON} 返回主描述内容。
     */
    getPrimaryContent() {
        return this.primaryContent;
    }

    /**
     * @inheritdoc
     */
    toJSON() {
        let json = super.toJSON();
        json.address = this.address;
        json.primaryContent = this.primaryContent;
        return json;
    }

    /**
     * 通过指定 JSON 数据创建 {@linkcode PrimaryDescription} 实例。
     * @param {JSON} json 符合 {@linkcode PrimaryDescription} 格式的 JSON 对象。
     * @returns {PrimaryDescription} 返回由 JSON 创建的 {@linkcode PrimaryDescription} 实例。
     */
    static create(json) {
        let pd = new PrimaryDescription(
            json.address,
            json.primaryContent
        );
        return pd;
    }
}
