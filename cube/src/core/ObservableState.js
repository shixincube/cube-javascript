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

/**
 * 观察者观察到的事件。
 */
export class ObservableState {

    /**
     * 构造函数。
     * @param {string} name 状态名称。
     * @param {object} [data] 状态数据。
     */
    constructor(name, data) {
        this.name = name;
        this.data = (undefined !== data) ? data : null;
        this.subject = null;
    }

    /**
     * 获取状态名称。
     * @returns {string} 返回状态名称。
     */
    getName() {
        return this.name;
    }

    /**
     * 获取状态数据。
     * @returns {object} 返回状态数据。
     */
    getData() {
        return this.data;
    }

    toString() {
        if (null == this.data) {
            return this.name;
        }
        else {
            return this.name + ' ' + this.data.toString();
        }
    }
}
