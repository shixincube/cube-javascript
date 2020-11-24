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

import { Module } from "../core/Module";
import { ContactEvent } from "../contact/ContactEvent";
import { Contact } from "../contact/Contact";
import { ContactService } from "../contact/ContactService";
import { Packet } from "../core/Packet";
import { OrderMap } from "../util/OrderMap";
import { CommField } from "./CommField";
import { MultipointCommAction } from "./MultipointCommAction";
import { RTCEndpoint } from "./RTCEndpoint";
import { MediaConstraint } from "./MediaConstraint";
import { MultipointCommState } from "./MultipointCommState";
import { CommPipelineListener } from "./CommPipelineListener";
import { ObservableState } from "../core/ObservableState";
import { MultipointCommEvent } from "./MultipointCommEvent";
import { Signaling } from "./Signaling";
import { ModuleError } from "../core/error/ModuleError";

/**
 * 多方通信服务。
 */
export class MultipointComm extends Module {

    static NAME = 'MultipointComm';

    /**
     * 构造函数。
     */
    constructor() {
        super(MultipointComm.NAME);

        /**
         * 管道监听器。
         * @type {CommPipelineListener}
         */
        this.pipelineListener = new CommPipelineListener(this);

        /**
         * 个人的私有通信场。
         * @type {CommField}
         */
        this.privateField = null;

        /**
         * RTC 节点。
         * @type {RTCEndpoint}
         */
        this.rtcEndpoint = null;

        /**
         * 管理的通信场域。
         * @type {OrderMap<number,CommField>}
         */
        this.fields = new OrderMap();

        /**
         * 当前工作的通讯场域。
         * @type {CommField}
         */
        this.currentField = null;

        /**
         * 来自主叫的信令。
         * @type {Signaling}
         */
        this.offerSignaling = null;

        /**
         * 来自被叫的信令。
         * @type {Signaling}
         */
        this.answerSignaling = null;

        /**
         * 呼叫定时器。
         * @type {number}
         */
        this.callTimer = 0;

        /**
         * 被叫定时器。
         * @type {number}
         */
        this.newCallTimer = 0;

        /**
         * 呼叫超时。
         * @type {number}
         */
        this.callTimeout = 30000;
    }

    /**
     * @inheritdoc
     */
    start() {
        if (!super.start()) {
            return false;
        }

        // 添加监听器
        this.pipeline.addListener(MultipointComm.NAME, this.pipelineListener);

        let contactService = this.kernel.getModule(ContactService.NAME);
        contactService.attachWithName(ContactEvent.SignIn, (state) => {
            // 创建个人通信场
            if (null == this.privateField) {
                let self = state.data;
                this.privateField = new CommField(self.getId(), self, this.pipeline);
            }
        });
        let self = contactService.getSelf();
        if (null != self) {
            // 创建个人通信场
            this.privateField = new CommField(self.getId(), self, this.pipeline);
        }

        return true;
    }

    /**
     * @inheritdoc
     */
    stop() {
        super.stop();

        if (null != this.rtcEndpoint) {
            if (this.rtcEndpoint.isWorking()) {
                this.terminateCall();
            }
        }

        this.videoElem.pause();
        this.videoElem.remove();

        this.pipeline.removeListener(MultipointComm.NAME, this.pipelineListener);
    }

    /**
     * @returns {HTMLElement} 返回本地视频标签的 DOM 元素。
     */
    getLocalVideoElement() {
        let rtcEndpoint = this.getRTCEndpoint();
        return rtcEndpoint.localVideoElem;
    }

    /**
     * 设置本地视频标签的 DOM 元素。
     * @param {HTMLElement} value 
     */
    setLocalVideoElement(value) {
        let rtcEndpoint = this.getRTCEndpoint();
        rtcEndpoint.localVideoElem = value;
    }

    /**
     * @returns {HTMLElement} 返回远端视频标签的 DOM 元素。
     */
    getRemoteVideoElement() {
        let rtcEndpoint = this.getRTCEndpoint();
        return rtcEndpoint.remoteVideoElem;
    }

