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
         * 视频元素。
         * @type {HTMLElement}
         */
        this.videoElem = null;

        /**
         * 管理的通信场域。
         * @type {OrderMap<number,CommField>}
         */
        this.fields = new OrderMap();
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

        // 创建 video DOM
        this.videoElem = document.createElement("video");

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

    getVideoElement() {
        return this.videoElem;
    }

    setVideoElement(value) {
        this.videoElem = value;
    }

    getLocalPoint() {
        if (null == this.localPoint) {
            let cs = this.kernel.getModule(ContactService.NAME);
            let self = cs.getSelf();
            let name = [self.getId(), '_', AuthService.DOMAIN, '_',
                        self.getDevice().getName(), '_', self.getDevice().getPlatform()];
            this.localPoint = new LocalRTCEndpoint(name.join(''), self);
        }

        return this.localPoint;
    }

    /**
     * 
     * @param {CommField|Contact} fieldOrContact 
     * @param {MediaConstraint} mediaConstraint 
     * @param {function} [handleSuccess]
     * @param {function} [handleError]
     * @returns {boolean}
     */
    makeCall(fieldOrContact, mediaConstraint, handleSuccess, handleError) {
        if (null == this.privateField) {
            // 联系人模块没有完成签入操作
            let error = { code: MultipointCommState.Uninitialized, data: fieldOrContact };
            if (handleError) {
                handleError(error);
            }
            this.notifyObservers(new ObservableState(MultipointCommEvent.CallFailed, error));
            return false;
        }

        // 获取本地 RTC 节点
        let localPoint = this.getLocalPoint();

        if (localPoint.isWorking()) {
            // 正在通话中
            let error = { code: MultipointCommState.CallerBusy, data: fieldOrContact };
            if (handleError) {
                handleError(error);
            }
            this.notifyObservers(new ObservableState(MultipointCommEvent.CallFailed, error));
            return false;
        }

        // 设置 video 元素
        localPoint.videoElem = this.videoElem;

        let successHandler = (field, signaling) => {
            if (handleSuccess) {
                handleSuccess(field, signaling);
            }
            this.notifyObservers(new ObservableState(MultipointCommEvent.InProgress, field));
        };

        let errorHandler = (error) => {
            if (handleError) {
                handleError(error);
            }
            this.notifyObservers(new ObservableState(MultipointCommEvent.CallFailed, error));
        };

        if (fieldOrContact instanceof Contact) {
            // 呼叫指定联系人
            this.privateField.addEndpoint(fieldOrContact);
            this.privateField.launchCaller(localPoint, mediaConstraint, successHandler, errorHandler);
        }
        else if (fieldOrContact instanceof CommField) {
            // 呼入 Comm Field
            fieldOrContact.addEndpoint(localPoint);
            fieldOrContact.launchCaller(localPoint, mediaConstraint, successHandler, errorHandler);
        }
        else {
            return false;
        }

        return true;
    }

    answerCall(fieldOrContact, mediaConstraint) {
        let localPoint = this.getLocalPoint();

        if (localPoint.isWorking()) {
            // 正在通话中
            return false;
        }

        // 设置 video 元素
        localPoint.videoElem = this.videoElem;

        if (fieldOrContact instanceof Contact) {
            this.privateField.addEndpoint(localPoint);
        }
        else if (fieldOrContact instanceof CommField) {
            fieldOrContact.addEndpoint(localPoint);
        }
        else {
            return false;
        }

        return true;
    }

    terminateCall(fieldOrContact) {

    }

    triggerOffer(payload) {
        let data = payload.data;
        let signaling = Signaling.create(data);
        this.notifyObservers(new ObservableState(MultipointCommEvent.NewCall, signaling));
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
