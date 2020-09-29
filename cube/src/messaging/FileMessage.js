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

import { Message } from "./Message";

/**
 * 文件消息。
 */
export class FileMessage extends Message {

    /**
     * 构造函数。
     * @param {File} [file] 指定文件。
     */
    constructor(file) {
        super();

        this.file = null;
        if (undefined !== file && (file instanceof File)) {
            this.file = file;
        }
    }

    /**
     * 获取消息的文件句柄。
     * @returns {File} 返回消息的文件句柄。
     */
    getFile() {
        return this.file;
    }

    getFileName() {
        return this.payload._file_.fileName;
    }

    getFileSize() {
        return this.payload._file_.fileSize;
    }

    getFileCode() {
        return this.payload._file_.fileCode;
    }

    getAccessURL() {
        return this.payload._file_.url;
    }

    getPosition() {
        return this.payload._file_.position;
    }
}
