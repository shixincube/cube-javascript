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

import { Contact } from "../contact/Contact";
import { Device } from "../contact/Device";
import { Pipeline } from "../core/Pipeline";
import { JSONable } from "../util/JSONable";
import { CommField } from "./CommField";
import { CommFieldEndpoint } from "./CommFieldEndpoint";
import { MediaConstraint } from "./MediaConstraint";

/**
 * 信令。
 */
export class Signaling extends JSONable {

    /**
     * @param {string} name 信令名。
     * @param {CommField} field 信令的通讯场域。
     * @param {Contact} contact 传送/接收该信令的联系人。
     * @param {Device} device 传送/接收该信令的设备。
     */
    constructor(name, field, contact, device) {
        super();

        /**
         * 信令名。
         * @type {string}
         */
        this.name = name;

        /**
         * 信令的通讯场域。
         * @type {CommField}
         */
        this.field = field;

        /**
         * 传送/接收该信令的联系人。
         * @type {Contact}
         */
        this.contact = contact;

        /**
         * 传送/接收该信令的设备。
         * @type {Device}
         */
        this.device = device;

        /**
         * 目标。
         * @type {CommFieldEndpoint}
         */
        this.target = null;

        /**
         * 通话的 SDP 信息。
         * @type {object}
         */
        this.sessionDescription = null;

        /**
         * 媒体通道的 ICE candidate 。
         * @type {object}
         */
        this.candidate = null;

        /**
         * 媒体通道的 ICE candidate 列表。
         * @type {Array<object>}
         */
        this.candidates = null;

        /**
         * 媒体约束。
         * @type {MediaConstraint}
         */
        this.mediaConstraint = null;

        /**
         * 主叫。
         * @type {Contact}
         */
        this.caller = null;

        /**
         * 被叫。
         * @type {Contact}
         */
        this.callee = null;
    }

    /**
     * @inheritdoc
     */
    toJSON() {
        let json = super.toJSON();
        json["name"] = this.name;
        json["field"] = this.field.toCompactJSON();
        json["contact"] = this.contact.toCompactJSON();
        json["device"] = this.device.toCompactJSON();

        if (null != this.sessionDescription) {
            json["description"] = this.sessionDescription;
        }

        if (null != this.target) {
            json["target"] = this.target.toJSON();
        }

        if (null != this.candidate) {
            json["candidate"] = this.candidate;
        }

        if (null != this.mediaConstraint) {
            json["constraint"] = this.mediaConstraint.toJSON();
        }

        return json;
    }

    /**
     * @inheritdoc
     */
    toCompactJSON() {
        return this.toJSON();
    }

    /**
     * 创建 {@link Signaling} 实例。
     * @param {JSON} json JSON 数据对象。
     * @param {Pipeline} pipeline 数据管道。
     * @param {Self} self 指定当前登录用户。
     * @returns {Signaling} 返回 {@linkcode Signaling} 实例。
     */
    static create(json, pipeline, self) {
        let signaling = new Signaling(json.name,
            CommField.create(json.field, pipeline, self),
            Contact.create(json.contact),
            Device.create(json.device));

        if (json.description) {
            signaling.sessionDescription = json.description;
        }

        if (json.target) {
            signaling.target = CommFieldEndpoint.create(json.target);
        }

        if (json.candidate) {
            signaling.candidate = json.candidate;
        }

        if (json.candidates) {
            signaling.candidates = json.candidates;
        }

        if (json.constraint) {
            signaling.mediaConstraint = MediaConstraint.create(json.constraint);
        }

        if (json.caller) {
            signaling.caller = Contact.create(json.caller);
        }

        if (json.callee) {
            signaling.callee = Contact.create(json.callee);
        }

        return signaling;
    }
}
