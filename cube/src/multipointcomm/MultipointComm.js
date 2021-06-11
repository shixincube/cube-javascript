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
import { BroswerUtil } from "../util/BroswerUtil";

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
         * @private
         */
        this.pipelineListener = new CommPipelineListener(this);

        /**
         * 联系人模块。
         * @type {ContactService}
         * @private
         */
        this.cs = null;

        /**
         * ICE Servers 。
         * @type {Array}
         * @private
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
         * @private
         */
        this.fields = new OrderMap();

        /**
         * 来自主叫的信令。
         * @type {Signaling}
         * @private
         */
        this.offerSignaling = null;

        /**
         * 来自被叫的信令。
         * @type {Signaling}
         * @private
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
         * @type {function}
         * @private
         */
        this.videoElemAgent = null;

        /**
         * 实时状态更新定时器。
         * @type {number}
         * @private
         */
        this.statsTimer = 0;

        /**
         * 呼叫定时器。
         * @type {number}
         * @private
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
                this.privateField = new CommField(self.getId(), self, this.pipeline, self);
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
            this.privateField = new CommField(self.getId(), self, this.pipeline, self);
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
     * 设置视频元素代理器。用于将视频、音频流加载到对应的 {@linkcode vidoe} 标签上。
     * 代理器是一个 {@linkcode function} 类型，输入参数为联系人，返回该联系人对应的视频标签元素。
     * @param {function} agent 指定能返回指定联系人 video 标签元素的函数。
     */
    setVideoElementAgent(agent) {
        this.videoElemAgent = agent;
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
     * @param {string} mode 工作模式。
     * @param {HTMLElement} [localVideoElem]
     * @param {HTMLElement} [remoteVideoElem]
     * @returns {RTCDevice} 返回 {@ink RTCDevice} 实例。
     */
    createRTCDevice(mode, localVideoElem, remoteVideoElem) {
        // 创建 RTC Device
        let rtcDevice = new RTCDevice(mode);

        if (localVideoElem) {
            localVideoElem.muted = true;
            localVideoElem.volume = 0;
            rtcDevice.localVideoElem = localVideoElem;
        }

        if (remoteVideoElem) {
            rtcDevice.remoteVideoElem = remoteVideoElem;
        }

        // 启用 ICE
        rtcDevice.enableICE(this.iceServers);

        return rtcDevice;
    }

    /**
     * 创建多方通讯场域。
     * @param {MediaConstraint} mediaConstraint
     * @param {function} successCallback 
     * @param {function} failureCallback 
     * @param {Group} [group]
     * @param {string} [name]
     * @param {Array<Contact>} [contacts] 
     */
    createCommField(mediaConstraint, successCallback, failureCallback, group, name, contacts) {
        let commField = new CommField(cell.Utils.generateSerialNumber(), this.cs.getSelf(), this.pipeline, this.cs.getSelf());
        commField.mediaConstraint = mediaConstraint;

        // 监听器
        commField.listener = this;

        // 设置群组
        if (group) {
            commField.group = group;
        }

        if (name) {
            commField.name = name;
        }

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
     * 获取指定 ID 的场域。
     * @param {number|Group} idOrGroup 
     * @param {function} successCallback 
     * @param {function} [failureCallback] 
     */
    getCommField(idOrGroup, successCallback, failureCallback) {
        let commFieldId = (typeof idOrGroup === 'number') ? idOrGroup : idOrGroup.getAppendix().getCommId();

        let requestPacekt = new Packet(MultipointCommAction.GetField, {
            "commFieldId": commFieldId
        });

        this.pipeline.send(MultipointComm.NAME, requestPacekt, (pipeline, source, packet) => {
            if (null != packet && packet.getStateCode() == StateCode.OK) {
                if (packet.data.code == MultipointCommState.Ok) {
                    // 实例化
                    let commField = CommField.create(packet.data.data, this.pipeline, this.cs.getSelf());

                    if (null != this.activeCall && this.activeCall.field.id == commField.id) {
                        // 进行数据更新
                        this.activeCall.field.copy(commField);
                        commField = this.activeCall.field;
                    }

                    if (null != commField.group) {
                        // 更新群组实例
                        this.cs.getGroup(commField.group.id, (group) => {
                            commField.group = group;
                            successCallback(commField);
                        }, (error) => {
                            // 更新群组失败，但是回调成功
                            successCallback(commField);
                        });
                    }
                    else {
                        successCallback(commField);
                    }
                }
                else {
                    let error = new ModuleError(MultipointComm.NAME, packet.data.code, commFieldId);
                    if (failureCallback) {
                        failureCallback(error);
                    }
                }
            }
            else {
                let error = new ModuleError(MultipointComm.NAME, MultipointCommState.ServerFault, commFieldId);
                if (failureCallback) {
                    failureCallback(error);
                }
            }
        });
    }

    /**
     * 销毁指定的通讯场域。
     * @param {number} commFieldId 
     * @param {function} successCallback 
     * @param {function} [failureCallback] 
     */
    destroyCommField(commFieldId, successCallback, failureCallback) {
        let requestPacekt = new Packet(MultipointCommAction.DestroyField, {
            "commFieldId": commFieldId
        });

        this.pipeline.send(MultipointComm.NAME, requestPacekt, (pipeline, source, packet) => {
            if (null != packet && packet.getStateCode() == StateCode.OK) {
                if (packet.data.code == MultipointCommState.Ok) {
                    let commField = CommField.create(packet.data.data, this.pipeline, this.cs.getSelf());

                    if (null != commField.group) {
                        // 更新群组实例
                        this.cs.getGroup(commField.group.id, (group) => {
                            commField.group = group;
                            successCallback(commField);
                        }, (error) => {
                            // 更新群组失败，但是回调成功
                            successCallback(commField);
                        });
                    }
                    else {
                        successCallback(commField);
                    }
                }
                else {
                    let error = new ModuleError(MultipointComm.NAME, packet.data.code, commFieldId);
                    if (failureCallback) {
                        failureCallback(error);
                    }
                }
            }
            else {
                let error = new ModuleError(MultipointComm.NAME, MultipointCommState.ServerFault, commFieldId);
                if (failureCallback) {
                    failureCallback(error);
                }
            }
        });
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
            this.notifyObservers(new ObservableEvent(MultipointCommEvent.Failed, error));
            return false;
        }

        // 处理操作成功
        let successHandler = () => {
            if (successCallback) {
                successCallback(this.activeCall);
            }

            if (this.activeCall.field.isPrivate()) {
                // 私有场域，触发 Ringing 事件
                this.notifyObservers(new ObservableEvent(MultipointCommEvent.Ringing, this.activeCall));
            }
            else {
                // 普通场域，触发 Ringing 事件
                this.notifyObservers(new ObservableEvent(MultipointCommEvent.Ringing, this.activeCall));

                // 请求接收其他终端的数据
                setTimeout(() => {
                    let self = this.cs.getSelf();
                    if (this.activeCall.field.mediaConstraint.videoEnabled) {
                        this.activeCall.field.getEndpoints().forEach((endpoint) => {
                            if (endpoint.contact.id == self.id) {
                                // 跳过自己
                                return;
                            }

                            // 接收指定终端的数据
                            this.follow(endpoint);
                        });
                    }
                    else {
                        this.touch(this.activeCall.field);
                    }
                }, 100);
            }
        };

        // 处理操作失败
        let failureHandler = (error) => {
            if (this.callTimer > 0) {
                clearTimeout(this.callTimer);
                this.callTimer = 0;
            }

            // 记录错误
            if (null == this.activeCall) {
                if (failureCallback) {
                    failureCallback(error);
                }
                return;
            }

            this.activeCall.lastError = error;

            // 如果是 MediaPermissionDenied
            if (error.code == MultipointCommState.MediaPermissionDenied) {
                // 需要额外进行处理，因为浏览器可能无法连接到摄像头，但是可以连接麦克风
                // 当连接不到摄像头时，需要直接从通信域退出，而不发送信令
                if (this.activeCall.field.isPrivate()) {
                    this.privateField.applyTerminate(this.privateField.founder, this.privateField.device);
                }
                else {
                    this.activeCall.field.applyTerminate(this.privateField.founder, this.privateField.device);
                }

                if (failureCallback) {
                    failureCallback(error);
                }

                this.notifyObservers(new ObservableEvent(MultipointCommEvent.Failed, error));

                this.activeCall = null;
            }
            else {
                if (failureCallback) {
                    failureCallback(error);
                }

                this.notifyObservers(new ObservableEvent(MultipointCommEvent.Failed, error));

                // 挂断通话
                this.hangupCall();
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
                this.notifyObservers(new ObservableEvent(MultipointCommEvent.Failed, error));
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

            // 1. 申请一对一主叫
            this.privateField.applyCall(this.privateField.caller, this.privateField.device, (commField, proposer, device) => {
                // 记录主叫媒体约束
                this.activeCall.callerMediaConstraint = mediaConstraint;

                // 2. 启动 RTC 节点，发起 Offer
                // 创建 RTC 设备
                let rtcDevice = this.createRTCDevice('sendrecv', this.videoElem.local, this.videoElem.remote);
                // 发起 Offer
                this.privateField.launchOffer(rtcDevice, mediaConstraint, successHandler, failureHandler);
            }, (error) => {
                failureHandler(error);
            });
        }
        else if (target instanceof Group) {
            // 发起群组内的通话
            // 获取群组的通讯 ID
            target.getAppendix().getCommId((commId, appendix, group) => {
                if (0 == commId) {
                    // 创建新场域，关联对应的群组
                    this.createCommField(mediaConstraint, (commField) => {
                        // 更新群组的 CommFiled ID
                        target.getAppendix().updateCommId(commField.getId(), (appendix) => {
                            // 发起呼叫
                            setTimeout(() => {
                                if (!this.makeCall(commField, mediaConstraint, successCallback, failureCallback)) {
                                    failureHandler(new ModuleError(MultipointComm.NAME, MultipointCommState.GroupStateError, target));

                                    // 呼叫失败，重置群组的 Comm ID
                                    target.getAppendix().updateCommId(0);
                                }
                            }, 0);
                        }, (error) => {
                            // 更新群组的通讯 ID 错误
                            failureHandler(new ModuleError(MultipointComm.NAME, MultipointCommState.GroupStateError, target));
                        });
                    }, (error) => {
                        failureHandler(error);
                    }, target, target.getName() + '#' + target.getId());
                }
                else {
                    // 获取场域
                    this.getCommField(commId, (commField) => {
                        // 发起呼叫
                        setTimeout(() => {
                            if (!this.makeCall(commField, mediaConstraint, successCallback, failureCallback)) {
                                failureHandler(new ModuleError(MultipointComm.NAME, MultipointCommState.GroupStateError, target));
                            }
                        }, 0);
                    }, (error) => {
                        if (error.code == MultipointCommState.NoCommField) {
                            // 场域不存在
                            target.getAppendix().updateCommId(0, () => {
                                setTimeout(() => {
                                    this.makeCall(target, mediaConstraint, successCallback, failureCallback);
                                }, 0);
                            }, () => {
                                failureHandler(new ModuleError(MultipointComm.NAME, MultipointCommState.GroupStateError, target));
                            });
                        }
                        else {
                            // 其他错误
                            failureHandler(error);
                        }
                    });
                }
            }, (error) => {
                failureHandler(new ModuleError(MultipointComm.NAME, MultipointCommState.GroupStateError, target));
            });
        }
        else if (target instanceof CommField) {
            if (null != this.activeCall && null != this.activeCall.field) {
                if (this.activeCall.field.getId() != target.getId()) {
                    cell.Logger.w('MultipointComm', 'Comm field data error');
                    return false;
                }
            }

            if (null == this.activeCall) {
                // 创建通话记录
                this.activeCall = new CallRecord(this.privateField.founder);
            }

            // 记录
            this.activeCall.field = target;

            (new Promise((resolve, reject) => {
                resolve();
            })).then(() => {
                // 回调 InProgress 事件
                this.notifyObservers(new ObservableEvent(MultipointCommEvent.InProgress, target));
            });

            let self = this.cs.getSelf();

            // 1. 申请通话
            target.applyCall(self, self.getDevice(), (commField, proposer, device) => {
                // 获取自己的终端节点
                let endpoint = commField.getEndpoint(self);
                endpoint.videoEnabled = mediaConstraint.videoEnabled;
                endpoint.audioEnabled = mediaConstraint.audioEnabled;

                // 2. 发起 Offer
                let rtcDevice = this.createRTCDevice('sendonly', this.videoElem.local);
                // 发起 send only 的 Offer 回送自己的视频流
                commField.launchOffer(rtcDevice, mediaConstraint, successHandler, failureHandler, endpoint);
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
     * 邀请列表里的联系人加入到当前通讯域。
     * @param {CommField|Group|number} entityOrId 指定场域或者群组。
     * @param {Array} list 被邀请人的 ID 清单。
     * @param {function} successCallback 
     * @param {function} failureCallback 
     */
    inviteCall(entityOrId, list, successCallback, failureCallback) {
        let commFieldId = 0;
        if (entityOrId instanceof Group) {
            commFieldId = entityOrId.getAppendix().getCommId();
        }
        else if (entityOrId instanceof CommField) {
            commFieldId = entityOrId.getId();
        }
        else {
            commFieldId = entityOrId;
        }

        let handler = (commField) => {
            let signaling = new Signaling(MultipointCommAction.Invite, commField, 
                this.privateField.founder, this.privateField.founder.device);

            // 设置邀请列表
            signaling.invitees = list;

            let requestPacket = new Packet(MultipointCommAction.Invite, signaling.toJSON());
            this.pipeline.send(MultipointComm.NAME, requestPacket, (pipeline, source, packet) => {
                if (null != packet && packet.getStateCode() == StateCode.OK) {
                    if (packet.data.code == MultipointCommState.Ok) {
                        if (successCallback) {
                            successCallback(commField);
                        }
                    }
                    else {
                        if (failureCallback) {
                            failureCallback(new ModuleError(MultipointComm.NAME, packet.data.code, commField));
                        }
                    }
                }
                else {
                    if (failureCallback) {
                        failureCallback(new ModuleError(MultipointComm.NAME, MultipointCommState.ServerFault, commField));
                    }
                }
            });
        };

        if (null != this.activeCall && null != this.activeCall.field && this.activeCall.field.id == commFieldId) {
            handler(this.activeCall.field);
        }
        else {
            this.getCommField(commFieldId, (commField) => {
                handler(commField);
            }, (error) => {
                if (failureCallback) {
                    failureCallback(error);
                }
            });
        }
    }

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

        let successHandler = () => {
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
            this.notifyObservers(new ObservableEvent(MultipointCommEvent.Failed, error));

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
                this.notifyObservers(new ObservableEvent(MultipointCommEvent.Failed, error));
                return false;
            }

            if (null == this.videoElem.local && null == this.videoElem.remote) {
                // 没有设置任何视频元素标签
                let error = new ModuleError(MultipointComm.NAME, MultipointCommState.VideoElementNotSetting, target);
                if (failureCallback) {
                    failureCallback(error);
                }
                this.notifyObservers(new ObservableEvent(MultipointCommEvent.Failed, error));
                return false;
            }

            // 记录时间
            this.activeCall.answerTime = Date.now();

            // 1. 先申请加入
            this.privateField.applyJoin(this.privateField.founder, this.privateField.founder.device, (commField, contact, device) => {
                // 记录
                this.activeCall.calleeMediaConstraint = mediaConstraint;

                // 2. 启动 RTC 节点，发起 Answer
                // 创建 RTC 设备
                let rtcDevice = this.createRTCDevice('sendrecv', this.videoElem.local, this.videoElem.remote);
                this.privateField.launchAnswer(rtcDevice,
                    this.offerSignaling.sessionDescription, mediaConstraint, successHandler, failureHandler);
            }, (error) => {
                failureHandler(error);
            });
        }
        else if (target instanceof CommField) {
            // 创建 RTC 终端
            // let rtcDevice = this.createRTCDevice();

            // 应答 Comm Field
            // target.launchAnswer(rtcDevice,
            //     this.offerSignaling.sessionDescription, mediaConstraint, successHandler, failureHandler);
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
        if (null == this.activeCall) {
            cell.Logger.w('MultipointComm', '#hangupCall() - No active calling');
            return false;
        }

        if (this.statsTimer > 0) {
            clearInterval(this.statsTimer);
            this.statsTimer = 0;
        }

        // 当前通话的场域
        let field = this.activeCall.field;

        let handler = (pipeline, source, packet) => {
            if (null == this.activeCall) {
                // 当返回数据时，之前的操作已经关闭通话
                return;
            }

            let activeCall = this.activeCall;

            if (null != packet && packet.getStateCode() == StateCode.OK) {
                if (packet.data.code == MultipointCommState.Ok) {
                    // 信令
                    let signaling = Signaling.create(packet.data.data, this.pipeline, this.cs.getSelf());

                    if (field.isPrivate()) {
                        field.close();
                        this.offerSignaling = null;
                        this.answerSignaling = null;

                        // 记录结束时间
                        activeCall.endTime = Date.now();

                        if (successCallback) {
                            successCallback(activeCall);
                        }

                        this.notifyObservers(new ObservableEvent(MultipointCommEvent.Bye, activeCall));
                    }
                    else {
                        // 更新数据
                        field.copy(signaling.field);

                        if (successCallback) {
                            successCallback(activeCall);
                        }

                        this.notifyObservers(new ObservableEvent(MultipointCommEvent.Bye, activeCall));

                        // 关闭所有节点
                        field.close();
                    }

                    // 重置
                    this.activeCall = null;
                }
                else {
                    let error = new ModuleError(MultipointComm.NAME, packet.data.code, activeCall);

                    activeCall.endTime = Date.now();
                    activeCall.lastError = error;

                    // 关闭本地场域
                    field.close();

                    if (failureCallback) {
                        failureCallback(error);
                    }
                    this.notifyObservers(new ObservableEvent(MultipointCommEvent.Failed, error));

                    this.activeCall = null;
                }
            }
            else {
                let error = new ModuleError(MultipointComm.NAME, MultipointCommState.ServerFault, activeCall);

                activeCall.endTime = Date.now();
                activeCall.lastError = error;

                // 关闭本地场域
                field.close();

                if (failureCallback) {
                    failureCallback(error);
                }
                this.notifyObservers(new ObservableEvent(MultipointCommEvent.Failed, error));

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
                    this.privateField.founder, this.privateField.founder.getDevice());
                let packet = new Packet(MultipointCommAction.Bye, signaling.toJSON());
                this.pipeline.send(MultipointComm.NAME, packet, handler);
            }
            else {
                // 回送被叫忙
                let signaling = new Signaling(MultipointCommAction.Busy, field, 
                    this.privateField.founder, this.privateField.founder.getDevice());
                let packet = new Packet(MultipointCommAction.Busy, signaling.toJSON());
                this.pipeline.send(MultipointComm.NAME, packet, handler);
            }
        }
        else {
            let signaling = new Signaling(MultipointCommAction.Bye, field, 
                this.privateField.founder, this.privateField.founder.device);

            let packet = new Packet(MultipointCommAction.Bye, signaling.toJSON());
            this.pipeline.send(MultipointComm.NAME, packet, handler);
        }

        return true;
    }

    /**
     * 从指定 Comm Field 上接收混码流。
     * @private
     * @param {CommField} commField 
     * @param {function} [successCallback] 
     * @param {function} [failureCallback] 
     */
    touch(commField, successCallback, failureCallback) {
        if (null == this.videoElem.remote) {
            if (failureCallback) {
                failureCallback(new ModuleError(MultipointComm.NAME, MultipointCommState.VideoElementNotSetting, commField));
            }
            return false;
        }

        let successHandler = () => {
            if (successCallback) {
                successCallback(this.activeCall);
            }
        };

        let failureHandler = (error) => {
            // 记录错误
            if (null != this.activeCall) {
                this.activeCall.lastError = error;
            }

            if (failureCallback) {
                failureCallback(error);
            }

            // this.notifyObservers(new ObservableEvent(MultipointCommEvent.Failed, error));
        };

        cell.Logger.d(MultipointComm.NAME, 'Touch comm filed: ' + commField.getName());

        // 发起 Offer
        let rtcDevice = this.createRTCDevice('recvonly', null, this.videoElem.remote);
        // 发起 recv only 的 Offer
        this.activeCall.field.launchOffer(rtcDevice, this.activeCall.field.mediaConstraint, successHandler, failureHandler);

        return true;
    }

    /**
     * 定向接收指定终端的音视频数据。
     * @protected
     * @param {CommFieldEndpoint} endpoint 指定待获取数据的终端。
     * @param {function} [successCallback] 成功回调函数，函数参数：({@linkcode callRecord}:{@link CallRecord}) 。
     * @param {function} [failureCallback] 失败回调函数，函数参数：({@linkcode error}:{@link ModuleError}) 。
     * @returns {boolean} 返回是否允许执行该操作。
     */
    follow(endpoint, successCallback, failureCallback) {
        if (null == this.privateField) {
            // 联系人模块没有完成签入操作
            let error = new ModuleError(MultipointComm.NAME, MultipointCommState.Uninitialized, endpoint);
            if (failureCallback) {
                failureCallback(error);
            }
            this.notifyObservers(new ObservableEvent(MultipointCommEvent.Failed, error));
            return false;
        }

        // 处理操作成功
        let successHandler = () => {
            // 更新 field
            endpoint.field = this.activeCall.field;

            if (successCallback) {
                successCallback(this.activeCall, endpoint);
            }

            // 发送 Followed 事件
            this.notifyObservers(new ObservableEvent(MultipointCommEvent.Followed, endpoint));
        };

        // 处理操作失败
        let failureHandler = (error) => {
            // 记录错误
            if (null != this.activeCall) {
                this.activeCall.lastError = error;
            }

            if (failureCallback) {
                failureCallback(error);
            }

            // this.notifyObservers(new ObservableEvent(MultipointCommEvent.Failed, error));

            if (null != this.activeCall) {
                this.activeCall.field.closeRTCDevice(endpoint);
            }
        };

        if (null == this.activeCall) {
            if (null == endpoint.field) {
                failureHandler(new ModuleError(MultipointComm.NAME, MultipointCommState.NoCommField, endpoint));
                return false;
            }

            // 创建记录
            this.activeCall = new CallRecord(this.privateField.founder);
            this.activeCall.field = endpoint.field;
        }
        else {
            if (this.activeCall.field.isPrivate()) {
                failureHandler(new ModuleError(MultipointComm.NAME, MultipointCommState.CommFieldStateError, endpoint));
                return false;
            }
        }

        if (this.activeCall.field.hasRTCDevice(endpoint)) {
            // 已经存在该终端的 RTC 设备
            return false;
        }

        if (null == this.videoElemAgent || typeof this.videoElemAgent !== 'function') {
            failureHandler(new ModuleError(MultipointComm.NAME, MultipointCommState.VideoElementNotSetting, endpoint));
            return false;
        }

        let videoEl = this.videoElemAgent(endpoint.contact);
        if (null == videoEl || undefined === videoEl) {
            failureHandler(new ModuleError(MultipointComm.NAME, MultipointCommState.VideoElementNotSetting, endpoint));
            return false;
        }

        // TODO 检查是否已经接收该终端数据

        cell.Logger.d(MultipointComm.NAME, 'Follow endpoint (' + BroswerUtil.getBrowserName() + ')');
        // 发起 Offer
        let rtcDevice = this.createRTCDevice('recvonly', null, videoEl);
        // 发起 recv only 的 Offer
        this.activeCall.field.launchOffer(rtcDevice, this.activeCall.field.mediaConstraint, successHandler, failureHandler, endpoint);

        return true;
    }

    /**
     * 取消定向接收的指定终端音视频数据。
     * @protected
     * @param {CommFieldEndpoint} endpoint 
     * @param {function} successCallback 
     * @param {function} failureCallback 
     */
    unfollow(endpoint, successCallback, failureCallback) {
        if (null == this.privateField) {
            // 联系人模块没有完成签入操作
            let error = new ModuleError(MultipointComm.NAME, MultipointCommState.Uninitialized, endpoint);
            if (failureCallback) {
                failureCallback(error);
            }
            this.notifyObservers(new ObservableEvent(MultipointCommEvent.Failed, error));
            return false;
        }

        if (null == this.activeCall) {
            return false;
        }

        let signaling = new Signaling(MultipointCommAction.Bye, this.activeCall.field, 
            this.privateField.founder, this.privateField.founder.device);

        // 设置目标
        signaling.target = endpoint;

        let packet = new Packet(MultipointCommAction.Bye, signaling.toJSON());
        this.pipeline.send(MultipointComm.NAME, packet, (pipeline, source, response) => {
            if (null != response && response.getStateCode() == StateCode.OK) {
                if (response.data.code == MultipointCommState.Ok) {
                    // 更新
                    endpoint.field = this.activeCall.field;

                    // 关闭 Endpoint
                    this.activeCall.field.closeEndpoint(endpoint);

                    // 关闭 RTC 设备
                    this.activeCall.field.closeRTCDevice(endpoint);

                    // 发送 Unfollowed 事件
                    this.notifyObservers(new ObservableEvent(MultipointCommEvent.Unfollowed, endpoint));

                    if (successCallback) {
                        successCallback(this.activeCall, endpoint);
                    }
                }
                else {
                    let error = new ModuleError(MultipointComm.NAME, response.data.code, endpoint);
                    if (failureCallback) {
                        failureCallback(error);
                    }
                    // this.notifyObservers(new ObservableEvent(MultipointCommEvent.Failed, error));
                }
            }
            else {
                let error = new ModuleError(MultipointComm.NAME, MultipointCommState.ServerFault, endpoint);
                if (failureCallback) {
                    failureCallback(error);
                }
                // this.notifyObservers(new ObservableEvent(MultipointCommEvent.Failed, error));
            }
        });

        return true;
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
     * 群组是否正在通话。
     * @param {Group} group 
     * @param {function} handler 回调函数，参数：({@linkcode calling}:{@linkcode boolean}) 。
     */
    isCalling(group, handler) {
        group.getAppendix().getCommId((commId) => {
            if (0 == commId) {
                handler(false);
                return;
            }

            this.getCommField(commId, () => {
                handler(true);
            }, () => {
                handler(false);
            });
        }, (error) => {
            handler(false);
        });
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

        if (0 == this.statsTimer) {
            this.statsTimer = setInterval(() => {
                this.onTimer();
            }, 1000);
        }
    }

    /**
     * 当媒体流断开时回调。
     * @private
     * @param {CommField} commField 
     * @param {RTCDevice} rtcDevice 
     */
    onMediaDisconnected(commField, rtcDevice) {
        if (this.statsTimer > 0) {
            clearInterval(this.statsTimer);
            this.statsTimer = 0;
        }

        this.notifyObservers(new ObservableEvent(MultipointCommEvent.MediaDisconnected, this.activeCall));

        if (this.activeCall.field.isPrivate()) {
            // 私域通信，触发 Hangup
            this.hangupCall();
        }
    }

    /**
     * @private
     * 定时器回调。
     */
    onTimer() {
        if (null == this.activeCall) {
            return;
        }

        let field = this.activeCall.field;
        if (null == field) {
            return;
        }

        let endpoint = field.getEndpoint(this.cs.getSelf());
        if (null != endpoint) {
            // 先读取上一次的值
            let lastVolume = endpoint.volume;

            // 再获取新的值
            let volume = field.getMicrophoneVolume();

            if (volume >= 0) {
                let timestamp = window.performance.now();

                if (Math.abs(lastVolume - volume) >= 10) {
                    // 超过控制阀值发送数据
                    let packet = new Packet(MultipointCommAction.Broadcast, {
                        "source" : endpoint.toJSON(),
                        "data" : {
                            event: MultipointCommEvent.MicrophoneVolume,
                            value: volume,
                            timestamp: timestamp
                        }
                    });
                    this.pipeline.send(MultipointComm.NAME, packet);
                }

                this.notifyObservers(new ObservableEvent(MultipointCommEvent.MicrophoneVolume, {
                    endpoint: endpoint,
                    volume: volume,
                    timestamp: timestamp
                }));
            }
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
        let offerSignaling = Signaling.create(data, this.pipeline, this.cs.getSelf());

        // 检查当期是否有通话正在进行
        if (null != this.activeCall && this.activeCall.isActive()) {
            // 应答忙音 Busy
            let busy = new Signaling(MultipointCommAction.Busy, offerSignaling.field,
                this.privateField.self, this.privateField.device);
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
            // 更新数据
            this.privateField.caller = offerSignaling.caller;
            this.privateField.callee = offerSignaling.callee;

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
            cell.Logger.e(MultipointComm.NAME, '#triggerAnswer() no active call record');
            return;
        }

        if (this.callTimer > 0) {
            clearTimeout(this.callTimer);
            this.callTimer = 0;
        }

        // 记录应答时间
        this.activeCall.answerTime = Date.now();

        let data = payload.data;
        let answerSignaling = Signaling.create(data, this.pipeline, this.cs.getSelf());

        let rtcDevice = null;

        if (this.activeCall.field.isPrivate()) {
            // 记录媒体约束
            this.answerSignaling = answerSignaling;
            this.activeCall.calleeMediaConstraint = this.answerSignaling.mediaConstraint;
            rtcDevice = this.activeCall.field.getRTCDevice();
        }
        else {
            if (answerSignaling.sn == 0) {
                let fromContact = answerSignaling.contact;
                let endpoint = this.activeCall.field.getEndpoint(fromContact);
                // 查找到对应的 RTC 设备
                rtcDevice = this.activeCall.field.getRTCDevice(endpoint);
            }
            else {
                // 通过 SN 查找 RTC 设备
                rtcDevice = this.activeCall.field.getRTCDevice(answerSignaling.sn);
            }
        }

        if (null == rtcDevice) {
            cell.Logger.w(MultipointComm.NAME, '#triggerAnswer() - Can not find rtc device for ' + answerSignaling.contact.id);
            let error = new ModuleError(MultipointComm.NAME, MultipointCommState.NoPeerEndpoint, this.activeCall);
            this.notifyObservers(new ObservableEvent(MultipointCommEvent.Failed, error));
            return;
        }

        cell.Logger.d(MultipointComm.NAME, 'Answer from ' + answerSignaling.contact.getId());

        rtcDevice.doAnswer(answerSignaling.sessionDescription, () => {
            // 对于 recvonly 的 Peer 不回调 Connected 事件
            if (rtcDevice.mode == 'sendrecv' || rtcDevice.mode == 'sendonly') {
                this.notifyObservers(new ObservableEvent(MultipointCommEvent.Connected, this.activeCall));
            }
        }, (error) => {
            this.activeCall.lastError = error;
            this.notifyObservers(new ObservableEvent(MultipointCommEvent.Failed, error));
        });
    }

    /**
     * 处理 Candidate 信令。
     * @private
     * @param {JSON} payload 
     * @param {object} context 
     */
    triggerCandidate(payload, context) {
        let signaling = Signaling.create(payload.data, this.pipeline, this.cs.getSelf());

        // 获取 RTCDevice 实例
        let rtcDevice = null;
        if (this.activeCall.field.isPrivate()) {
            rtcDevice = this.activeCall.field.getRTCDevice();
        }
        else {
            if (signaling.sn == 0) {
                // 找到对应的节点
                let endpoint = this.activeCall.field.getEndpoint(signaling.contact);
                if (null != endpoint) {
                    rtcDevice = this.activeCall.field.getRTCDevice(endpoint);
                }
            }
            else {
                rtcDevice = this.activeCall.field.getRTCDevice(signaling.sn);
            }
        }

        if (null == rtcDevice) {
            cell.Logger.e('MultipointComm', '#triggerCandidate() - Can NOT find RTC device: ' + signaling.name);
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
            this.notifyObservers(new ObservableEvent(MultipointCommEvent.Failed, error));
            return;
        }

        if (this.callTimer > 0) {
            clearTimeout(this.callTimer);
            this.callTimer = 0;
        }

        let signaling = Signaling.create(payload.data, this.pipeline, this.cs.getSelf());
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
        let signaling = Signaling.create(payload.data, this.pipeline, this.cs.getSelf());
        if (signaling.field.isPrivate()) {
            this.hangupCall();
        }
    }

    /**
     * @private
     * @param {JSON} payload 
     * @param {object} context 
     */
    triggerInvite(payload, context) {
        if (null != this.activeCall && this.activeCall.isActive()) {
            // 正在通话，不能回调邀请
            return;
        }

        let signaling = Signaling.create(payload.data, this.pipeline, this.cs.getSelf());

        cell.Logger.d(MultipointComm.NAME, 'Receive "' + signaling.field.getName() + '" invitation');

        this.activeCall = new CallRecord(this.privateField.founder);
        this.activeCall.field = signaling.field;

        this.notifyObservers(new ObservableEvent(MultipointCommEvent.Invited, signaling.field));
    }

    /**
     * @private
     * @param {JSON} payload 
     * @param {object} context 
     */
    triggerArrived(payload) {
        let data = payload.data;
        let commField = CommField.create(data.field, this.pipeline, this.cs.getSelf());

        if (commField.id == this.activeCall.field.id) {
            this.activeCall.field.copy(commField);
            commField = this.activeCall.field;
        }

        let endpoint = CommFieldEndpoint.create(data.endpoint);
        endpoint.field = commField;

        cell.Logger.d(MultipointComm.NAME, 'Endpoint "' + endpoint.getName() + '" arrived "' + commField.getName() + '"');

        this.notifyObservers(new ObservableEvent(MultipointCommEvent.Arrived, endpoint));

        if (commField.id == this.activeCall.field.id && commField.mediaConstraint.videoEnabled) {
            // 接收对方的音视频流
            setTimeout(() => {
                if (!this.follow(endpoint)) {
                    cell.Logger.w(MultipointComm.NAME, 'Comm field state error, can not follow endpoint "' + endpoint.getName() + '"');
                }
            }, 1000);
        }
    }

    /**
     * @private
     * @param {JSON} payload 
     * @param {object} context 
     */
    triggerLeft(payload) {
        let data = payload.data;
        let commField = CommField.create(data.field, this.pipeline, this.cs.getSelf());

        let endpoint = CommFieldEndpoint.create(data.endpoint);
        endpoint.field = commField;

        cell.Logger.d(MultipointComm.NAME, 'Endpoint "' + endpoint.getName() + '" left "' + commField.getName() + '"');

        // 停止接收对方音视频流
        if (commField.id == this.activeCall.field.id) {
            let rtc = this.activeCall.field.getRTCDevice(endpoint);

            // 复制数据
            this.activeCall.field.copy(commField);

            if (null != rtc) {
                setTimeout(() => {
                    if (!this.unfollow(endpoint, () => {
                        this.notifyObservers(new ObservableEvent(MultipointCommEvent.Left, endpoint));
                    })) {
                        cell.Logger.w(MultipointComm.NAME, 'Comm field state error, can not unfollow endpoint "' + endpoint.getName() + '"');
                    }
                }, 1);
            }
            else {
                this.activeCall.field.closeEndpoint(endpoint);

                this.notifyObservers(new ObservableEvent(MultipointCommEvent.Left, endpoint));
            }
        }
    }

    /**
     * @private
     * @param {JSON} payload 
     * @param {object} context 
     */
    triggerBroadcast(payload, context) {
        let data = payload.data;
        if (undefined !== data.data && undefined !== data.source) {
            // 解析 source
            let source = CommFieldEndpoint.create(data.source);
            // 事件名
            let event = data.data.event;
            if (event == MultipointCommEvent.MicrophoneVolume) {
                let value = data.data.value;
                let timestamp = data.data.timestamp;

                // console.log('triggerBroadcast : ' + source.getName() + ' - ' + value);

                if (null != this.activeCall) {
                    let endpoint = this.activeCall.field.getEndpoint(source);
                    if (null != endpoint) {
                        // 更新音量数据
                        endpoint.volume = value;

                        (new Promise((resolve, reject) => {
                            resolve();
                        })).then(() => {
                            this.notifyObservers(new ObservableEvent(MultipointCommEvent.MicrophoneVolume, {
                                endpoint: endpoint,
                                volume: value,
                                timestamp: timestamp
                            }));
                        }).catch((error) => {
                            // Noting
                        });
                    }
                }
            }
        }
    }
}
