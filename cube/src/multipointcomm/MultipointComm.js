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

import cell from "@lib/cell-lib";
import { Module } from "../core/Module";
import { ContactEvent } from "../contact/ContactEvent";
import { Contact } from "../contact/Contact";
import { Device } from "../contact/Device";
import { Group } from "../contact/Group";
import { GroupAppendix } from "../contact/GroupAppendix";
import { ContactService } from "../contact/ContactService";
import { Packet } from "../core/Packet";
import { StateCode } from "../core/StateCode";
import { OrderMap } from "../util/OrderMap";
import { CommField } from "./CommField";
import { MultipointCommAction } from "./MultipointCommAction";
import { RTCDevice } from "./RTCDevice";
import { MediaConstraint } from "./MediaConstraint";
import { MultipointCommState } from "./MultipointCommState";
import { CommPipelineListener } from "./CommPipelineListener";
import { ObservableEvent } from "../core/ObservableEvent";
import { MultipointCommEvent } from "./MultipointCommEvent";
import { Signaling } from "./Signaling";
import { ModuleError } from "../core/error/ModuleError";
import { CallRecord } from "./CallRecord";
import { CommFieldEndpoint } from "./CommFieldEndpoint";
import { MediaDeviceTool } from "../util/MediaDeviceTool";

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
         * 联系人模块。
         * @type {ContactService}
         */
        this.cs = null;

        /**
         * ICE Servers 。
         * @type {Array}
         */
        this.iceServers = null;

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
        this.activeCall = null;

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
                this.privateField.listener = this;
                this.privateField.device = self.getDevice();
            }
        });
        contactService.attachWithName(ContactEvent.SignOut, (state) => {
            // 停止所有的通话
            if (null != this.activeCall) {
                this.hangupCall();
            }
        });
        let self = contactService.getSelf();
        if (null != self) {
            // 创建个人通信场
            this.privateField = new CommField(self.getId(), self, this.pipeline);
            this.privateField.listener = this;
            this.privateField.device = self.getDevice();
        }
        // 赋值
        this.cs = contactService;

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
            this.privateField.closeRTCDevices();
        }

        if (null != this.activeCall && this.activeCall.isActive()) {
            this.hangupCall(() => {
                this.activeCall = null;
                this.pipeline.removeListener(MultipointComm.NAME, this.pipelineListener);
            }, () => {
                this.activeCall = null;
                this.pipeline.removeListener(MultipointComm.NAME, this.pipelineListener);
            });
        }
        else {
            this.pipeline.removeListener(MultipointComm.NAME, this.pipelineListener);
        }
    }

    /**
     * @inheritdoc
     * @see Module#config
     */
    config(config) {
        if (config.iceServers) {
            this.iceServers = config.iceServers;
        }
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
     * 获取私有通信域。
     * @returns {CommField}
     */
    getPrivateField() {
        return this.privateField;
    }

    /**
     * 列举当前系统可用的所有媒体设备。
     * @param {function} handler 结果回调函数。参数：({@linkcode list}:{@linkcode Array< MediaDeviceDescription >}) 。
     */
    listMediaDevices(handler) {
        let list = [];
        MediaDeviceTool.enumDevices(function(result) {
            for (let i = 0; i < result.length; ++i) {
                if (result[i].deviceId == 'default') {
                    continue;
                }

                list.push(result[i]);
            }

            handler(list);
        });
    }

    /**
     * 创建 RTC 终端节点。
     * @private
     * @param {Contact} contact 
     * @param {Device} device 
     * @param {string} mode
     * @param {HTMLElement} [localVideoElem]
     * @param {HTMLElement} [remoteVideoElem]
     * @returns {RTCDevice} 返回 {@ink RTCDevice} 实例。
     */
    createRTCDevice(contact, device, mode, localVideoElem, remoteVideoElem) {
        // 创建 RTC Device
        let rtcDevice = new RTCDevice(contact, device, mode);

        if (localVideoElem) {
            localVideoElem.muted = true;
            localVideoElem.volume = 0;
            rtcDevice.localVideoElem = localVideoElem;
        }

        if (remoteVideoElem) {
            rtcDevice.remoteVideoElem = remoteVideoElem;
        }

        return rtcDevice;
    }

    /**
     * 创建多方场域。
     * @param {function} successCallback 
     * @param {function} failureCallback 
     * @param {Array<Contact>} [contacts] 
     */
    createCommField(successCallback, failureCallback, contacts) {
        let commField = new CommField(cell.Utils.generateSerialNumber(), this.cs.getSelf(), this.pipeline);

        if (contacts) {
            commField.invitees = contacts;
        }

        // 向服务器申请创建场域
        let requestPacekt = new Packet(MultipointCommAction.CreateField, commField.toJSON());
        this.pipeline.send(MultipointComm.NAME, requestPacekt, (pipeline, source, packet) => {
            if (null != packet && packet.getStateCode() == StateCode.OK) {
                if (packet.data.code == MultipointCommState.Ok) {
                    if (successCallback) {
                        successCallback(commField);
                    }
                }
                else {
                    let error = new ModuleError(MultipointComm.NAME, packet.data.code, commField);
                    if (failureCallback) {
                        failureCallback(error);
                    }
                }
            }
            else {
                let error = new ModuleError(MultipointComm.NAME, MultipointCommState.ServerFault, commField);
                if (failureCallback) {
                    failureCallback(error);
                }
            }
        });
    }

    /**
     * 
     * @param {number} id 
     * @param {function} successCallback 
     * @param {function} failureCallback 
     */
    getCommField(id, successCallback, failureCallback) {

    }

    /**
     * 呼叫指定场域或者联系人。
     * @param {CommField|Contact|Group} target 指定通话对象。指定 {@link CommField} 表示呼入通讯场，指定 {@link Contact} 表示呼叫联系人，指定 {@link Group} 表示呼叫群组。
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
            this.notifyObservers(new ObservableEvent(MultipointCommEvent.CallFailed, error));
            return false;
        }

        // 处理操作成功
        let successHandler = (signaling) => {
            if (successCallback) {
                successCallback(this.activeCall);
            }

            if (signaling.field.isPrivate()) {
                // 私有场域，触发 Ringing 事件
                this.notifyObservers(new ObservableEvent(MultipointCommEvent.Ringing, this.activeCall));
            }
        };

        // 处理操作失败
        let failureHandler = (error) => {
            if (this.callTimer > 0) {
                clearTimeout(this.callTimer);
                this.callTimer = 0;
            }

            // 记录错误
            this.activeCall.lastError = error;

            // 如果是 MediaPermissionDenied
            if (error.code == MultipointCommState.MediaPermissionDenied) {
                // 需要额外进行处理，因为浏览器可能无法连接到摄像头，但是可以连接麦克风
                // 当连接不到摄像头时，需要直接从私域退出，而不发送信令
                if (this.activeCall.field.isPrivate()) {
                    this.privateField.applyTerminate(this.privateField.founder, this.privateField.device);
                }
                else {
                    // TODO
                }

                if (failureCallback) {
                    failureCallback(error);
                }

                this.notifyObservers(new ObservableEvent(MultipointCommEvent.CallFailed, error));

                this.activeCall = null;
            }
            else {
                if (failureCallback) {
                    failureCallback(error);
                }
    
                this.notifyObservers(new ObservableEvent(MultipointCommEvent.CallFailed, error));

                if (this.activeCall.field.isPrivate()) {
                    this.hangupCall();
                }
                else {
                    // TODO
                }
            }
        };

        if (target instanceof Contact) {
            // 呼叫指定联系人

            if (null != this.activeCall && this.activeCall.isActive()) {
                // 正在通话中
                let error = new ModuleError(MultipointComm.NAME, MultipointCommState.CallerBusy, target);
                if (failureCallback) {
                    failureCallback(error);
                }
                this.notifyObservers(new ObservableEvent(MultipointCommEvent.CallFailed, error));
                return false;
            }

            (new Promise((resolve, reject) => {
                // 启动定时器
                this.callTimer = setTimeout(() => {
                    this.fireCallTimeout();
                }, this.callTimeout);

                resolve();
            })).then(() => {
                // 回调 InProgress 事件
                this.notifyObservers(new ObservableEvent(MultipointCommEvent.InProgress, target));
            });

            // 创建通话记录
            this.activeCall = new CallRecord(this.privateField.getFounder());
            this.activeCall.field = this.privateField;

            // 设置主叫
            this.privateField.caller = this.privateField.getFounder();
            // 设置被叫
            this.privateField.callee = target;

            // 创建 RTC 设备
            let rtcDevice = this.createRTCDevice(this.privateField.caller, this.privateField.device,
                            'sendrecv', this.videoElem.local, this.videoElem.remote);

            // 1. 先申请主叫，从而设置目标
            this.privateField.applyCall(this.privateField.caller, this.privateField.device, (commField, proposer, device) => {
                // 记录主叫媒体约束
                this.activeCall.callerMediaConstraint = mediaConstraint;

                // 2. 启动 RTC 节点，发起 Offer
                rtcDevice.enableICE(this.iceServers);
                this.privateField.launchOffer(rtcDevice, mediaConstraint, successHandler, failureHandler);
            }, (error) => {
                failureHandler(error);
            });
        }
        else if (target instanceof Group) {
            // 发起群组内的通话

            let cfid = target.getAppendix().commId;
            if (0 == cfid) {
                // 创建新场域
                this.createCommField((commField) => {
                    // 更新群组的 CommFiled ID
                    target.getAppendix().updateCommId(commField.getId());

                    // 发起呼叫
                    setTimeout(() => {
                        if (!this.makeCall(commField, mediaConstraint, successCallback, failureCallback)) {
                            failureHandler(new ModuleError(MultipointComm.NAME, MultipointCommState.GroupStateError, target));
                        }
                    }, 1);
                }, (error) => {
                    failureHandler(error);
                });
            }
            else {
                // 获取场域
                this.getCommField(cfid, (commField) => {
                    // 发起呼叫
                    setTimeout(() => {
                        if (!this.makeCall(commField, mediaConstraint, successCallback, failureCallback)) {
                            failureHandler(new ModuleError(MultipointComm.NAME, MultipointCommState.GroupStateError, target));
                        }
                    }, 1);
                }, (error) => {
                    failureHandler(error);
                });
            }
        }
        else if (target instanceof CommField) {
            if (null != this.activeCall) {
                if (this.activeCall.field.getId() != target.getId()) {
                    return false;
                }
            }
            else {
                // 创建通话记录
                this.activeCall = new CallRecord(this.privateField.getFounder());
                // 记录
                this.activeCall.field = target;
            }

            (new Promise((resolve, reject) => {
                resolve();
            })).then(() => {
                // 回调 InProgress 事件
                this.notifyObservers(new ObservableEvent(MultipointCommEvent.InProgress, target));
            });

            let self = this.cs.getSelf();
            let rtcDevice = this.createRTCDevice(self, self.getDevice(), 'sendonly');

            // 1. 申请通话
            target.applyCall(self, (commField, proposer) => {
                console.log('applyCall is ok');
            }, (error) => {
                failureHandler(error);
            });
        }
        else {
            return false;
        }

        return true;
    }

    /**
     * 获取指定场域或者终端的通讯数据。
     * @param {CommField|CommFieldEndpoint} target 指定待获取数据的场域或者终端。
     * @param {function} [successCallback] 成功回调函数，函数参数：({@linkcode callRecord}:{@link CallRecord}) 。
     * @param {function} [failureCallback] 失败回调函数，函数参数：({@linkcode error}:{@link ModuleError}) 。
     * @returns {boolean} 返回是否允许执行该操作。
     *
    followCall(target, successCallback, failureCallback) {
        if (null == this.privateField) {
            // 联系人模块没有完成签入操作
            let error = new ModuleError(MultipointComm.NAME, MultipointCommState.Uninitialized, target);
            if (failureCallback) {
                failureCallback(error);
            }
            this.notifyObservers(new ObservableEvent(MultipointCommEvent.CallFailed, error));
            return false;
        }

        // 处理操作成功
        let successHandler = (signaling) => {
            if (successCallback) {
                successCallback(this.activeCall);
            }
        };

        // 处理操作失败
        let failureHandler = (error) => {
            // 记录错误
            this.activeCall.lastError = error;

            if (failureCallback) {
                failureCallback(error);
            }

            this.notifyObservers(new ObservableEvent(MultipointCommEvent.CallFailed, error));

            if (target instanceof CommField) {
                this.activeCall.field.closeRTCDevices();
            }
            else if (target instanceof CommFieldEndpoint) {
                this.activeCall.field.closeRTCDevice(target);
            }
        };

        if (target instanceof CommField) {
            if (null != this.activeCall) {
                if (this.activeCall.field.getId() != target.getId()) {
                    return false;
                }

                if (null != this.activeCall.field.inboundRTC) {
                    // 正在通话中
                    let error = new ModuleError(MultipointComm.NAME, MultipointCommState.CallerBusy, target);
                    if (failureCallback) {
                        failureCallback(error);
                    }
                    this.notifyObservers(new ObservableEvent(MultipointCommEvent.CallFailed, error));
                    return false;
                }
            }
            else {
                // 创建通话记录
                this.activeCall = new CallRecord(this.privateField.getFounder());
                // 记录
                this.activeCall.field = target;
            }

            (new Promise((resolve, reject) => {
                resolve();
            })).then(() => {
                // 回调 InProgress 事件
                this.notifyObservers(new ObservableEvent(MultipointCommEvent.InProgress, target));
            });

            // xjw
            let rtcDevice = this.createRTCDevice();

            // 获取 Comm Field 的混码流
            target.launchOffer(rtcDevice, null, successHandler, failureHandler);
            target.inboundRTC = rtcDevice;
        }
        else if (target instanceof CommFieldEndpoint) {
            if (null != this.activeCall) {
                if (this.activeCall.field.getId() != target.field.getId()) {
                    return false;
                }
            }
            else {
                // 记录
                this.activeCall = new CallRecord(this.privateField.getFounder());
                this.activeCall.field = target.field;
            }

            (new Promise((resolve, reject) => {
                resolve();
            })).then(() => {
                // 回调 InProgress 事件
                this.notifyObservers(new ObservableEvent(MultipointCommEvent.InProgress, target));
            });

            // xjw
            let rtcDevice = this.createRTCDevice();

            // 订阅 CommFieldEndpoint 的流
            target.field.launchFollow(target, rtcDevice, successHandler, failureHandler);
        }
        else {
            return false;
        }

        return true;
    }*/

    /**
     * 应答呼叫。
     * @param {MediaConstraint} mediaConstraint 指定本地的媒体约束。
     * @param {CommField|Contact|Group} [target] 指定应答对象。
     * @param {function} [successCallback] 成功回调函数，函数参数：({@linkcode callRecord}:{@link CallRecord}) 。
     * @param {function} [failureCallback] 失败回调函数，函数参数：({@linkcode error}:{@link ModuleError}) 。
     * @returns {boolean} 返回是否允许执行该操作。
     */
    answerCall(mediaConstraint, target, successCallback, failureCallback) {
        if (null == mediaConstraint || undefined === mediaConstraint) {
            return false;
        }

        if (null == this.offerSignaling) {
            cell.Logger.w(MultipointComm.NAME, '#answerCall offer signaling is null');
            return false;
        }

        if (typeof target === 'function') {
            // 调整参数
            failureCallback = successCallback;
            successCallback = target;
            if (this.offerSignaling.field.isPrivate()) {
                target = this.offerSignaling.caller;
            }
            else {
                target = this.offerSignaling.field;
            }
        }
        else if (undefined === target) {
            if (this.offerSignaling.field.isPrivate()) {
                target = this.offerSignaling.caller;
            }
            else {
                target = this.offerSignaling.field;
            }
        }

        if (this.callTimer > 0) {
            clearTimeout(this.callTimer);
            this.callTimer = 0;
        }

        let successHandler = (signaling) => {
            if (successCallback) {
                successCallback(this.activeCall);
            }
            this.notifyObservers(new ObservableEvent(MultipointCommEvent.Connected, this.activeCall));
        };

        let failureHandler = (error) => {
            this.activeCall.lastError = error;

            if (failureCallback) {
                failureCallback(error);
            }
            this.notifyObservers(new ObservableEvent(MultipointCommEvent.CallFailed, error));

            if (this.activeCall.field.isPrivate()) {
                this.hangupCall();
            }
        };

        (new Promise((resolve, reject) => {
            resolve();
        })).then(() => {
            // 回调 InProgress 事件
            this.notifyObservers(new ObservableEvent(MultipointCommEvent.InProgress, target));
        });

        if (target instanceof Contact) {
            // 应答指定联系人
            if (null != this.activeCall && this.activeCall.isActive()) {
                // 正在通话中
                let error = new ModuleError(MultipointComm.NAME, MultipointCommState.CalleeBusy, target);
                if (failureCallback) {
                    failureCallback(error);
                }
                this.notifyObservers(new ObservableEvent(MultipointCommEvent.CallFailed, error));
                return false;
            }

            if (null == this.videoElem.local && null == this.videoElem.remote) {
                // 没有设置任何视频元素标签
                let error = new ModuleError(MultipointComm.NAME, MultipointCommState.VideoElementNotSetting, target);
                if (failureCallback) {
                    failureCallback(error);
                }
                this.notifyObservers(new ObservableEvent(MultipointCommEvent.CallFailed, error));
                return false;
            }

            // 记录时间
            this.activeCall.answerTime = Date.now();

            // 创建 RTC 设备
            let rtcDevice = this.createRTCDevice(this.privateField.founder, this.privateField.device,
                                'sendrecv', this.videoElem.local, this.videoElem.remote);

            // 1. 先申请加入
            this.privateField.applyJoin(rtcDevice.getContact(), rtcDevice.getDevice(), (commField, contact, device) => {
                // 记录
                this.activeCall.calleeMediaConstraint = mediaConstraint;

                // 2. 启动 RTC 节点，发起 Answer
                rtcDevice.enableICE(this.iceServers);
                this.privateField.launchAnswer(rtcDevice,
                    this.offerSignaling.sessionDescription, mediaConstraint, successHandler, failureHandler);
            }, (error) => {
                failureHandler(error);
            });
        }
        else if (target instanceof CommField) {
            // 创建 RTC 终端
            // xjw
            let rtcDevice = this.createRTCDevice();

            // 应答 Comm Field
            target.launchAnswer(rtcDevice,
                this.offerSignaling.sessionDescription, mediaConstraint, successHandler, failureHandler);
        }
        else {
            return false;
        }

        return true;
    }

    /**
     * 终止当前的通话。
     * @param {CommField|CommFieldEndpoint} [target] 指定终止的目标。
     * @param {function} [successCallback] 成功回调函数，函数参数：({@linkcode callRecord}:{@link CallRecord}) 。
     * @param {function} [failureCallback] 失败回调函数，函数参数：({@linkcode error}:{@link ModuleError}) 。
     * @returns {boolean} 返回是否允许执行该操作。
     */
    hangupCall(target, successCallback, failureCallback) {
        if (null == this.activeCall) {
            cell.Logger.w('MultipointComm', '#hangupCall - activeCall is null');
            return false;
        }

        let busy = !this.activeCall.isActive();
         // 当前通话的场域
        let field = this.activeCall.field;
        let endpoint = null;

        if (undefined !== target) {
            if (typeof target === 'function') {
                failureCallback = successCallback;
                successCallback = target;
            }
            else if (target instanceof CommField) {
                if (this.activeCall.field.getId() != target.getId()) {
                    return false;
                }
            }
            else if (target instanceof CommFieldEndpoint) {
                endpoint = target;
            }
        }

        let handler = (pipeline, source, packet) => {
            if (null == this.activeCall) {
                // 当返回数据时，之前的操作已经关闭通话
                return;
            }

            let activeCall = this.activeCall;

            if (field.isPrivate()) {
                field.closeRTCDevices();
                this.offerSignaling = null;
                this.answerSignaling = null;
            }

            if (null != packet && packet.getStateCode() == StateCode.OK) {
                if (packet.data.code == MultipointCommState.Ok) {
                    let signaling = Signaling.create(packet.data.data, this.pipeline);

                    if (!signaling.field.isPrivate()) {
                        // 非私域，指定是否关闭指定的终端
                        if (null != signaling.target) {
                            field.closeRTCDevice(signaling.target);
                            activeCall.currentFieldEndpoint = field.getEndpoint(signaling.target);
                        }
                        else {
                            field.closeRTCDevice(field.outboundRTC);
                        }
                    }
                    else {
                        // 记录结束时间
                        activeCall.endTime = Date.now();
                    }

                    if (successCallback) {
                        successCallback(activeCall);
                    }

                    if (busy) {
                        this.notifyObservers(new ObservableEvent(MultipointCommEvent.Busy, activeCall));
                    }
                    else {
                        this.notifyObservers(new ObservableEvent(MultipointCommEvent.Bye, activeCall));
                    }

                    if (activeCall.field.numRTCDevices() == 0) {
                        this.activeCall = null;
                    }
                }
                else {
                    let error = new ModuleError(MultipointComm.NAME, packet.data.code, activeCall);

                    activeCall.endTime = Date.now();
                    activeCall.lastError = error;

                    if (failureCallback) {
                        failureCallback(error);
                    }
                    this.notifyObservers(new ObservableEvent(MultipointCommEvent.CallFailed, error));

                    this.activeCall = null;
                }
            }
            else {
                let error = new ModuleError(MultipointComm.NAME, packet.getStateCode(), activeCall);

                activeCall.endTime = Date.now();
                activeCall.lastError = error;

                if (failureCallback) {
                    failureCallback(error);
                }
                this.notifyObservers(new ObservableEvent(MultipointCommEvent.CallFailed, error));

                this.activeCall = null;
            }
        };

        if (this.callTimer > 0) {
            clearTimeout(this.callTimer);
            this.callTimer = 0;
        }

        if (field.isPrivate()) {
            if (this.activeCall.isActive()) {
                let signaling = new Signaling(MultipointCommAction.Bye, field, 
                    this.privateField.founder, this.privateField.founder.getDevice(),
                    null != field.getRTCDevice() ? field.getRTCDevice().sn : 0);
                let packet = new Packet(MultipointCommAction.Bye, signaling.toJSON());
                this.pipeline.send(MultipointComm.NAME, packet, handler);
            }
            else {
                let signaling = new Signaling(MultipointCommAction.Busy, field, 
                    this.privateField.founder, this.privateField.founder.getDevice(),
                    null != field.getRTCDevice() ? field.getRTCDevice().sn : 0);
                let packet = new Packet(MultipointCommAction.Busy, signaling.toJSON());
                this.pipeline.send(MultipointComm.NAME, packet, handler);
            }
        }
        else {
            if (null == field.outboundRTC) {
                return false;
            }

            let signaling = new Signaling(MultipointCommAction.Bye, field, 
                this.privateField.founder, this.privateField.founder.getDevice(),
                field.outboundRTC.sn);
            // 设置目标，如果不订阅目标设置为 null
            signaling.target = endpoint;
            let packet = new Packet(MultipointCommAction.Bye, signaling.toJSON());
            this.pipeline.send(MultipointComm.NAME, packet, byeHandler);
        }

        return true;
    }

    /**
     * 取消指定场域或者指定场域终端的入站流。
     * @param {CommField|CommFieldEndpoint} target 指定场域或者场域终端。
     * @param {function} [successCallback] 成功回调函数，函数参数：({@linkcode callRecord}:{@link CallRecord}) 。
     * @param {function} [failureCallback] 失败回调函数，函数参数：({@linkcode error}:{@link ModuleError}) 。
     * @returns {boolean} 返回是否允许执行该操作。
     */
    revokeCall(target, successCallback, failureCallback) {
        if (null == this.activeCall || !this.activeCall.isActive()) {
            return false;
        }

        if (this.activeCall.field.isPrivate()) {
            return false;
        }

        // 当前通话的场域
        let field = this.activeCall.field;
        let endpoint = null;

        if (target instanceof Contact) {
            return false;
        }
        else if (target instanceof CommField) {
            if (field.getId() != target.getId()) {
                return false;
            }

            if (null == field.inboundRTC) {
                // 没有拉取场域的流
                return false;
            }
        }
        else if (target instanceof CommFieldEndpoint) {
            endpoint = target;
        }

        let revokeHandler = (pipeline, source, packet) => {
            let activeCall = this.activeCall;

            if (null != packet && packet.getStateCode() == StateCode.OK) {
                if (packet.data.code == MultipointCommState.Ok) {
                    let signaling = Signaling.create(packet.data.data, this.pipeline);

                    // 非私域，指定是否关闭指定的终端
                    if (null != signaling.target) {
                        field.closeRTCDevice(signaling.target);
                        activeCall.currentFieldEndpoint = field.getEndpoint(signaling.target);
                    }
                    else {
                        field.closeRTCDevice(field.inboundRTC);
                    }

                    if (successCallback) {
                        successCallback(activeCall);
                    }
                    this.notifyObservers(new ObservableEvent(MultipointCommEvent.Bye, activeCall));

                    if (field.numRTCDevices() == 0) {
                        this.activeCall = null;
                    }
                }
                else {
                    let error = new ModuleError(MultipointComm.NAME, packet.data.code, activeCall);

                    activeCall.lastError = error;

                    if (failureCallback) {
                        failureCallback(error);
                    }
                    this.notifyObservers(new ObservableEvent(MultipointCommEvent.CallFailed, error));
                }
            }
            else {
                let error = new ModuleError(MultipointComm.NAME, packet.getStateCode(), activeCall);

                activeCall.lastError = error;

                if (failureCallback) {
                    failureCallback(error);
                }
                this.notifyObservers(new ObservableEvent(MultipointCommEvent.CallFailed, error));
            }
        };

        let signaling = new Signaling(MultipointCommAction.Revoke, field, 
            this.privateField.founder, this.privateField.founder.getDevice(),
            field.getRTCDevice(endpoint).sn);
        // 设置目标，如果不订阅目标设置为 null
        signaling.target = endpoint;
        let packet = new Packet(MultipointCommAction.Revoke, signaling.toJSON());
        this.pipeline.send(MultipointComm.NAME, packet, revokeHandler);

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
        if (null == this.activeCall) {
            return null;
        }

        return this.activeCall.field;
    }

    /**
     * 获取当前活跃的通话记录。
     * @returns {CallRecord} 返回当前活跃的通话记录。
     */
    getActiveRecord() {
        return this.activeCall;
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

        this.notifyObservers(new ObservableEvent(MultipointCommEvent.Timeout, this.activeCall));

        this.hangupCall();
    }

    /**
     * 当媒体流连通时回调。
     * @private
     * @param {CommField} commField 
     * @param {RTCDevice} rtcDevice 
     */
    onMediaConnected(commField, rtcDevice) {
        this.notifyObservers(new ObservableEvent(MultipointCommEvent.MediaConnected, this.activeCall));
    }

    /**
     * 当媒体流断开时回调。
     * @private
     * @param {CommField} commField 
     * @param {RTCDevice} rtcDevice 
     */
    onMediaDisconnected(commField, rtcDevice) {
        this.notifyObservers(new ObservableEvent(MultipointCommEvent.MediaDisconnected, this.activeCall));

        if (this.activeCall.field.isPrivate()) {
            // 私域通信，触发 Hangup
            this.hangupCall();
        }
    }

    /**
     * 处理 Offer 信令。
     * @private
     * @param {JSON} payload 
     * @param {object} context 
     */
    triggerOffer(payload, context) {
        let data = payload.data;
        let offerSignaling = Signaling.create(data, this.pipeline);

        // 检查当期是否有通话正在进行
        if (null != this.activeCall && this.activeCall.isActive()) {
            // 应答忙音 Busy
            let busy = new Signaling(MultipointCommAction.Busy, offerSignaling.field,
                this.privateField.getFounder(), this.privateField.getDevice(), 0);
            let packet = new Packet(MultipointCommAction.Busy, busy.toJSON());
            this.pipeline.send(MultipointComm.NAME, packet);
            return;
        }

        // 赋值
        this.offerSignaling = offerSignaling;

        this.callTimer = setTimeout(() => {
            this.fireCallTimeout();
        }, this.callTimeout - 5500);

        // 创建记录
        this.activeCall = new CallRecord(this.privateField.getFounder());

        if (this.offerSignaling.field.isPrivate()) {
            // 设置私域
            this.activeCall.field = this.privateField;
            // 记录媒体约束
            this.activeCall.callerMediaConstraint = this.offerSignaling.mediaConstraint;

            let callback = () => {
                // 新的通话申请
                this.notifyObservers(new ObservableEvent(MultipointCommEvent.NewCall, this.activeCall));
            };

            this.cs.getContact(this.offerSignaling.caller.id, (contact) => {
                this.activeCall.field.caller = this.offerSignaling.caller = contact;
                this.activeCall.field.callee = this.offerSignaling.callee = this.cs.getSelf();
                callback();
            }, (error) => {
                this.activeCall.field.caller = this.offerSignaling.caller;
                this.activeCall.field.callee = this.offerSignaling.callee = this.cs.getSelf();
                callback();
            });
        }
        else {
            this.activeCall.field = this.offerSignaling.field;
            // 新的通话申请
            this.notifyObservers(new ObservableEvent(MultipointCommEvent.NewCall, this.activeCall));
        }
    }

    /**
     * 处理 Answer 信令。
     * @private
     * @param {JSON} payload 
     * @param {object} context 
     */
    triggerAnswer(payload, context) {
        if (null == this.activeCall || !this.activeCall.isActive()) {
            cell.Logger.e(MultipointComm.NAME, '#triggerAnswer no active call record');
            return;
        }

        if (this.callTimer > 0) {
            clearTimeout(this.callTimer);
            this.callTimer = 0;
        }

        // 记录应答时间
        this.activeCall.answerTime = Date.now();

        let data = payload.data;
        this.answerSignaling = Signaling.create(data, this.pipeline);

        let rtcDevice = null;

        if (this.activeCall.field.isPrivate()) {
            // 记录媒体约束
            this.activeCall.calleeMediaConstraint = this.answerSignaling.mediaConstraint;
            rtcDevice = this.activeCall.field.getRTCDevice();
        }
        else {
            if (null != this.answerSignaling.target) {
                rtcDevice = this.activeCall.field.getRTCDevice(this.answerSignaling.target);
            }
            else {
                if (null != this.answerSignaling.mediaConstraint) {
                    // 应答数据带媒体约束表示是来自 CommField 的入站流
                    rtcDevice = this.activeCall.field.inboundRTC;
                }
                else {
                    // 没有携带媒体约束表示是出站 Offer 的流
                    rtcDevice = this.activeCall.field.outboundRTC;
                }
            }
        }

        rtcDevice.doAnswer(this.answerSignaling.sessionDescription, () => {
            this.notifyObservers(new ObservableEvent(MultipointCommEvent.Connected, this.activeCall));
        }, (error) => {
            this.activeCall.lastError = error;
            this.notifyObservers(new ObservableEvent(MultipointCommEvent.CallFailed, error));
        });
    }

    /**
     * 处理 Candidate 信令。
     * @private
     * @param {JSON} payload 
     * @param {object} context 
     */
    triggerCandidate(payload, context) {
        let signaling = Signaling.create(payload.data, this.pipeline);

        // 获取 RTCDevice 实例
        let rtcDevice = this.activeCall.field.getRTCDeviceBySN(signaling.rtcSN);

        if (null == rtcDevice) {
            cell.Logger.e('MultipointComm', 'Can NOT find rtc device: ' + signaling.rtcSN);
            return;
        }

        if (null != signaling.candidates) {
            let list = signaling.candidates;
            for (let i = 0; i < list.length; ++i) {
                rtcDevice.doCandidate(list[i]);
            }
        }

        if (null != signaling.candidate) {
            rtcDevice.doCandidate(signaling.candidate);
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
            this.notifyObservers(new ObservableEvent(MultipointCommAction.CallFailed, error));
            return;
        }

        if (this.callTimer > 0) {
            clearTimeout(this.callTimer);
            this.callTimer = 0;
        }

        let signaling = Signaling.create(payload.data, this.pipeline);
        if (signaling.field.isPrivate()) {
            if (signaling.callee.getId() == this.privateField.getId()) {
                // 记录
                this.activeCall.endTime = Date.now();

                // 收到本终端 Busy 时，回调 Bye
                this.notifyObservers(new ObservableEvent(MultipointCommEvent.Bye, this.activeCall));
            }
            else {
                // 收到其他终端的 Busy
                this.notifyObservers(new ObservableEvent(MultipointCommEvent.Busy, this.activeCall));

                // 终止通话
                this.hangupCall();
            }
        }
        else {
            this.notifyObservers(new ObservableEvent(MultipointCommEvent.Busy, signaling.field));
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
            this.hangupCall(signaling.field);
        }
    }
}
