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
import { FileAnchor } from "../filestorage/FileAnchor";
import { FileLabel } from "../filestorage/FileLabel";
import { FileThumbnail } from "../fileprocessor/FileThumbnail";
import { AuthService } from "../auth/AuthService";

/**
 * 文件附件。
 * @extends JSONable
 * 
 * FIXME 2021-11-17 XJW 需要重构，新结构使用 labels 和 anchors ，一个文件附件包含多个文件
 * 弃用 thumbs 和 thumbConfig
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
         * @type {JSON}
         * @protected
         */
        this.thumbConfig = null;

        /**
         * 缩略图列表。
         * @type {Array<FileThumbnail>}
         */
        this.thumbs = null;

        /**
         * 是否是安全连接。
         * @type {boolean}
         * @private
         */
        // this.secure = (window.location.protocol.toLowerCase().indexOf("https") >= 0);

        /**
         * @type {string}
         * @private
         */
        this.token = null;
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
     * 是否是图像文件。
     * @returns {boolean} 如果是常用图像文件返回 {@linkcode true} 。
     */
    isImageType() {
        let type = this.getFileType();
        if (type == 'png' || type == 'jpeg' || type == 'gif' || type == 'jpg' || type == 'bmp') {
            return true;
        }
        else {
            return false;
        }
    }

    /**
     * 是否可用。附件可用表示服务器已经管理了该附件。
     * @returns {boolean} 返回附件是否可用。
     */
    isEnabled() {
        return (null != this.label);
    }

    /**
     * 返回文件 URL 地址。
     * @returns {string} 返回 URL 地址。
     */
    getFileURL(secure) {
        if (null == this.label) {
            return null;
        }

        if (null == this.token || this.token.length == 0) {
            this.token = AuthService.TOKEN;
        }

        let url = null;
        if (undefined !== secure) {
            url = [ secure ? this.label.getFileSecureURL() : this.label.getFileURL(),
                '&token=', this.token,
                '&type=', this.label.fileType ];
        }
        else {
            url = [ this.label.getFileURL(), '&token=', this.token, '&type=', this.label.fileType ];
        }

        return url.join('');
    }

    /**
     * 启用缩略图。
     * @param {JSON} 缩略图参数。
     */
    enableThumb(config) {
        if (undefined === config) {
            this.thumbConfig = {
                "size": 480,
                "quality": 0.7
            };
        }
        else {
            this.thumbConfig = config;
        }
    }

    /**
     * 禁用缩略图。
     */
    disableThumb() {
        this.thumbConfig = null;
    }

    /**
     * 获取文件默认缩略图。
     * @returns {FileThumbnail} 返回文件默认缩略图。
     */
    getDefaultThumb() {
        if (null == this.thumbs) {
            return null;
        }

        if (null == this.token || this.token.length == 0) {
            this.token = AuthService.TOKEN;
        }

        let thumb = this.thumbs[0];
        thumb.token = this.token;
        return thumb;
    }

    /**
     * 获取文件默认缩略图的访问 URL 。
     * @returns {string} 返回文件默认缩略图的 URL 信息。
     */
    getDefaultThumbURL(secure) {
        if (null == this.thumbs) {
            return null;
        }

        if (null == this.token || this.token.length == 0) {
            this.token = AuthService.TOKEN;
        }

        let thumb = this.thumbs[0];
        thumb.token = this.token;
        return thumb.getFileURL(secure);
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

        if (null != this.thumbConfig) {
            json.thumbConfig = this.thumbConfig;
        }

        if (null != this.thumbs) {
            json.thumbs = [];
            for (let i = 0; i < this.thumbs.length; ++i) {
                json.thumbs.push(this.thumbs[i].toJSON());
            }
        }

        return json;
    }

    /**
     * 从 JSON 数据创建 {@link FileAttachment} 对象。
     * @private
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
        if (undefined !== json.thumbConfig) {
            attachment.thumbConfig = json.thumbConfig;
        }
        if (undefined !== json.thumbs) {
            attachment.thumbs = [];
            for (let i = 0; i < json.thumbs.length; ++i) {
                let thumb = FileThumbnail.create(json.thumbs[i]);
                attachment.thumbs.push(thumb);
            }
        }
        return attachment;
    }
}
