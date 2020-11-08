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

        this.id = id;

        this.domain = domain;

        this.ownerId = 0;

        this.fileName = null;

        this.fileSize = 0;

        this.completedTime = 0;

        this.fileCode = null;

        this.md5Code = null;

        this.sha1Code = null;

        this.url = null;
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

    getMD5Code() {
        return this.md5Code;
    }

    getSHA1Code() {
        return this.sha1Code;
    }

    getURL() {
        return this.url;
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
        label.md5Code = json.md5;
        label.sha1Code = json.sha1;
        return label;
    }
}
