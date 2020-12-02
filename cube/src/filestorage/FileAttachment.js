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

import { AuthService } from "../auth/AuthService";
import { JSONable } from "../util/JSONable";
import { FileAnchor } from "./FileAnchor";
import { FileLabel } from "./FileLabel";


/**
 * 文件附件。
 */
export class FileAttachment extends JSONable {

    /**
     * @param {File} file 文件实例。
     */
    constructor(file) {
        super();
        
        /**
         * 文件句柄。
         * @type {File}
         */
        this.file = file;

        /**
         * 文件处理时的记录信息。
         * @type {FileAnchor}
         */
        this.anchor = null;

        /**
         * 文件标签。
         * @type {FileLabel}
         */
        this.label = null;

        /**
         * 是否生成文件的缩略图。
         * @type {boolean}
         * @protected
         */
        this.thumbEnabled = false;

        /**
         * 是否是安全连接。
         * @type {boolean}
         */
        this.secure = (window.location.protocol.toLowerCase().indexOf("https") >= 0);
    }

    /**
     * 返回文件码。
     * @returns {string} 返回文件码。
     */
    getFileCode() {
        if (null != this.anchor) {
            return this.anchor.fileCode;
        }
        else if (null != this.label) {
            return this.label.fileCode;
        }
        else {
            return null;
        }
    }

    /**
     * 返回文件名。
     * @returns {string} 返回文件名。
     */
    getFileName() {
        if (null != this.label) {
            return this.label.fileName;
        }
        else if (null != this.anchor) {
            return this.anchor.fileName;
        }
        else {
            return null;
        }
    }

    /**
     * 返回文件大小。
     * @returns {number} 返回文件大小。
     */
    getFileSize() {
        if (null != this.label) {
            return this.label.fileSize;
        }
        else if (null != this.anchor) {
            return this.anchor.fileSize;
        }
        else {
            return 0;
        }
    }

    /**
     * 返回文件类型。
     * @returns {string} 返回文件类型。
     */
    getFileType() {
        if (null != this.label) {
            return this.label.fileType;
        }
        else if (null != this.anchor) {
            return this.anchor.getExtension().toLowerCase();
        }
        else {
            return 'unknown';
        }
    }

    /**
     * 返回文件 URL 地址。
     * @returns {string} 返回 URL 地址。
     */
    getFileURL(autoSecure) {
        if (null == this.label) {
            return null;
        }

        let url = null;
        if (autoSecure) {
            url = [ this.secure ? this.label.getFileSecureURL() : this.label.getFileURL(),
                '&type=', this.label.fileType];
        }
        else {
            url = [ this.label.getFileURL(), '&type=', this.label.fileType];
        }

        return url.join('');
    }

    /**
     * 启用缩略图。
     */
    enableThumb() {
        this.thumbEnabled = true;
    }

    /**
     * @inheritdoc
     */
    toJSON() {
        let json = super.toJSON();
        if (null != this.anchor) {
            json.anchor = this.anchor.toJSON();
        }

        if (null != this.label) {
            json.label = this.label.toJSON();
        }
        return json;
    }

    /**
     * 从 JSON 数据创建 {@link FileAttachment} 对象。
     * @param {JSON} json 
     */
    static create(json) {
        let attachment = new FileAttachment(null);
        if (undefined !== json.anchor) {
            attachment.anchor = FileAnchor.create(json.anchor);
        }
        if (undefined !== json.label) {
            attachment.label = FileLabel.create(json.label);
        }
        return attachment;
    }
}
