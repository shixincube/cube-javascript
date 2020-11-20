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
import { AuthService } from "../auth/AuthService";
import { ContactEvent } from "../contact/ContactEvent";
import { Contact } from "../contact/Contact";
import { ContactService } from "../contact/ContactService";
import { Packet } from "../core/Packet";
import { OrderMap } from "../util/OrderMap";
import { CommField } from "./CommField";
import { MultipointCommAction } from "./MultipointCommAction";
import { LocalRTCEndpoint } from "./LocalRTCEndpoint";
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
         * 本地节点。
         * @type {LocalRTCEndpoint}
         */
        this.localPoint = null;

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
    }

    /**
     * @inheritdoc
     */
    start() {
        if (!super.start()) {
            return false;
        }

        // 添加监听器
        this.pipeline.addListener(this.pipelineListener);

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

        this.videoElem.pause();
        this.videoElem.remove();

        this.pipeline.removeListener(this.pipelineListener);
    }

    /**
     * @returns {HTMLElement} 返回本地视频标签的 DOM 元素。
     */
    getLocalVideoElement() {
        let localPoint = this.getLocalPoint();
        return localPoint.localVideoElem;
    }

    /**
     * 设置本地视频标签的 DOM 元素。
     * @param {HTMLElement} value 
     */
    setLocalVideoElement(value) {
        let localPoint = this.getLocalPoint();
        localPoint.localVideoElem = value;
    }

    /**
     * @returns {HTMLElement} 返回远端视频标签的 DOM 元素。
     */
    getRemoteVideoElement() {
        let localPoint = this.getLocalPoint();
        return localPoint.remoteVideoElem;
    }

    /**
     * 设置远端视频标签的 DOM 元素。
     * @param {HTMLElement} value 
     */
    setRemoteVideoElement(value) {
        let localPoint = this.getLocalPoint();
        localPoint.remoteVideoElem = value;
    }

    /**
     * @private
     */
    getLocalPoint() {
        if (null == this.localPoint) {
            let cs = this.kernel.getModule(ContactService.NAME);
            let self = cs.getSelf();
            let name = [self.getId(), '_', AuthService.DOMAIN, '_',
                        self.getDevice().getName(), '_', self.getDevice().getPlatform()];
            this.localPoint = new LocalRTCEndpoint(name.join(''), self);

            this.localPoint.localVideoElem = document.createElement('video');
            this.localPoint.localVideoElem.width = 480;
            this.localPoint.localVideoElem.height = 360;

            this.localPoint.remoteVideoElem = document.createElement('video');
            this.localPoint.remoteVideoElem.width = 480;
            this.localPoint.remoteVideoElem.height = 360;
        }

        return this.localPoint;
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
        let localPoint = this.getLocalPoint();

        if (localPoint.isWorking()) {
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
            this.notifyObservers(new ObservableState(MultipointCommEvent.InProgress, fieldOrContact));
        };

        let failureHandler = (error) => {
            if (failureCallback) {
                failureCallback(error);
            }
            this.notifyObservers(new ObservableState(MultipointCommEvent.CallFailed, error));
        };

        if (fieldOrContact instanceof Contact) {
            // 呼叫指定联系人
            this.privateField.addEndpoint(fieldOrContact);
            this.privateField.launchCaller(localPoint, mediaConstraint, successHandler, failureHandler);
        }
        else if (fieldOrContact instanceof CommField) {
            // 呼入 Comm Field
            fieldOrContact.addEndpoint(localPoint);
            fieldOrContact.launchCaller(localPoint, mediaConstraint, successHandler, failureHandler);
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
        if (null == this.offerSignaling) {
            let error = new ModuleError(MultipointComm.NAME, MultipointCommState.SignalingError, fieldOrContact);
            if (failureCallback) {
                failureCallback(error);
            }
            this.notifyObservers(new ObservableState(MultipointCommEvent.CallFailed, error));
            return false;
        }

        let localPoint = this.getLocalPoint();

        if (localPoint.isWorking()) {
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
            this.notifyObservers(new ObservableState(MultipointCommEvent.InProgress, fieldOrContact));
        };

        let failureHandler = (error) => {
            if (failureCallback) {
                failureCallback(error);
            }
            this.notifyObservers(new ObservableState(MultipointCommEvent.CallFailed, error));
        };

        if (fieldOrContact instanceof Contact) {
            // 应答指定联系人
            this.privateField.addEndpoint(localPoint);
            this.privateField.launchCallee(localPoint, this.offerSignaling.sdp, mediaConstraint, successHandler, failureHandler);
        }
        else if (fieldOrContact instanceof CommField) {
            // 应答 Comm Field
            fieldOrContact.addEndpoint(localPoint);
            fieldOrContact.launchCallee(localPoint, this.offerSignaling.sdp, mediaConstraint, successHandler, failureHandler);
        }
        else {
            return false;
        }

        return true;
    }

    terminateCall(fieldOrContact) {
        this.offerSignaling = null;
    }

    triggerOffer(payload) {
        let data = payload.data;
        this.offerSignaling = Signaling.create(data, this.pipeline);

        // 先应答
        if (this.localPoint.isWorking()) {
            // 应答忙音 Busy
            let busy = new Signaling(MultipointCommAction.Busy, this.offerSignaling.field, this.localPoint.getContact());
            busy.target = this.offerSignaling.target;
            let packet = new Packet(MultipointCommAction.Busy, busy.toCompactJSON());
            this.pipeline.send(MultipointComm.NAME, packet);
        }
        else {
            // 应答振铃 Ringing
            let ringing = new Signaling(MultipointCommAction.Ringing, this.offerSignaling.field, this.localPoint.getContact());
            ringing.target = this.offerSignaling.target;
            let packet = new Packet(MultipointCommAction.Ringing, ringing.toCompactJSON());
            this.pipeline.send(MultipointComm.NAME, packet);
        }

        if (this.offerSignaling.field.isPrivate()) {
            // 来自个人的通话申请
            this.notifyObservers(new ObservableState(MultipointCommEvent.NewCall, this.offerSignaling.field.getFounder()));
        }
        else {
            // 来自场域的通话申请
            this.notifyObservers(new ObservableState(MultipointCommEvent.NewCall, this.offerSignaling.field));
        }
    }

    triggerAnswer(payload) {
        let data = payload.data;
    }

    triggerRinging(payload) {
        let data = payload.data;
    }

    triggerBusy(payload) {
        let data = payload.data;
    }

    triggerReady(payload) {
        let data = payload.data;
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
