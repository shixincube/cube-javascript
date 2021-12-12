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
     * 缓存持续时长。
     */
    static CacheDuration = 10 * 60 * 1000;

    /**
     * 数据生命周期。
     */
    static Lifespan = 7 * 24 * 60 * 60 * 1000;

    /**
     * @param {number} [id] 实体的 ID 。
     * @param {number} [timestamp] 时间戳。
     */
    constructor(id, timestamp) {
        super();

        /**
         * 实体 ID 。
         * @protected
         * @type {number}
         */
        this.id = 0;
        if (id !== undefined) {
            if (typeof id === 'number') {
                this.id = id;
            }
            else if (typeof id === 'string') {
                this.id = parseInt(id);
            }
        }

        /**
         * 数据时间戳。
         * @type {number}
         */
        this.timestamp = (timestamp !== undefined && typeof timestamp === 'number') ? timestamp : Date.now();

        /**
         * 上一次更新数据的时间戳。
         * @type {number}
         */
        this.last = this.timestamp;

        /**
         * 有效期。
         * @type {number}
         */
        this.expiry = this.last + Entity.Lifespan;

        /**
         * 关联的上下文信息。
         * @type {JSON}
         */
        this.context = null;

        /**
         * 模块名称。
         * @protected
         * @type {string}
         */
        this.moduleName = null;

        /**
         * 实体创建时间戳。
         * @private
         * @type {number}
         */
        this.entityCreation = Date.now();

        /**
         * 实体内存寿命。
         * @private
         * @type {number}
         */
        this.entityLifeExpiry = this.entityCreation + Entity.CacheDuration;
    }

    /**
     * 获取实体 ID 。
     * @returns {number} 返回实体 ID 。
     */
    getId() {
        return this.id;
    }

    /**
     * 获取数据时间戳。
     * @returns {number} 返回数据时间戳。
     */
    getTimestamp() {
        return this.timestamp;
    }

    /**
     * 获取最近一次更新数据的时间戳。
     * @returns {number} 返回最近一次更新数据的时间戳。
     */
    getLast() {
        return this.last;
    }

    /**
     * 获取数据的有效期。
     * @returns {number} 返回数据的有效期。
     */
    getExpiry() {
        return this.expiry;
    }

    /**
     * 重置更新时间。
     * @param {number} time 更新时间。
     */
    resetUpdateTime(time) {
        this.last = time;
        this.expiry = this.last + Entity.Lifespan;
    }

    /**
     * 设置关联的上下文。
     * @param {JSON} context 指定上下文数据。
     */
    setContext(context) {
        this.context = context;
    }

    /**
     * 获取关联的上下文。
     * @returns {JSON} 返回关联的上下文数据。
     */
    getContext() {
        return this.context;
    }

    /**
     * 数据是否已经超期。
     * @returns {boolean} 如果超期返回 {@linkcode true} ，否则返回 {@linkcode false} 。
     */
    isOverdue() {
        return (this.expiry <= Date.now());
    }

    /**
     * 数据是否在有效期内。
     * @returns {boolean} 如果有效返回 {@linkcode true} ，否则返回 {@linkcode false} 。
     */
    isValid() {
        return (this.expiry > Date.now());
    }

    /**
     * @inheritdoc
     */
    toJSON() {
        let json = super.toJSON();
        json.id = this.id;
        json.timestamp = this.timestamp;
        json.last = this.last;
        json.expiry = this.expiry;
        return json;
    }

    /**
     * @inheritdoc
     */
    toCompactJSON() {
        let json = super.toCompactJSON();
        json.id = this.id;
        json.timestamp = this.timestamp;
        return json;
    }
}
