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

import { Entity } from "../core/Entity";

/**
 * 访问痕迹。
 * @extends Entity
 */
export class VisitTrace extends Entity {

    constructor() {
        super();

        /**
         * 访问时间。
         * @type {number}
         */
        this.time = 0;

        /**
         * 访问 IP 。
         * @type {string}
         */
        this.ip = null;

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
         * Referrer
         * @type {string}
         */
        this.referrer = null;

        /**
         * 浏览器信息。
         * @type {string}
         */
        this.userAgent = null;

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
    }

    /**
     * 使用 JSON 格式数据创建 VisitTrace 实例。
     * @param {JSON} json 
     * @returns {VisitTrace} 
     */
    static create(json) {
        let trace = new VisitTrace();
        trace.time = json.time;
        trace.ip = json.ip;
        trace.url = json.url;

        trace.domain = (undefined !== json.domain) ? json.domain : null;
        trace.title = (undefined !== json.title) ? json.title : null;

        trace.screenSize.width = json.screen.width;
        trace.screenSize.height = json.screen.height;
        trace.screenColorDepth = json.screen.colorDepth;
        trace.screenOrientation = json.screen.orientation;

        trace.referrer = json.referrer;
        trace.language = json.language;
        trace.userAgent = json.userAgent;

        trace.event = (undefined !== json.event) ? json.event : null;
        trace.eventTag = (undefined !== json.eventTag) ? json.eventTag : null;
        trace.eventParam = (undefined !== json.eventParam) ? json.eventParam : null;

        return trace;
    }
}
