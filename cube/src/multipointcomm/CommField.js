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

import { Entity } from "../core/Entity";
import { Contact } from "../contact/Contact";
import { Device } from "../contact/Device";
import { CommFieldEndpoint } from "./CommFieldEndpoint";
import { MediaConstraint } from "./MediaConstraint";
import { RTCEndpoint } from "./RTCEndpoint";
import { MultipointCommAction } from "./MultipointCommAction";
import { Pipeline } from "../core/Pipeline";
import { MultipointComm } from "./MultipointComm";
import { Packet } from "../core/Packet";
import { StateCode } from "../core/StateCode";
import { MultipointCommState } from "./MultipointCommState";
import { Signaling } from "./Signaling";
import { ModuleError } from "../core/error/ModuleError";

/**
 * 多方通信场域。
 */
export class CommField extends Entity {

    /**
     * @param {number} id 场域 ID 。
     * @param {Contact} founder 创建人 ID 。
     * @param {Pipeline} pipeline 数据通道。
     */
    constructor(id, founder, pipeline) {
        super(7 * 24 * 60 * 60 * 1000);

        /**
         * 场域 ID 。
         * @type {number}
         */
        this.id = id;

        /**
         * 通信场创建人。
         * @type {Contact}
         */
        this.founder = founder;

        /**
         * 通信管道。
         * @type {Pipeline}
         */
        this.pipeline = pipeline;

        /**
         * RTC 终端列表。
         * @type {Array<RTCEndpoint>}
         */
        this.rtcEndpoints = [];

        /**
         * 出站流的 RTC 终端。
         * @type {RTCEndpoint}
         */
        this.outboundRTC = null;

        /**
         * 入站流的 RTC 终端。
         * @type {RTCEndpoint}
         */
        this.inboundRTC = null;

        /**
         * 终端列表。
         * @type {Array<CommFieldEndpoint>}
         */
        this.endpoints = [];

        /**
         * 私域的设备，仅适用于私有域。
         * @type {Device}
         */
        this.device = null;

        /**
         * 当前主叫，仅适用于私有域。
         * @type {Contact}
         */
        this.caller = null;

        /**
         * 当前被叫，仅适用于私有域。
         * @type {Contact}
         */
        this.callee = null;
    }

    /**
     * 返回创建人。
     * @returns {Contact} 返回创建人。
     */
    getFounder() {
        return this.founder;
    }

    /**
     * 返回设备。
     * @returns {Device} 返回设备。
     */
    getDevice() {
        return this.device;
    }

    /**
     * 当前通信场是否是私有场域。
     * @returns {boolean} 如果是私有场域返回 {@linkcode true} ，否则返回 {@linkcode false} 。
     */
    isPrivate() {
        return (this.id == this.founder.getId());
    }

    /**
     * 启动为主叫。
     * @param {RTCEndpoint} endpoint
     * @param {MediaConstraint} mediaConstraint
     * @param {function} successCallback
     * @param {function} failureCallback
     */
    launchCaller(endpoint, mediaConstraint, successCallback, failureCallback) {
        let rtcEndpoint = endpoint;

        this.rtcEndpoints.push(rtcEndpoint);

        rtcEndpoint.onIceCandidate = (candidate) => {
            this.onIceCandidate(candidate, rtcEndpoint);
        };

        rtcEndpoint.openOffer(mediaConstraint, (description) => {
            let signaling = new Signaling(MultipointCommAction.Offer, this, rtcEndpoint.getContact(), rtcEndpoint.getDevice());
            // 设置 SDP 信息
            signaling.sessionDescription = description;
            // 设置媒体约束
            signaling.mediaConstraint = mediaConstraint;
            // 发送信令
            this.sendSignaling(signaling, successCallback, failureCallback);
        }, (error) => {
            failureCallback(error);
        });
    }

