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

import { JSONable } from "../util/JSONable";
import { Entity } from "../core/Entity";

/**
 * 抽象联系人。
 * @extends Entity
 */
export class AbstractContact extends Entity {

    /**
     * @param {number|string} id 指定联系人 ID 。
     * @param {string} [name] 指定联系人名称。
     * @param {string} [domain] 指定联系人所在的域。
     */
    constructor(id, name, domain) {
        super(id);

         /**
          * 联系人名称。
          * @private
          * @type {string}
          */
        this.name = (undefined === name) ? 'Cube-' + id : name;

        /**
         * 名字的拼音。
         * @private
         * @type {string}
         */
        this.namePY = '';
 
         /**
          * 联系人所在域。
          * @private
          * @type {string}
          */
        this.domain = (undefined === domain) ? AuthService.DOMAIN : domain;
    }

    /**
     * 获取联系人 ID 。
     * @returns {number} 返回联系人 ID 。
     */
    getId() {
        return this.id;
    }

    /**
     * 获取联系人所在域。
     * @returns {string} 返回联系人所在域。
     */
    getDomain() {
        return this.domain;
    }

    /**
     * 设置联系人名称。
     * @param {string} name 指定联系人名称。
     */
    setName(name) {
        this.name = name;
    }

    /**
     * 获取联系人名称。
     * @returns {string} 返回联系人名称。
     */
    getName() {
        return this.name;
    }

    /**
     * 获取名字的拼音格式。
     * @returns {string} 返回名字的拼音格式。
     */
    getNamePinYin() {
        let array = this.namePY.split(',');
        return array.join('');
    }

    /**
     * @inheritdoc
     */
    toJSON() {
        let json = super.toJSON();
        json.name = this.name;
        json.domain = this.domain;

        json.namePY = this.namePY;

        if (null != this.context) {
            json.context = (this.context instanceof JSONable) ? this.context.toJSON() : this.context;
        }

        return json;
    }

    /**
     * 将对象序列化为数据内容紧凑的 JSON 格式。
     * @returns {JSON} 返回紧凑结构的 JSON 数据，数据里只包含基础的联系人数据。
     */
    toCompactJSON() {
        let json = super.toCompactJSON();
        json.name = this.name;
        json.domain = this.domain;

        json.namePY = this.namePY;

        if (null != this.context) {
            json.context = (this.context instanceof JSONable) ? this.context.toJSON() : this.context;
        }

        return json;
    }
}
