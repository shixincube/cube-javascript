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
import { FileLabel } from "../filestorage/FileLabel";

/**
 * 文件缩略图。
 */
export class FileThumbnail extends Entity {

    constructor() {
        super();

        /**
         * 域。
         * @type {string}
         */
        this.domain = null;

        /**
         * 缩略图文件标签。
         * @type {FileLabel}
         */
        this.fileLabel = null;

        /**
         * 缩略图宽度。
         * @type {number}
         */
        this.width = 0;

        /**
         * 缩略图高度。
         * @type {number}
         */
        this.height = 0;

        /**
         * 原文件文件码。
         * @type {string}
         */
        this.sourceFileCode = null;

        /**
         * 原文件宽度。
         * @type {number}
         */
        this.sourceWidth = 0;

        /**
         * 原文件高度。
         * @type {number}
         */
        this.sourceHeight = 0;

        /**
         * 缩略图使用的图像质量参数。
         * @type {number}
         */
        this.quality = 1.0;

        /**
         * @type {string}
         * @private
         */
        this.token = 'cube';
    }

    /**
     * 获取文件的 URL 地址。
     * @param {boolean} [secure] 是否返回安全的 URL 地址。
     * @returns {string} 返回文件的访问 URL 地址。
     */
    getFileURL(secure) {
        let url = null;
        if (undefined !== secure) {
            url = [ secure ? this.fileLabel.getFileSecureURL() : this.fileLabel.getFileURL(),
                '&token=', this.token,
                '&type=', this.fileLabel.fileType ];
        }
        else {
            url = [ this.fileLabel.getFileURL(), '&token=', this.token, '&type=', this.fileLabel.fileType ];
        }

        return url.join('');
    }

    /**
     * @inheritdoc
     */
    toJSON() {
        let json = super.toJSON();
        json.id = this.id;
        json.domain = this.domain;
        json.fileLabel = this.fileLabel.toJSON();
        json.width = this.width;
        json.height = this.height;
        json.sourceFileCode = this.sourceFileCode;
        json.sourceWidth = this.sourceWidth;
        json.sourceHeight = this.sourceHeight;
        json.quality = this.quality;
        return json;
    }

    /**
     * @inheritdoc
     */
    toCompactJSON() {
        return this.toJSON();
    }

    /**
     * 从 JSON 数据创建 {@link FileThumbnail} 对象。
     * @private
     * @param {JSON} json 符合格式的 JSON 数据。
     * @returns {FileThumbnail} 返回 {@link FileThumbnail} 对象实例。
     */
    static create(json) {
        let thumb = new FileThumbnail();
        thumb.id = json.id;
        thumb.domain = json.domain;
        thumb.fileLabel = FileLabel.create(json.fileLabel);
        thumb.width = json.width;
        thumb.height = json.height;
        thumb.sourceFileCode = json.sourceFileCode;
        thumb.sourceWidth = json.sourceWidth;
        thumb.sourceHeight = json.sourceHeight;
        thumb.quality = json.quality;
        return thumb;
    }
}
