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

import cell from "@lib/cell-lib";
import InDB from "indb";
import { Group } from "./Group";

/**
 * 消息存储器。
 */
export class ContactStorage {

    constructor() {
        /**
         * 存储器操作的域。
         */
        this.domain = null;

        /**
         * 数据库实例。
         */
        this.db = null;

        /**
         * 群组库。
         */
        this.groupStore = null;
    }
    
    /**
     * 打开存储器连接数据库连接。
     * @param {string} domain 指定操作的域。
     */
    open(domain) {
        if (null != this.db) {
            return;
        }

        cell.Logger.d('ContactStorage', 'Open contact storage : ' + domain);

        this.domain = domain;

        // 数据库配置
        let options = {
            name: 'CubeContact-' + domain,
            version: 1,
            stores: [{
                name: 'group',
                keyPath: 'id',
                indexes: [{
                    name: 'id',
                    keyPath: 'id',
                    unique: true
                }, {
                    name: 'lastActive',
                    keyPath: 'lastActive',
                    unique: false
                }]
            }, {
                name: 'config',
                keyPath: 'item',
                indexes: [{
                    name: 'item',
                    keyPath: 'item',
                    unique: true
                }]
            }]
        };

        this.db = new InDB(options);

        this.groupStore = this.db.use('group');
    }

    /**
     * 关闭存储器。
     */
    close() {
        if (null == this.db) {
            return;
        }

        cell.Logger.d('MessagingStorage', 'Close contact storage : ' + this.domain);

        this.db.close();
        this.db = null;
    }

    /**
     * 
     * @param {number} timestamp 
     * @param {function} hander 
     */
    getGroups(timestamp, hander) {

    }
}
