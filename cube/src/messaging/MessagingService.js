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
import { Module } from "../core/Module"
import { ContactService } from "../contacts/ContactService";
import { ContactEvent } from "../contacts/ContactEvent";
import { Contact } from "../contacts/Contact";
import { Group } from "../contacts/Group";
import { Packet } from "../core/Packet";
import { Message } from "./Message";
import { MessageState } from "./MessageState";
import { MessagingAction } from "./MessagingAction";
import { MessagingPipelineListener } from "./MessagingPipelineListener";
import { MessagingEvent } from "./MessagingEvent";
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
         * @type {Array<Message>}
         */
        this.sendingQueue = [];

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
         * 是否拉取过最近的消息。
         * @type {boolean}
         */
        this.pulled = false;
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

        // 添加数据通道的监听器
        this.pipeline.addListener(MessagingService.NAME, this.pipelineListener);

        if (this.timer > 0) {
            clearInterval(this.timer);
        }
        this.timer = setInterval((e) => {
            this._processQueue();
        }, 100);

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
    }

    /**
     * 组装插件系统。
     * @returns {PluginSystem}
     */
    assemble() {
        this.pluginSystem.addHook(new NotifyHook());
    }

    /**
     * 向指定联系人发送消息。
     * @param {number|Contact} contact 指定联系人。
     * @param {Message} message 指定消息内容。
     * @returns {boolean} 如果消息成功写入数据通道返回 {@linkcode true} ，否则返回 {@linkcode false} 。
     */
    sendToContact(contact, message) {
        let self = this.contactService.getSelf();
        if (null == self) {
            return false;
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
            return false;
        }
        
        message.from = self.getId();
        message.to = to;
        message.localTS = Date.now();

        this.pushQueue.push(message);

        return true;
    }

    /**
     * 向指定群组发送消息。
     * @param {Group} group 指定群组。
     * @param {Message} message 指定消息内容。
     * {boolean} 如果消息成功写入数据通道返回 {@linkcode true} ，否则返回 {@linkcode false} 。
     */
    sendToGroup(group, message) {
        let self = this.contactService.getSelf();
        if (null == self) {
            return false;
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
            return false;
        }

        message.from = self.getId();
        message.source = source;
        message.localTS = Date.now();

        this.pushQueue.push(message);

        // 更新状态
        message.state = MessageState.Sending;

        return true;
    }

    /**
     * 触发观察者 Notify 回调。
     * @private
     * @param {JSON} payload 
     */
    triggerNotify(payload) {
        let data = payload.data;
        let message = Message.create(data);

        // 下钩子
        let hook = this.pluginSystem.getHook(MessagingEvent.Notify);
        // 调用插件处理
        message = hook.apply(message);

        // 回调事件
        this.nodifyObservers(new ObservableState(MessagingEvent.Notify, message));
    }

    /**
     * 处理 Pull 数据并回调事件。
     * @private
     * @param {JSON} payload 
     */
    triggerPull(payload) {
        let data = payload.data;
        let total = data.total;
        let beginning = data.beginning;
        let ending = data.ending;
        let messages = data.messages;
        for (let i = 0, len = messages.length; i < len; ++i) {
            this.triggerNotify(messages[i]);
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

                if (message instanceof FileMessage) {
                    this._processFile(message);
                }
                else {
                    // 发送到服务器
                    let packet = new Packet(MessagingAction.Push, message.toJSON());
                    this.pipeline.send(MessagingService.NAME, packet, (pipeline, source, responsePacket) => {
                        if (null != responsePacket && responsePacket.getStateCode() == StateCode.OK) {
                            if (responsePacket.data.code == 0) {
                                message.state = MessageState.Sent;

                                let state = new ObservableState(MessagingEvent.Sent, message);
                                this.nodifyObservers(state);
                            }
                            else {
                                // TODO 回调
                                cell.Logger.e('MessagingService', 'Sent failed: ' + responsePacket.data.code);
                            }
                        }
                        else {
                            cell.Logger.e('MessagingService', 'Pipeline error');
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
        if (state.name == ContactEvent.SignIn) {
            let self = state.data;

            if (!this.pulled) {
                // 拉取消息
                let payload = {
                    id: self.getId(),
                    domain: self.getDomain(),
                    device: self.getDevice().toJSON()
                };

                let packet = new Packet(MessagingAction.Pull, payload);
                this.pipeline.send(MessagingService.NAME, packet);

                this.pulled = true;
            }
        }
    }
}
