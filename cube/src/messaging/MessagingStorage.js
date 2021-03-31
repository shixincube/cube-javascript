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

import cell from "@lib/cell-lib";
import InDB from "indb";
import { ModuleError } from "../core/error/ModuleError";
import { Message } from "./Message";
import { MessageDraft } from "./MessageDraft";
import { MessageState } from "./MessageState";
import { MessagingService } from "./MessagingService";

/**
 * 消息存储器。
 */
export class MessagingStorage {

    /**
     * @param {MessagingService} service 消息服务。
     */
    constructor(service) {
        /**
         * 消息服务。
         * @type {MessagingService}
         */
        this.service = service;

        /**
         * 存储器操作的域。
         * @type {string}
         */
        this.domain = null;

        /**
         * 数据库实例。
         * @type {InDB}
         */
        this.db = null;

        /**
         * 配置库。
         * @type {object}
         */
        this.configStore = null;

        /**
         * 消息库。
         * @type {object}
         */
        this.messageStore = null;

        /**
         * 草稿库。
         * @type {object}
         */
        this.draftStore = null;
    }

    /**
     * 打开存储器连接数据库连接。
     * @param {number} contactId 指定当前签入的联系人 ID 。
     * @param {string} domain 指定操作的域。
     */
    open(contactId, domain) {
        if (null != this.db) {
            return;
        }

        cell.Logger.d('MessagingStorage', 'Open messaging storage : ' + domain);

        this.domain = domain;

        // 数据库配置
        let options = {
            name: 'CubeMessaging-' + domain + '-' + contactId,
            version: 1,
            stores: [{
                name: 'message',
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
                    name: 'source',
                    keyPath: 'source',
                    unique: false
                }, {
                    name: 'rts',
                    keyPath: 'rts',
                    unique: false
                }]
            }, {
                name: 'draft',
                keyPath: 'owner',
                indexes: [{
                    name: 'owner',
                    keyPath: 'owner',
                    unique: true
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

        // 考虑是否不再调用此函数？
        //this.db.connect();

        this.configStore = this.db.use('config');
        this.messageStore = this.db.use('message');
        this.draftStore = this.db.use('draft');
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
        this.db = null;
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
            handler(0);
            return false;
        }

        (async () => {
            let item = await this.configStore.get('lastMessageTime');
            if (undefined === item || null == item) {
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

        let cur = message;
        (async ()=> {
            let contained = true;
            let value = await this.messageStore.get(cur.getId());
            if (undefined !== value && null != value) {
                if (value.owner == 0) {
                    contained = false;
                }
            }
            else {
                contained = false;
            }

            handler(cur, contained);
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
            await this.messageStore.put(data);
        })();
        return true;
    }

    /**
     * 读取指定时间之后的所有消息。
     * @param {number} beginning 指定读取的起始时间戳。
     * @param {function} handler 指定查询结果回调函数，函数参数：({@linkcode beginning}:number, {@linkcode result}:Array<{@link Message}>) 。
     * @returns {boolean} 返回是否执行了读取操作。
     */
    readMessage(beginning, handler) {
        if (null == this.db) {
            return false;
        }

        (async ()=> {
            let result = await this.messageStore.query('rts', beginning, '>');
            let messages = [];
            for (let i = 0; i < result.length; ++i) {
                result[i].domain = this.domain;
                let message = Message.create(result[i]);

                if (message.state == MessageState.Deleted || message.state == MessageState.Recalled) {
                    // 跳过被删除和已召回的消息
                    continue;
                }

                let res = await this.service.fillMessage(message);
                if (res instanceof ModuleError) {
                    cell.Logger.e(MessagingService.NAME, res.toString());
                }

                // 有效的消息
                messages.push(message);
            }
            handler(beginning, messages);
        })();
        return true;
    }

    /**
     * 读取指定消息 ID 的消息。
     * @param {number} messageId 指定消息 ID 。
     * @param {function} handler 指定回调函数，函数参数：({@linkcode message}:{@link Message}) 。
     * @returns {boolean} 返回是否执行了读取操作。
     */
    readMessageById(messageId, handler) {
        if (null == this.db) {
            return false;
        }

        (async ()=> {
            let value = await this.messageStore.get(messageId);
            if (null == value) {
                handler(null);
                return;
            }
            value.domain = this.domain;
            let message = Message.create(value);

            let res = await this.service.fillMessage(message);
            if (res instanceof ModuleError) {
                cell.Logger.e(MessagingService.NAME, res.toString());
            }

            handler(message);
        })();

        return true;
    }

    /**
     * 读取指定联系人相关的并且指定时间之后的所有消息。
     * @param {number} contactId 指定联系人 ID 。
     * @param {number} beginning 指定读取的起始时间戳。
     * @param {function} handler 指定查询结果回调函数，函数参数：({@linkcode contactId}:number, {@linkcode beginning}:number, {@linkcode result}:Array<{@link Message}>) 。
     * @returns {boolean} 返回是否执行了读取操作。
     */
    readMessageWithContact(contactId, beginning, handler) {
        if (null == this.db) {
            return false;
        }

        (async ()=> {
            let result = await this.messageStore.select([
                { key: 'rts', value: beginning, compare: '>' },
                { key: 'source', value: 0, compare: '=' },
                { key: 'from', value: contactId, optional: true },
                { key: 'to', value: contactId, optional: true }
            ]);
            let messages = [];
            for (let i = 0; i < result.length; ++i) {
                result[i].domain = this.domain;
                let message = Message.create(result[i]);

                if (message.state == MessageState.Deleted || message.state == MessageState.Recalled) {
                    // 跳过被删除和已召回的消息
                    continue;
                }

                let res = await this.service.fillMessage(message);
                if (res instanceof ModuleError) {
                    cell.Logger.e(MessagingService.NAME, res.toString());
                }

                // 记录有效消息
                messages.push(message);
            }
            handler(contactId, beginning, messages);
        })();
        return true;
    }

    /**
     * 读取指定滚阻相关的并且指定时间之后的所有消息。
     * @param {number} groupId 指定群组 ID 。
     * @param {number} beginning 指定读取的起始时间戳。
     * @param {function} handler 指定查询结果回调函数，函数参数：({@linkcode groupId}:number, {@linkcode beginning}:number, {@linkcode result}:Array<{@link Message}>) 。
     * @returns {boolean} 返回是否执行了读取操作。
     */
    readMessageWithGroup(groupId, beginning, handler) {
        if (null == this.db) {
            return false;
        }

        (async ()=> {
            let result = await this.messageStore.select([
                { key: 'rts', value: beginning, compare: '>' },
                { key: 'source', value: groupId, optional: true }
            ]);
            let messages = [];
            for (let i = 0; i < result.length; ++i) {
                result[i].domain = this.domain;
                let message = Message.create(result[i]);

                if (message.state == MessageState.Deleted || message.state == MessageState.Recalled) {
                    // 跳过被删除和已召回的消息
                    continue;
                }

                let res = await this.service.fillMessage(message);
                if (res instanceof ModuleError) {
                    cell.Logger.e(MessagingService.NAME, res.toString());
                }

                // 记录有效有消息
                messages.push(message);
            }
            handler(groupId, beginning, messages);
        })();
        return true;
    }

    /**
     * 读取最近一条有效的消息。
     * @param {number} contactId 指定该消息关联的联系人 ID 。
     * @param {function} handler 指定查询结果回调函数，函数参数：({@linkcode message}:{@link Message}) 。
     * @returns {boolean} 返回是否执行了读取操作。
     */
    readLastMessageWtihContact(contactId, handler) {
        if (null == this.db) {
            return false;
        }

        (async ()=> {
            let result = null;

            await this.messageStore.iterate((cursor, next, stop) => {
                var obj = cursor.value;
                if ((obj.from == contactId || obj.to == contactId) && (obj.source == 0)
                    && (obj.state == MessageState.Read || obj.state == MessageState.Sent)) {
                    obj.domain = this.domain;
                    let message = Message.create(obj);
                    result = message;
                    stop();
                }
                else {
                    next();
                }
            }, {
                writable: false,
                direction: 'prev'
            });

            if (null != result) {
                let res = await this.service.fillMessage(result);
                if (res instanceof ModuleError) {
                    cell.Logger.e(MessagingService.NAME, res.toString());
                }
            }

            handler(result);
        })();

        return true;
    }

    /**
     * 读取最近一条有效的消息。
     * @param {number} groupId 指定群组消息的群组 ID 。
     * @param {function} handler 指定查询结果回调函数，函数参数：({@linkcode message}:{@link Message}) 。
     * @returns {boolean} 返回是否执行了读取操作。
     */
    readLastMessageWtihGroup(groupId, handler) {
        if (null == this.db) {
            return false;
        }

        (async ()=> {
            let result = null;

            await this.messageStore.iterate((cursor, next, stop) => {
                var obj = cursor.value;
                if ((obj.source == groupId) && (obj.state == MessageState.Read || obj.state == MessageState.Sent)) {
                    obj.domain = this.domain;
                    let message = Message.create(obj);
                    result = message;
                    stop();
                }
                else {
                    next();
                }
            }, {
                writable: false,
                direction: 'prev'
            });

            if (null != result) {
                let res = await this.service.fillMessage(result);
                if (res instanceof ModuleError) {
                    cell.Logger.e(MessagingService.NAME, res.toString());
                }
            }

            handler(result);
        })();

        return true;
    }

    /**
     * 读取最近一条有效的消息。
     * @param {function} handler 指定查询结果回调函数，函数参数：({@linkcode message}:{@link Message}) 。
     * @returns {boolean} 返回是否执行了读取操作。
     */
    readLastMessage(handler) {
        if (null == this.db) {
            return false;
        }

        (async ()=> {
            let result = null;

            await this.messageStore.iterate((cursor, next, stop) => {
                var obj = cursor.value;
                if (obj.state == MessageState.Read || obj.state == MessageState.Sent) {
                    obj.domain = this.domain;
                    let message = Message.create(obj);
                    result = message;
                    stop();
                }
                else {
                    next();
                }
            }, {
                writable: false,
                direction: 'prev'
            });

            if (null != result) {
                let res = await this.service.fillMessage(result);
                if (res instanceof ModuleError) {
                    cell.Logger.e(MessagingService.NAME, res.toString());
                }
            }

            handler(result);
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
            await this.messageStore.put(data);
        })();
        return true;
    }

    /**
     * 写入草稿。
     * @param {MessageDraft} draft 草稿。
     */
    writeDraft(draft) {
        if (null == this.db) {
            return false;
        }

        (async ()=> {
            let data = draft.toJSON();
            await this.draftStore.put(data);
        })();
        return true;
    }

    /**
     * 删除草稿。
     * @param {number} ownerId 草稿所属的实体 ID 。
     */
    deleteDraft(ownerId) {
        if (null == this.db) {
            return false;
        }

        (async ()=> {
            await this.draftStore.delete(ownerId);
        })();
        return true;
    }

    /**
     * 读取草稿。
     * @param {number} ownerId 草稿所属实体的 ID 。
     * @param {function} handler 结果回调，参数：({@linkcode draft}:{@link MessageDraft}) 。
     */
    readDraft(ownerId, handler) {
        if (null == this.db) {
            return false;
        }

        (async ()=> {
            let value = await this.draftStore.get(ownerId);
            if (null == value) {
                handler(null);
                return;
            }

            value.message.domain = this.domain;
            let message = Message.create(value.message);
            let draft = new MessageDraft(ownerId, message);
            handler(draft);
        })();

        return true;
    }
}
