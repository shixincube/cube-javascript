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
import { Device } from "../contact/Device";
import { Contact } from "../contact/Contact";
import { Self } from "../contact/Self";
import { Group } from "../contact/Group";
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
import { OrderMap } from "../util/OrderMap";

/**
 * 多方通信场域。
 */
export class CommField extends Entity {

    /**
     * @param {number} id 场域 ID 。
     * @param {Contact} founder 创建人 ID 。
     * @param {Pipeline} pipeline 数据通道。
     * @param {Self} self 当前登录的用户。
     */
    constructor(id, founder, pipeline, self) {
        super(7 * 24 * 60 * 60 * 1000);

        /**
         * 场域 ID 。
         * @type {number}
         */
        this.id = id;

        /**
         * 场域名称。
         * @type {string}
         */
        this.name = founder.getName() + '#' + id;

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
         * 当前签入的用户。
         * @type {Self}
         */
        this.self = self;

        /**
         * 监听器。
         * @type {object}
         */
        this.listener = null;

        /**
         * 媒体约束。
         * @type {MediaConstraint}
         */
        this.mediaConstraint = null;

        /**
         * 终端列表。
         * @type {Array<CommFieldEndpoint>}
         */
        this.endpoints = [];

        /**
         * 出站流的 RTC 终端。
         * @type {RTCDevice}
         */
        this.outboundRTC = null;

        /**
         * 入站流的 RTC 终端。键为 Endpoint 的 ID 。
         * @type {OrderMap< number, RTCDevice >}
         */
        this.inboundRTCMap = new OrderMap();

        /**
         * RTC 设备对应的目标。键为 RTC 设备的 SN 。
         * @type {OrderMap< number, CommFieldEndpoint >}
         */
        this.rtcForEndpointMap = new OrderMap();

        /**
         * 仅用于目标为群组时。
         * @type {Group}
         */
        this.group = null;

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
     * 返回名称。
     * @returns {string} 返回名称。
     */
    getName() {
        return this.name;
    }

    /**
     * 返回创建人。
     * @returns {Contact} 返回创建人。
     */
    getFounder() {
        return this.founder;
    }

    /**
     * 返回媒体约束。
     * @returns {MediaConstraint} 返回媒体约束。
     */
    getMediaConstraint() {
        return this.mediaConstraint;
    }

    /**
     * 当前通信场是否是私有场域。
     * @returns {boolean} 如果是私有场域返回 {@linkcode true} ，否则返回 {@linkcode false} 。
     */
    isPrivate() {
        return (this.id == this.founder.getId());
    }

    /**
     * 启动为 Offer 。
     * @param {RTCDevice} rtcDevice RTC 设备。
     * @param {MediaConstraint} mediaConstraint 媒体约束。
     * @param {function} successCallback 成功回调。
     * @param {function} failureCallback 失败回调。
     * @param {CommFieldEndpoint} [target] 目标终端。
     */
    launchOffer(rtcDevice, mediaConstraint, successCallback, failureCallback, target) {
        if (rtcDevice.mode == 'sendrecv') {
            this.outboundRTC = rtcDevice;
        }
        else if (rtcDevice.mode == 'sendonly') {
            this.outboundRTC = rtcDevice;
        }
        else {
            if (undefined !== target && null != target) {
                this.inboundRTCMap.put(target.id, rtcDevice);
            }
            else {
                failureCallback(new ModuleError(MultipointComm.NAME, MultipointCommState.RTCPeerError, rtcDevice));
                return;
            }
        }

        if (target) {
            // 匹配目标
            this.rtcForEndpointMap.put(rtcDevice.sn, target);
        }

        rtcDevice.onIceCandidate = (candidate, rtcDevice) => {
            this.onIceCandidate(candidate, rtcDevice);
        };
        rtcDevice.onMediaConnected = (rtcDevice) => {
            this.onMediaConnected(rtcDevice);
        };
        rtcDevice.onMediaDisconnected = (rtcDevice) => {
            this.onMediaDisconnected(rtcDevice);
        };

        rtcDevice.openOffer(mediaConstraint, (description) => {
            // 创建信令
            let signaling = new Signaling(MultipointCommAction.Offer, this, this.self, this.self.device);
            // 设置 SDP 信息
            signaling.sessionDescription = description;
            // 设置媒体约束
            signaling.mediaConstraint = mediaConstraint;
            // 设置目标
            if (undefined !== target) {
                signaling.target = target;
            }

            try {
                // 发送信令
                this.sendSignaling(signaling, (signaling) => {
                    // 更新数据
                    this.copy(signaling.field);
                    // 回调
                    successCallback(this);
                }, failureCallback);
            } catch (error) {
                failureCallback(new ModuleError(MultipointComm.NAME, MultipointCommState.Failure, error));
            }
        }, (error) => {
            failureCallback(error);
        });
    }

    /**
     * 启动为 Answer 。
     * @param {RTCDevice} rtcDevice RTC 设备。
     * @param {string} offerDescription
     * @param {MediaConstraint} mediaConstraint 
     * @param {function} successCallback 
     * @param {function} failureCallback 
     * @param {CommFieldEndpoint} target
     */
    launchAnswer(rtcDevice, offerDescription, mediaConstraint, successCallback, failureCallback, target) {
        if (rtcDevice.mode == 'sendrecv' || rtcDevice.mode == 'sendonly') {
            this.outboundRTC = rtcDevice;
        }
        else {
            if (undefined !== target && null != target) {
                this.inboundRTCMap.put(target.id, rtcDevice);
            }
            else {
                failureCallback(new ModuleError(MultipointComm.NAME, MultipointCommState.RTCPeerError, rtcDevice));
                return;
            }
        }

        rtcDevice.onIceCandidate = (candidate) => {
            this.onIceCandidate(candidate, rtcDevice);
        };
        rtcDevice.onMediaConnected = (rtcDevice) => {
            this.onMediaConnected(rtcDevice);
        };
        rtcDevice.onMediaDisconnected = (rtcDevice) => {
            this.onMediaDisconnected(rtcDevice);
        };

        rtcDevice.openAnswer(offerDescription, mediaConstraint, (description) => {
            // 创建信令
            let signaling = new Signaling(MultipointCommAction.Answer, this, this.self, this.self.device);
            // 设置 SDP 信息
            signaling.sessionDescription = description;
            // 设置媒体约束
            signaling.mediaConstraint = mediaConstraint;

            // 设置目标
            if (undefined !== target) {
                signaling.target = target;
            }

            try {
                // 发送信令
                this.sendSignaling(signaling, (signaling) => {
                    // 更新数据
                    this.copy(signaling.field);
                    // 回调
                    successCallback(this);
                }, failureCallback);
            } catch (error) {
                failureCallback(new ModuleError(MultipointComm.NAME, MultipointCommState.Failure, error));
            }
        }, (error) => {
            failureCallback(error);
        });
    }

    /**
     * 申请通话场域。
     * @param {Contact} participant 
     * @param {Device} device
     * @param {function} successCallback 
     * @param {function} failureCallback 
     */
    applyCall(participant, device, successCallback, failureCallback) {
        let packet = new Packet(MultipointCommAction.ApplyCall, {
            field: this.toCompactJSON(),
            participant: participant.toCompactJSON(),
            device: device.toCompactJSON()
        });

        this.pipeline.send(MultipointComm.NAME, packet, (pipeline, source, responsePacket) => {
            if (null != responsePacket && responsePacket.getStateCode() == StateCode.OK) {
                if (responsePacket.data.code == MultipointCommState.Ok) {
                    let responseData = responsePacket.data.data;
                    // 更新数据
                    this.copy(responseData);

                    successCallback(this, participant, device);
                }
                else {
                    let error = new ModuleError(MultipointComm.NAME, responsePacket.data.code, {
                        field: this,
                        participant: participant,
                        device: device
                    });
                    failureCallback(error);
                }
            }
            else {
                let error = new ModuleError(MultipointComm.NAME,
                    (null != responsePacket) ? responsePacket.getStateCode() : MultipointCommState.ServerFault, {
                    field: this,
                    participant: participant,
                    device: device
                });
                failureCallback(error);
            }
        });
    }

    /**
     * 申请直接加入场域。
     * @param {Contact} participant 
     * @param {Device} device
     * @param {function} successCallback 
     * @param {function} failureCallback 
     */
    applyJoin(participant, device, successCallback, failureCallback) {
        let packet = new Packet(MultipointCommAction.ApplyJoin, {
            field: this.toCompactJSON(),
            participant: participant.toCompactJSON(),
            device: device.toCompactJSON()
        });
        this.pipeline.send(MultipointComm.NAME, packet, (pipeline, source, responsePacket) => {
            if (null != responsePacket && responsePacket.getStateCode() == StateCode.OK) {
                if (responsePacket.data.code == MultipointCommState.Ok) {
                    let responseData = responsePacket.data.data;
                    // 更新数据
                    this.copy(responseData);

                    successCallback(this, participant, device);
                }
                else {
                    let error = new ModuleError(MultipointComm.NAME, responsePacket.data.code, {
                        field: this,
                        participant: participant,
                        device: device
                    });
                    failureCallback(error);
                }
            }
            else {
                let error = new ModuleError(MultipointComm.NAME,
                    (null != responsePacket) ? responsePacket.getStateCode() : MultipointCommState.ServerFault, {
                        field: this,
                        participant: participant,
                        device: device
                });
                failureCallback(error);
            }
        });
    }

    /**
     * 申请终止场域。
     * @param {Contact} participant 
     * @param {Device} device
     * @param {function} [successCallback] 
     * @param {function} [failureCallback] 
     */
    applyTerminate(participant, device, successCallback, failureCallback) {
        let packet = new Packet(MultipointCommAction.ApplyTerminate, {
            field: this.toCompactJSON(),
            participant: participant.toCompactJSON(),
            device: device.toCompactJSON()
        });
        this.pipeline.send(MultipointComm.NAME, packet, (pipeline, source, responsePacket) => {
            if (null != responsePacket && responsePacket.getStateCode() == StateCode.OK) {
                if (responsePacket.data.code == MultipointCommState.Ok) {
                    let responseData = responsePacket.data.data;
                    // 更新数据
                    this.copy(responseData);

                    if (successCallback) {
                        successCallback(this, participant, device);
                    }
                }
                else {
                    let error = new ModuleError(MultipointComm.NAME, responsePacket.data.code, {
                        field: this,
                        participant: participant,
                        device: device
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
                    participant: participant,
                    device: device
                });
                if (failureCallback) {
                    failureCallback(error);
                }
            }
        });
    }

    /**
     * 终端节点数量。
     * @returns {number} 返回终端节点数量。
     */
    numEndpoints() {
        return this.endpoints.length;
    }

    /**
     * 获取终端节点列表。
     * @returns {Array<CommFieldEndpoint>} 返回终端节点列表。
     */
    getEndpoints() {
        return this.endpoints.concat();
    }

    /**
     * 返回指定的终端节点的实际实例。
     * @param {CommFieldEndpoint|Contact|number} param 
     * @returns {CommFieldEndpoint}
     */
    getEndpoint(param) {
        if (param instanceof CommFieldEndpoint) {
            for (let i = 0; i < this.endpoints.length; ++i) {
                let ep = this.endpoints[i];
                if (ep.getId() == param.getId()) {
                    return ep;
                }
            }
        }
        else if (param instanceof Contact) {
            for (let i = 0; i < this.endpoints.length; ++i) {
                let ep = this.endpoints[i];
                if (ep.contact.id == param.id) {
                    return ep;
                }
            }
        }
        else if (typeof param === 'number') {
            for (let i = 0; i < this.endpoints.length; ++i) {
                let ep = this.endpoints[i];
                if (ep.getId() == param) {
                    return ep;
                }
            }
        }

        return null;
    }

    /**
     * 关闭指定的终端。
     * @param {*} endpoint 
     */
    closeEndpoint(endpoint) {
        for (let i = 0; i < this.endpoints.length; ++i) {
            let ep = this.endpoints[i];
            if (ep.getId() == endpoint.getId()) {
                // 关闭设备
                this.closeRTCDevice(ep);
                // 删除
                this.endpoints.splice(i, 1);
                break;
            }
        }
    }

    /**
     * 获取当前管理的 RTC 设备数量。
     * @returns {number} 返回当前管理的 RTC 设备数量。
     */
    numRTCDevices() {
        let result = (null != this.outboundRTC) ? 1 : 0;
        return result + this.inboundRTCMap.size();
    }

    /**
     * 获取指定终端的 RTC 设备。
     * @param {CommFieldEndpoint} [endpoint] 指定终端。
     * @returns {RTCDevice} 返回指定终端的 RTC 设备。
     */
    getRTCDevice(endpoint) {
        if (undefined == endpoint) {
            return this.outboundRTC;
        }

        if (endpoint.contact.id == this.self.id && endpoint.device.name == this.self.device.name) {
            // loopback 的 Peer
            return this.outboundRTC;
        }

        return this.inboundRTCMap.get(endpoint.getId());
    }

    /**
     * 关闭当前场域。
     */
    close() {
        this.closeRTCDevices();
        this.endpoints.splice(0, this.endpoints.length);
    }

    /**
     * @private
     * @param {CommFieldEndpoint} endpoint 
     */
    closeRTCDevice(endpoint) {
        if (null != this.outboundRTC) {
            if (this.self.id == endpoint.contact.id && this.self.device.name == endpoint.device.name) {
                this.outboundRTC.close();
                this.outboundRTC = null;
                return;
            }
        }

        let rtc = this.inboundRTCMap.remove(endpoint.getId());
        if (null != rtc) {
            this.rtcForEndpointMap.remove(rtc.sn);
            rtc.close();
        }
    }

    /**
     * 关闭并清空所有 RTC 终端。
     * @private
     */
    closeRTCDevices() {
        if (null != this.outboundRTC) {
            this.outboundRTC.close();
            this.outboundRTC = null;
        }

        this.inboundRTCMap.forEach((key, value) => {
            value.close();
        });
        this.inboundRTCMap.clear();

        this.rtcForEndpointMap.clear();
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
                    // 解析数据
                    let response = Signaling.create(data, this.pipeline, this.self);
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
        let signaling = new Signaling(MultipointCommAction.Candidate, this, this.self, this.self.device);
        signaling.candidate = candidate;

        let endpoint = this.rtcForEndpointMap.get(rtcDevice.sn);
        if (null != endpoint) {
            signaling.target = endpoint;
        }

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
     * 从 JSON 数据里复制数据。
     * @param {CommField|JSON} source 
     */
    copy(source) {
        if (source instanceof CommField) {
            this.endpoints = source.endpoints.concat();

            if (null == this.group && null != source.group) {
                this.group = source.group;
            }
        }
        else {
            if (undefined !== source.endpoints) {
                this.endpoints.splice(0, this.endpoints.length);

                source.endpoints.forEach((value) => {
                    let cfep = CommFieldEndpoint.create(value);
                    cfep.field = this;
                    this.endpoints.push(cfep);
                });
            }

            if (null == this.caller && undefined !== source.caller) {
                this.caller = Contact.create(source.caller);
            }

            if (null == this.callee && undefined !== source.callee) {
                this.callee = Contact.create(source.callee);
            }
        }
    }

    /**
     * @inheritdoc
     */
    toJSON() {
        let json = super.toJSON();
        json.id = this.id;
        json.domain = this.founder.getDomain();
        json.name = this.name;
        json.founder = this.founder.toCompactJSON();

        json.mediaConstraint = this.mediaConstraint.toJSON();

        json.endpoints = [];
        for (let i = 0; i < this.endpoints.length; ++i) {
            json.endpoints.push(this.endpoints[i].toJSON());
        }

        if (null != this.group) {
            json.group = this.group.toCompactJSON();
        }

        if (null != this.caller) {
            json.caller = this.caller.toCompactJSON();
        }

        if (null != this.callee) {
            json.callee = this.callee.toCompactJSON();
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
        json.name = this.name;
        json.founder = this.founder.toCompactJSON();

        json.mediaConstraint = this.mediaConstraint.toJSON();

        if (null != this.group) {
            json.group = this.group.toCompactJSON();
        }

        if (null != this.caller) {
            json.caller = this.caller.toCompactJSON();
        }

        if (null != this.callee) {
            json.callee = this.callee.toCompactJSON();
        }

        return json;
    }

    /**
     * 创建由 JSON 格式定义的 {@link CommField} 对象。
     * @param {JSON} json 指定 JSON 格式。
     * @param {Pipeline} pipeline 指定数据管道。
     * @param {Self} self 指定当前登录用户。
     * @returns {CommField} 返回 {@link CommField} 对象实例。
     */
    static create(json, pipeline, self) {
        let field = new CommField(json.id, Contact.create(json.founder), pipeline, self);

        field.name = json.name;

        field.mediaConstraint = MediaConstraint.create(json.mediaConstraint);

        if (undefined !== json.endpoints) {
            let list = json.endpoints;
            for (let i = 0; i < list.length; ++i) {
                let cfep = CommFieldEndpoint.create(list[i]);
                cfep.field = field;
                field.endpoints.push(cfep);
            }
        }

        if (undefined !== json.group) {
            field.group = Group.create(null, json.group);
        }

        if (undefined !== json.caller) {
            field.caller = Contact.create(json.caller, json.domain);
        }

        if (undefined !== json.callee) {
            field.callee = Contact.create(json.callee, json.domain);
        }

        return field;
    }
}
