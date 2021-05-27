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

/**
 * 信息实体对象。
 * 所有实体对象的基类。
 */
export class Entity extends JSONable {

    /**
     * @param {number} lifespan 实体的生存周期，单位：毫秒。
     */
    constructor(lifespan) {
        super();

        /**
         * 实体 ID 。
         * @protected
         * @type {number}
         */
        this.id = 0;

        /**
         * 实体创建时的时间戳。
         * @type {number}
         */
        this.timestamp = Date.now();

        /**
         * 实体的有效期。
         * @type {number}
         */
        this.expiry = this.timestamp + (lifespan !== undefined && typeof lifespan === 'number') ? lifespan : 10 * 60 * 1000;

        /**
         * 关联的上下文信息。
         * @private
         * @type {object}
         */
        this.context = null;

        /**
         * 模块名称。
         * @protected
         * @type {string}
         */
        this.moduleName = null;
    }

    /**
     * 获取实体 ID 。
     * @returns {number} 返回实体 ID 。
     */
    getId() {
        return this.id;
    }

    /**
     * 获取实体创建时的时间戳。
     * @returns {number} 返回实体创建时的时间戳。
     */
    getTimestamp() {
        return this.timestamp;
    }

    /**
     * 获取实体的有效期。
     * @returns {number} 返回实体的有效期。
     */
    getExpiry() {
        return this.expiry;
    }

    /**
     * 设置关联的上下文。
     * @param {object} context 指定上下文对象。
     */
    setContext(context) {
        this.context = context;
    }

    /**
     * 获取关联的上下文。
     * @returns {object} 返回关联的上下文。
     */
    getContext() {
        return this.context;
    }

    /**
     * 实体生命周期是否已经超期。
     * @returns {boolean} 如果超期返回 {@linkcode true} ，否则返回 {@linkcode false} 。
     */
    overdue() {
        return (this.expiry > Date.now());
    }

    /**
     * @inheritdoc
     */
    toJSON() {
        return super.toJSON();
    }

    /**
     * @inheritdoc
     */
    toCompactJSON() {
        return super.toCompactJSON();
    }
}
