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
 * 以上问题于 2022-10-07 修改
 */
export class FileAttachment extends JSONable {

    /**
     * @param {File|FileLabel} file 文件实例。
     */
    constructor(file) {
        super();

        /**
         * 文件句柄。
         * @type {File}
         */
        this.file = (file instanceof File) ? file : null;

        /**
         * 本地处理文件时的文件标签。
         * @type {FileLabel}
         * @private
         */
        this.localLabel = (file instanceof FileLabel) ? file : null;

        /**
         * 本地文件处理时的记录信息锚。
         * @type {FileAnchor}
         * @private
         */
        this.localAnchor = null;

        /**
         * 文件标签列表。
         * @type {Array<FileLabel>}
         */
        this.labels = (null != this.localLabel) ? [ this.localLabel ] : [];

        /**
         * 文件锚列表。
         * @type {Array<FileAnchor>}
         */
        this.anchors = [];

        /**
         * 是否压缩了原文件。
         * @type {boolean}
         */
        this.compressed = false;

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
        if (null != this.localAnchor) {
            return this.localAnchor.fileCode;
        }
        else if (null != this.localLabel) {
            return this.localLabel.fileCode;
        }
        else if (null != this.labels) {
            return this.labels[0].fileCode;
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
        if (null != this.localLabel) {
            return this.localLabel.fileName;
        }
        else if (null != this.localAnchor) {
            return this.localAnchor.fileName;
        }
        else if (null != this.labels) {
            return this.labels[0].fileName;
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
        if (null != this.localLabel) {
            return this.localLabel.fileSize;
        }
        else if (null != this.localAnchor) {
            return this.localAnchor.fileSize;
        }
        else if (null != this.labels) {
            return this.labels[0].fileSize;
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
        if (null != this.localLabel) {
            return this.localLabel.fileType;
        }
        else if (null != this.localAnchor) {
            return this.localAnchor.getExtension().toLowerCase();
        }
        else if (null != this.labels) {
            return this.labels[0].fileType;
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
        return (null != this.localLabel) || (null != this.labels);
    }

    /**
     * 返回文件 URL 地址。
     * @returns {string} 返回 URL 地址。
     */
    getFileURL(secure) {
        let label = (null != this.localLabel) ? this.localLabel :
            (this.labels.length > 0) ? this.labels[0] : null;

        if (null == label) {
            return null;
        }

        if (null == this.token || this.token.length == 0) {
            this.token = AuthService.TOKEN;
        }

        let url = null;
        if (undefined !== secure) {
            url = [ secure ? label.getFileSecureURL() : label.getFileURL(),
                '&token=', token,
                '&type=', label.fileType ];
        }
        else {
            url = [ label.getFileURL(), '&token=', this.token, '&type=', label.fileType ];
        }

        return url.join('');
    }

    /**
     * 启用缩略图。
     * @param {JSON} 缩略图参数。
     * @deprecated
     */
    enableThumb(config) {
        /*if (undefined === config) {
            this.thumbConfig = {
                "size": 480,
                "quality": 0.7
            };
        }
        else {
            this.thumbConfig = config;
        }*/
    }

    /**
     * 禁用缩略图。
     * @deprecated
     */
    disableThumb() {
        //this.thumbConfig = null;
    }

    /**
     * 获取文件默认缩略图。
     * @returns {FileThumbnail} 返回文件默认缩略图。
     * @deprecated
     */
    getDefaultThumb() {
        /*if (null == this.thumbs) {
            return null;
        }

        if (null == this.token || this.token.length == 0) {
            this.token = AuthService.TOKEN;
        }

        let thumb = this.thumbs[0];
        thumb.token = this.token;
        return thumb;*/
        return null;
    }

    /**
     * 获取文件默认缩略图的访问 URL 。
     * @returns {string} 返回文件默认缩略图的 URL 信息。
     * @deprecated
     */
    getDefaultThumbURL(secure) {
        /*if (null == this.thumbs) {
            return null;
        }

        if (null == this.token || this.token.length == 0) {
            this.token = AuthService.TOKEN;
        }

        let thumb = this.thumbs[0];
        thumb.token = this.token;
        return thumb.getFileURL(secure);*/
        return null;
    }

    /**
     * @inheritdoc
     */
    toJSON() {
        let json = super.toJSON();

        if (null != this.localAnchor && this.anchors.length == 0) {
            this.anchors.push(this.localAnchor);
        }

        json.anchors = [];
        this.anchors.forEach((value) => {
            json.anchors.push(value.toJSON());
        });

        if (null != this.localLabel && this.labels.length == 0) {
            this.labels.push(this.localLabel);
        }

        json.labels = [];
        this.labels.forEach((value) => {
            json.labels.push(value.toJSON());
        });

        json.compressed = this.compressed;

        return json;
    }

    /**
     * 从 JSON 数据创建 {@link FileAttachment} 对象。
     * @private
     * @param {JSON} json 
     */
    static create(json) {
        let attachment = new FileAttachment(null);

        if (undefined !== json.anchors) {
            json.anchors.forEach((value) => {
                attachment.anchors.push(FileAnchor.create(value));
            });
        }

        if (undefined !== json.labels) {
            json.labels.forEach((value) => {
                attachment.labels.push(FileLabel.create(value));
            });
        }

        if (undefined !== json.compressed) {
            attachment.compressed = json.compressed;
        }

        return attachment;
    }
}
