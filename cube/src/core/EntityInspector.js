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

import { OrderMap } from "../util/OrderMap";
import { Entity } from "./Entity";

/**
 * 实体管理器，用于维护实体的生命周期。
 */
export class EntityInspector {

    constructor() {
        /**
         * 托管的 Map 清单。
         * @type {Array<OrderMap>}
         */
        this.depositedMapList = [];

        /**
         * 托管的 Array 清单。
         * @type {Array<Array>}
         */
        this.depositedArrayList = [];

        /**
         * 监听器。
         * @type {function}
         */
        this.listener = null;

        /**
         * 定时器。
         * @type {number}
         */
        this.timer = 0;
    }

    /**
     * 启动。
     */
    start() {
        this.timer = setInterval((e) => {
            this._onTick();
        }, 10 * 1000);
    }

    /**
     * 停止。
     */
    stop() {
        clearInterval(this.timer);
    }

    /**
     * 托管存储了 {@link Entity} 对象的映射。
     * @param {OrderMap} map 指定映射。
     */
    depositMap(map) {
        this.depositedMapList.push(map);
    }

    /**
     * 托管存储了 {@link Entity} 对象的数组。
     * @param {Array} array 指定数组。
     */
    depositArray(array) {
        this.depositedArrayList.push(array);
    }

    /**
     * 设置监听函数。
     * @param {function} listener 当实体过期时回调的函数。
     */
    setListener(listener) {
        this.listener = listener;
    }

    /**
     * 定时器回调。
     * @private
     */
    _onTick() {
        let now = Date.now();

        for (let i = 0; i < this.depositedMapList.length; ++i) {
            let map = this.depositedMapList[i];
            let keys = map.keys();
            for (let n = 0; n < keys.length; ++n) {
                let key = keys[n];
                let entity = map.get(key);
                if (!(entity instanceof Entity)) {
                    continue;
                }

                if (entity.expiry > now) {
                    map.remove(key);
                    if (null != this.listener) {
                        this.listener(entity);
                    }
                }
            }
        }

        for (let i = 0; i < this.depositedArrayList.length; ++i) {
            let array = this.depositedArrayList[i];
            for (let n = 0; n < array.length; ++n) {
                let entity = array[n];
                if (!(entity instanceof Entity)) {
                    continue;
                }

                if (entity.expiry > now) {
                    array.splice(n, 1);

                    if (null != this.listener) {
                        this.listener(entity);
                    }

                    --n;
                }
            }
        }
    }
}