    /**
     * 设置远端视频标签的 DOM 元素。
     * @param {HTMLElement} value 
     */
    setRemoteVideoElement(value) {
        let rtcEndpoint = this.getRTCEndpoint();
        rtcEndpoint.remoteVideoElem = value;
    }

    /**
     * @private
     */
    getRTCEndpoint() {
        if (null == this.rtcEndpoint) {
            let cs = this.kernel.getModule(ContactService.NAME);
            let self = cs.getSelf();
            this.rtcEndpoint = new RTCEndpoint(self, self.getDevice());

            this.rtcEndpoint.localVideoElem = document.createElement('video');
            this.rtcEndpoint.localVideoElem.width = 480;
            this.rtcEndpoint.localVideoElem.height = 360;

            this.rtcEndpoint.remoteVideoElem = document.createElement('video');
            this.rtcEndpoint.remoteVideoElem.width = 480;
            this.rtcEndpoint.remoteVideoElem.height = 360;
        }

        return this.rtcEndpoint;
    }

    /**
     * 呼叫指定场域或者联系人。
     * @param {CommField|Contact} fieldOrContact 
     * @param {MediaConstraint} mediaConstraint 
     * @param {function} [successCallback]
     * @param {function} [failureCallback]
     * @returns {boolean}
     */
    makeCall(fieldOrContact, mediaConstraint, successCallback, failureCallback) {
        if (null == this.privateField) {
            // 联系人模块没有完成签入操作
            let error = new ModuleError(MultipointComm.NAME, MultipointCommState.Uninitialized, fieldOrContact);
            if (failureCallback) {
                failureCallback(error);
            }
            this.notifyObservers(new ObservableState(MultipointCommEvent.CallFailed, error));
            return false;
        }

        // 获取本地 RTC 节点
        let rtcEndpoint = this.getRTCEndpoint();

        if (rtcEndpoint.isWorking()) {
            // 正在通话中
            let error = new ModuleError(MultipointComm.NAME, MultipointCommState.CallerBusy, fieldOrContact);
            if (failureCallback) {
                failureCallback(error);
            }
            this.notifyObservers(new ObservableState(MultipointCommEvent.CallFailed, error));
            return false;
        }

        let successHandler = (signaling) => {
            if (successCallback) {
                successCallback(fieldOrContact);
            }
            this.notifyObservers(new ObservableState(MultipointCommEvent.Ringing, fieldOrContact));
        };

        let failureHandler = (error) => {
            if (failureCallback) {
                failureCallback(error);
            }
            if (this.callTimer > 0) {
                clearTimeout(this.callTimer);
                this.callTimer = 0;
            }
            this.notifyObservers(new ObservableState(MultipointCommEvent.CallFailed, error));
        };

        (new Promise((resolve, reject) => {
            // 启动定时器
            this.callTimer = setTimeout(() => {
                this.fireCallTimeout();
            }, this.callTimeout);

            resolve();
        })).then(() => {
            // 回调 InProgress 事件
            this.notifyObservers(new ObservableState(MultipointCommEvent.InProgress, fieldOrContact));
        });

        if (fieldOrContact instanceof Contact) {
            // 呼叫指定联系人
            // 1. 先申请主叫，从而设置目标
            this.privateField.applyCall(this.privateField.getFounder(), fieldOrContact, (commField, proposer, target) => {
                this.privateField.caller = this.privateField.getFounder();
                this.privateField.callee = fieldOrContact;
                this.currentField = this.privateField;

                // 2. 启动 RTC 节点，发起 Offer
                this.privateField.launchCaller(rtcEndpoint, mediaConstraint, successHandler, failureHandler);
            }, (error) => {
                failureHandler(error);
            });
        }
        else if (fieldOrContact instanceof CommField) {
            this.currentField = fieldOrContact;

            // 呼入 Comm Field
            fieldOrContact.launchCaller(rtcEndpoint, mediaConstraint, successHandler, failureHandler);
        }
        else {
            return false;
        }

        return true;
    }

