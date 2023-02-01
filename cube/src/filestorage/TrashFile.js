/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020-2023 Cube Team.
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

import { FileLabel } from "./FileLabel";

/**
 * 废弃的文件。
 * @extends FileLabel
 */
export class TrashFile extends FileLabel {

    /**
     * @param {JSON} json 
     */
    constructor(json) {
        super(json.id, json.domain);

        let file = json.file;
        this.fileCode = file.fileCode;
        this.ownerId = file.ownerId;
        this.fileName = file.fileName;
        this.fileSize = file.fileSize;
        this.lastModified = file.lastModified;
        this.completedTime = file.completedTime;
        this.expiryTime = file.expiry;
        this.fileType = file.fileType;
        this.md5Code = (undefined !== file.md5) ? file.md5 : null;
        this.sha1Code = (undefined !== file.sha1) ? file.sha1 : null;
        this.fileURL = (undefined !== file.fileURL) ? file.fileURL : null;
        this.fileSecureURL = (undefined !== file.fileSecureURL) ? file.fileSecureURL : null;

        /**
         * 废弃文件的时间戳。
         * @type {number}
         */
        this.trashTimestamp = json.timestamp;
    }

    /**
     * 是否是文件。
     * @returns {boolean} 返回 {@linkcode true} 。
     */
    isFile() {
        return true;
    }

    /**
     * 是否是目录。
     * @returns {boolean} 返回 {@linkcode false} 。
     */
    isDirectory() {
        return false;
    }

    /**
     * 获取废弃的时间戳。
     * @returns {number} 返回废弃的时间戳。
     */
    getTrashTimestamp() {
        return this.trashTimestamp;
    }
}
