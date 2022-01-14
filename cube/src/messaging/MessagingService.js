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
import { AuthService } from "../auth/AuthService";
import { OrderMap } from "../util/OrderMap";
import { Module } from "../core/Module";
import { ModuleError } from "../core/error/ModuleError";
import { ContactService } from "../contact/ContactService";
import { ContactEvent } from "../contact/ContactEvent";
import { Contact } from "../contact/Contact";
import { Group } from "../contact/Group";
import { GroupState } from "../contact/GroupState";
import { Packet } from "../core/Packet";
import { Message } from "./Message";
import { MessageState } from "./MessageState";
import { MessagingAction } from "./MessagingAction";
import { MessagingPipelineListener } from "./MessagingPipelineListener";
import { MessagingEvent } from "./MessagingEvent";
import { MessagingServiceState } from "./MessagingServiceState";
import { MessagingStorage } from "./MessagingStorage";
import { FileStorage } from "../filestorage/FileStorage";
import { FileStorageEvent } from "../filestorage/FileStorageEvent";
import { ObservableEvent } from "../core/ObservableEvent";
import { PipelineState } from "../core/PipelineState";
import { InstantiateHook } from "./hook/InstantiateHook";
import { MessagePlugin } from "./MessagePlugin";
import { MessageDraft } from "./MessageDraft";
import { Conversation } from "./Conversation";
import { ConversationType } from "./ConversationType";

/**
 * 消息服务模块接口。
 * @extends Module
 */
export class MessagingService extends Module {

    static NAME = 'Messaging';

    /**
     * 构造函数。
     */
    constructor() {
        super('Messaging');

        // 依赖联系人模块
        super.require(ContactService.NAME);

        // 依赖文件存储模块
        super.require(FileStorage.NAME);

        /**
         * 联系人服务。
         * @type {ContactService}
         */
        this.contactService = null;

        /**
         * 联系模块的事件监听函数。
         * @type {function}
         */
        this.contactEventFun = null;

        /**
         * 文件存储模块的事件监听函数。
         * @type {function}
         */
        this.fileStorageEventFun = null;

        /**
         * 发送队列。
         * @type {Array<Message>}
         */
        this.pushQueue = [];

        /**
         * 消息通知达到队列。
         * @type {Array<Message>}
         */
        this.notifiedQueue = [];

        /**
         * 正在发送队列。
         * @type {OrderMap<number,Message>}
         */
        this.sendingMap = new OrderMap();

        /**
         * 消息发送队列定时器。
         * @private
         * @type {number}
         */
        this.timer = 0;

        /**
         * 定时器上一次执行时间戳。
         * @private
         * @type {number}
         */
        this.timerLastTime = 0;

        /**
         * 用于监听数据通道数据的监听器。
         * @type {MessagingPipelineListener}
         */
        this.pipelineListener = new MessagingPipelineListener(this);

        /**
         * 消息存储器。
         * @type {MessagingStorage}
         */
        this.storage = new MessagingStorage(this);

        /**
         * 会话列表。
         * @type {Array<Conversation>}
         */
        this.conversations = [];

        /**
         * 最近一条消息的时间。
         * @type {number}
         */
        this.lastMessageTime = 0;

        /**
         * 最近一次查询操作的执行时间。用于控制高频查询。
         * @type {number}
         */
        this.lastQueryTime = 0;

        /**
         * 查询 Pull 回调处理函数。
         * @private
         * @type {function}
         */
        this.pullHandler = null;

        /**
         * @private
         * @type {number}
         */
        this.pullHandlerTimer = 0;

        /**
         * @private
         * @type {boolean}
         */
        this.serviceReady = false;
    }

    /**
     * @inheritdoc
     */
    start() {
        if (!super.start()) {
            return false;
        }

        // 组装插件
        this.assemble();

        // 监听联系人模块
        this.contactService = this.kernel.getModule(ContactService.NAME);
        let fun = (event) => {
            this._fireContactEvent(event);
        };
        this.contactService.attach(fun);
        this.contactEventFun = fun;

        // 监听文件存储模块
        fun = (event) => {
            this._fireFileStorageEvent(event);
        };
        this.kernel.getModule(FileStorage.NAME).attach(fun);
        this.fileStorageEventFun = fun;

        // 添加数据通道的监听器
        this.pipeline.addListener(MessagingService.NAME, this.pipelineListener);

        // 启动定时器
        this.resetTimer();

        let self = this.contactService.getSelf();
        if (null != self) {
            this._prepare(self);
        }

        return true;
    }

    /**
     * @inheritdoc
     */
    stop() {
        super.stop();

        if (null == this.pipeline) {
            return;
        }

        if (0 != this.timer) {
            clearInterval(this.timer);
            this.timer = 0;
        }

        this.pipeline.removeListener(MessagingService.NAME, this.pipelineListener);

        if (null != this.contactService) {
            let fun = this.contactEventFun;
            this.contactService.detach(fun);
            this.contactEventFun = null;
        }

        let fs = this.kernel.getModule(FileStorage.NAME);
        if (null != fs) {
            let fun = this.fileStorageEventFun;
            fs.detach(fun);
            this.fileStorageEventFun = null;
        }

        this.notifiedQueue.splice(0, this.notifiedQueue.length);

        // 关闭存储器
        this.storage.close();

        this.serviceReady = false;
    }

    /**
     * @private
     * @param {Self} self 
     */
     _prepare(self) {
        let gotMessages = false;
        let gotConversations = false;

        // 启动存储
        this.storage.open(self.getId(), self.getDomain());

        // 查询最新消息时间
        this.storage.queryLastMessageTime((value) => {
            let now = Date.now();

            if (value == 0) {
                this.lastMessageTime = now - this.defaultRetrospect;
            }
            else {
                this.lastMessageTime = value;
            }

            // 从服务器上拉取自上一次时间戳之后的所有消息
            this.queryRemoteMessage(this.lastMessageTime, now, () => {
                cell.Logger.d('MessagingService', '#queryRemoteMessage');

                gotMessages = true;
                if (gotConversations) {
                    cell.Logger.d('MessagingService', 'Ready');

                    this.serviceReady = true;
                    let event = new ObservableEvent(MessagingEvent.Ready, this);
                    this.notifyObservers(event);
                }
            });

            // 获取最新的会话列表
            let limit = 50;
            if (now - this.lastQueryTime > 1 * 60 * 60 * 1000) {
                // 大于一小时
                limit = 100;
            }
            this.queryRemoteConversations(limit, (list) => {
                cell.Logger.d('MessagingService', '#queryRemoteConversations');

                gotConversations = true;
                if (gotMessages) {
                    cell.Logger.d('MessagingService', 'Ready');

                    this.serviceReady = true;
                    let event = new ObservableEvent(MessagingEvent.Ready, this);
                    this.notifyObservers(event);
                }
            });
        });
    }

    /**
     * @inheritdoc
     */
    isReady() {
        return this.serviceReady;
    }

    /**
     * 组装插件系统。
     */
    assemble() {
        this.pluginSystem.addHook(new InstantiateHook());
    }

