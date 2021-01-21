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

/**
 * 支持记录顺序的 Map 封装。
 */
export class OrderMap {

    /**
     * 构造函数。
     */
    constructor() {
        // 键数组
        this._keys = [];
        // 值数组
        this._values = [];
    }

    /**
     * 判断 Map 是否为空。
     * 
     * @returns {boolean} 如果没有数据返回 {@linkcode true} 。
     */
    isEmpty() {
        return this._keys.length == 0;
    }

    /**
     * 判断是否包含给定的键。
     * 
     * @param {*} key 指定键。
     * @returns {boolean} 如果包含返回 {@linkcode true} ，否则返回 {@linkcode false} 。
     */
    containsKey(key) {
        return this._keys.indexOf(key) >= 0;
    }

    /**
     * 判断是否包含给定的值。
     * 
     * @param {*} value 指定待判断的值。
     * @returns {boolean} 如果包含返回 {@linkcode true} ，否则返回 {@linkcode false} 。
     */
    containsValue(value) {
        return this._values.indexOf(value) >= 0;
    }

    /**
     * 向 Map 中添加数据。
     * 
     * @param {*} key 指定键。
     * @param {*} value 指定值。
     */
    put(key, value) {
        let index = this._keys.indexOf(key);
        if (index >= 0) {
            this._values[index] = value;
        }
        else {
            this._keys.push(key);
            this._values.push(value);
        }
    }

    /**
     * 根据给定的键获得对应的值。
     * 
     * @param {*} key 指定键。
     * @returns {*} 返回键对应的值。如果没有找到该键对应的值，返回 {@linkcode null} 。
     */
    get(key) {
        let index = this._keys.indexOf(key);
        if (index >= 0) {
            return this._values[index];
        }

        return null;
    }

    /**
     * 根据给定的键删除对应的值。
     * 
     * @param {*} 指定键。
     * @returns {*} 返回已删除的值，如果没有指定的键返回 {@linkcode null} 。
     */
    remove(key) {
        let index = this._keys.indexOf(key);
        if (index >= 0) {
            let value = this._values[index];
            this._keys.splice(index, 1);
            this._values.splice(index, 1);
            return value;
        }

        return null;
    }

    /**
     * 获得 Map 中的所有值。
     * 
     * @returns {Array} 返回存储了所有值的列表。
     */
    values() {
        let _values = new Array();
        Array.prototype.push.apply(_values, this._values);
        return _values;
    }

    /**
     * 获得 Map 中的所有的键。
     * 
     * @returns {Array} 返回存储了所有键的列表。
     */
    keys() {
        let _keys = new Array();
        Array.prototype.push.apply(_keys, this._keys);
        return _keys;
    }

    /**
     * 获得 Map 中的所有的键。
     * 
     * @returns {Array} 返回存储了所有键的列表。
     */
    keySet() {
        let _keys = new Array();
        Array.prototype.push.apply(_keys, this._keys);
        return _keys;
    }

    /**
     * 获得 Map 的长度，即数据大小。
     * 
     * @returns {number} 返回 Map 保存的数据量。
     */
    size() {
        return this._keys.length;
    }

    /**
     * 清空 Map 内的所有数据。
     */
    clear() {
        this._keys.length = 0;
        this._values.length = 0;
        this._keys = [];
        this._values = [];
    }
}
