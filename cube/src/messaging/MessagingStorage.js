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
        this.domain = null;

        /**
         * 数据库实例。
         */
        this.db = null;

        this.configStore = null;
        this.messagesStore = null;
    }

    open(domain) {
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

    close() {
        this.db.close();
    }

    updateLastMessageTime(timestamp) {
        (async () => {
            let data = {
                "item": "lastMessageTime",
                "value": timestamp
            };
            await this.configStore.put(data);
        })();
    }

    queryLastMessageTime(handler) {
        (async () => {
            let item = await this.configStore.get('lastMessageTime');
            if (undefined === item) {
                item = 0;
            }

            handler(item.value);
        })();
    }

    /**
     * 写入消息到数据库。
     * @param {Message} message 
     */
    writeMessage(message) {
        (async ()=> {
            let data = message.toJSON();
            delete data["domain"];
            await this.messagesStore.put(data);
        })();
    }

    readMessage(start, handler) {
        (async ()=> {
            let result = await this.messagesStore.select([
                { key: 'rts', value: start, compare: '>' }
            ]);
            for (let i = 0; i < result.length; ++i) {
                result[i].domain = this.domain;
            }
            handler(start, result);
        })();
    }

    readMessageWithContact(contactId, handler) {
        (async ()=> {
            let result = await this.messagesStore.select([
                { key: 'from', value: contactId },
                { key: 'to', value: contactId }
            ]);
            for (let i = 0; i < result.length; ++i) {
                result[i].domain = this.domain;
            }
            handler(contactId, result);
        })();
    }

    /**
     * 
     * @param {Message} message 
     */
    updateMessage(message) {
        (async ()=> {
            let data = message.toJSON();
            delete data["domain"];
            await this.messagesStore.put(data);
        })();
    }
}