    /**
     * 重置定时器。
     * @private
     */
    resetTimer() {
        if (this.timer > 0) {
            clearInterval(this.timer);
        }
        this.timer = setInterval((e) => {
            this._processQueue();
        }, 100);
    }

    /**
     * 消息是否是当前签入的联系人账号发出的。
     * 即当前账号是否是指定消息的发件人。
     * @param {Message} message 指定消息实例。
     * @returns {boolean} 如果是当前签入人发出的返回 {@linkcode true} 。
     */
    isSender(message) {
        let self = this.contactService.getSelf();
        if (null == self) {
            return false;
        }

        return (message.from == self.getId());
    }

    /**
     * 获取最近的会话清单。
     * @param {function} handler 指定会话清单回调句柄，参数：({@linkcode list}:Array<{@link Conversation}>) 。
     */
    getRecentConversations(handler) {
        if (!this.isReady()) {
            handler(null);
            return;
        }

        let process = (list) => {
            let result = [];

            list.forEach((value) => {
                (async ()=> {
                    let conversation = await this.fillConversation(value);
                    result.push(conversation);

                    if (result.length == list.length) {
                        // 获取到全部数据
                        this.conversations = result;
                        setTimeout(() => {
                            handler(this.conversations);
                        }, 0);
                    }
                })();
            });
        };

        if (this.conversations.length == 0) {
            this.storage.queryRecentConversations(50, (list) => {
                process(list);
            });
        }
        else {
            handler(this.conversations);
        }
    }

    /**
     * 获取指定会话。
     * @param {number} conversationId 指定会话 ID 。
     * @param {function} handleSuccess 操作成功的回调方法。参数：({@linkcode conversation}:{@link Conversation}) 。
     * @param {function} [handleFailure] 操作失败的回调方法。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    getConversation(conversationId, handleSuccess, handleFailure) {
        let id = conversationId;
        if (typeof conversationId == 'string') {
            id = parseInt(conversationId);
        }

        if (this.conversations.length > 0) {
            for (let i = 0; this.conversations.length; ++i) {
                let conv = this.conversations[i];
                if (conv.id == id) {
                    handleSuccess(conv);
                    return;
                }
            }
        }

        this.storage.readConversation(id, (conversation) => {
            if (null == conversation) {
                if (undefined !== handleFailure) {
                    let error = new ModuleError(MessagingService.NAME, MessagingServiceState.StorageNoData, conversationId);
                    handleFailure(error);
                }
                return;
            }

            (async ()=> {
                let conv = await this.fillConversation(conversation);
                handleSuccess(conv);
            })();
        });
    }

    /**
     * 向指定的联系人或者群组发送消息。
     * @param {Contact|Group} destination 指定联系人或者群组。
     * @param {JSON|Message} message 指定消息实例或消息负载。
     * @param {File} [file] 指定消息附件。
     * @returns {Message} 如果消息成功写入数据通道返回 {@link Message} 实例，否则返回 {@linkcode null} 值。
     */
    sendTo(destination, message, file) {
        if (destination instanceof Group) {
            return this.sendToGroup(destination, message, file);
        }
        else if (destination instanceof Contact) {
            return this.sendToContact(destination, message, file);
        }
        else {
            return null;
        }
    }

    /**
     * 向指定联系人发送消息。
     * @param {Contact|number} contact 指定联系人或联系人 ID 。
     * @param {JSON|Message} message 指定消息实例或消息内容。
     * @param {File} [file] 指定消息附件。
     * @returns {Message} 如果消息成功写入数据通道返回 {@link Message} 实例，否则返回 {@linkcode null} 值。
     */
    sendToContact(contact, message, file) {
        if (!this.started) {
            this.start();
        }

        let self = this.contactService.getSelf();
        if (null == self) {
            return null;
        }

        var msg = message;
        if (!(message instanceof Message)) {
            msg = new Message(message, file);
        }

        let to = 0;

        if (contact instanceof Contact) {
            to = contact.getId();
        }
        else if (typeof contact === 'string') {
            to = parseInt(contact);
        }
        else if (typeof contact === 'number') {
            to = contact;
        }
        else {
            return null;
        }

        // 更新状态
        msg.state = MessageState.Sending;

        msg.from = self.getId();
        msg.to = to;
        msg.localTS = Date.now();
        msg.remoteTS = msg.localTS;

        (async ()=> {
            let result = await this.fillMessage(msg);
            if (result instanceof ModuleError) {
                cell.Logger.e(MessagingService.NAME, result.toString());
            }

            // 更新状态
            let promise = new Promise((resolve, reject) => {
                // 存储
                this.storage.writeMessage(msg);

                resolve(msg);
            });
            promise.then((msg) => {
                // 写入队列
                this.pushQueue.push(msg);
            });
        })();

        if (msg.localTS - this.timerLastTime > 5000) {
            this.resetTimer();
        }

        return msg;
    }

    /**
     * 向指定群组发送消息。
     * @param {Group|number} group 指定群组或群组 ID 。
     * @param {JSON|Message} message 指定消息实例或消息内容。
     * @param {File} [file] 指定消息附件。
     * @returns {Message} 如果消息成功写入数据通道返回 {@link Message} 实例，否则返回 {@linkcode null} 值。
     */
    sendToGroup(group, message, file) {
        if (!this.started) {
            this.start();
        }

        let self = this.contactService.getSelf();
        if (null == self) {
            return null;
        }

        var msg = message;
        if (!(message instanceof Message)) {
            msg = new Message(message, file);
        }

        let source = 0;

        if (group instanceof Group) {
            source = group.getId();
        }
        else if (typeof group === 'string') {
            source = parseInt(group);
        }
        else if (typeof group === 'number') {
            source = group;
        }
        else {
            return null;
        }

        // 更新状态
        msg.state = MessageState.Sending;

        msg.from = self.getId();
        msg.source = source;
        msg.localTS = Date.now();
        msg.remoteTS = msg.localTS;

        (async ()=> {
            let result = await this.fillMessage(msg);
            if (result instanceof ModuleError) {
                cell.Logger.e(MessagingService.NAME, result.toString());
            }

            // 更新状态
            let promise = new Promise((resolve, reject) => {
                // 存储
                this.storage.writeMessage(msg);

                resolve(msg);
            });
            promise.then((msg) => {
                // 写入队列
                this.pushQueue.push(msg);
            });
        })();

        if (msg.localTS - this.timerLastTime > 5000) {
            this.resetTimer();
        }

        return msg;
    }

    /**
     * 标记指定的消息为本地的自作用域消息。
     * 该方法会触发 {@linkcode MessagingEvent.MarkOnlyOwner} 事件。
     * @param {Message} message 指定消息。
     */
    markLocalOnlyOwner(destination, message) {
        if (!this.started) {
            this.start();
        }

        // 标记 scope 为 1
        message.scope = 1;

        let self = this.contactService.getSelf();

        message.from = self.getId();
        message.to = destination.getId();
        message.localTS = Date.now();
        message.remoteTS = message.localTS + 1;
        message.owner = self.getId();
        message.state = MessageState.Read;

        (async () => {
            // 写入数据
            this.storage.writeMessage(message);

            // 填充数据
            await this.fillMessage(message);

            this.notifyObservers(new ObservableEvent(MessagingEvent.MarkOnlyOwner, message));
        })();
    }