    /**
     * 启动为被叫。
     * @param {RTCEndpoint} endpoint 
     * @param {string} offerDescription
     * @param {MediaConstraint} mediaConstraint 
     * @param {function} successCallback 
     * @param {function} failureCallback 
     */
    launchCallee(endpoint, offerDescription, mediaConstraint, successCallback, failureCallback) {
        let rtcEndpoint = endpoint;

        this.rtcEndpoints.push(rtcEndpoint);

        rtcEndpoint.onIceCandidate = (candidate) => {
            this.onIceCandidate(candidate, rtcEndpoint);
        };

        rtcEndpoint.openAnswer(offerDescription, mediaConstraint, (description) => {
            let signaling = new Signaling(MultipointCommAction.Answer, this, rtcEndpoint.getContact(), rtcEndpoint.getDevice());
            // 设置 SDP 信息
            signaling.sessionDescription = description;
            // 设置媒体约束
            signaling.mediaConstraint = mediaConstraint;
            // 发送信令
            this.sendSignaling(signaling, successCallback, failureCallback);
        }, (error) => {
            failureCallback(error);
        });
    }

    /**
     * 启动无出站流呼叫目标。
     * @param {CommFieldEndpoint} target 
     * @param {RTCEndpoint} endpoint 
     * @param {function} successCallback 
     * @param {function} failureCallback 
     */
    launchFollow(target, endpoint, successCallback, failureCallback) {
        let rtcEndpoint = endpoint;

        rtcEndpoint.target = target;
        this.rtcEndpoints.push(rtcEndpoint);

        rtcEndpoint.onIceCandidate = (candidate) => {
            this.onIceCandidate(candidate, rtcEndpoint);
        };

        rtcEndpoint.openOffer(null, (description) => {
            let signaling = new Signaling(MultipointCommAction.Follow, this, rtcEndpoint.getContact(), rtcEndpoint.getDevice());
            // 设置 SDP 信息
            signaling.sessionDescription = description;
            // 设置目标
            signaling.target = target;
            // 发送信令
            this.sendSignaling(signaling, successCallback, failureCallback);
        }, (error) => {
            failureCallback(error);
        });
    }

    /**
     * 
     * @param {Contact} proposer 
     * @param {Contact} target 
     * @param {function} successCallback 
     * @param {function} failureCallback 
     */
    applyCall(proposer, target, successCallback, failureCallback) {
        let packet = new Packet(MultipointCommAction.ApplyCall, {
            field: this.toCompactJSON(),
            proposer: proposer.toCompactJSON(),
            target: target.toCompactJSON()
        });
        this.pipeline.send(MultipointComm.NAME, packet, (pipeline, source, responsePacket) => {
            if (null != responsePacket && responsePacket.getStateCode() == StateCode.OK) {
                if (responsePacket.data.code == MultipointCommState.Ok) {
                    let responseData = responsePacket.data.data;
                    successCallback(this, proposer, target);
                }
                else {
                    let error = new ModuleError(MultipointComm.NAME, responsePacket.data.code, {
                        field: this,
                        proposer: proposer,
                        target: target
                    });
                    failureCallback(error);
                }
            }
            else {
                let error = new ModuleError(MultipointComm.NAME,
                    (null != responsePacket) ? responsePacket.getStateCode() : MultipointCommState.ServerFault, {
                    field: this,
                    proposer: proposer,
                    target: target
                });
                failureCallback(error);
            }
        });
    }

    /**
     * 
     * @param {Contact} contact 
     * @param {Device} device
     * @param {function} successCallback 
     * @param {function} failureCallback 
     */
    applyEnter(contact, device, successCallback, failureCallback) {
        let packet = new Packet(MultipointCommAction.ApplyEnter, {
            field: this.toCompactJSON(),
            contact: contact.toCompactJSON(),
            device: device.toCompactJSON()
        });
        this.pipeline.send(MultipointComm.NAME, packet, (pipeline, source, responsePacket) => {
            if (null != responsePacket && responsePacket.getStateCode() == StateCode.OK) {
                if (responsePacket.data.code == MultipointCommState.Ok) {
                    let responseData = responsePacket.data.data;
                    successCallback(this, contact, device);
                }
                else {
                    let error = new ModuleError(MultipointComm.NAME, responsePacket.data.code, {
                        field: this,
                        contact: contact,
                        device: device
                    });
                    failureCallback(error);
                }
            }
            else {
                let error = new ModuleError(MultipointComm.NAME,
                    (null != responsePacket) ? responsePacket.getStateCode() : MultipointCommState.ServerFault, {
                        field: this,
                        contact: contact,
                        device: device
                });
                failureCallback(error);
            }
        });
    }

