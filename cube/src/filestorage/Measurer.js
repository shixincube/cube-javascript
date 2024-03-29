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
 * 搜索结果项。
 */
export class Measurer {

    constructor() {
        /**
         * 阀值，单位：字节/秒。
         * @type {number}
         */
        this.threshold = 500 * 1024;

        /**
         * 开始时间戳。
         * @type {number}
         */
        this.beginTimestamp = 0;

        /**
         * 结束时间戳。
         * @type {number}
         */
        this.endTimestamp = 0;

        /**
         * 累计大小。
         * @type {number}
         */
        this.accumulatedSize = 0;

        /**
         * 累计大小时的时间戳。
         * @type {number}
         */
        this.tickTimestamp = 0;
    }

    /**
     * 重置所有计算诸元。
     * @param {number} timestamp 重置的开始时间戳。
     */
    reset(timestamp) {
        this.beginTimestamp = timestamp;
        this.endTimestamp = 0;
        this.accumulatedSize = 0;
        this.tickTimestamp = 0;
    }

    /**
     * 传输的平均速率。
     * @returns {number} 返回平均传输速率。
     */
    averageRate() {
        if (0 == this.endTimestamp) {
            return -1;
        }

        let delta = this.endTimestamp - this.beginTimestamp;
        let size = this.accumulatedSize;
        return Math.round(size / (delta / 1000.0));
    }

    /**
     * Tick
     * @private
     * @param {number} size 
     * @returns {Promise}
     */
    tick(size) {
        // 累加大小
        this.accumulatedSize += size;
        // 计时
        this.tickTimestamp = Date.now();

        let rate = this._calc();
        if (rate < 0) {
            return new Promise((resolve, reject) => {
                resolve();
            });
        }

        cell.Logger.d('Measurer', 'Rate: ' + (rate / 1024) + ' / ' + (this.threshold / 1024));

        if (rate <= this.threshold) {
            return new Promise((resolve, reject) => {
                resolve();
            });
        }
        else {
            let d = rate - this.threshold;
            return new Promise((resolve, reject) => {
                let time = d / this.threshold;
                time = time * 1000; // 转为毫秒
                setTimeout(() => {
                    resolve();
                }, time);
            });
        }
    }

    /**
     * 结束计算。
     * @param {number} size 最后一个数据包大小。
     */
    finish(size) {
        // 累加大小
        this.accumulatedSize += size;
        // 计时
        this.tickTimestamp = Date.now();

        this.endTimestamp = this.tickTimestamp;
    }

    /**
     * 计算 bytes/s 数据。
     * @private
     * @returns {number} 如果数据量无法支撑计算返回 {@linkcode -1} 值。
     */
    _calc() {
        let delta = this.tickTimestamp - this.beginTimestamp;
        if (delta < 1000) {
            return -1;
        }

        let size = this.accumulatedSize;
        return Math.round(size / (delta / 1000.0));
    }
}
