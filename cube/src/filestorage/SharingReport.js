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

import { FastMap } from "../util/FastMap";
import { FileStorage } from "./FileStorage";
import { SharingTag } from "./SharingTag";

/**
 * 分享数据报告。
 */
export class SharingReport {

    /**
     * 事件计数记录。
     * @type {string}
     */
    static CountRecord = 'CountRecord';

    /**
     * 排行记录。
     * @type {string}
     */
    static TopCountRecord = 'TopCountRecord';

    /**
     * 历史事件时间线记录。
     * @type {string}
     */
    static HistoryEventRecord = 'HistoryEventRecord';

    /**
     * 访问人的事件记录。
     * @type {string}
     */
    static VisitorRecord = 'VisitorRecord';


    constructor(json) {
        /**
         * 分享标签映射.
         * @type {FastMap}
         */
        this.sharingTagMap = new FastMap();

        /**
         * 有效的分享标签总数量。
         * @type {number}
         */
        this.totalSharingTag = (undefined !== json.totalSharingTag) ? json.totalSharingTag : 0;

        /**
         * 当前账号的浏览事件总数量。
         * @type {number}
         */
        this.totalEventView = (undefined !== json.totalEventView) ? json.totalEventView : 0;

        /**
         * 当前账号的下载事件总数量。
         * @type {number}
         */
        this.totalEventExtract = (undefined !== json.totalEventExtract) ? json.totalEventExtract : 0;

        /**
         * 当前账号的复制分享事件总数量。
         * @type {number}
         */
        this.totalEventShare = (undefined !== json.totalEventShare) ? json.totalEventShare : 0;

        /**
         * View 事件 TOP 记录。
         * @type {Array}
         */
        this.topViewRecords = (undefined !== json.topView) ? json.topView : null;

        /**
         * Extract 事件 TOP 记录。
         * @type {Array}
         */
        this.topExtractRecords = (undefined !== json.topExtract) ? json.topExtract : null;

        /**
         * @type {Array}
         */
        this.timelineView = (undefined !== json.timelineView) ? json.timelineView : null;

        /**
         * @type {Array}
         */
        this.timelineExtract = (undefined !== json.timelineExtract) ? json.timelineExtract : null;

        /**
         * @type {Array}
         */
        this.timelineShare = (undefined !== json.timelineShare) ? json.timelineShare : null;

        /**
         * @type {Array}
         */
        this.ipTotalStatistics = (undefined !== json.ipTotalStatistics) ? json.ipTotalStatistics : null;

        /**
         * @type {Array}
         */
        this.osTotalStatistics = (undefined !== json.osTotalStatistics) ? json.osTotalStatistics : null;

        /**
         * @type {Array}
         */
        this.swTotalStatistics = (undefined !== json.swTotalStatistics) ? json.swTotalStatistics : null;

        /**
         * @type {Array}
         */
        this.visitorEvents = (undefined !== json.visitorEvents) ? json.visitorEvents : null;
    }

    /**
     * 获取指定分享码的分享标签。
     * @param {string} code 指定分享码。
     * @returns {SharingTag} 返回分享标签实例。
     */
    getSharingTag(code) {
        return this.sharingTagMap.get(code);
    }

    /**
     * 
     * @param {FileStorage} service 
     * @param {SharingReport} resport 
     * @param {function} handle 
     */
    static fillData(service, resport, handle) {
        let codeList = [];
        if (null != resport.topViewRecords) {
            resport.topViewRecords.forEach((item) => {
                let code = item.code;
                if (codeList.indexOf(code) >= 0) {
                    return;
                }

                codeList.push(code);
            });
        }

        if (null != resport.topExtractRecords) {
            resport.topExtractRecords.forEach((item) => {
                let code = item.code;
                if (codeList.indexOf(code) >= 0) {
                    return;
                }

                codeList.push(code);
            });
        }
        if (null != resport.visitorEvents) {
            resport.visitorEvents.forEach((item) => {
                item.eventTotals.forEach((value) => {
                    let code = value.sharingCode;
                    if (codeList.indexOf(code) >= 0) {
                        return;
                    }
    
                    codeList.push(code);
                });
            });
        }

        if (codeList.length == 0) {
            handle();
            return;
        }

        let tick = (handle) => {
            if (codeList.length == 0) {
                handle();
                return;
            }

            let code = codeList.shift();
            service.getSharingTag(code, (sharingTag) => {
                resport.sharingTagMap.put(code, sharingTag);
                tick(handle);
            }, (error) => {
                tick(handle);
            });
        };

        tick(handle);
    }
}