    /**
     * 标记消息已读。
     * @param {Message|number} message 指定消息实例或者消息 ID 。
     * @param {function} [handleSuccess] 操作成功回调该方法，参数：({@linkcode message}:{@link Message}) 。
     * @param {function} [handleFailure] 操作失败回调该方法，参数：({@linkcode error}:{@link ModuleError}) 。
     * @returns {boolean} 返回是否能执行该操作。
     */
    markRead(message, handleSuccess, handleFailure) {
        if (!this.started) {
            this.start();
        }

        let self = this.contactService.getSelf();
        if (null == self) {
            return false;
        }

        let messageId = 0;

        if (message instanceof Message) {
            messageId = message.getId();
            if (message.getTo() != self.getId()) {
                let error = new ModuleError(MessagingService.NAME, MessagingServiceState.Forbidden, message);
                if (handleFailure) {
                    handleFailure(error);
                }
                return false;
            }
        }
        else {
            messageId = message;
        }

        let payload = {
            "contactId": self.getId(),
            "messageId": messageId
        };
        let packet = new Packet(MessagingAction.Read, payload);
        this.pipeline.send(MessagingService.NAME, packet, (pipeline, source, responsePacket) => {
            if (null != responsePacket && responsePacket.getStateCode() == PipelineState.OK) {
                if (responsePacket.data.code == 0) {
                    this.storage.readMessageById(messageId, (message) => {
                        // 更新状态
                        message.state = MessageState.Read;

                        // 写存储
                        this.storage.updateMessage(message);

                        // 标注 Token
                        if (null != message.attachment) {
                            message.attachment.token = this.getAuthToken().code;
                        }

                        // 使用插件
                        let hook = this.pluginSystem.getHook(InstantiateHook.NAME);
                        message = hook.apply(message);

                        if (handleSuccess) {
                            handleSuccess(message);
                        }

                        // 事件通知
                        this.notifyObservers(new ObservableEvent(MessagingEvent.Read, message));
                    });
                }
                else {
                    this.storage.readMessageById(messageId, (message) => {
                        let error = new ModuleError(MessagingService.NAME, responsePacket.data.code, message);
                        if (handleFailure) {
                            handleFailure(error);
                        }
                    });
                }
            }
            else {
                this.storage.readMessageById(messageId, (message) => {
                    let error = new ModuleError(MessagingService.NAME, MessagingServiceState.Failure, message);
                    if (handleFailure) {
                        handleFailure(error);
                    }
                });
            }
        });

        return true;
    }

    /**
     * 删除消息。
     * @param {Message|number} message 指定消息实例或者消息 ID 。
     * @param {function} [handleSuccess] 操作成功回调该方法，参数：({@linkcode message}:{@link Message}) 。
     * @param {function} [handleFailure] 操作错误回调该方法，参数：({@linkcode message}:{@link Message}) 。
     * @returns {boolean} 返回是否能执行该操作。
     */
    deleteMessage(message, handleSuccess, handleFailure) {
        if (!this.started) {
            this.start();
        }

        let self = this.contactService.getSelf();
        if (null == self) {
            return false;
        }

        let messageId = (message instanceof Message) ? message.getId() : message;

        let payload = {
            contactId: self.getId(),
            messageId: messageId
        };
        let packet = new Packet(MessagingAction.Delete, payload);
        this.pipeline.send(MessagingService.NAME, packet, (pipeline, source, responsePacket) => {
            if (null != responsePacket && responsePacket.getStateCode() == PipelineState.OK) {
                if (responsePacket.data.code == 0) {
                    this.storage.readMessageById(messageId, (message) => {
                        // 更新状态
                        message.state = MessageState.Deleted;

                        // 写存储
                        this.storage.updateMessage(message);

                        // 标注 Token
                        if (null != message.attachment) {
                            message.attachment.token = this.getAuthToken().code;
                        }

                        // 使用插件
                        let hook = this.pluginSystem.getHook(InstantiateHook.NAME);
                        message = hook.apply(message);

                        if (handleSuccess) {
                            handleSuccess(message);
                        }

                        // 事件通知
                        this.notifyObservers(new ObservableEvent(MessagingEvent.Delete, message));
                    });
                }
                else {
                    this.storage.readMessageById(messageId, (message) => {
                        if (handleFailure) {
                            handleFailure(message);
                        }
                    });
                }
            }
            else {
                this.storage.readMessageById(messageId, (message) => {
                    if (handleFailure) {
                        handleFailure(message);
                    }
                });
            }
        });

        return true;
    }

    /**
     * 撤回消息。
     * @param {Message|number} message 指定消息 ID 或者消息实例。
     * @param {function} [handleSuccess] 操作成功回调该方法，参数：({@linkcode message}:{@link Message}) 。
     * @param {function} [handleFailure] 操作错误回调该方法，参数：({@linkcode error}:{@link ModuleError}) 。
     * @returns {boolean} 返回是否能执行该操作。
     */
    recallMessage(message, handleSuccess, handleFailure) {
        if (!this.started) {
            this.start();
        }

        let self = this.contactService.getSelf();
        if (null == self) {
            return false;
        }

        let messageId = (message instanceof Message) ? message.getId() : parseInt(message);

        this.storage.readMessageById(messageId, (message) => {
            if (message.getFrom() != self.getId()) {
                // 不是本人发送的消息不能撤回
                if (handleFailure) {
                    let error = new ModuleError(MessagingService.NAME, MessagingServiceState.IllegalOperation, message);
                    handleFailure(error);
                }
                return;
            }

            let now = Date.now();
            if (now - message.getRemoteTimestamp() > 2 * 60 * 1000) {
                // 超过时限不能撤回
                if (handleFailure) {
                    let error = new ModuleError(MessagingService.NAME, MessagingServiceState.DataTimeout, message);
                    handleFailure(error);
                }
                return;
            }

            let payload = {
                contactId: self.getId(),
                messageId: messageId
            };
            let packet = new Packet(MessagingAction.Recall, payload);
            this.pipeline.send(MessagingService.NAME, packet);

            if (handleSuccess) {
                handleSuccess(message);
            }
        });

        return true;
    }

    /**
     * 通过消息 ID 查询指定消息。
     * @param {number} messageId 
     * @param {function} handler 回调函数，函数参数：({@linkcode message}:{@link Message}) 。
     */
    queryMessageById(messageId, handler) {
        if (!this.started) {
            this.start();
        }

        if (!this.storage.readMessageById(messageId, handler)) {
            handler(null);
        }
    }

