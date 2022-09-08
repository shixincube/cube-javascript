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

import { JSONable } from "../util/JSONable";

/**
 * 文件锚点。
 * @extends JSONable
 */
export class FileAnchor extends JSONable {

    /**
     * 构造函数。
     * @param {number} [sn] 序号。
     */
    constructor(sn) {
        super();

        /**
         * 当前在客户端处理的序号。
         * @type {number}
         */
        this.sn = (undefined !== sn) ? sn : Date.now();

        /**
         * 时间戳。
         * @type {number}
         */
        this.timestamp = Date.now();

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
        this.fileSize = 0;

        /**
         * 文件最后修改时间。
         * @type {number}
         */
        this.lastModified = 0;

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

        /**
         * 结束时间。
         * @type {number}
         */
        this.endTime = 0;

        /**
         * 文件上传完成回调。
         * @type {function}
         * @private
         */
        this.finishCallback = null;
    }

    /**
     * 获取文件名。
     * @returns {string} 返回文件名。
     */
    getFileName() {
        return this.fileName;
    }

    /**
     * 获取文件扩展名。
     * @returns {string} 返回文件扩展名。
     */
    getExtension() {
        let index = this.fileName.lastIndexOf('.');
        if (index <= 0) {
            return '';
        }

        let extension = this.fileName.substring(index + 1);
        return extension;
    }

    /**
     * 标记成功。
     * @private
     */
    _markSuccess() {
        this.success = true;
        this.endTime = Date.now();
    }

    /**
     * 标记失败。
     * @private
     */
    _markFailure() {
        this.success = false;
        this.endTime = Date.now();
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

    /**
     * @inheritdoc
     */
    toCompactJSON() {
        return this.toJSON();
    }

    /**
     * @inheritdoc
     */
    toString() {
        return this.position.toString();
    }

    /**
     * 从 JSON 数据创建 {@link FileAnchor} 对象。
     * @private
     * @param {JSON} json 符合 {@link FileAnchor} 格式的 JSON 对象。
     * @param {number} [sn] 序号。
     * @returns {FileAnchor} 返回 {@link FileAnchor} 实例。
     */
    static create(json, sn) {
        let anchor = new FileAnchor(sn);
        anchor.fileName = json.fileName;
        anchor.fileSize = json.fileSize;
        anchor.fileCode = json.fileCode;
        anchor.position = json.position;
        return anchor;
    }
}
