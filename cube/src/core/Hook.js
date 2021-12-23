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

import { PluginSystem } from "./PluginSystem";

/**
 * 事件钩子。
 */
export class Hook {

    /**
     * @param {string} name 触发的事件名。
     */
    constructor(name) {
        /**
         * 触发钩子的事件名。
         * @type {string}
         */
        this.name = name;

        /**
         * 钩子的系统宿主。
         * @private
         * @type {PluginSystem}
         */
        this.system = null;
    }

    /**
     * 返回钩子事件名。
     * @returns {string} 返回钩子事件名。
     */
    getName() {
        return this.name;
    }

    /**
     * 触发钩子，从系统里找到对应的插件进行数据处理，并返回处理后的数据。
     * @param {*} data 指定触发事件时的数据。
     * @returns {*} 返回处理后的数据。
     */
    apply(data) {
        return this.system.syncApply(this.name, data);
    }
}
