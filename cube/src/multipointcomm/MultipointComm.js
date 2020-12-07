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
import { CallRecord } from "./CallRecord";
import { CommFieldEndpoint } from "./CommFieldEndpoint";

/**
 * 多方通信服务。
 */
export class MultipointComm extends Module {

    static NAME = 'MultipointComm';

    /**
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
         * 管理的通信场域。
         * @type {OrderMap<number,CommField>}
         */
        this.fields = new OrderMap();

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
         * 当前活跃的通话记录。
         * @type {CallRecord}
         */
        this.activeCallRecord = null;

        /**
         * 视频标签 DOM Element 。
         * @type {object}
         * @private
         */
        this.videoElem = { local: null, remote: null };

        /**
         * 呼叫定时器。
         * @type {number}
         */
        this.callTimer = 0;

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

        if (null == this.pipeline) {
            return;
        }

        if (null != this.privateField) {
            this.privateField.closeRTCEndpoints();
            // if (this.rtcEndpoint.isWorking()) {
            //     this.hangupCall();
            // }
        }

        this.pipeline.removeListener(MultipointComm.NAME, this.pipelineListener);
    }

    /**
     * 获取本地视频标签的 DOM 元素。
     * @returns {HTMLElement} 返回本地视频标签的 DOM 元素。
     */
    getLocalVideoElement() {
        return this.videoElem.local;
    }

    /**
     * 设置本地视频标签的 DOM 元素。
     * @param {HTMLElement} element 指定本地视频标签的 DOM 元素。
     */
    setLocalVideoElement(element) {
        this.videoElem.local = element;
    }

    /**
     * 获取远端视频标签的 DOM 元素。
     * @returns {HTMLElement} 返回远端视频标签的 DOM 元素。
     */
    getRemoteVideoElement() {
        return this.videoElem.remote;
    }

    /**
     * 设置远端视频标签的 DOM 元素。
     * @param {HTMLElement} element 指定远端视频标签的 DOM 元素。
     */
    setRemoteVideoElement(element) {
        this.videoElem.remote = element;
    }

    /**
     * 创建 RTC 终端节点。
     * @private
     * @param {HTMLElement} localVideoElem 
     * @param {HTMLElement} remoteVideoElem 
     */
    createRTCEndpoint(localVideoElem, remoteVideoElem) {
        let cs = this.kernel.getModule(ContactService.NAME);
        let self = cs.getSelf();
        if (null == self) {
            return null;
        }

        // this.rtcEndpoint.localVideoElem = document.createElement('video');

        let rtcEndpoint = new RTCEndpoint(self, self.getDevice());

        if (localVideoElem) {
            rtcEndpoint.localVideoElem = localVideoElem;
        }

        if (remoteVideoElem) {
            rtcEndpoint.remoteVideoElem = remoteVideoElem;
        }

        return rtcEndpoint;
    }

    /**
     * 呼叫指定场域或者联系人。
     * @param {CommField|CommFieldEndpoint|Contact} target 指定呼叫对象。
     * @param {MediaConstraint} mediaConstraint 指定通话的媒体约束。
     * @param {function} [successCallback] 成功回调函数，函数参数：({@linkcode callRecord}:{@link CallRecord}) 。
     * @param {function} [failureCallback] 失败回调函数，函数参数：({@linkcode error}:{@link ModuleError}) 。
     * @returns {boolean} 返回是否允许执行该操作。
     */
    makeCall(target, mediaConstraint, successCallback, failureCallback) {
        if (null == this.privateField) {
            // 联系人模块没有完成签入操作
            let error = new ModuleError(MultipointComm.NAME, MultipointCommState.Uninitialized, target);
            if (failureCallback) {
                failureCallback(error);
            }
            this.notifyObservers(new ObservableState(MultipointCommEvent.CallFailed, error));
            return false;
        }

        // 处理操作成功
        let successHandler = (signaling) => {
            if (successCallback) {
                successCallback(target);
            }

            if (signaling.field.isPrivate()) {
                // 私有场域，触发 Ringing 事件
                this.notifyObservers(new ObservableState(MultipointCommEvent.Ringing, this.activeCallRecord));
            }
            else {
                // 触发 Ringing 事件
                this.notifyObservers(new ObservableState(MultipointCommEvent.Ringing, this.activeCallRecord));
            }
        };

        // 处理操作失败
        let failureHandler = (error) => {
            // 记录错误
            this.activeCallRecord.lastError = error;

            if (failureCallback) {
                failureCallback(error);
            }
            if (this.callTimer > 0) {
                clearTimeout(this.callTimer);
                this.callTimer = 0;
            }
            this.notifyObservers(new ObservableState(MultipointCommEvent.CallFailed, error));

            this.hangupCall();
        };

        (new Promise((resolve, reject) => {
            // 启动定时器
            this.callTimer = setTimeout(() => {
                this.fireCallTimeout();
            }, this.callTimeout);

            resolve();
        })).then(() => {
            // 回调 InProgress 事件
            this.notifyObservers(new ObservableState(MultipointCommEvent.InProgress, target));
        });

        if (target instanceof Contact) {
            // 呼叫指定联系人

            if (null != this.activeCallRecord && this.activeCallRecord.isActive()) {
                // 正在通话中
                let error = new ModuleError(MultipointComm.NAME, MultipointCommState.CallerBusy, target);
                if (failureCallback) {
                    failureCallback(error);
                }
                this.notifyObservers(new ObservableState(MultipointCommEvent.CallFailed, error));
                return false;
            }

            // 创建通话记录
            this.activeCallRecord = new CallRecord(this.privateField.getFounder());

            // 创建 RTC 终端
            let rtcEndpoint = this.createRTCEndpoint(this.videoElem.local, this.videoElem.remote);

            // 1. 先申请主叫，从而设置目标
            this.privateField.applyCall(this.privateField.getFounder(), target, (commField, proposer, target) => {
                this.privateField.caller = this.privateField.getFounder();
                this.privateField.callee = target;

                // 记录
                this.activeCallRecord.field = this.privateField;
                this.activeCallRecord.callerMediaConstraint = mediaConstraint;

                // 2. 启动 RTC 节点，发起 Offer
                rtcEndpoint.enableICE();
                this.privateField.launchCaller(rtcEndpoint, mediaConstraint, successHandler, failureHandler);
            }, (error) => {
                failureHandler(error);
            });
        }
        else if (target instanceof CommField) {
            if (null != this.activeCallRecord && this.activeCallRecord.field.getId() != target.getId()) {
                // TODO
                return false;
            }

            // 记录
            this.activeCallRecord.field = target;

            let rtcEndpoint = this.createRTCEndpoint();

            // 发布本地流到 Comm Field
            target.launchCaller(rtcEndpoint, mediaConstraint, successHandler, failureHandler);
        }
        else if (target instanceof CommFieldEndpoint) {
            let rtcEndpoint = this.createRTCEndpoint();

            // 订阅 CommFieldEndpoint 的流
            target.field.launch(target, rtcEndpoint, mediaConstraint, successHandler, failureHandler);
        }
        else {
            return false;
        }

        return true;
    }

    /**
     * 应答呼叫。
     * @param {MediaConstraint} mediaConstraint 指定本地的媒体约束。
     * @param {CommField|Contact} [target] 指定应答对象。
     * @param {function} [successCallback] 成功回调函数，函数参数：({@linkcode callRecord}:{@link CallRecord}) 。
     * @param {function} [failureCallback] 失败回调函数，函数参数：({@linkcode error}:{@link ModuleError}) 。
     * @returns {boolean} 返回是否允许执行该操作。
     */
    answerCall(mediaConstraint, target, successCallback, failureCallback) {
        if (null == mediaConstraint || undefined === mediaConstraint) {
            return false;
        }

        if (null == this.offerSignaling) {
            let error = new ModuleError(MultipointComm.NAME, MultipointCommState.SignalingError, this.activeCallRecord);
            if (failureCallback) {
                failureCallback(error);
            }
            this.notifyObservers(new ObservableState(MultipointCommEvent.CallFailed, error));
            return false;
        }

        if (this.callTimer > 0) {
            clearTimeout(this.callTimer);
            this.callTimer = 0;
        }

        if (typeof target === 'function') {
            // 调整参数
            failureCallback = successCallback;
            successCallback = target;
            if (this.offerSignaling.field.isPrivate()) {
                target = this.offerSignaling.contact;
            }
            else {
                target = this.offerSignaling.field;
            }
        }
        else if (undefined === target) {
            if (this.offerSignaling.field.isPrivate()) {
                target = this.offerSignaling.contact;
            }
            else {
                target = this.offerSignaling.field;
            }
        }

        let rtcEndpoint = this.getRTCEndpoint();

        if (rtcEndpoint.isWorking()) {
            // 正在通话中
            let error = new ModuleError(MultipointComm.NAME, MultipointCommState.CalleeBusy, target);
            if (failureCallback) {
                failureCallback(error);
            }
            this.notifyObservers(new ObservableState(MultipointCommEvent.CallFailed, error));
            return false;
        }

        let successHandler = (signaling) => {
            if (successCallback) {
                successCallback(target);
            }
            this.notifyObservers(new ObservableState(MultipointCommEvent.Connected, this.activeCallRecord));
        };

        let failureHandler = (error) => {
            this.activeCallRecord.lastError = error;

            if (failureCallback) {
                failureCallback(error);
            }
            this.notifyObservers(new ObservableState(MultipointCommEvent.CallFailed, error));

            this.hangupCall();
        };

        (new Promise((resolve, reject) => {
            resolve();
        })).then(() => {
            // 回调 InProgress 事件
            this.notifyObservers(new ObservableState(MultipointCommEvent.InProgress, target));
        });

        // 记录
        this.activeCallRecord.answerTime = Date.now();

        if (target instanceof Contact) {
            // 应答指定联系人
            // 1. 先申请进入
            this.privateField.applyEnter(rtcEndpoint.getContact(), rtcEndpoint.getDevice(), (contact, device) => {
                this.privateField.caller = target;
                this.privateField.callee = this.privateField.getFounder();

                // 记录
                this.activeCallRecord.field = this.privateField;
                this.activeCallRecord.calleeMediaConstraint = mediaConstraint;

                // 2. 启动 RTC 节点，发起 Answer
                rtcEndpoint.enableICE();
                this.privateField.launchCallee(rtcEndpoint,
                    this.offerSignaling.sessionDescription, mediaConstraint, successHandler, failureHandler);
            }, (error) => {
                failureHandler(error);
            });
        }
        else if (target instanceof CommField) {
            // 记录
            this.activeCallRecord.field = this.offerSignaling.field;

            // 应答 Comm Field
            target.launchCallee(rtcEndpoint,
                this.offerSignaling.sessionDescription, mediaConstraint, successHandler, failureHandler);
        }
        else {
            return false;
        }

        return true;
    }

    /**
     * 终止当前的通话。
     * @param {function} [successCallback] 成功回调函数，函数参数：({@linkcode callRecord}:{@link CallRecord}) 。
     * @param {function} [failureCallback] 失败回调函数，函数参数：({@linkcode error}:{@link ModuleError}) 。
     * @returns {boolean} 返回是否允许执行该操作。
     */
    hangupCall(successCallback, failureCallback) {
        if (this.callTimer > 0) {
            clearTimeout(this.callTimer);
            this.callTimer = 0;
        }

        let rtcEndpoint = this.getRTCEndpoint();

        if (!this.started) {
            // 如果模块已经关闭，则需要将 this.rtcEndpoint 置为空指针
            this.rtcEndpoint = null;
        }

        let field = this.activeCallRecord.field;
        let callee = null;

        let byeHandler = (pipeline, source, packet) => {
            if (packet.data.code == MultipointCommState.Ok) {
                let signaling = Signaling.create(packet.data.data, this.pipeline);

                // 记录结束时间
                this.activeCallRecord.endTime = Date.now();

                if (successCallback) {
                    successCallback(this.activeCallRecord);
                }

                this.notifyObservers(new ObservableState(MultipointCommEvent.Bye, this.activeCallRecord));
            }
            else {
                let error = new ModuleError(MultipointComm.NAME, packet.data.code, this.activeCallRecord);

                this.activeCallRecord.lastError = error;

                if (failureCallback) {
                    failureCallback(error);
                }
                this.notifyObservers(new ObservableState(MultipointCommEvent.CallFailed, error));
            }
        };

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
            this.pipeline.send(MultipointComm.NAME, packet, byeHandler);

            this.offerSignaling = null;
            this.answerSignaling = null;
            rtcEndpoint.close();
            return true;
        }

        if (!rtcEndpoint.ready && null != callee && callee.getId() == this.privateField.founder.getId()) {
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
            this.pipeline.send(MultipointComm.NAME, packet, byeHandler);
        }

        this.offerSignaling = null;
        this.answerSignaling = null;

        rtcEndpoint.close();

        return true;
    }

    /**
     * 获取指定 ID 的通信场域。
     * @param {number} id 
     * @param {function} successCallback
     * @param {function} [failureCallback]
     * @returns {boolean} 返回操作是否被正确执行。
     */
    getField(id, successCallback, failureCallback) {
        let field = this.fields.get(id);
        if (null != field) {
            handleSuccess(field);
            return;
        }

        let requestPacket = new Packet(MultipointCommAction.GetField, { "id": id });
        this.pipeline.send(MultipointComm.NAME, requestPacket, (pipeline, source, packet) => {
            
        });
    }

    /**
     * 获取当前通话的通信场域。
     * @returns {CommField} 返回当前通话的通信场域。
     */
    getActiveField() {
        return this.activeCallRecord.field;
    }

    /**
     * 获取自己当前设备的终端节点。
     * @returns {CommFieldEndpoint} 返回自己当前设备的终端节点。
     */
    getOwnEndpoint() {
        return this.rtcEndpoint;
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

        if (this.activeCallRecord.field.isPrivate()) {
            this.notifyObservers(new ObservableState(MultipointCommEvent.CallTimeout, this.activeCallRecord));
        }
        else {
            this.notifyObservers(new ObservableState(MultipointCommEvent.CallTimeout, this.activeCallRecord));
        }

        this.hangupCall();
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

        let data = payload.data;
        this.offerSignaling = Signaling.create(data, this.pipeline);

        let rtcEndpoint = this.getRTCEndpoint();

        // 检查当期是否有通话正在进行
        if (rtcEndpoint.isWorking()) {
            // 应答忙音 Busy
            let busy = new Signaling(MultipointCommAction.Busy, this.privateField,
                rtcEndpoint.getContact(), rtcEndpoint.getDevice());
            let packet = new Packet(MultipointCommAction.Busy, busy.toJSON());
            this.pipeline.send(MultipointComm.NAME, packet);
            return;
        }

        this.callTimer = setTimeout(() => {
            this.fireCallTimeout();
        }, this.callTimeout - 5000);

        // 创建记录
        this.activeCallRecord = new CallRecord(this.privateField.getFounder());
        this.activeCallRecord.field = this.offerSignaling.field;

        if (this.offerSignaling.field.isPrivate()) {
            this.activeCallRecord.field.caller = this.offerSignaling.caller;
            this.activeCallRecord.field.callee = this.offerSignaling.callee;
            // 记录媒体约束
            this.activeCallRecord.callerMediaConstraint = this.offerSignaling.mediaConstraint;
        }

        // 来自个人的通话申请
        this.notifyObservers(new ObservableState(MultipointCommEvent.NewCall, this.activeCallRecord));
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

        if (this.callTimer > 0) {
            clearTimeout(this.callTimer);
            this.callTimer = 0;
        }

        // 记录应答时间
        this.activeCallRecord.answerTime = Date.now();

        let data = payload.data;
        this.answerSignaling = Signaling.create(data, this.pipeline);

        // 记录媒体约束
        this.activeCallRecord.calleeMediaConstraint = this.answerSignaling.mediaConstraint;

        rtcEndpoint.doAnswer(this.answerSignaling.sessionDescription, () => {
            this.notifyObservers(new ObservableState(MultipointCommEvent.Connected, this.activeCallRecord));
        }, (error) => {
            this.activeCallRecord.lastError = error;
            this.notifyObservers(new ObservableState(MultipointCommEvent.CallFailed, error));
        });
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
        if (payload.code != MultipointCommState.Ok) {
            let error = new ModuleError(MultipointComm.NAME, payload.code, this);
            this.notifyObservers(new ObservableState(MultipointCommAction.CallFailed, error));
            return;
        }

        let signaling = Signaling.create(payload.data, this.pipeline);
        if (signaling.field.isPrivate()) {
            if (signaling.callee.getId() == this.privateField.getId()) {
                // 记录
                this.activeCallRecord.endTime = Date.now();

                // 收到本终端 Busy 时，回调 Bye
                this.notifyObservers(new ObservableState(MultipointCommEvent.Bye, this.activeCallRecord));
            }
            else {
                // 收到其他终端的 Busy
                this.notifyObservers(new ObservableState(MultipointCommEvent.Busy, this.activeCallRecord));

                // 终止通话
                this.hangupCall();
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
        let signaling = Signaling.create(payload.data, this.pipeline);
        if (signaling.field.isPrivate()) {
            this.hangupCall();
        }
        else {
            this.hangupCall();
        }
    }
}
