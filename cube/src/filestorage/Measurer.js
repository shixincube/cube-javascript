/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020-2022 Cube Team.
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
         * 时间戳列表。
         */
        this.timestampList = [];

        /**
         * 每次记录的数据大小。
         */
        this.sizeList = [];
    }

    reset() {
        this.timestampList = [];
        this.sizeList = [];
    }

    /**
     * Tick
     * @param {number} size 
     * @returns {Promise}
     */
    tick(size) {
        this.timestampList.push(Date.now());
        this.sizeList.push(size);

        let realtime = this._calc();
        if (realtime < 0) {
            return new Promise((resolve, reject) => {
                resolve();
            });
        }

        cell.Logger.d('Measurer', 'Rate: ' + (realtime / 1024) + ' / ' + (this.threshold / 1024));

        if (realtime <= this.threshold) {
            return new Promise((resolve, reject) => {
                resolve();
            });
        }
        else {
            let d = realtime - this.threshold;
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
     * 计算 bytes/s 数据。
     * @private
     * @returns {number} 如果数据量无法支撑计算返回 {@linkcode -1} 值。
     */
    _calc() {
        let start = this.timestampList[this.timestampList.length - 1];
        let size = this.sizeList[this.sizeList.length - 1];
        let delta = 0.0;
        let position = 0;

        for (let i = this.timestampList.length - 2; i >= 0; --i) {
            position = i;

            let time = this.timestampList[i];
            // 累计大小
            size += this.sizeList[i];

            delta = start - time;
            if (delta >= 500) {
                // 计算跨度达到 500 ms
                break;
            }
        }

        if (delta < 500) {
            return -1;
        }

        // 删除 position 之前的数据
        if (position > 1) {
            this.timestampList.splice(0, position);
            this.sizeList.splice(0, position);
        }

        // 数据放大一倍
        size += size;
        delta += delta
        return Math.round(size / (delta / 1000.0));
    }
}
