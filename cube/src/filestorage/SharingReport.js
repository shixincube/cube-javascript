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

import cell from "@lib/cell-lib";
import { Contact } from "../contact/Contact";
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

    /**
     * 文件类型总数统计。
     * @type {string}
     */
    static FileTypeTotalRecord = 'FileTypeTotalRecord';


    constructor(json) {
        /**
         * 分享标签映射.
         * @type {FastMap}
         */
        this.sharingTagMap = new FastMap();

        /**
         * 联系人映射。
         * @type {FastMap}
         */
        this.contactMap = new FastMap();

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

        /**
         * @type {Array}
         */
        this.validFileTypeTotals = (undefined !== json.validFileTypeTotals) ? json.validFileTypeTotals : null;

        /**
         * @type {Array}
         */
        this.expiredFileTypeTotals = (undefined !== json.expiredFileTypeTotals) ? json.expiredFileTypeTotals : null;
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
     * 获取在报告数据中的联系人。
     * @param {number} contactId 指定联系人 ID 。
     * @returns {Contact} 返回联系人实例。
     */
    getContact(contactId) {
        if (0 == contactId) {
            let contact = new Contact(0, '匿名访客', '');
            return contact;
        }

        return this.contactMap.get(contactId);
    }

    /**
     * 获取报告里的访客列表。
     * @returns {Array}
     */
    getVisitorList() {
        if (null == this.visitorEvents) {
            return [];
        }

        let result = [];
        this.visitorEvents.forEach((item) => {
            let contact = this.contactMap.get(item.contactId);
            if (null != contact) {
                result.push(contact);
            }
        });
        return result;
    }

    /**
     * 获取访客事件。
     * @param {number} contactId 指定联系人 ID 。
     * @returns {object} 访客事件。
     */
    getVisitorEvent(contactId) {
        if (null == this.visitorEvents) {
            return null;
        }

        for (let i = 0; i < this.visitorEvents.length; ++i) {
            let value = this.visitorEvents[i];
            if (value.contactId == contactId) {
                return value;
            }
        }

        return null;
    }

    /**
     * 填写实例。
     * @param {FileStorage} service 
     * @param {SharingReport} report 
     * @param {function} handle 
     */
    static fillData(service, report, handle) {
        let codeList = [];
        let contactIdList = [];

        if (null != report.topViewRecords) {
            report.topViewRecords.forEach((item) => {
                let code = item.code;
                if (codeList.indexOf(code) >= 0) {
                    return;
                }

                codeList.push(code);
            });
        }

        if (null != report.topExtractRecords) {
            report.topExtractRecords.forEach((item) => {
                let code = item.code;
                if (codeList.indexOf(code) >= 0) {
                    return;
                }

                codeList.push(code);
            });
        }

        if (null != report.visitorEvents) {
            report.visitorEvents.forEach((item) => {
                if (0 != item.contactId) {
                    if (contactIdList.indexOf(item.contactId) < 0) {
                        contactIdList.push(item.contactId);
                    }
                }

                item.eventTotals.forEach((value) => {
                    let code = value.sharingCode;
                    if (codeList.indexOf(code) >= 0) {
                        return;
                    }

                    codeList.push(code);
                });
            });
        }

        if (codeList.length == 0 && contactIdList.length == 0) {
            handle();
            return;
        }

        let tickSharingTag = (handle) => {
            if (codeList.length == 0 && contactIdList.length == 0) {
                handle();
                return;
            }

            let code = codeList.shift();
            service.getSharingTag(code, (sharingTag) => {
                report.sharingTagMap.put(code, sharingTag);
                tickSharingTag(handle);
            }, (error) => {
                cell.Logger.w('SharingReport', 'Get sharing tag error: ' + code + ' - ' + error.code);
                tickSharingTag(handle);
            });
        };

        if (codeList.length > 0) {
            tickSharingTag(handle);
        }

        let tickContact = (handle) => {
            if (codeList.length == 0 && contactIdList.length == 0) {
                handle();
                return;
            }

            let cid = contactIdList.shift();
            service.contactService.getContact(cid, (contact) => {
                report.contactMap.put(cid, contact);
                tickContact(handle);
            }, (error) => {
                cell.Logger.w('SharingReport', 'Get contact error: ' + cid + ' - ' + error.code);
                tickContact(handle);
            });
        };

        if (contactIdList.length > 0) {
            tickContact(handle);
        }
    }
}
