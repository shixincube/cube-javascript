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

import { Entity } from "../core/Entity";

/**
 * 访问痕迹。
 * @extends Entity
 */
export class VisitTrace extends Entity {

    /**
     * 浏览器。
     * @type {string}
     */
    static PlatformBrowser = 'Browser';

    /**
     * 小程序。
     * @type {string}
     */
    static PlatformAppletWeChat = 'AppletWeChat';

    constructor() {
        super();

        /**
         * 平台名称。
         * @type {string}
         */
        this.platform = null;

        /**
         * 访问时间。
         * @type {number}
         */
        this.time = 0;

        /**
         * 访问地址。
         * @type {string}
         */
        this.address = null;

        /**
         * 域名。
         * @type {string}
         */
        this.domain = null;

        /**
         * URL 。
         * @type {string}
         */
        this.url = null;

        /**
         * 页面标题。
         * @type {string}
         */
        this.title = null;

        /**
         * 屏幕分辨率。
         * @type {object}
         */
        this.screenSize = {
            width: 0,
            height: 0
        };

        /**
         * 屏幕色深。
         * @type {number}
         */
        this.screenColorDepth = 0;

        /**
         * 屏幕方向。
         * @type {string}
         */
        this.screenOrientation = null;

        /**
         * 浏览器代理字符串。
         * @type {string}
         */
        this.userAgent = null;

        /**
         * 平台代理描述。
         * @type {object}
         */
        this.agent = null;

        /**
         * 客户端语言。
         * @type {string}
         */
        this.language = null;

        /**
         * 事件。
         * @type {string}
         */
        this.event = null;

        /**
         * 事件标签。
         * @type {string}
         */
        this.eventTag = null;

        /**
         * 事件参数。
         * @type {object}
         */
        this.eventParam = null;

        /**
         * 触发记录的联系人 ID 。
         * @type {number}
         */
        this.contactId = 0;

        /**
         * 触发记录的联系人域。
         * @type {string}
         */
        this.contactDomain = null;

        /**
         * 分享人 ID 。
         * @type {number}
         */
        this.sharerId = 0;

        /**
         * 上一级分享人 ID 。
         * @type {number}
         */
        this.parentId = 0;
    }

    /**
     * 使用 JSON 格式数据创建 VisitTrace 实例。
     * @param {JSON} json 
     * @returns {VisitTrace} 
     */
    static create(json) {
        let trace = new VisitTrace();
        trace.platform = json.platform;
        trace.time = json.time;
        trace.address = json.address;
        trace.url = json.url;

        trace.domain = (undefined !== json.domain) ? json.domain : null;
        trace.title = (undefined !== json.title) ? json.title : null;

        trace.screenSize.width = json.screen.width;
        trace.screenSize.height = json.screen.height;
        trace.screenColorDepth = json.screen.colorDepth;
        trace.screenOrientation = json.screen.orientation;

        trace.language = json.language;

        trace.userAgent = (undefined !== json.userAgent) ? json.userAgent : null;

        trace.agent = (undefined !== json.agent) ? json.agent : null;

        trace.event = (undefined !== json.event) ? json.event : null;
        trace.eventTag = (undefined !== json.eventTag) ? json.eventTag : null;
        trace.eventParam = (undefined !== json.eventParam) ? json.eventParam : null;

        trace.contactId = json.contactId;
        trace.contactDomain = (undefined !== json.contactDomain) ? json.contactDomain : null;

        trace.sharerId = json.sharerId;
        trace.parentId = json.parentId;

        return trace;
    }
}
