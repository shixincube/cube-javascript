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

import { TypeableMessage } from "./TypeableMessage";

/**
 * 文件消息。
 */
export class FileMessage extends TypeableMessage {

    constructor(param) {
        super(param);

        if (undefined === this.payload.type) {
            this.payload.type = "file";
        }
    }

    /**
     * 获取文件名。
     * @returns {string} 返回文件名。
     */
    getFileName() {
        return this.attachment.getFileName();
    }

    /**
     * 获取文件大小。
     * @returns {number} 返回文件大小。
     */
    getFileSize() {
        return this.attachment.getFileSize();
    }

    /**
     * 获取文件扩展名。
     * @returns {string} 返回文件扩展名。
     */
    getExtension() {
        if (!this.hasAttachment()) {
            return null;
        }

        let name = this.attachment.getFileName();
        let index = name.lastIndexOf('.');
        if (index > 0) {
            return name.substring(index + 1, name.length);
        }
        else {
            return null;
        }
    }
}
