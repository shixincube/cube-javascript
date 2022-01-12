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
import InDB from "indb";
import { ModuleError } from "../core/error/ModuleError";
import { Conversation } from "./Conversation";
import { ConversationState } from "./ConversationState";
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
                name: 'conversation',
                keyPath: 'id',
                indexes: [{
                    name: 'id',
                    keyPath: 'id',
                    unique: true
                }, {
                    name: 'timestamp',
                    keyPath: 'timestamp',
                    unique: false
                }, {
                    name: 'type',
                    keyPath: 'type',
                    unique: false
                }, {
                    name: 'state',
                    keyPath: 'state',
                    unique: false
                }, {
                    name: 'reminding',
                    keyPath: 'reminding',
                    unique: false
                }, {
                    name: 'pivotalId',
                    keyPath: 'pivotalId',
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
                name: 'recent_messager',
                keyPath: 'id',
                indexes: [{
                    name: 'id',
                    keyPath: 'id',
                    unique: true
                }, {
                    name: 'time',
                    keyPath: 'time',
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

        // 考虑是否不再调用此函数？
        //this.db.connect();

        this.configStore = this.db.use('config');
        this.messageStore = this.db.use('message');
        this.conversationStore = this.db.use('conversation');
        this.draftStore = this.db.use('draft');
        this.recentMessagerStore = this.db.use('recent_messager');
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
     * 查询最近的会话。
     * @param {number} limit 查询的最大数量。
     * @param {function} handler 数据回调句柄，参数：({@linkcode list}:Array<{@link Conversation}>) 。
     */
    queryRecentConversations(limit, handler) {
        (async ()=> {
            let list = [];

            let result = await this.conversationStore.select([
                { key: 'state', value: ConversationState.Normal, compare: '=' },
                { key: 'state', value: ConversationState.Important, compare: '=', optional: true }
            ]);

            if (null != result) {
                // 降序排序
                result.sort((a, b) => {
                    if (a.timestamp < b.timestamp) return -1;
                    else if (a.timestamp > b.timestamp) return 1;
                    else return 0;
                });

                result.forEach((value) => {
                    let conversation = Conversation.create(value);
                    list.push(conversation);
                });
            }

            handler(list);
        })();
    }

    /**
     * 更新最近一条消息的时间戳。
     * @param {Message} message 消息实例。
     * @param {boolean} updateLastTime 是否更新最近消息时间。
     * @returns {boolean} 返回是否执行了更新操作。
     */
    updateLastMessage(message, updateLastTime) {
        if (null == this.db) {
            return false;
        }

        if (updateLastTime) {
            (async () => {
                let timestamp = message.getRemoteTimestamp();
                let data = {
                    "item": "lastMessageTime",
                    "value": timestamp
                };
                await this.configStore.put(data);
            })();
        }

        (async () => {
            let messagerId = 0;
            let group = false;
            if (message.isFromGroup()) {
                // 群组的消息
                messagerId = message.getSource();
                group = true;
            }
            else {
                if (this.service.isSender(message)) {
                    messagerId = message.getTo();
                }
                else {
                    messagerId = message.getFrom();
                }
            }

            let cur = await this.recentMessagerStore.get(messagerId);
            if (null != cur && cur.length > 0) {
                let time = cur[0].time;
                if (message.remoteTS > time) {
                    // 指定消息的时间戳更大，更新数据
                    await this.recentMessagerStore.put({
                        "id": messagerId,
                        "time": message.remoteTS,
                        "group": group,
                        "message": message.toJSON()
                    });
                }
            }
            else {
                // 没有记录
                await this.recentMessagerStore.put({
                    "id": messagerId,
                    "time": message.remoteTS,
                    "group": group,
                    "message": message.toJSON()
                });
            }
        })();

        return true;
    }

    /**
     * 最近记录的相关消息联系人和群组。
     * @param {function} handler 查询结果回调函数，参数：({@linkcode list}:{@linkcode Array}) 。
     * @returns {boolean} 是否执行了查询操作。
     */
    queryRecentMessagers(handler) {
        if (null == this.db) {
            return false;
        }

        (async ()=> {
            let result = await this.recentMessagerStore.all();
            if (null != result) {
                // 降序排序
                result.sort((a, b) => {
                    if (a.time < b.time) return -1;
                    else if (a.time > b.time) return 1;
                    else return 0;
                });
            }
            handler(result);
        })();

        return true;
    }

    /**
     * 从最近消息列表里删除指定的联系人或群组。
     * @param {number} id 指定 ID 。
     * @param {function} [handler] 操作结束的回调函数。参数：({@linkcode id}:{@linkcode number}) 。
     * @returns {boolean} 是否执行了操作。
     */
    deleteRecentMessager(id, handler) {
        if (null == this.db) {
            return false;
        }

        (async ()=> {
            await this.recentMessagerStore.delete(id);
            if (handler) {
                handler(id);
            }
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

        (async ()=> {
            let contained = true;
            let value = await this.messageStore.get(message.getId());
            if (undefined !== value && null != value) {
                // if (value.owner == 0) {
                //     contained = false;
                // }
                contained = true;
            }
            else {
                contained = false;
            }

            handler(message, contained);
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

    reverseReadMessages() {

    }

    /**
     * 读取指定时间之后的所有消息。
     * @param {number} beginning 指定读取的起始时间戳。
     * @param {function} handler 指定查询结果回调函数，函数参数：({@linkcode beginning}:number, {@linkcode result}:Array<{@link Message}>) 。
     * @param {number} [limit=100] 指定查询结果的数量上限。
     * @returns {boolean} 返回是否执行了读取操作。
     */
    readMessages(beginning, handler, limit) {
        if (null == this.db) {
            return false;
        }

        if (undefined === limit) {
            limit = 100;
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

            let resultList = null;

            if (messages.length > limit) {
                let start = messages.length - limit;
                resultList = messages.slice(start);
            }
            else {
                resultList = messages;
            }

            handler(beginning, resultList);
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
                let obj = cursor.value;
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
                let obj = cursor.value;
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
                let obj = cursor.value;
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
     * 迭代相关联系人消息。
     * @param {number} contactId 指定联系人 ID 。
     * @param {number} timestamp 指定起始时间戳。
     * @param {function} iterator 指定迭代器。
     * @param {boolean} reverse 是否反向迭代。
     * @returns {boolean}
     */
    iterateContactMessage(contactId, timestamp, iterator, reverse) {
        if (null == this.db) {
            return false;
        }

        let resumeFunc = null;
        let stopFunc = null;

        let resumeCallback = () => {
            resumeFunc();
        };

        let stopCallback = () => {
            stopFunc();
        };

        (async ()=> {
            await this.messageStore.iterate((cursor, next, stop) => {
                let data = cursor.value;
                if (data.source > 0) {
                    next();
                    return;
                }

                if (data.state == MessageState.Deleted || data.state == MessageState.Recalled) {
                    // 跳过已删除和已撤回的消息
                    next();
                    return;
                }

                if (reverse) {
                    // 反向
                    if (data.rts > timestamp) {
                        next();
                        return;
                    }
                }
                else {
                    if (data.rts < timestamp) {
                        next();
                        return;
                    }
                }

                if (data.from == contactId || data.to == contactId) {
                    // 找到对应的联系人
                    data.domain = this.domain;
                    let message = Message.create(data);

                    // 回调迭代器
                    let ret = iterator(message, resumeCallback, stopCallback);

                    if (undefined === ret) {
                        // 没有返回值，等待回调
                        resumeFunc = next;
                        stopFunc = stop;
                    }
                    else {
                        if (ret) {
                            next();
                        }
                        else {
                            stop();
                        }
                    }
                }
                else {
                    next();
                }
            }, {
                writable: false,
                direction: reverse ? 'prev' : 'next'
            });

            iterator(null);
        })();

        return true;
    }

    /**
     * 迭代相关群组消息。
     * @param {number} contactId 指定群组 ID 。
     * @param {number} timestamp 指定起始时间戳。
     * @param {function} iterator 指定迭代器。
     * @param {boolean} reverse 是否反向迭代。
     * @returns {boolean}
     */
    iterateGroupMessage(groupId, timestamp, iterator, reverse) {
        if (null == this.db) {
            return false;
        }

        let resumeFunc = null;
        let stopFunc = null;

        let resumeCallback = () => {
            resumeFunc();
        };

        let stopCallback = () => {
            stopFunc();
        };

        (async ()=> {
            await this.messageStore.iterate((cursor, next, stop) => {
                let data = cursor.value;
                if (data.source != groupId) {
                    next();
                    return;
                }

                if (data.state == MessageState.Deleted || data.state == MessageState.Recalled) {
                    // 跳过已删除和已撤回的消息
                    next();
                    return;
                }

                if (reverse) {
                    // 反向
                    if (data.rts > timestamp) {
                        next();
                        return;
                    }
                }
                else {
                    if (data.rts < timestamp) {
                        next();
                        return;
                    }
                }

                data.domain = this.domain;
                let message = Message.create(data);

                // 回调迭代器
                let ret = iterator(message, resumeCallback, stopCallback);

                if (undefined === ret) {
                    // 没有返回值，等待回调
                    resumeFunc = next;
                    stopFunc = stop;
                }
                else {
                    if (ret) {
                        next();
                    }
                    else {
                        stop();
                    }
                }
            }, {
                writable: false,
                direction: reverse ? 'prev' : 'next'
            });

            iterator(null);
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
