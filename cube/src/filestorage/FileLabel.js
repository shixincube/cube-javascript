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

import { Entity } from "../core/Entity";
import { FileType } from "./FileType";

/**
 * 文件标签。
 */
export class FileLabel extends Entity {

    /**
     * @param {number} id 
     * @param {string} domain 
     */
    constructor(id, domain) {
        super();

        /**
         * 文件 ID 。
         * @type {number}
         */
        this.id = id;

        /**
         * 文件域。
         * @type {string}
         */
        this.domain = domain;

        /**
         * 文件所有人 ID 。
         * @type {number}
         */
        this.ownerId = 0;

        /**
         * 文件名。
         * @type {string}
         */
        this.fileName = null;

        /**
         * 文件大小。
         * @type {number}
         */
        this.fileSize = 0;

        /**
         * 文件完成处理的时间。
         * @type {number}
         */
        this.completedTime = 0;

        /**
         * 文件码。
         * @type {string}
         */
        this.fileCode = null;

        /**
         * 文件状态。
         * @type {string}
         * @see {@link FileType}
         */
        this.fileType = 'unknown';

        /**
         * 文件 MD5 码。
         * @type {string}
         */
        this.md5Code = null;

        /**
         * 文件 SHA1 码。
         * @type {string}
         */
        this.sha1Code = null;

        /**
         * 文件的访问 URL 。
         * @type {string}
         */
        this.fileURL = null;

        /**
         * 文件的安全访问 URL 。
         * @type {string}
         */
        this.fileSecureURL = null;
    }

    getDomain() {
        return this.domain;
    }

    getOwnderId() {
        return this.ownerId;
    }

    getFileName() {
        return this.fileName;
    }

    getFileSize() {
        return this.fileSize;
    }

    getFileCode() {
        return this.fileCode;
    }

    getFileType() {
        return this.fileType;
    }

    getMD5Code() {
        return this.md5Code;
    }

    getSHA1Code() {
        return this.sha1Code;
    }

    getFileURL() {
        return this.fileURL;
    }

    getFileSecureURL() {
        return this.fileSecureURL;
    }

    toJSON() {
        let json = super.toJSON();
        return json;
    }

    /**
     * 从 JSON 数据创建 {@link FileLabel} 对象。
     * @param {JSON} json 符合格式的 JSON 数据。
     * @returns {FileLabel} 返回 {@link FileLabel} 对象实例。
     */
    static create(json) {
        let label = new FileLabel(json.id, json.domain);
        label.ownerId = json.ownerId;
        label.fileName = json.fileName;
        label.fileSize = json.fileSize;
        label.completedTime = json.completed;
        label.fileCode = json.fileCode;
        label.fileType = json.fileType;
        label.md5Code = json.md5;
        label.sha1Code = json.sha1;
        label.fileURL = json.fileURL;
        label.fileSecureURL = json.fileSecureURL;
        return label;
    }
}
