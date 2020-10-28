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
import { AuthService } from "../auth/AuthService";
import { OrderMap } from "../util/OrderMap";
import { Module } from "../core/Module"
import { ContactService } from "../contact/ContactService";
import { ContactEvent } from "../contact/ContactEvent";
import { Contact } from "../contact/Contact";
import { Group } from "../contact/Group";
import { Packet } from "../core/Packet";
import { Message } from "./Message";
import { MessageState } from "./MessageState";
import { MessagingAction } from "./MessagingAction";
import { MessagingPipelineListener } from "./MessagingPipelineListener";
import { MessagingEvent } from "./MessagingEvent";
import { MessagingStorage } from "./MessagingStorage";
import { FileMessage } from "./FileMessage";
import { FileStorage } from "../filestorage/FileStorage"
import { ObservableState } from "../core/ObservableState";
import { StateCode } from "../core/StateCode";
import { PluginSystem } from "../core/PluginSystem";
import { NotifyHook } from "./extends/NotifyHook";

/**
 * 消息服务模块接口。
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
         * 联系模块的事件回调函数。
         * @type {function}
         */
        this.contactEventFun = null;

        /**
         * 发送队列。
         * @type {Array<Message>}
         */
        this.pushQueue = [];

        /**
         * 正在发送队列。
         * @type {OrderMap<number,Message>}
         */
        this.sendingMap = new OrderMap();

        /**
         * 消息发送队列定时器。
         * @type {object}
         */
        this.timer = 0;

        /**
         * 用于监听数据通道数据的监听器。
         * @type {MessagingPipelineListener}
         */
        this.pipelineListener = new MessagingPipelineListener(this);

        /**
         * 消息存储器。
         * @type {MessagingStorage}
         */
        this.storage = new MessagingStorage();

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

        // 获取联系人模块
        this.contactService = this.kernel.getModule(ContactService.NAME);
        let fun = (state) => {
            this._fireContactEvent(state);
        };
        this.contactService.attach(fun);
        this.contactEventFun = fun;

        // 开启存储器
        this.storage.open(AuthService.DOMAIN);

        // 添加数据通道的监听器
        this.pipeline.addListener(MessagingService.NAME, this.pipelineListener);

        if (this.timer > 0) {
            clearInterval(this.timer);
        }
        this.timer = setInterval((e) => {
            this._processQueue();
        }, 100);

        if (0 == this.lastMessageTime) {
            this.storage.queryLastMessageTime((value) => {
                if (value == 0) {
                    this.lastMessageTime = Date.now() - (7 * 24 * 60 * 60000);
                }
                else {
                    this.lastMessageTime = value;
                }
            });
        }

        return true;
    }

    /**
     * @inheritdoc
     */
    stop() {
        super.stop();

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

        // 关闭存储器
        this.storage.close();
    }

    /**
     * 组装插件系统。
     * @returns {PluginSystem}
     */
    assemble() {
        this.pluginSystem.addHook(new NotifyHook());
    }

    /**
     * 消息是否是当前签入的联系人账号发出的。
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
     * 向指定联系人发送消息。
     * @param {number|Contact} contact 指定联系人或联系人 ID 。
     * @param {JSON|Message} message 指定消息实例或消息内容。
     * @returns {Message} 如果消息成功写入数据通道返回 {@link Message} 实例，否则返回 {@linkcode null} 值。
     */
    sendToContact(contact, message) {
        let self = this.contactService.getSelf();
        if (null == self) {
            return null;
        }

        var msg = message;
        if (!(message instanceof Message)) {
            msg = new Message(message);
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

        // 更新状态
        let promise = new Promise((resolve, reject) => {
            // 存储
            this.storage.writeMessage(msg);

            // 事件通知
            this.nodifyObservers(new ObservableState(MessagingEvent.Sending, msg));
            resolve(msg);
        });
        promise.then((msg) => {
            // 写入队列
            this.pushQueue.push(msg);
        });
    
        return msg;
    }

    /**
     * 向指定群组发送消息。
     * @param {Group|number|string} group 指定群组或群组 ID 。
     * @param {JSON|Message} message 指定消息实例或消息内容。
     * @returns {Message} 如果消息成功写入数据通道返回 {@link Message} 实例，否则返回 {@linkcode null} 值。
     */
    sendToGroup(group, message) {
        let self = this.contactService.getSelf();
        if (null == self) {
            return null;
        }

        var msg = message;
        if (!(message instanceof Message)) {
            msg = new Message(message);
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

        msg.from = self.getId();
        msg.source = source;
        msg.localTS = Date.now();
        msg.remoteTS = msg.localTS;

        // 更新状态
        let promise = new Promise((resolve, reject) => {
            // 存储
            this.storage.writeMessage(msg);

            // 事件通知
            this.nodifyObservers(new ObservableState(MessagingEvent.Sending, msg));
            resolve(msg);
        });
        promise.then((msg) => {
            // 写入队列
            this.pushQueue.push(msg);
        });

        return msg;
    }

    /**
     * 查询指定时间开始到当前时间的所有消息。
     * @param {number} time 指定查询的起始时间。
     * @param {function} handler 查询结果回调函数，函数参数：({@linkcode time}:number, {@linkcode result}:Array<{@link Message}>) 。
     * @returns {boolean} 如果成功执行查询返回 {@linkcode true} 。
     */
    queryMessage(time, handler) {
        return this.storage.readMessage(time, (start, result) => {
            result.sort((a, b) => {
                if (a.remoteTS < b.remoteTS) return -1;
                else if (a.remoteTS > b.remoteTS) return 1;
                else return 0;
            });
            handler(start, result);
        });
    }

    /**
     * 查询指定联系人 ID 相关的所有消息，即包括该联系人发送的消息，也包含该联系人接收的消息s。
     * @param {number} id 指定联系人 ID 。
     * @param {number} time 指定查询的起始时间。
     * @param {function} handler 查询结果回调函数，函数参数：({@linkcode contactId}:number, {@linkcode time}:number, {@linkcode result}:Array<{@link Message}>) 。
     * @returns {boolean} 如果成功执行查询返回 {@linkcode true} 。
     */
    queryMessageWithContact(id, time, handler) {
        return this.storage.readMessageWithContact(id, time, (contactId, start, result) => {
            result.sort((a, b) => {
                if (a.remoteTS < b.remoteTS) return -1;
                else if (a.remoteTS > b.remoteTS) return 1;
                else return 0;
            });
            handler(contactId, start, result); 
        });
    }

    /**
     * 查询服务器上的消息。
     * @private
     * @param {number} [beginning] 指定获取消息的起始时间。
     * @param {number} [ending] 指定获取消息的截止时间。
     * @returns {boolean} 如果成功执行查询返回 {@linkcode true} 。
     */
    queryRemoteMessage(beginning, ending) {
        if (!this.contactService.selfReady) {
            return false;
        }

        let now = Date.now();

        if (now - this.lastQueryTime < 2000) {
            // 不允许高频查询
            return false;
        }

        this.lastQueryTime = now;

        let beginningTime = (undefined === beginning) ? this.lastMessageTime : beginning;
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
     * 触发观察者 Notify 回调。
     * @private
     * @param {JSON|Message} payload 
     */
    triggerNotify(payload) {
        // 判断传入的数据类型
        let data = (undefined === payload.code && undefined === payload.data) ? payload : payload.data;
        let message = Message.create(data);

        message.state = MessageState.Sent;

        // 使用服务器的时间戳设置为最新消息时间
        this.refreshLastMessageTime(message.getRemoteTimestamp());

        // 下钩子
        let hook = this.pluginSystem.getHook(MessagingEvent.Notify);
        // 调用插件处理
        message = hook.apply(message);

        let promise = new Promise((resolve, reject) => {
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
                // 回调事件
                this.nodifyObservers(new ObservableState(MessagingEvent.Notify, message));
            }
        });
    }

    /**
     * 处理 Pull 数据并回调事件。
     * @private
     * @param {JSON} payload 
     */
    triggerPull(payload) {
        if (payload.code != 0) {
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
    }

    /**
     * 处理接收到服务器的故障信息。
     * @param {string} name 动作指令名。
     * @param {JSON} payload 包负载数据。
     */
    triggerFail(name, payload) {
        cell.Logger.w('MessagingService', 'Failed #' + name + ' : ' + payload.code);
    }

    /**
     * 刷新最近一条消息时间戳。
     * @param {number} value 新的时间戳。
     */
    refreshLastMessageTime(value) {
        if (value > this.lastMessageTime) {
            this.lastMessageTime = value;
            this.storage.updateLastMessageTime(value);
        }
    }

    /**
     * 处理队列。将消息从队列里出队并发送。
     * @private
     */
    _processQueue() {
        if (this.pushQueue.length > 0) {
            if (this.pipeline.isReady()) {
                let message = this.pushQueue.shift();

                // 进入发送中状态
                this.sendingMap.put(message.getId(), message);

                if (message instanceof FileMessage) {
                    this._processFile(message);
                }
                else {
                    // 发送到服务器
                    let packet = new Packet(MessagingAction.Push, message.toJSON());
                    this.pipeline.send(MessagingService.NAME, packet, (pipeline, source, responsePacket) => {
                        if (null != responsePacket && responsePacket.getStateCode() == StateCode.OK) {
                            let respMessage = this.sendingMap.remove(responsePacket.data.data.id);
                            if (null == respMessage) {
                                cell.Logger.e('MessagingService', 'Can NOT find message in cache: ' + responsePacket.data.data.id);
                                return;
                            }

                            // 更新时间戳
                            respMessage.remoteTS = responsePacket.data.data.rts;
                            this.refreshLastMessageTime(respMessage.remoteTS);

                            if (responsePacket.data.code == 0) {
                                respMessage.state = MessageState.Sent;

                                let state = new ObservableState(MessagingEvent.Sent, respMessage);
                                this.nodifyObservers(state);
                            }
                            else {
                                cell.Logger.w('MessagingService', 'Sent failed: ' + responsePacket.data.code);

                                respMessage.state = MessageState.Fault;

                                // 回调错误
                                let state = new ObservableState(MessagingEvent.SendFailed, respMessage);
                                this.nodifyObservers(state);
                            }

                            // 更新存储
                            this.storage.updateMessage(respMessage);
                        }
                        else {
                            cell.Logger.e('MessagingService', 'Pipeline error : ' + MessagingAction.Push + ' - ' + responsePacket.getStateCode());
                        }
                    });
                }
            }
        }
    }

    /**
     * 处理文件消息。
     * @param {FileMessage} fileMessage 
     */
    _processFile(fileMessage) {
        let fs = this.kernel.getModule(FileStorage.NAME);
        fs.uploadFile(fileMessage.getFile(), (fileAnchor) => {
            // 正在发送文件
            fileMessage.payload._file_ = fileAnchor.toJSON();

            let state = new ObservableState(MessagingEvent.Sending, fileMessage);
            this.nodifyObservers(state);
        }, (fileAnchor) => {
            // 更新 Payload 内的 _file_ 字段
            fileMessage.payload._file_ = fileAnchor.toJSON();

            // 发送到服务器
            let packet = new Packet(MessagingAction.Push, fileMessage.toJSON());
            this.pipeline.send(MessagingService.NAME, packet, (pipeline, source, responsePacket) => {
                if (null == responsePacket || responsePacket.getStateCode() != StateCode.OK) {
                    // TODO 错误处理
                    return;
                }

                fileMessage.state = MessageState.Sent;

                let state = new ObservableState(MessagingEvent.Sent, fileMessage);
                this.nodifyObservers(state);
            });
        }, (fileAnchor) => {
            // TODO 错误处理
        });
    }

    /**
     * 触发联系人事件。
     * @private
     * @param {ObservableState} state 
     */
    _fireContactEvent(state) {
        if (state.name == ContactEvent.SignIn || state.name == ContactEvent.Comeback) {
            let self = state.data;

            // 启动存储
            this.storage.open(self.getDomain());

            if (this.lastMessageTime > 0) {
                this.queryRemoteMessage();
            }
            else {
                setTimeout(() => {
                    if (this.lastMessageTime > 0) {
                        this.queryRemoteMessage();
                    }
                }, 1000);
            }
        }
    }
}