    /**
     * 查询指定时间开始到当前时间的所有消息。
     * @param {number} time 指定查询的起始时间。
     * @param {function} handler 查询结果回调函数，函数参数：({@linkcode time}:number, {@linkcode result}:Array<{@link Message}>) 。
     * @returns {boolean} 如果成功执行查询返回 {@linkcode true} 。
     */
    queryMessages(time, handler) {
        if (!this.started) {
            this.start();
        }

        let ret = this.storage.readMessages(time, (beginning, result) => {
            let list = result.sort((a, b) => {
                if (a.remoteTS < b.remoteTS) return -1;
                else if (a.remoteTS > b.remoteTS) return 1;
                else return 0;
            });

            let reslist = [];
            for (let i = 0; i < list.length; ++i) {
                let message = list[i];

                // 标注 Token
                if (null != message.attachment) {
                    message.attachment.token = this.getAuthToken().code;
                }

                // 使用插件
                let hook = this.pluginSystem.getHook(InstantiateHook.NAME);
                reslist.push(hook.apply(message));
            }

            handler(beginning, reslist);
        });

        if (!ret) {
            handler(time, []);
        }

        return ret;
    }

    /**
     * 查询最近的消息记录对应的联系人或群组。
     * @param {function} handler 数据接收回调。参数：({@linkcode beginning}:number, {@linkcode list}:Array<{@link Contact}|{@link Group}>})。
     * @param {number} [beginning] 指定查询的开始时间戳。
     */
    queryRecentMessagers(handler, beginning) {
        if (!this.contactService.isReady()) {
            handler([], beginning);
            return;
        }

        let messagers = [];

        let process = (list) => {
            if (list.length == 0) {
                handler(messagers, beginning);
                return;
            }

            let data = list.shift();

            if (data.group) {
                (async ()=> {
                    let group = await this.contactService.getGroup(data.id);
                    if (group.tag != 'public' || group.state != GroupState.Normal) {
                        process(list);
                        return;
                    }

                    messagers.push(group);
                    process(list);
                })();
            }
            else {
                (async ()=> {
                    let contact = await this.contactService.getContact(data.id);
                    messagers.push(contact);
                    process(list);
                })();
            }
        };

        this.storage.queryRecentMessagers((list) => {
            process(list);
        });
    }

    /**
     * 删除指定的最近消息列表里的联系人或群组。
     * @param {Group|Contact|number} messager 指定需要移除的联系人或者群组。
     * @param {function} [handleSuccess] 操作成功回调该方法，参数：({@linkcode messagerId}:{@link number}) 。
     * @param {function} [handleFailure] 操作错误回调该方法，参数：({@linkcode error}:{@link ModuleError}) 。
     */
    deleteRecentMessager(messager, handleSuccess, handleFailure) {
        if (!this.started) {
            this.start();
        }

        let id = 0;
        if (typeof messager === 'number') {
            id = messager;
        }
        else if (messager instanceof Group) {
            id = messager.getId();
        }
        else if (messager instanceof Contact) {
            id = messager.getId();
        }
        else {
            if (handleFailure) {
                handleFailure(new ModuleError(MessagingService.NAME, MessagingServiceState.Failure, messager));
            }
            return;
        }

        this.storage.deleteRecentMessager(id, handleSuccess);
    }

    /**
     * 查询指定联系人 ID 相关的所有消息，即包括该联系人发送的消息，也包含该联系人接收的消息。从起始时间向后查询所有消息。
     * @param {Contact|number} contactOrId 指定联系人或联系人 ID 。
     * @param {number} beginning 指定查询的起始时间。
     * @param {function} handler 查询结果回调函数，函数参数：({@linkcode contactId}:number, {@linkcode beginning}:number, {@linkcode result}:Array<{@link Message}>) 。
     * @returns {boolean} 如果成功执行查询返回 {@linkcode true} 。
     */
    queryMessagesWithContact(contactOrId, beginning, handler) {
        if (!this.started) {
            this.start();
        }

        let id = contactOrId;
        if (contactOrId instanceof Contact) {
            id = contactOrId.getId();
        }
        else if (undefined !== contactOrId.id) {
            id = parseInt(contactOrId.id);
        }

        let ret = this.storage.readMessageWithContact(id, beginning, (contactId, beginning, result) => {
            let list = result.sort((a, b) => {
                if (a.remoteTS < b.remoteTS) return -1;
                else if (a.remoteTS > b.remoteTS) return 1;
                else return 0;
            });

            let reslist = [];
            for (let i = 0; i < list.length; ++i) {
                let message = list[i];

                // 标注 Token
                if (null != message.attachment) {
                    message.attachment.token = this.getAuthToken().code;
                }

                // 使用插件
                let hook = this.pluginSystem.getHook(InstantiateHook.NAME);
                reslist.push(hook.apply(message));
            }

            handler(contactId, beginning, reslist);
        });

        if (!ret) {
            handler(id, beginning, []);
        }

        return ret;
    }

    /**
     * 查询指定群组 ID 相关的所有消息。从起始时间向后查询所有消息。
     * @param {Group|number} groupOrId 指定群组或者群组 ID 。
     * @param {number} beginning 指定查询的起始时间。
     * @param {function} handler 查询结果回调函数，函数参数：({@linkcode groupId}:number, {@linkcode beginning}:number, {@linkcode result}:Array<{@link Message}>) 。
     * @returns {boolean} 如果成功执行查询返回 {@linkcode true} 。
     */
    queryMessagesWithGroup(groupOrId, beginning, handler) {
        if (!this.started) {
            this.start();
        }

        let id = groupOrId;
        if (groupOrId instanceof Group) {
            id = groupOrId.getId();
        }
        else if (undefined !== groupOrId.id) {
            id = parseInt(groupOrId.id);
        }

        let ret = this.storage.readMessageWithGroup(id, beginning, (groupId, beginning, result) => {
            let list = result.sort((a, b) => {
                if (a.remoteTS < b.remoteTS) return -1;
                else if (a.remoteTS > b.remoteTS) return 1;
                else return 0;
            });

            let reslist = [];
            for (let i = 0; i < list.length; ++i) {
                let message = list[i];

                // 标注 Token
                if (null != message.attachment) {
                    message.attachment.token = this.getAuthToken().code;
                }

                // 使用插件
                let hook = this.pluginSystem.getHook(InstantiateHook.NAME);
                reslist.push(hook.apply(message));
            }

            handler(groupId, beginning, reslist); 
        });

        if (!ret) {
            handler(id, beginning, []);
        }

        return ret;
    }

    /**
     * 查询指定联系人的最后一条消息。
     * @param {Contact|number} contactOrId 指定联系人或联系人 ID 。
     * @param {function} handler 回调函数，参数：({@linkcode message}:{@link Message}) 。
     */
    queryLastMessageWithContact(contactOrId, handler) {
        if (!this.started) {
            this.start();
        }

        let id = contactOrId;
        if (contactOrId instanceof Contact) {
            id = contactOrId.getId();
        }
        else if (undefined !== contactOrId.id) {
            id = parseInt(contactOrId.id);
        }

        this.storage.readLastMessageWtihContact(id, (message) => {
            if (null == message) {
                handler(null);
                return;
            }

            // 标注 Token
            if (null != message.attachment) {
                message.attachment.token = this.getAuthToken().code;
            }

            // 使用插件
            let hook = this.pluginSystem.getHook(InstantiateHook.NAME);
            let result = hook.apply(message);
            handler(result);
        });
    }

