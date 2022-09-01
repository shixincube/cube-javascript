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
 * 简单的 Map 封装。
 */
export class FastMap {

    constructor() {
        // 定义长度
        this.length = 0;
        // 创建一个对象
        this.obj = new Object();
    }

    /**
     * 判断 Map 是否为空。
     * 
     * @returns {boolean} 如果没有数据返回 {@linkcode true} 。
     */
    isEmpty() {
        return this.length == 0;
    }

    /**
     * 判断是否包含给定的键。
     * 
     * @param {string} key 指定键。
     * @returns {boolean} 如果包含返回 {@linkcode true} ，否则返回 {@linkcode false} 。
     */
    containsKey(key) {
        return (key in this.obj);
    }

    /**
     * 判断是否包含给定的值。
     * 
     * @param {*} value 指定待判断的值。
     * @returns {boolean} 如果包含返回 {@linkcode true} ，否则返回 {@linkcode false} 。
     */
    containsValue(value) {
        for (var key in this.obj) {
            if (this.obj[key] == value) {
                return true;
            }
        }
        return false;
    }

    /**
     * 向 Map 中添加数据。
     * 
     * @param {strinig} key 指定键。
     * @param {*} value 指定值。
     */
    put(key, value) {
        if (!this.containsKey(key)) {
            this.length++;
        }
        this.obj[key] = value;
    }

    /**
     * 根据给定的键获得对应的值。
     * 
     * @param {string} key 指定键。
     * @returns {*} 返回键对应的值。如果没有找到该键对应的值，返回 {@linkcode null} 。
     */
    get(key) {
        return this.containsKey(key) ? this.obj[key] : null;
    }

    /**
     * 根据给定的键删除对应的值。
     * 
     * @param {string} key 指定键。
     * @returns {*} 返回被删除的值。
     */
    remove(key) {
        if (this.containsKey(key)) {
            var ret = this.obj[key];
            delete this.obj[key];
            this.length--;
            return ret;
        }

        return null;
    }

    /**
     * 获得 Map 中的所有值。
     * 
     * @returns {Array} 返回存储了所有值的列表。
     */
    values() {
        var _values = new Array();
        for (var key in this.obj) {
            _values.push(this.obj[key]);
        }
        return _values;
    }

    /**
     * 获得 Map 中的所有的键。
     * 
     * @returns {Array} 返回存储了所有键的列表。
     */
    keys() {
        var _keys = new Array();
        for (var key in this.obj) {
            _keys.push(key);
        }
        return _keys;
    }

    /**
     * 获得 Map 中的所有的键。
     * 
     * @returns {Array} 返回存储了所有键的列表。
     */
    keySet() {
        var _keys = new Array();
        for (var key in this.obj) {
            _keys.push(key);
        }
        return _keys;
    }

    /**
     * 获得 Map 的长度，即数据大小。
     * 
     * @returns {number} 返回 Map 保存的数据量。
     */
    size() {
        return this.length;
    }

    /**
     * 清空 Map 内的所有数据。
     */
    clear() {
        this.length = 0;
        this.obj = new Object();
    }
}
