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

import { Directory } from "./Directory";
import { FileLabel } from "./FileLabel";

/**
 * 搜索结果项。
 */
export class SearchItem {

    /**
     * @param {Directory} directory 
     * @param {FileLabel} file 
     */
    constructor(directory, file) {
        /**
         * @type {Directory}
         */
        this.directory = directory;

        /**
         * @type {FileLabel}
         */
        this.file = file;
    }

    /**
     * 是否是目录。
     * @returns {boolean} 返回是否是目录。
     */
    isDirectory() {
        return (null == this.file);
    }

    /**
     * 判断两个搜索结果是否相同。
     * @param {SearchItem} item 
     * @returns {boolean} 如果相同返回 {@linkcode true} 。
     */
    equals(item) {
        if (null != this.file && null != item.file) {
            return (item.directory.id == this.directory.id) && (item.file.fileCode == this.file.fileCode);
        }
        else {
            return (item.directory.id == this.directory.id);
        }
    }
}
