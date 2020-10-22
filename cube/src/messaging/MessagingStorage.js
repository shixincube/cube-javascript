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
import { Message } from "./Message";

/**
 * 消息存储器。
 */
export class MessagingStorage {

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
         * 配置库。
         */
        this.configStore = null;

        /**
         * 消息库。
         */
        this.messagesStore = null;
    }

    /**
     * 打开存储器连接数据库连接。
     * @param {string} domain 指定操作的域。
     */
    open(domain) {
        cell.Logger.d('MessagingStorage', 'Open messaging storage : ' + domain);

        this.domain = domain;

        // 数据库配置
        let options = {
            name: 'CubeMessages-' + domain,
            version: 1,
            stores: [{
                name: 'messages',
                keyPath: 'id',
                indexes: [{
                    name: 'id',
                    keyPath: 'id',
                    unique: true
                }, {
                    name: 'from',
                    keyPath: 'from',
                    unique: false
                }, {
                    name: 'to',
                    keyPath: 'to',
                    unique: false
                }, {
                    name: 'rts',
                    keyPath: 'rts',
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

        this.configStore = this.db.use('config');
        this.messagesStore = this.db.use('messages');
    }

    /**
     * 关闭存储器。
     */
    close() {
        if (null == this.db) {
            return;
        }

        cell.Logger.d('MessagingStorage', 'Close messaging storage : ' + this.domain);

        this.db.close();
    }

    /**
     * 更新最近一条消息的时间戳。
     * @param {number} timestamp 时间戳。
     * @returns {boolean} 返回是否执行了更新操作。
     */
    updateLastMessageTime(timestamp) {
        if (null == this.db) {
            return false;
        }

        (async () => {
            let data = {
                "item": "lastMessageTime",
                "value": timestamp
            };
            await this.configStore.put(data);
        })();
        return true;
    }

    /**
     * 查询最近一条消息的时间戳。
     * @param {function} handler 查询结果回调函数，函数参数：({@linkcode time}:number) 。
     * @returns {boolean} 返回是否执行了查询操作。
     */
    queryLastMessageTime(handler) {
        if (null == this.db) {
            return false;
        }

        (async () => {
            let item = await this.configStore.get('lastMessageTime');
            if (undefined === item) {
                item = { value: 0 };
            }

            handler(item.value);
        })();
        return true;
    }

    /**
     * 数据库里是否包含该消息。
     * @param {Message} message 指定消息实例。
     * @param {function} handler 查询结果回调函数，函数参数：({@linkcode message}:{@link Message}, {@linkcode contained}:boolean) 。
     * @returns {boolean} 返回是否执行了查询操作。
     */
    containsMessage(message, handler) {
        if (null == this.db) {
            return false;
        }

        (async ()=> {
            let value = await this.messagesStore.get(message.getId());
            handler(message, (undefined !== value && null != value));
        })();
        return true;
    }

    /**
     * 写入消息到数据库。
     * @param {Message} message 消息实体。
     * @returns {boolean} 返回是否执行了写入操作。
     */
    writeMessage(message) {
        if (null == this.db) {
            return false;
        }

        (async ()=> {
            let data = message.toJSON();
            delete data["domain"];
            await this.messagesStore.put(data);
        })();
        return true;
    }

    /**
     * 读取指定时间之后的所有消息。
     * @param {number} start 指定读取的起始时间戳。
     * @param {function} handler 指定查询结果回调函数，函数参数：({@linkcode start}:number, {@linkcode result}:Array<{@linkcode JSON}>) 。
     * @returns {boolean} 返回是否执行了读取操作。
     */
    readMessage(start, handler) {
        if (null == this.db) {
            return false;
        }

        (async ()=> {
            let result = await this.messagesStore.select([
                { key: 'rts', value: start, compare: '>' }
            ]);
            for (let i = 0; i < result.length; ++i) {
                result[i].domain = this.domain;
            }
            handler(start, result);
        })();
        return true;
    }

    /**
     * 读取指定联系人相关的并且指定时间之后的所有消息。
     * @param {number} contactId 指定联系人 ID 。
     * @param {number} start 指定读取的起始时间戳。
     * @param {function} handler 指定查询结果回调函数，函数参数：({@linkcode contactId}:number, {@linkcode start}:number, {@linkcode result}:Array<{@linkcode JSON}>) 。
     * @returns {boolean} 返回是否执行了读取操作。
     */
    readMessageWithContact(contactId, start, handler) {
        if (null == this.db) {
            return false;
        }

        (async ()=> {
            let result = await this.messagesStore.select([
                { key: 'rts', value: start, compare: '>' },
                { key: 'from', value: contactId, optional: true },
                { key: 'to', value: contactId, optional: true }
            ]);
            for (let i = 0; i < result.length; ++i) {
                result[i].domain = this.domain;
            }
            handler(contactId, start, result);
        })();
        return true;
    }

    /**
     * 更新或写入消息到数据库。
     * @param {Message} message 消息实体。
     * @returns {boolean} 返回是否执行了写入操作。
     */
    updateMessage(message) {
        if (null == this.db) {
            return false;
        }

        (async ()=> {
            let data = message.toJSON();
            delete data["domain"];
            await this.messagesStore.put(data);
        })();
        return true;
    }
}