    /**
     * 应答呼叫。
     * @param {CommField|Contact} fieldOrContact 
     * @param {MediaConstraint} mediaConstraint 
     * @param {function} [successCallback]
     * @param {function} [failureCallback]
     * @returns {boolean}
     */
    answerCall(fieldOrContact, mediaConstraint, successCallback, failureCallback) {
        if (this.newCallTimer > 0) {
            clearTimeout(this.newCallTimer);
            this.newCallTimer = 0;
        }

        if (null == this.offerSignaling) {
            let error = new ModuleError(MultipointComm.NAME, MultipointCommState.SignalingError, fieldOrContact);
            if (failureCallback) {
                failureCallback(error);
            }
            this.notifyObservers(new ObservableState(MultipointCommEvent.CallFailed, error));
            return false;
        }

        let rtcEndpoint = this.getRTCEndpoint();

        if (rtcEndpoint.isWorking()) {
            // 正在通话中
            let error = new ModuleError(MultipointComm.NAME, MultipointCommState.CalleeBusy, fieldOrContact);
            if (failureCallback) {
                failureCallback(error);
            }
            this.notifyObservers(new ObservableState(MultipointCommEvent.CallFailed, error));
            return false;
        }

        let successHandler = (signaling) => {
            if (successCallback) {
                successCallback(fieldOrContact);
            }
            this.notifyObservers(new ObservableState(MultipointCommEvent.Connected, fieldOrContact));
        };

        let failureHandler = (error) => {
            if (failureCallback) {
                failureCallback(error);
            }
            this.notifyObservers(new ObservableState(MultipointCommEvent.CallFailed, error));
        };

        (new Promise((resolve, reject) => {
            resolve();
        })).then(() => {
            // 回调 InProgress 事件
            this.notifyObservers(new ObservableState(MultipointCommEvent.InProgress, fieldOrContact));
        });

        if (fieldOrContact instanceof Contact) {
            // 应答指定联系人
            // 1. 先申请进入
            this.privateField.applyEnter(rtcEndpoint.getContact(), rtcEndpoint.getDevice(), (contact, device) => {
                this.privateField.caller = fieldOrContact;
                this.privateField.callee = this.privateField.getFounder();
                this.currentField = this.privateField;

                // 2. 启动 RTC 节点，发起 Answer
                this.privateField.launchCallee(rtcEndpoint,
                    this.offerSignaling.sessionDescription, mediaConstraint, successHandler, failureHandler);
            }, (error) => {
                failureHandler(error);
            });
        }
        else if (fieldOrContact instanceof CommField) {
            this.currentField = fieldOrContact;

            // 应答 Comm Field
            fieldOrContact.launchCallee(rtcEndpoint,
                this.offerSignaling.sessionDescription, mediaConstraint, successHandler, failureHandler);
        }
        else {
            return false;
        }

        return true;
    }

    /**
     * 终止当前的通话。
     */
    terminateCall() {
        if (this.callTimer > 0) {
            clearTimeout(this.callTimer);
            this.callTimer = 0;
        }

        if (this.newCallTimer > 0) {
            clearTimeout(this.newCallTimer);
            this.newCallTimer = 0;
        }

        let rtcEndpoint = this.getRTCEndpoint();

        let field = this.currentField;
        let callee = null;

        if (null != this.offerSignaling) {
            callee = this.offerSignaling.callee;
        }
        else if (null != this.answerSignaling) {
            callee = this.answerSignaling.callee;
        }
        else {
            if (!rtcEndpoint.isWorking()) {
                return false;
            }

            let signaling = new Signaling(MultipointCommAction.Bye, field, 
                this.privateField.founder, this.privateField.founder.getDevice());
            let packet = new Packet(MultipointCommAction.Bye, signaling.toJSON());
            this.pipeline.send(MultipointComm.NAME, packet);

            this.offerSignaling = null;
            this.answerSignaling = null;
            rtcEndpoint.close();
            return true;
        }

        if (!rtcEndpoint.ready && callee.getId() == this.privateField.founder.getId()) {
            // 被叫端拒绝通话
            let signaling = new Signaling(MultipointCommAction.Busy, field, 
                this.privateField.founder, this.privateField.founder.getDevice());
            let packet = new Packet(MultipointCommAction.Busy, signaling.toJSON());
            this.pipeline.send(MultipointComm.NAME, packet);
        }
        else {
            let signaling = new Signaling(MultipointCommAction.Bye, field, 
                this.privateField.founder, this.privateField.founder.getDevice());
            let packet = new Packet(MultipointCommAction.Bye, signaling.toJSON());
            this.pipeline.send(MultipointComm.NAME, packet);
        }

        this.offerSignaling = null;
        this.answerSignaling = null;

        rtcEndpoint.close();

        return true;
    }

