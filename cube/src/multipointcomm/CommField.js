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

import { Entity } from "../core/Entity";
import { Contact } from "../contact/Contact";
import { Device } from "../contact/Device";
import { CommFieldEndpoint } from "./CommFieldEndpoint";
import { MediaConstraint } from "./MediaConstraint";
import { RTCDevice } from "./RTCDevice";
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
         * 监听器。
         * @type {object}
         */
        this.listener = null;

        /**
         * RTC 终端列表。
         * @type {Array<RTCDevice>}
         */
        this.rtcDevices = [];

        /**
         * 终端列表。
         * @type {Array<CommFieldEndpoint>}
         */
         this.endpoints = [];

        /**
         * 出站流的 RTC 终端。仅适用于私有域。
         * @type {RTCDevice}
         */
        this.outboundRTC = null;

        /**
         * 入站流的 RTC 终端。仅适用于私有域。
         * @type {RTCDevice}
         */
        this.inboundRTC = null;

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
     * @param {RTCDevice} device RTC 设备。
     * @param {MediaConstraint} mediaConstraint 媒体约束。
     * @param {function} successCallback 成功回调。
     * @param {function} failureCallback 失败回调。
     */
    launchCaller(device, mediaConstraint, successCallback, failureCallback) {
        this.rtcDevices.push(device);

        device.onIceCandidate = (candidate) => {
            this.onIceCandidate(candidate, device);
        };
        device.onMediaConnected = (device) => {
            this.onMediaConnected(device);
        };
        device.onMediaDisconnected = (device) => {
            this.onMediaDisconnected(device);
        };

        device.openOffer(mediaConstraint, (description) => {
            let signaling = new Signaling(MultipointCommAction.Offer, this,
                device.getContact(), device.getDevice(), device.sn);
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
     * @param {RTCDevice} device RTC 设备。
     * @param {string} offerDescription
     * @param {MediaConstraint} mediaConstraint 
     * @param {function} successCallback 
     * @param {function} failureCallback 
     */
    launchCallee(device, offerDescription, mediaConstraint, successCallback, failureCallback) {
        this.rtcDevices.push(device);

        device.onIceCandidate = (candidate) => {
            this.onIceCandidate(candidate, device);
        };
        device.onMediaConnected = (device) => {
            this.onMediaConnected(device);
        };
        device.onMediaDisconnected = (device) => {
            this.onMediaDisconnected(device);
        };

        device.openAnswer(offerDescription, mediaConstraint, (description) => {
            let signaling = new Signaling(MultipointCommAction.Answer, this,
                device.getContact(), device.getDevice(), device.sn);
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
     * @param {RTCDevice} device 
     * @param {function} successCallback 
     * @param {function} failureCallback 
     */
    launchFollow(target, device, successCallback, failureCallback) {
        device.target = target;

        this.rtcDevices.push(device);

        device.onIceCandidate = (candidate) => {
            this.onIceCandidate(candidate, device);
        };
        device.onMediaConnected = (device) => {
            this.onMediaConnected(device);
        };
        device.onMediaDisconnected = (device) => {
            this.onMediaDisconnected(device);
        };

        device.openOffer(null, (description) => {
            let signaling = new Signaling(MultipointCommAction.Follow, this,
                device.getContact(), device.getDevice(), device.sn);
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
     * 申请通话场域。
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
     * 申请终止场域。
     * @param {Contact} proposer 
     * @param {Contact} target
     * @param {function} [successCallback] 
     * @param {function} [failureCallback] 
     */
    applyTerminate(proposer, target, successCallback, failureCallback) {
        let packet = new Packet(MultipointCommAction.ApplyTerminate, {
            field: this.toCompactJSON(),
            proposer: proposer.toCompactJSON(),
            target: target.toCompactJSON()
        });
        this.pipeline.send(MultipointComm.NAME, packet, (pipeline, source, responsePacket) => {
            if (null != responsePacket && responsePacket.getStateCode() == StateCode.OK) {
                if (responsePacket.data.code == MultipointCommState.Ok) {
                    let responseData = responsePacket.data.data;
                    if (successCallback) {
                        successCallback(this, proposer, target);
                    }
                }
                else {
                    let error = new ModuleError(MultipointComm.NAME, responsePacket.data.code, {
                        field: this,
                        proposer: proposer,
                        target: target
                    });
                    if (failureCallback) {
                        failureCallback(error);
                    }
                }
            }
            else {
                let error = new ModuleError(MultipointComm.NAME,
                    (null != responsePacket) ? responsePacket.getStateCode() : MultipointCommState.ServerFault, {
                    field: this,
                    proposer: proposer,
                    target: target
                });
                if (failureCallback) {
                    failureCallback(error);
                }
            }
        });
    }

    /**
     * 申请直接加入场域。
     * @param {Contact} contact 
     * @param {Device} device
     * @param {function} successCallback 
     * @param {function} failureCallback 
     */
    applyJoin(contact, device, successCallback, failureCallback) {
        let packet = new Packet(MultipointCommAction.ApplyJoin, {
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
     * 获取 RTC 设备数量。
     * @returns {number} 返回 RTC 终端数量。
     */
    numRTCDevices() {
        return this.rtcDevices.length;
    }

    /**
     * 获取指定 SN 的 RTC 设备。
     * @param {number} sn 
     * @returns {number} 返回指定 SN 的 RTC 终端。
     */
    getRTCDeviceBySN(sn) {
        for (let i = 0; i < this.rtcDevices.length; ++i) {
            let device = this.rtcDevices[i];
            if (device.sn == sn) {
                return device;
            }
        }

        return null;
    }

    /**
     * 获取指定终端的 RTC 设备。
     * @param {CommFieldEndpoint} [fieldEndpoint] 指定终端。
     * @returns {RTCDevice} 返回指定终端的 RTC 设备。
     */
    getRTCDevice(fieldEndpoint) {
        if (undefined === fieldEndpoint) {
            if (this.rtcDevices.length > 0) {
                return this.rtcDevices[0];
            }
            else {
                return null;
            }
        }
        else {
            for (let i = 0; i < this.rtcDevices.length; ++i) {
                let device = this.rtcDevices[i];
                if (null != device.target && device.target.getId() == fieldEndpoint.getId()) {
                    return device;
                }
            }

            return null;
        }
    }

    closeRTCDevice(device) {
        if (device instanceof RTCDevice) {
            for (let i = 0; i < this.rtcDevices.length; ++i) {
                let rtcDevice = this.rtcDevices[i];
                if (rtcDevice == device) {
                    if (this.outboundRTC == rtcDevice) {
                        this.outboundRTC = null;
                    }
                    if (this.inboundRTC == rtcDevice) {
                        this.inboundRTC = null;
                    }
                    rtcDevice.close();
                    this.rtcDevices.splice(i, 1);
                    break;
                }
            }
        }
        else {
            for (let i = 0; i < this.rtcDevices.length; ++i) {
                let rtcDevice = this.rtcDevices[i];
                if (null != rtcDevice.target && rtcDevice.target.getId() == endpoint.getId()) {
                    rtcDevice.close();
                    if (this.outboundRTC == rtcDevice) {
                        this.outboundRTC = null;
                    }
                    if (this.inboundRTC == rtcDevice) {
                        this.inboundRTC = null;
                    }
                    this.rtcDevices.splice(i, 1);
                    break;
                }
            }
        }
    }

    /**
     * 关闭并清空所有 RTC 终端。
     */
    closeRTCDevices() {
        if (this.rtcDevices.length == 0) {
            return;
        }

        this.rtcDevices.forEach((device, index, array) => {
            device.close();
        });
        this.rtcDevices.splice(0, this.rtcDevices.length);

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
     * @param {object} candidate 
     * @param {RTCDevice} rtcDevice
     */
    onIceCandidate(candidate, rtcDevice) {
        let signaling = new Signaling(MultipointCommAction.Candidate,
            this, rtcDevice.getContact(), rtcDevice.getDevice(), rtcDevice.sn);
        signaling.candidate = candidate;
        this.sendSignaling(signaling);
    }

    /**
     * @private
     * @param {RTCDevice} device 
     */
    onMediaConnected(device) {
        if (null != this.listener) {
            this.listener.onMediaConnected(this, device);
        }
    }

    /**
     * @private
     * @param {RTCDevice} device 
     */
    onMediaDisconnected(device) {
        if (null != this.listener) {
            this.listener.onMediaDisconnected(this, device);
        }
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