    /**
     * 查询指定联系人的最后一条消息。
     * @param {Group|number} groupOrId 指定群组或群组 ID 。
     * @param {function} handler 回调函数，参数：({@linkcode message}:{@link Message}) 。
     */
    queryLastMessageWithGroup(groupOrId, handler) {
        if (!this.started) {
            this.start();
        }

        let id = groupOrId;
        if (groupOrId instanceof Group) {
            id = groupOrId.getId();
        }
        else if (undefined !== groupOrId.id) {
            id = parseInt(groupOrId.id);
        }

        this.storage.readLastMessageWtihGroup(id, (message) => {
            if (null == message) {
                handler(null);
                return;
            }

            // 标注 Token
            if (null != message.attachment) {
                message.attachment.token = this.getAuthToken().code;
            }

            // Hook 实例化
            let hook = this.pluginSystem.getHook(InstantiateHook.NAME);
            let result = hook.apply(message);
            handler(result);
        });
    }

    /**
     * 查询最近的指定的联系人消息。返回的消息列表为时间戳正序。
     * @param {Contact|number} contactOrId 联系人或联系人 ID 。
     * @param {number} limit 查询的最大消息数量限制。
     * @param {function} handler 查询结果回调。参数：({@linkcode contactId}:{@linkcode number}, {@linkcode list}:{@linkcode Array<Message>}) 。
     */
    queryRecentMessagesWithContact(contactOrId, limit, handler) {
        let contactId = (typeof contactOrId === 'number') ? contactOrId : contactOrId.id;

        let process = (list)=> {
            let result = [];

            (async ()=> {
                for (let i = 0; i < list.length; ++i) {
                    let message = list[i];

                    await this.fillMessage(message);

                    // Hook 实例化
                    let hook = this.pluginSystem.getHook(InstantiateHook.NAME);
                    let newMessage = hook.apply(message);

                    result.push(newMessage);

                    if (result.length == list.length) {
                        handler(contactId, result);
                    }
                }
            })();
        };

        let list = [];

        this.storage.iterateContactMessage(contactId, Date.now(), (message) => {
            if (null == message) {
                // 按照时间戳正序排序
                let result = list.sort((a, b) => {
                    if (a.remoteTS < b.remoteTS) return -1;
                    else if (a.remoteTS > b.remoteTS) return 1;
                    else return 0;
                });

                setTimeout(function() {
                    process(result);
                }, 1);

                return true;
            }

            // 添加到列表
            list.push(message);

            if (list.length >= limit) {
                return false;
            }

            return true;
        }, true);
    }

    /**
     * 查询最近的指定的群组消息。返回的消息列表为时间戳正序。
     * @param {Group|number} groupOrId 群组或群组 ID 。
     * @param {number} limit 查询的最大消息数量限制。
     * @param {function} handler 查询结果回调。参数：({@linkcode groupId}:{@linkcode number}, {@linkcode list}:{@linkcode Array<Message>}) 。
     */
    queryRecentMessagesWithGroup(groupOrId, limit, handler) {
        let groupId = (typeof groupOrId === 'number') ? groupOrId : groupOrId.id;

        let process = (list)=> {
            let result = [];

            (async ()=> {
                for (let i = 0; i < list.length; ++i) {
                    let message = list[i];

                    await this.fillMessage(message);

                    // Hook 实例化
                    let hook = this.pluginSystem.getHook(InstantiateHook.NAME);
                    let newMessage = hook.apply(message);

                    result.push(newMessage);

                    if (result.length == list.length) {
                        handler(groupId, result);
                    }
                }
            })();
        };

        let list = [];

        this.storage.iterateGroupMessage(groupId, Date.now(), (message) => {
            if (null == message) {
                // 按照时间戳正序排序
                let result = list.sort((a, b) => {
                    if (a.remoteTS < b.remoteTS) return -1;
                    else if (a.remoteTS > b.remoteTS) return 1;
                    else return 0;
                });

                setTimeout(function() {
                    process(result);
                }, 1);

                return true;
            }

            // 添加到列表
            list.push(message);

            if (list.length >= limit) {
                return false;
            }

            return true;
        }, true);
    }

    /**
     * 按照时间戳反向遍历指定联系人的消息。
     * 遍历数据时当 {@linkcode handleTouch} 返回 {@linkcode true} 时表示继续遍历下一条消息，返回 {@linkcode false} 表示停止遍历。
     * @param {number|Contact} contactOrId 联系人或联系人 ID 。
     * @param {number} timestamp 起始时间戳。
     * @param {function} handleTouch 当遍历到数据时回调该函数。参数：({@linkcode id}:{@linkcode number}, {@linkcode message}:{@link Message}) 。
     * @param {function} handleDone 当遍历结束时回调该函数。
     */
    reverseIterateMessageWithContact(contactOrId, timestamp, handleTouch, handleDone) {
        let contactId = (typeof contactOrId === 'number') ? contactOrId : contactOrId.id;

        this.storage.iterateContactMessage(contactId, timestamp, (message, resume, stop) => {
            if (null == message) {
                // 结束
                if (handleDone) {
                    handleDone();
                }
                return true;
            }

            (async ()=> {
                await this.fillMessage(message);

                // Hook 实例化
                let hook = this.pluginSystem.getHook(InstantiateHook.NAME);
                let newMessage = hook.apply(message);

                if (handleTouch(contactId, newMessage)) {
                    resume();
                }
                else {
                    stop();
                }
            })();
        }, true);
    }

    /**
     * 按照时间戳反向遍历指定群组的消息。
     * 遍历数据时当 {@linkcode handleTouch} 返回 {@linkcode true} 时表示继续遍历下一条消息，返回 {@linkcode false} 表示停止遍历。
     * @param {number|Contact} contactOrId 群组或群组 ID 。
     * @param {number} timestamp 起始时间戳。
     * @param {function} handleTouch 当遍历到数据时回调该函数。参数：({@linkcode id}:{@linkcode number}, {@linkcode message}:{@link Message}) 。
     * @param {function} handleDone 当遍历结束时回调该函数。
     */
    reverseIterateMessageWithGroup(groupOrId, timestamp, handleTouch, handleDone) {
        let groupId = (typeof groupOrId === 'number') ? groupOrId : groupOrId.id;
        this.storage.iterateGroupMessage(groupId, timestamp, (message, resume, stop) => {
            if (null == message) {
                // 结束
                if (handleDone) {
                    handleDone();
                }
                return true;
            }

            (async ()=> {
                await this.fillMessage(message);

                // Hook 实例化
                let hook = this.pluginSystem.getHook(InstantiateHook.NAME);
                let newMessage = hook.apply(message);

                if (handleTouch(groupId, newMessage)) {
                    resume();
                }
                else {
                    stop();
                }
            })();
        }, true);
    }