    /**
     * 触发呼叫超时。
     * @private
     */
    fireCallTimeout() {
        if (this.callTimer > 0) {
            clearTimeout(this.callTimer);
            this.callTimer = 0;
        }

        if (this.currentField.isPrivate()) {
            this.notifyObservers(new ObservableState(MultipointCommEvent.CallTimeout, this.privateField.callee));
        }
        else {
            this.notifyObservers(new ObservableState(MultipointCommEvent.CallTimeout, this.currentField));
        }

        this.terminateCall();
    }

    /**
     * 触发被叫超时。
     * @private
     */
    fireNewCallTimeout() {
        if (this.newCallTimer > 0) {
            clearTimeout(this.newCallTimer);
            this.newCallTimer = 0;
        }

        if (this.offerSignaling.field.isPrivate()) {
            this.terminateCall();
        }
        else {
            this.terminateCall();
        }
    }

    /**
     * 处理 Offer 信令。
     * @private
     * @param {JSON} payload 
     * @param {object} context 
     */
    triggerOffer(payload, context) {
        if (null != context) {
            // context 不是 null 值时，表示该信令是由本终端发出的，因此无需处理，直接返回
            return;
        }

        if (null != this.offerSignaling) {
            // 已经有一个呼叫未结束
            if (this.newCallTimer > 0) {
                clearTimeout(this.newCallTimer);
                this.newCallTimer = 0;
            }
        }

        let data = payload.data;
        this.offerSignaling = Signaling.create(data, this.pipeline);

        let rtcEndpoint = this.getRTCEndpoint();

        // 检查当期是否有通话正在进行
        if (rtcEndpoint.isWorking()) {
            // 应答忙音 Busy
            let busy = new Signaling(MultipointCommAction.Busy, this.offerSignaling.field,
                rtcEndpoint.getContact(), rtcEndpoint.getDevice());
            let packet = new Packet(MultipointCommAction.Busy, busy.toJSON());
            this.pipeline.send(MultipointComm.NAME, packet);
            return;
        }

        this.newCallTimer = setTimeout(() => {
            this.fireNewCallTimeout();
        }, this.callTimeout - 5000);

        if (this.offerSignaling.field.isPrivate()) {
            // 来自个人的通话申请
            this.notifyObservers(new ObservableState(MultipointCommEvent.NewCall, this.offerSignaling.caller));
        }
        else {
            // 来自场域的通话申请
            this.notifyObservers(new ObservableState(MultipointCommEvent.NewCall, this.offerSignaling.field));
        }
    }

