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

/**
 * 观察者观察到的事件。
 */
export class ObservableEvent {

    /**
     * @param {string} name 事件名称。
     * @param {object} [data] 事件数据。
     */
    constructor(name, data) {
        /**
         * 事件名。
         * @type {string}
         */
        this.name = name;

        /**
         * 事件关联的数据。
         * @type {object}
         */
        this.data = (undefined !== data) ? data : null;

        /**
         * 次要事件数据。
         * @type {object}
         */
        this.secondaryData = null;

        /**
         * @private
         * @type {object}
         */
        this.subject = null;
    }

    /**
     * 获取事件名称。
     * @returns {string} 返回事件名称。
     */
    getName() {
        return this.name;
    }

    /**
     * 获取事件数据。
     * @returns {object} 返回事件数据。
     */
    getData() {
        return this.data;
    }

    /**
     * @inheritdoc
     */
    toString() {
        if (null == this.data) {
            return this.name;
        }
        else {
            return this.name + ' ' + this.data.toString();
        }
    }
}
