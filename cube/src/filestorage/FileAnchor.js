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

import { JSONable } from "../util/JSONable";

/**
 * 文件锚点。
 */
export class FileAnchor extends JSONable {

    /**
     * 构造函数。
     */
    constructor() {
        super();

        /**
         * 当前数据的游标位置。
         * @type {number}
         */
        this.position = 0;

        /**
         * 文件名。
         * @type {string}
         */
        this.fileName = null;

        /**
         * 文件大小。单位：字节。
         * @type {number}
         */
        this.fileSize = null;

        /**
         * 文件码。
         * @type {string}
         */
        this.fileCode = null;

        /**
         * 是否处理成功。
         * @type {boolean}
         */
        this.success = false;
    }

    getExtension() {
        let index = this.fileName.lastIndexOf('.');
        if (index <= 0) {
            return '';
        }

        let extension = this.fileName.substring(index + 1);
        return extension;
    }

    /**
     * @inheritdoc
     */
    toJSON() {
        let json = super.toJSON();
        json.fileName = this.fileName;
        json.fileSize = this.fileSize;
        json.fileCode = (null != this.fileCode) ? this.fileCode : '';
        json.position = this.position;
        return json;
    }

    toString() {
        return this.position.toString();
    }

    /**
     * 从 JSON 数据创建 {@link FileAnchor} 对象。
     * @param {JSON} json 
     * @returns {FileAnchor}
     */
    static create(json) {
        let anchor = new FileAnchor();
        anchor.fileName = json.fileName;
        anchor.fileSize = json.fileSize;
        anchor.fileCode = json.fileCode;
        anchor.position = json.position;
        return anchor;
    }
}
