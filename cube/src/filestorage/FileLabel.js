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

import { Entity } from "../core/Entity";

/**
 * 文件标签。
 * @extends Entity
 */
export class FileLabel extends Entity {

    /**
     * @param {number} id 文件 ID 。
     * @param {string} domain 文件的域。
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
         * 文件最后一次修改时间。
         * @type {number}
         */
        this.lastModified = 0;

        /**
         * 文件完成处理的时间。
         * @type {number}
         */
        this.completedTime = 0;

        /**
         * 文件到期的时间。
         * @type {number}
         */
        this.expiryTime = 0;

        /**
         * 文件码。
         * @type {string}
         */
        this.fileCode = null;

        /**
         * 文件类型。
         * @type {string}
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

    /**
     * 获取文件的 ID 。
     * @returns {number} 返回文件 ID 。
     */
    getId() {
        return this.id;
    }

    /**
     * 获取文件所属的域。
     * @returns {string} 返回文件域。
     */
    getDomain() {
        return this.domain;
    }

    /**
     * 获取文件所有人的 ID 。
     * @returns {number} 返回文件所有人 ID 。
     */
    getOwnderId() {
        return this.ownerId;
    }

    /**
     * 获取文件名。
     * @returns {string} 返回文件名。
     */
    getFileName() {
        return this.fileName;
    }

    /**
     * 获取文件大小。
     * @returns {number} 返回文件大小，单位：字节。
     */
    getFileSize() {
        return this.fileSize;
    }

    /**
     * 获取文件最后一次修改时间。
     * @returns {number} 返回文件最后一次修改时间。
     */
    getLastModified() {
        return this.lastModified;
    }

    /**
     * 获取文件的访问文件码。
     * @returns {string} 返回文件码。
     */
    getFileCode() {
        return this.fileCode;
    }

    /**
     * 获取文件的上传完成时间。
     * @returns {number} 返回文件完成时间。
     */
    getCompletedTime() {
        return this.completedTime;
    }

    /**
     * 获取文件的过期时间。
     * @returns {number} 返回文件过期时间。
     */
    getExpiryTime() {
        return this.expiryTime;
    }

    /**
     * 获取文件类型。
     * @returns {string} 返回文件类型描述。
     */
    getFileType() {
        return this.fileType;
    }

    /**
     * 获取文件数据的 MD5 码。
     * @returns {string} 返回文件 MD5 码。
     */
    getMD5Code() {
        return this.md5Code;
    }

    /**
     * 获取文件数据的 SHA1 码。
     * @returns {string} 返回文件 SHA1 码。
     */
    getSHA1Code() {
        return this.sha1Code;
    }

    /**
     * @private
     * @returns {string} 返回文件的访问 URL 地址。
     */
    getFileURL() {
        return this.fileURL;
    }

    /**
     * @private
     * @returns {string} 返回文件的访问 SSL URL 地址。
     */
    getFileSecureURL() {
        return this.fileSecureURL;
    }

    /**
     * 序列化为 JSON 结构。
     * @returns {JSON} 返回 JSON 结构的 {@link FileLabel} 。
     */
    toJSON() {
        let json = super.toJSON();
        json.id = this.id;
        json.domain = this.domain;
        json.fileCode = this.fileCode;
        json.ownerId = this.ownerId;
        json.fileName = this.fileName;
        json.fileSize = this.fileSize;
        json.lastModified = this.lastModified;
        json.completed = this.completedTime;
        json.expiry = this.expiryTime;
        json.fileType = this.fileType;
        if (null != this.md5Code) json.md5 = this.md5Code;
        if (null != this.sha1Code) json.sha1 = this.sha1Code;
        if (null != this.fileURL) json.fileURL = this.fileURL;
        if (null != this.fileSecureURL) json.fileSecureURL = this.fileSecureURL;
        return json;
    }

    /**
     * @inheritdoc
     */
    toCompactJSON() {
        return this.toJSON();
    }

    /**
     * 从 JSON 数据创建 {@link FileLabel} 对象。
     * @private
     * @param {JSON} json 符合格式的 JSON 数据。
     * @returns {FileLabel} 返回 {@link FileLabel} 对象实例。
     */
    static create(json) {
        let label = new FileLabel(json.id, json.domain);
        label.fileCode = json.fileCode;
        label.ownerId = json.ownerId;
        label.fileName = json.fileName;
        label.fileSize = json.fileSize;
        label.lastModified = json.lastModified;
        label.completedTime = json.completed;
        label.expiryTime = json.expiry;
        label.fileType = json.fileType;
        label.md5Code = (undefined !== json.md5) ? json.md5 : null;
        label.sha1Code = (undefined !== json.sha1) ? json.sha1 : null;
        label.fileURL = (undefined !== json.fileURL) ? json.fileURL : null;
        label.fileSecureURL = (undefined !== json.fileSecureURL) ? json.fileSecureURL : null;

        if ('unknown' == label.fileType) {
            let index = label.fileName.lastIndexOf('.');
            if (index > 0) {
                let extension = label.fileName.substring(index + 1);
                label.fileType = extension;
            }
        }

        return label;
    }
}
