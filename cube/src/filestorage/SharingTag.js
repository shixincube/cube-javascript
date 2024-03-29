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

import { Contact } from "../contact/Contact";
import { Device } from "../contact/Device";
import { Entity } from "../core/Entity";
import { Kernel } from "../core/Kernel";
import { FileLabel } from "./FileLabel";
import { FileStorage } from "./FileStorage";

/**
 * 分享描述标签。
 * @extends Entity
 */
export class SharingTag extends Entity {

    /**
     * 一般状态。
     * @type {number}
     */
    static STATE_NORMAL = 0;

    /**
     * 已取消状态。
     * @type {number}
     */
    static STATE_CANCEL = 1;

    /**
     * 已删除状态。
     * @type {number}
     */
    static STATE_DELETE = 2;

    constructor(id, code) {
        super(id);

        /**
         * 分享码。
         * @type {string}
         */
        this.code = code;

        /**
         * 到期日期。
         * @type {number}
         */
         this.expiryDate = 0;

        /**
         * 分享创建人。
         * @type {Contact}
         */
        this.creator = null;

        /**
         * 创建分享的设备。
         * @type {Device}
         */
        this.device = null;

        /**
         * 文件标签。
         * @type {FileLabel}
         */
        this.fileLabel = null;

        /**
         * 有效时长。
         * @type {number}
         */
        this.duration = 0;

        /**
         * 访问码。
         * @type {string}
         */
        this.password = null;

        /**
         * 是否需要访问码。
         * @type {boolean}
         */
        this.hasPassword = false;

        /**
         * 是否启用预览功能。
         * @type {boolean}
         */
        this.preview = false;

        /**
         * 是否允许下载。
         * @type {boolean}
         */
        this.download = true;

        /**
         * 是否跟踪下载动作。
         * @type {boolean}
         */
        this.traceDownload = true;

        this.httpURL = null;
        this.httpsURL = null;

        /**
         * 预览文件列表。
         * @type {Array<FileLabel>}
         */
        this.previewList = null;

        /**
         * 状态描述。
         * @type {number}
         */
        this.state = 0;

        /**
         * 是否安全链接。
         * @type {boolean}
         */
        this.secure = window.location.protocol.toLowerCase().startsWith("https");
    }

    /**
     * 获取分享访问 URL 。
     * @returns {string} 返回分享访问 URL 。
     */
    getURL() {
        if (this.secure) {
            return this.httpsURL;
        }
        else {
            return this.httpURL;
        }
    }

    /**
     * 获取二维码 URL 。
     * @returns {string} 返回二维码图片的访问链接。
     */
    getQRCodeURL() {
        if (this.secure) {
            return [
                'https://',
                Kernel.CONFIG.address,
                ':',
                FileStorage.HTTPS_PORT,
                '/sharing/qrcode/',
                this.code
            ].join('');
        }
        else {
            return [
                'http://',
                Kernel.CONFIG.address,
                ':',
                FileStorage.HTTP_PORT,
                '/sharing/qrcode/',
                this.code
            ].join('');
        }
    }

    /**
     * 使用 JSON 格式数据创建 SharingTag 实例。
     * @param {JSON} json 
     * @returns {SharingTag} 返回分享标签实例。
     */
    static create(json) {
        let tag = new SharingTag(json.id, json.code);
        tag.timestamp = json.timestamp;
        tag.expiryDate = json.expiryDate;
        tag.creator = (undefined !== json.config.contact) ? Contact.create(json.config.contact) : null;
        tag.device = (undefined !== json.config.device) ? Device.create(json.config.device) : null;
        tag.fileLabel = FileLabel.create(json.config.fileLabel);
        tag.duration = json.config.duration;
        tag.password = (undefined !== json.config.password) ? json.config.password : null;
        tag.hasPassword = json.config.hasPassword;
        tag.preview = json.config.preview;
        tag.download = json.config.download;
        tag.traceDownload = json.config.traceDownload;
        tag.httpURL = (undefined !== json.httpURL) ? json.httpURL : null;
        tag.httpsURL = (undefined !== json.httpsURL) ? json.httpsURL : null;
        tag.state = json.state;

        let parent = json.parent["string"];

        if (null == tag.httpURL) {
            tag.httpURL = 'http://' + Kernel.CONFIG.address + ':' + FileStorage.HTTP_PORT + '/sharing/' + tag.code + '?p=' + parent;
        }
        if (null == tag.httpsURL) {
            tag.httpsURL = 'https://' + Kernel.CONFIG.address + ':' + FileStorage.HTTPS_PORT + '/sharing/' + tag.code + '?p=' + parent;
        }

        if (json.previewList) {
            tag.previewList = [];
            json.previewList.forEach((item) => {
                let fl = FileLabel.create(item);
                tag.previewList.push(fl);
            });
        }

        return tag;
    }
}