    /**
     * 处理 Answer 信令。
     * @private
     * @param {JSON} payload 
     * @param {object} context 
     */
    triggerAnswer(payload, context) {
        if (null != context) {
            // context 不是 null 值时，表示该信令是由本终端发出的，因此无需处理，直接返回
            return;
        }

        let rtcEndpoint = this.getRTCEndpoint();
        if (!rtcEndpoint.isWorking()) {
            return;
        }

        let data = payload.data;
        this.answerSignaling = Signaling.create(data, this.pipeline);

        if (this.answerSignaling.field.isPrivate()) {
            rtcEndpoint.doAnswer(this.answerSignaling.sessionDescription, () => {
                this.notifyObservers(new ObservableState(MultipointCommEvent.Connected, this.answerSignaling.callee));
            }, (error) => {
                this.notifyObservers(new ObservableState(MultipointCommEvent.CallFailed, error));
            });
        }
        else {
            rtcEndpoint.doAnswer(this.answerSignaling.sessionDescription, () => {
                this.notifyObservers(new ObservableState(MultipointCommEvent.Connected, this.answerSignaling.field));
            }, (error) => {
                this.notifyObservers(new ObservableState(MultipointCommEvent.CallFailed, error));
            });
        }
    }

    /**
     * 处理 Candidate 信令。
     * @private
     * @param {JSON} payload 
     * @param {object} context 
     */
    triggerCandidate(payload, context) {
        if (null != context) {
            // context 不是 null 值时，表示该信令是由本终端发出的，因此无需处理，直接返回
            return;
        }

        let signaling = Signaling.create(payload.data, this.pipeline);

        let rtcEndpoint = this.getRTCEndpoint();

        if (null != signaling.candidate) {
            rtcEndpoint.doCandidate(signaling.candidate);
        }
        else if (null != signaling.candidates) {
            let list = signaling.candidates;
            for (let i = 0; i < list.length; ++i) {
                rtcEndpoint.doCandidate(list[i]);
            }
        }
    }

    /**
     * 处理 Busy 信令。
     * @private
     * @param {JSON} payload 
     * @param {object} context
     */
    triggerBusy(payload, context) {
        let signaling = Signaling.create(payload.data, this.pipeline);
        if (signaling.field.isPrivate()) {
            if (signaling.field.getId() == this.privateField.getId()) {
                // 本终端发送的 Busy
                let peer = this.privateField.founder.getId() == signaling.caller.getId() ? 
                        signaling.callee : signaling.caller;
                // 收到本终端 Busy 时，回调 Bye
                this.notifyObservers(new ObservableState(MultipointCommEvent.Bye, peer));
            }
            else {
                // 收到其他终端的 Busy
                let peer = this.privateField.founder.getId() == signaling.caller.getId() ? 
                        signaling.callee : signaling.caller;
                this.notifyObservers(new ObservableState(MultipointCommEvent.Busy, peer));

                // 终止通话
                this.terminateCall();
            }
        }
        else {
            this.notifyObservers(new ObservableState(MultipointCommEvent.Busy, signaling.field));
        }
    }

    /**
     * 处理 Bye 信令。
     * @private
     * @param {JSON} payload 
     * @param {object} context
     */
    triggerBye(payload, context) {
        if (payload.code != MultipointCommState.Ok) {
            return;
        }

        let signaling = Signaling.create(payload.data, this.pipeline);
        if (signaling.field.isPrivate()) {
            if (signaling.field.getId() == this.privateField.getId()) {
                // 本终端发送的 Bye
                let peer = this.privateField.founder.getId() == signaling.caller.getId() ? 
                        signaling.callee : signaling.caller;
                this.notifyObservers(new ObservableState(MultipointCommEvent.Bye, peer));
            }
            else {
                // 收到其他终端的 Bye
                // 终止通话
                this.terminateCall();
            }
        }
        else {
            this.notifyObservers(new ObservableState(MultipointCommEvent.Bye, signaling.field));
        }
    }

    /**
     * 获取指定 ID 的通信场域。
     * @param {number} id 
     * @param {function} handleSuccess
     * @param {function} [handleError]
     * @returns {boolean} 返回操作是否被正确执行。
     */
    getField(id, handleSuccess, handleError) {
        let field = this.fields.get(id);
        if (null != field) {
            handleSuccess(field);
            return;
        }

        let requestPacket = new Packet(MultipointCommAction.GetField, { "id": fieldId });
        this.pipeline.send(MultipointComm.NAME, requestPacket, (pipeline, source, packet) => {
            
        });
    }
}