    /**
     * 从服务器上下载指定时间段内的数据，数据将直接写入本地存储。
     * @param {number} [beginning] 指定获取消息的起始时间。
     * @param {number} [ending] 指定获取消息的截止时间。
     * @param {function} [handler] 指定本次查询回调，该回调函数仅用于通知该次查询结束，不携带任何消息数据。
     * @returns {boolean} 如果成功执行查询操作返回 {@linkcode true} 。
     */
    queryRemoteMessage(beginning, ending, handler) {
        if (!this.contactService.selfReady) {
            return false;
        }

        if (0 != this.pullHandlerTimer) {
            return false;
        }

        let now = Date.now();

        if (now - this.lastQueryTime < 2000) {
            // 不允许高频查询
            return false;
        }

        if (undefined !== handler && typeof handler === 'function') {
            // 设置回调
            this.pullHandler = handler;

            this.pullHandlerTimer = setTimeout(() => {
                clearTimeout(this.pullHandlerTimer);
                this.pullHandlerTimer = 0;
                this.pullHandler = null;
                // 超时也回调结束
                handler(this);
            }, 10 * 1000);
        }

        this.lastQueryTime = now;

        let beginningTime = (undefined === beginning) ? (this.lastMessageTime + 1) : beginning;
        let endingTime = (undefined === ending) ? now : ending;

        let self = this.contactService.getSelf();
        // 拉取消息
        let payload = {
            id: self.getId(),
            domain: self.getDomain(),
            device: self.getDevice().toJSON(),
            beginning: beginningTime,
            ending: endingTime
        };

        cell.Logger.d('MessagingService', 'Pull message @ ' + beginningTime + ' - ' + endingTime);

        let packet = new Packet(MessagingAction.Pull, payload);
        this.pipeline.send(MessagingService.NAME, packet);

        return true;
    }

    /**
     * 查询远端服务器上的会话数据。
     * @param {number} limit 
     * @param {function} handleSuccess 
     * @param {function} handleFailure 
     */
    queryRemoteConversations(limit, handleSuccess, handleFailure) {
        if (!this.pipeline.isReady()) {
            let error = new ModuleError(MessagingService.NAME, MessagingServiceState.Failure);
            handleFailure(error);
            return;
        }

        let payload = {
            "limit": limit
        };
        let requestPacket = new Packet(MessagingAction.GetConversations, payload);
        this.pipeline.send(MessagingService.NAME, requestPacket, (pipeline, source, packet) => {
            if (packet.getStateCode() != PipelineState.OK) {
                cell.Logger.w(MessagingService.NAME, '#queryRemoteConversations : ' + packet.getStateCode());
                let error = new ModuleError(MessagingService.NAME, MessagingServiceState.ServerFault);
                handleFailure(error);
                return;
            }

            if (packet.extractServiceStateCode() != MessagingServiceState.Ok) {
                cell.Logger.w(MessagingService.NAME, '#queryRemoteConversations : ' + packet.extractServiceStateCode());
                let error = new ModuleError(MessagingService.NAME, packet.extractServiceStateCode());
                handleFailure(error);
                return;
            }

            // 删除旧数据
            this.conversations.splice(0, this.conversations.length);

            // let total = packet.extractServiceData().total;
            let list = packet.extractServiceData().list;

            list.forEach((value) => {
                let conversation = Conversation.create(value);
                (async ()=> {
                    let conv = await this.fillConversation(conversation);
                    this.conversations.push(conv);

                    // 写入数据
                    this.storage.writeConversation(conv);

                    if (this.conversations.length == list.length) {
                        setTimeout(() => {
                            // 排序
                            this.conversations.sort((a, b) => {
                                if (a.timestamp > b.timestamp) return -1;
                                else if (a.timestamp < b.timestamp) return 1;
                                else return 0;
                            });

                            handleSuccess(this.conversations);
                        }, 0);
                    }
                })();
            });
        });
    }

    /**
     * 保存草稿。
     * @param {Contact|Group|number} target 草稿的目标实体。
     * @param {Message} message 草稿的消息实体。
     * @returns {boolean} 保存成功返回 {@linkcode true} 。
     */
    saveDraft(target, message) {
        if (!this.serviceReady) {
            return false;
        }

        this.storage.writeDraft(new MessageDraft(target, message));
        return true;
    }

    /**
     * 删除草稿。
     * @param {Contact|Group|number} target 草稿的目标实体。
     * @returns {boolean} 删除成功返回 {@linkcode true} 。
     */
    deleteDraft(target) {
        if (!this.serviceReady) {
            return false;
        }

        let id = (typeof target === 'number') ? target : target.getId();
        this.storage.deleteDraft(id);
        return true;
    }

