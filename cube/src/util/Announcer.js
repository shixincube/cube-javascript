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

import { OrderMap } from "./OrderMap";

/**
 * 一般同步通知机制实现。
 * 用于管理记录事件发生的次数和数据，当事件发生时生成通知，通知会计数并记录数据。
 * 当达到约定的计数之后触发回调通知监听。
 */
export class Announcer {

    /**
     * @param {number} total 约定的计数计数器次数。
     * @param {number} timeout 超时时间。
     */
    constructor(total, timeout) {
        this.count = 0;
        this.total = total;
        this.timeout = timeout;

        this.timer = setTimeout((e)=>{
            clearTimeout(this.timer);
            this._fireTimeout();
        }, timeout);

        /**
         * @type {OrderMap}
         */
        this.announceDataMap = new OrderMap();

        /**
         * @type {Array<function>}
         */
        this.audienceList = [];
    }

    /**
     * 返回需要进行通知的总次数。
     * @returns {number} 返回需要进行通知的总次数。
     */
    getTotal() {
        return this.total;
    }

    /**
     * 事件结束后进行宣告。
     * @param {string} name 事件名。
     * @param {JSON} data 事件数据。
     */
    announce(name, data) {
        if (undefined === name) {
            return;
        }

        if (undefined === data) {
            data = name;
        }

        if (this.announceDataMap.containsKey(name)) {
            this.announceDataMap.put(name, data);
            return;
        }

        this.announceDataMap.put(name, data);

        ++this.count;

        if (this.count == this.total) {
            // 关闭定时器
            clearTimeout(this.timer);

            let promise = new Promise((resolve, reject) => {
                resolve();
            });
            promise.then(() => {
                for (let i = 0; i < this.audienceList.length; ++i) {
                    let audience = this.audienceList[i];
                    audience(this.count, this.announceDataMap);
                }
            });
        }
    }

    /**
     * 添加监听宣告结束的听众函数。
     * @param {function} audience 听众回调函数，参数：({@linkcode count}:number, {@linkcode dataMap}:{@link OrderMap}<JSON>) ，（通知次数，通知的数据映射）。
     */
    addAudience(audience) {
        let index = this.audienceList.indexOf(audience);
        if (index >= 0) {
            return;
        }

        this.audienceList.push(audience);
    }

    /**
     * 定时器执行函数。
     * @private
     */
    _fireTimeout() {
        for (let i = 0; i < this.audienceList.length; ++i) {
            let audience = this.audienceList[i];
            audience(this.count, this.announceDataMap);
        }
    }
}