    /**
     * 返回指定的终端节点的实际实例。
     * @param {CommFieldEndpoint} fieldEndpoint 
     * @returns {CommFieldEndpoint}
     */
    getEndpoint(fieldEndpoint) {
        for (let i = 0; i < this.endpoints.length; ++i) {
            let ep = this.endpoints[i];
            if (ep.getId() == fieldEndpoint.getId()) {
                return ep;
            }
        }
    }

    /**
     * @returns {number} 返回 RTC 终端数量。
     */
    numRTCEndpoints() {
        return this.rtcEndpoints.length;
    }

    getRTCEndpoint() {
        return this.rtcEndpoints[0];
    }

    closeRTCEndpoint(endpoint) {
        for (let i = 0; i < this.rtcEndpoints.length; ++i) {
            let rtcEndpoint = this.rtcEndpoints[i];
            if (null != rtcEndpoint.target && rtcEndpoint.target.getId() == endpoint.getId()) {
                rtcEndpoint.close();
                if (this.outboundRTC == rtcEndpoint) {
                    this.outboundRTC = null;
                }
                if (this.inboundRTC == rtcEndpoint) {
                    this.inboundRTC = null;
                }
                this.rtcEndpoints.splice(i, 1);
                break;
            }
        }
    }

    /**
     * 关闭并清空所有 RTC 终端。
     */
    closeRTCEndpoints() {
        if (this.rtcEndpoints.length == 0) {
            return;
        }

        this.rtcEndpoints.forEach((rtcEndpoint, index, array) => {
            rtcEndpoint.close();
        });
        this.rtcEndpoints.splice(0, this.rtcEndpoints.length);

        this.outboundRTC = null;
        this.inboundRTC = null;
    }

    /**
     * 发送信令。
     * @param {Signaling} signaling 
     * @param {function} [successCallback]
     * @param {function} [failureCallback]
     * @private
     */
    sendSignaling(signaling, successCallback, failureCallback) {
        this.pipeline.send(MultipointComm.NAME, new Packet(signaling.name, signaling.toJSON()), (pipeline, source, packet) => {
            if (null != packet && packet.getStateCode() == StateCode.OK) {
                if (packet.data.code == MultipointCommState.Ok) {
                    let data = packet.data.data;
                    let response = Signaling.create(data, this.pipeline);
                    packet.context = response;

                    if (successCallback) {
                        successCallback(response);
                    }
                }
                else {
                    if (failureCallback) {
                        failureCallback(new ModuleError(MultipointComm.NAME, packet.data.code, this));
                    }
                }
            }
            else {
                if (failureCallback) {
                    failureCallback(new ModuleError(MultipointComm.NAME, MultipointCommState.ServerFault, this));
                }
            }
        });
    }

    /**
     * @private
     * @param {*} candidate 
     * @param {*} rtcEndpoint 
     */
    onIceCandidate(candidate, rtcEndpoint) {
        let signaling = new Signaling(MultipointCommAction.Candidate, this, rtcEndpoint.getContact(), rtcEndpoint.getDevice());
        signaling.candidate = candidate;
        this.sendSignaling(signaling);
    }

    /**
     * @inheritdoc
     */
    toJSON() {
        let json = super.toJSON();
        json.id = this.id;
        json.domain = this.founder.getDomain();
        json.founder = this.founder.toCompactJSON();
        json.endpoints = [];
        for (let i = 0; i < this.endpoints.length; ++i) {
            json.endpoints.push(this.endpoints[i].toJSON());
        }
        return json;
    }

    /**
     * @inheritdoc
     */
    toCompactJSON() {
        let json = super.toCompactJSON();
        json.id = this.id;
        json.domain = this.founder.getDomain();
        json.founder = this.founder.toCompactJSON();
        return json;
    }

    /**
     * 创建由 JSON 格式定义的 {@link CommField} 对象。
     * @param {JSON} json 指定 JSON 格式。
     * @param {Pipeline} pipeline 指定数据管道。
     * @returns {CommField} 返回 {@link CommField} 对象实例。
     */
    static create(json, pipeline) {
        let field = new CommField(json.id, Contact.create(json.founder, json.domain), pipeline);
        if (undefined !== json.endpoints) {
            let list = json.endpoints;
            for (let i = 0; i < list.length; ++i) {
                let cfep = CommFieldEndpoint.create(list[i]);
                cfep.field = field;
                field.endpoints.put(cfep.getId(), cfep);
            }
        }
        return field;
    }
}