    /**
     * 加载草稿。
     * @param {Contact|Group|number} target 草稿的目标实体。
     * @param {function} handleSuccess 成功回调。参数：({@linkcode draft}:{@link MessageDraft}) 。
     * @param {function} [handleFailure] 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     * @returns {boolean} 是否可加载。
     */
    loadDraft(target, handleSuccess, handleFailure) {
        if (!this.serviceReady) {
            let error = new ModuleError(MessagingService.NAME, MessagingServiceState.Failure, target);
            if (handleFailure) {
                handleFailure(error);
            }
            return false;
        }

        let id = 0;
        if (typeof target === 'number') {
            id = target;
        }
        else {
            id = target.getId();
        }

        this.storage.readDraft(id, (draft) => {
            if (null == draft) {
                let error = new ModuleError(MessagingService.NAME, MessagingServiceState.StorageNoData, target);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            // 使用插件
            let hook = this.pluginSystem.getHook(InstantiateHook.NAME);
            let result = hook.apply(draft.message);
            draft.message = result;
            handleSuccess(draft);
        });

        return true;
    }

    /**
     * 注册插件。
     * @param {MessagePlugin} plugin 
     */
    register(plugin) {
        if (plugin instanceof MessagePlugin) {
            this.pluginSystem.register(InstantiateHook.NAME, plugin);
        }
    }

    /**
     * 注销插件。
     * @param {MessagePlugin} plugin 
     */
    deregister(plugin) {
        if (plugin instanceof MessagePlugin) {
            this.pluginSystem.deregister(InstantiateHook.NAME, plugin);
        }
    }

    /**
     * 补充填写消息关于 Contact 和 Group 的对象。
     * @private
     * @param {Message} message 
     * @returns {Promise}
     */
    fillMessage(message) {
        return new Promise((resolve, reject) => {
            let gotSender = false;
            let gotReceiver = false;
            let gotSource = false;

            if (message.isFromGroup()) {
                this.contactService.getContact(message.getFrom(), (contact) => {
                    message.sender = contact;
                    gotSender = true;
                    if (gotSource) {
                        resolve(message);
                    }
                }, (error) => {
                    gotSender = true;
                    if (gotSource) {
                        reject(error);
                    }
                });

                this.contactService.getGroup(message.getSource(), (group) => {
                    message.sourecGroup = group;
                    gotSource = true;
                    if (gotSender) {
                        resolve(message);
                    }
                }, (error) => {
                    gotSource = true;
                    if (gotSender) {
                        reject(error);
                    }
                });
            }
            else {
                this.contactService.getContact(message.getFrom(), (contact) => {
                    message.sender = contact;
                    gotSender = true;
                    if (gotReceiver) {
                        resolve(message);
                    }
                }, (error) => {
                    gotSender = true;
                    if (gotReceiver) {
                        reject(error);
                    }
                });

                this.contactService.getContact(message.getTo(), (contact) => {
                    message.receiver = contact;
                    gotReceiver = true;
                    if (gotSender) {
                        resolve(message);
                    }
                }, (error) => {
                    gotReceiver = true;
                    if (gotSender) {
                        reject(error);
                    }
                });
            }
        });
    }

    /**
     * 填充会话数据。
     * @param {Conversation} conversation 
     * @returns {Promise}
     */
    fillConversation(conversation) {
        return new Promise((resolve, reject) => {
            if (conversation.type == ConversationType.Contact) {
                this.contactService.getContact(conversation.pivotalId, (contact) => {
                    conversation.pivotal = contact;
                    resolve(conversation);
                }, (error) => {
                    cell.Logger.w(MessagingService.NAME, '#fillConversation (Contact) - ' + conversation.id + ' : ' + error);
                    resolve(conversation);
                });
            }
            else if (conversation.type == ConversationType.Group) {
                this.contactService.getGroup(conversation.pivotalId, (group) => {
                    conversation.pivotal = group;
                    resolve(conversation);
                }, (error) => {
                    cell.Logger.w(MessagingService.NAME, '#fillConversation (Group) - ' + conversation.id + ' : ' + error);
                    resolve(conversation);
                });
            }
            else {
                resolve(conversation);
            }
        });
    }

    /**
     * 触发观察者 Notify 回调。
     * @private
     * @param {JSON|Message} payload 
     */
    triggerNotify(payload) {
        // 判断传入的数据类型
        let data = (undefined === payload.code && undefined === payload.data) ? payload : payload.data;
        let message = Message.create(data);

        let start = (this.notifiedQueue.length == 0);

        this.notifiedQueue.push(message);

        if (start) {
            this._processNotify();
        }
    }

    /**
     * @private
     */
    _processNotify() {
        (async ()=> {
            if (this.notifiedQueue.length == 0) {
                return;
            }

            let message = this.notifiedQueue.shift();

            let result = null;
            try {
                result = await this.fillMessage(message);
            } catch (error) {
                cell.Logger.d(MessagingService.NAME, error.toString());
                return;
            }

            // 赋值
            message = result;

            // 使用服务器的时间戳设置为最新消息时间
            this.refreshLastMessageTime(message);

            let promise = new Promise((resolve, reject) => {
                // 如果是群组消息，更新群组的活跃时间
                if (message.getSource() > 0) {
                    this.contactService.updateGroupActiveTime(message.getSource(), message.getRemoteTimestamp());
                }

                // 判断是否存在该消息
                this.storage.containsMessage(message, (message, contained) => {
                    // 写消息
                    this.storage.writeMessage(message);
                    resolve(contained);
                });
            });
            promise.then((contained) => {
                // 对于已经在数据库里的消息不回调 Notify 事件
                if (!contained) {
                    // 标注 Token
                    if (null != message.attachment) {
                        message.attachment.token = this.getAuthToken().code;
                    }

                    // 获取事件钩子
                    let hook = this.pluginSystem.getHook(InstantiateHook.NAME);
                    // 调用插件处理
                    message = hook.apply(message);

                    // 回调事件
                    this.notifyObservers(new ObservableEvent(MessagingEvent.Notify, message));
                }

                setTimeout(() => {
                    this._processNotify();
                }, 0);
            }).catch((error) => {
                console.log('MessagingService ' + error);
                setTimeout(() => {
                    this._processNotify();
                }, 0);
            });
        })();
    }

    /**
     * 处理 Pull 数据并回调事件。
     * @private
     * @param {JSON} payload 
     */
    triggerPull(payload) {
        if (this.pullHandlerTimer > 0) {
            clearTimeout(this.pullHandlerTimer);
            this.pullHandlerTimer = 0;
        }

        if (payload.code != MessagingServiceState.Ok) {
            this.pullHandler = null;
            this.triggerFail(MessagingAction.Pull, payload);
            return;
        }

        let data = payload.data;
        let total = data.total;
        let beginning = data.beginning;
        let ending = data.ending;
        let messages = data.messages;

        cell.Logger.d('MessagingService', 'Query/Pull messages total: ' + total + ' - ' + beginning + ' - ' + ending);

        for (let i = 0, len = messages.length; i < len; ++i) {
            this.triggerNotify(messages[i]);
        }

        if (null != this.pullHandler) {
            this.pullHandler(this);
            this.pullHandler = null;
        }
    }

    /**
     * 处理 Read 数据。
     * @private
     * @param {JSON} payload 
     */
    triggerRead(payload) {
        if (payload.code != MessagingServiceState.Ok) {
            return;
        }

        let message = Message.create(payload.data);
        (async ()=> {
            let result = await this.fillMessage(message);
            if (result instanceof ModuleError) {
                cell.Logger.e(MessagingService.NAME, result.toString());
            }

            if (message.getFrom() == this.contactService.getSelf().getId()) {
                this.storage.readMessageById(message.getId(), (message) => {
                    if (null != message) {
                        message.state = MessageState.Read;
                        this.storage.updateMessage(message);
    
                        // 标注 Token
                        if (null != message.attachment) {
                            message.attachment.token = this.getAuthToken().code;
                        }
    
                        // 使用插件
                        let hook = this.pluginSystem.getHook(InstantiateHook.NAME);
                        message = hook.apply(message);
    
                        // 事件通知
                        this.notifyObservers(new ObservableEvent(MessagingEvent.Read, message));
                    }
                });
            }
        })();
    }

    /**
     * 处理 Recall 数据。
     * @private
     * @param {JSON} payload 
     */
    triggerRecall(payload) {
        if (payload.code != MessagingServiceState.Ok) {
            this.triggerFail(MessagingAction.Recall, payload);
            return;
        }

        let message = Message.create(payload.data);

        // 从本地查询消息
        this.storage.readMessageById(message.getId(), (local) => {
            if (null == local) {
                (async ()=> {
                    let result = await this.fillMessage(message);
                    if (result instanceof ModuleError) {
                        cell.Logger.e(MessagingService.NAME, result.toString());
                    }

                    message.state = MessageState.Recalled;

                    // 更新消息内容
                    this.storage.updateMessage(message);

                    cell.Logger.d('MessagingService', 'Recall message: ' + message.getId());

                    // 标注 Token
                    if (null != message.attachment) {
                        message.attachment.token = this.getAuthToken().code;
                    }

                    // 使用插件
                    let hook = this.pluginSystem.getHook(InstantiateHook.NAME);
                    message = hook.apply(message);

                    this.notifyObservers(new ObservableEvent(MessagingEvent.Recall, message));
                })();
            }
            else {
                // 更新状态
                local.state = MessageState.Recalled;

                // 更新消息内容
                this.storage.updateMessage(local);

                cell.Logger.d('MessagingService', 'Recall message: ' + local.getId());

                // 标注 Token
                if (null != local.attachment) {
                    local.attachment.token = this.getAuthToken().code;
                }

                // 使用插件实例化
                let hook = this.pluginSystem.getHook(InstantiateHook.NAME);
                local = hook.apply(local);

                this.notifyObservers(new ObservableEvent(MessagingEvent.Recall, local));
            }
        });
    }

    /**
     * 处理接收到服务器的故障信息。
     * @private
     * @param {string} name 动作指令名。
     * @param {JSON} payload 包负载数据。
     */
    triggerFail(name, payload) {
        cell.Logger.w('MessagingService', 'Failed #' + name + ' : ' + payload.code);
    }

    /**
     * 刷新最近一条消息时间戳。
     * @private
     * @param {Message} message 最新的消息。
     */
    refreshLastMessageTime(message) {
        let updateLastTime = false;

        if (message.getRemoteTimestamp() > this.lastMessageTime) {
            this.lastMessageTime = message.getRemoteTimestamp();
            updateLastTime = true;
        }

        this.storage.updateLastMessage(message, updateLastTime);
    }

    /**
     * 处理队列。将消息从队列里出队并发送。
     * @private
     */
    _processQueue() {
        // 更新时间戳
        this.timerLastTime = Date.now();

        if (this.pushQueue.length > 0) {
            if (this.pipeline.isReady()) {
                let message = this.pushQueue.shift();

                // 进入发送中状态
                this.sendingMap.put(message.getId(), message);

                if (null != message.attachment) {
                    // 文件带附件，先处理文件
                    this._processAttachment(message);
                }
                else {
                    // 事件通知
                    if (message.scope == 0) {
                        this.notifyObservers(new ObservableEvent(MessagingEvent.Sending, message));
                    }

                    // 发送到服务器
                    let packet = new Packet(MessagingAction.Push, message.toJSON());
                    this.pipeline.send(MessagingService.NAME, packet, (pipeline, source, responsePacket) => {
                        this._processPushResult(message, responsePacket);
                    });
                }
            }
        }
    }

    /**
     * 处理消息附件。
     * @private
     * @param {Message} message 
     */
    _processAttachment(message) {
        let fs = this.kernel.getModule(FileStorage.NAME);
        fs.start();

        // 上传数据
        let anchor = fs.uploadFile(message.attachment.file, (fileAnchor) => {
            // 正在发送文件
            message.attachment.anchor = fileAnchor;

            this.notifyObservers(new ObservableEvent(MessagingEvent.Processing, message));
        }, (fileAnchor) => {
            // 文件发送完成

            // 设置锚点
            message.attachment.anchor = fileAnchor;

            // 发送到服务器
            let packet = new Packet(MessagingAction.Push, message.toJSON());
            this.pipeline.send(MessagingService.NAME, packet, (pipeline, source, responsePacket) => {
                // 处理服务返回的数据
                this._processPushResult(message, responsePacket);
            });
        }, (fileAnchor) => {
            // 错误处理
            let error = new ModuleError(MessagingService.NAME, MessagingServiceState.AttachmentError, fileAnchor);
            this.notifyObservers(new ObservableEvent(MessagingEvent.Fault, error));
        });

        message.attachment.anchor = anchor;

        // 事件通知
        if (message.scope == 0) {
            this.notifyObservers(new ObservableEvent(MessagingEvent.Sending, message));
        }
    }

    /**
     * @private
     * @param {Message} message 
     * @param {Packet} responsePacket 
     */
    _processPushResult(message, responsePacket) {
        if (null != responsePacket && responsePacket.getStateCode() == PipelineState.OK) {
            // 返回的数据
            var responseData = responsePacket.data.data;

            // 获取当前应答消息的实例
            let respMessage = this.sendingMap.remove(responseData.id);

            if (null == respMessage) {
                cell.Logger.e('MessagingService', 'Can NOT find message in cache: ' + responseData.id);
                return;
            }

            // 更新时间戳
            respMessage.remoteTS = responseData.rts;

            // 更新最近消息时间
            this.refreshLastMessageTime(respMessage);

            if (responsePacket.data.code == MessagingServiceState.Ok) {
                // 更新状态
                respMessage.state = responseData.state;

                // 更新附件
                if (responseData.attachment) {
                    let recopy = Message.create(responseData);
                    recopy.attachment.token = this.getAuthToken().code;
                    respMessage.setAttachment(recopy.attachment);
                }

                if (respMessage.scope == 0) {
                    this.notifyObservers(new ObservableEvent(MessagingEvent.Sent, respMessage));
                }
                else {
                    this.notifyObservers(new ObservableEvent(MessagingEvent.MarkOnlyOwner, respMessage));
                }
            }
            else if (responsePacket.data.code == MessagingServiceState.BeBlocked) {
                // 更新状态
                respMessage.state = responseData.state;

                if (responseData.state == MessageState.SendBlocked) {
                    this.notifyObservers(new ObservableEvent(MessagingEvent.SendBlocked, respMessage));
                }
                else if (responseData.state == MessageState.ReceiveBlocked) {
                    this.notifyObservers(new ObservableEvent(MessagingEvent.ReceiveBlocked, respMessage));
                }
                else {
                    this.notifyObservers(new ObservableEvent(MessagingEvent.Fault, respMessage));
                }
            }
            else {
                cell.Logger.w('MessagingService', 'Sent failed: ' + responsePacket.data.code);

                // 更新状态
                respMessage.state = responseData.state;

                // 进行事件通知
                let error = new ModuleError(MessagingService.NAME, responsePacket.data.code, respMessage);
                this.notifyObservers(new ObservableEvent(MessagingEvent.Fault, error));
            }

            // 更新存储
            this.storage.updateMessage(respMessage);
        }
        else {
            cell.Logger.e('MessagingService', 'Pipeline error : ' + MessagingAction.Push + ' - ' + responsePacket.getStateCode());

            this.sendingMap.remove(message.getId());

            message.state = MessageState.Fault;

            // 更新存储
            this.storage.updateMessage(message);

            let error = new ModuleError(MessagingService.NAME, MessagingServiceState.ServerFault, message);
            this.notifyObservers(new ObservableEvent(MessagingEvent.Fault, error));
        }
    }

    /**
     * 触发联系人事件。
     * @private
     * @param {ObservableEvent} event 
     */
    _fireContactEvent(event) {
        if (!this.started) {
            return;
        }

        if (event.name == ContactEvent.SignIn || event.name == ContactEvent.Comeback) {
            let self = event.data;

            if (!this.serviceReady) {
                // 未就绪，执行就绪操作
                this._prepare(self);
            }
        }
        else if (event.name == ContactEvent.SignOut) {
            // 关闭存储
            this.storage.close();
        }
    }

    /**
     * 触发文件存储器事件。
     * @private
     * @param {ObservableEvent} event 
     */
    _fireFileStorageEvent(event) {
        if (!this.started) {
            return;
        }

        if (event.getName() == FileStorageEvent.FileUpdated) {

        }
    }
}
