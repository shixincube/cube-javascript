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
import { ContactService } from "../contact/ContactService";
import { Packet } from "../core/Packet";
import { OrderMap } from "../util/OrderMap";
import { CommField } from "./CommField";
import { MultipointCommAction } from "./MultipointCommAction";
import { Contact } from "../contact/Contact";
import { LocalRTCEndpoint } from "./LocalRTCEndpoint";
import { MediaConstraint } from "./MediaConstraint";

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
         * @type {Element}
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

        let contactService = this.kernel.getModule(ContactService.NAME);
        let self = contactService.getSelf();
        if (null == self) {
            return false;
        }

        // 创建个人通信场
        this.privateField = new CommField(self.getId(), self);

        // 创建 video DOM
        this.videoElem = document.createElement("video");

        return true;
    }

    /**
     * @inheritdoc
     */
    stop() {
        super.stop();
    }

    getVideoElement() {
        return this.videoElem;
    }

    setVideoElement(value) {
        this.videoElem = value;
    }

    /**
     * 
     * @param {CommField|Contact} fieldOrContact 
     * @param {MediaConstraint} mediaConstraint 
     * @returns {boolean}
     */
    makeCall(fieldOrContact, mediaConstraint) {
        if (null == this.privateField) {
            return false;
        }

        if (null == this.localPoint) {
            this.localPoint = new LocalRTCEndpoint(this.pipeline);
        }

        if (this.localPoint.isCalling()) {
            // 正在通话中
            return false;
        }

        // 设置 video 元素
        this.localPoint.videoElem = this.videoElem;

        if (fieldOrContact instanceof Contact) {
            this.privateField.join(this.localPoint, mediaConstraint);
            this.privateField.invite(fieldOrContact);
        }
        else if (fieldOrContact instanceof CommField) {
            fieldOrContact.join(this.localPoint, mediaConstraint);
        }
        else {
            return false;
        }

        return true;
    }

    answerCall(fieldOrContact, mediaConstraint) {

    }

    terminateCall(fieldOrContact) {

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

    /**
     * 删除指定的通信场域。
     * @param {number} id 
     */
    deleteField(id) {

    }

}
