/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020-2023 Cube Team.
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
import { Packet } from "../core/Packet";
import { PipelineState } from "../core/PipelineState";
import { ObservableEvent } from "../core/ObservableEvent";
import { ContactService } from "../contact/ContactService";
import { MultipointComm } from "../multipointcomm/MultipointComm";
import { Conference } from "./Conference";
import { ConferenceServiceState } from "./ConferenceServiceState";
import { ConferencePipelineListener } from "./ConferencePipelineListener";
import { ConferenceAction } from "./ConferenceAction";
import { ConferenceEvent } from "./ConferenceEvent";
import { ModuleError } from "../core/error/ModuleError";

/**
 * 会议服务。
 * @extends Module
 */
export class ConferenceService extends Module {

    static NAME = 'Conference';

    /**
     * 构造函数。
     */
    constructor() {
        super('Conference');

        super.require(ContactService.NAME);
        super.require(MultipointComm.NAME);

        /**
         * 会议列表。
         * @type {Array}
         */
        this.confs = [];

        /**
         * 监听器。
         * @type {ConferencePipelineListener}
         */
        this.pipelineListener = new ConferencePipelineListener();

        /**
         * 联系人服务。
         * @type {ContactService}
         */
        this.contact = null;

        /**
         * 多方通信服务。
         * @type {MultipointComm}
         */
        this.mpcomm = null;
    }

    /**
     * @inheritdoc
     */
    start() {
        if (!super.start()) {
            return false;
        }

        this.contact = this.kernel.getModule(ContactService.NAME);
        this.mpcomm = this.kernel.getModule(MultipointComm.NAME);

        this.pipeline.addListener(ConferenceService.NAME, this.pipelineListener);

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

        this.pipeline.removeListener(ConferenceService.NAME, this.pipelineListener);
    }

    /**
     * 查询指定时间段内的所有会议。
     * @param {*} beginning 
     * @param {*} ending 
     * @param {*} successCallback 
     * @param {*} failureCallback 
     */
    listConferences(beginning, ending, successCallback, failureCallback) {
        if (!this.started) {
            this.start();
        }

        let requestPacket = new Packet(ConferenceAction.ListConferences, {
            "beginning": beginning,
            "ending": ending
        });

        this.pipeline.send(ConferenceService.NAME, requestPacket, (pipeline, source, packet) => {
            if (null == packet || packet.getStateCode() != PipelineState.OK) {
                let error = new ModuleError(ConferenceService.NAME, ConferenceServiceState.ServerError, this);
                if (failureCallback) {
                    failureCallback(error);
                }
                return;
            }

            if (packet.getPayload().code != ConferenceServiceState.Ok) {
                let error = new ModuleError(ConferenceService.NAME, packet.getPayload().code, this);
                if (failureCallback) {
                    failureCallback(error);
                }
                return;
            }

            // 清空列表
            this.confs = [];

            let data = packet.getPayload().data;
            let resBeginning = data.beginning;
            let resEnding = data.ending;

            (async () => {
                let list = packet.getPayload().data.list;

                for (let i = 0; i < list.length; ++i) {
                    let conference = Conference.create(this, list[i]);
                    await this.fillConference(conference);
                    this.confs.push(conference);
                }

                successCallback(this.confs, resBeginning, resEnding);
            })();
        });
    }

    /**
     * 创建会议。
     * @param {string} subject 会议标题。
     * @param {string} password 会议密码，设置为 {@linkcode null} 时表示不需要密码。
     * @param {string} summary 会议摘要，设置为 {@linkcode null} 时表示无摘要。
     * @param {number} scheduleTime 会议计划时间。
     * @param {number} expireTime 会议结束时间。
     * @param {Array<Invitation>} invitations 会议邀请列表。
     * @param {function} successCallback
     * @param {function} failureCallback
     */
    createConference(subject, password, summary, scheduleTime, expireTime, invitations, successCallback, failureCallback) {
        if (!this.started) {
            this.start();
        }
        
        let invitationArray = [];
        if (null != invitations) {
            invitations.forEach((value) => {
                invitationArray.push(value.toJSON());
            });
        }

        let packetData = {
            subject: subject,
            password: (null == password) ? '' : password,
            summary: (null == summary) ? '' : summary,
            scheduleTime: scheduleTime,
            expireTime: expireTime,
            invitations: invitationArray
        };

        let requestPacket = new Packet(ConferenceAction.CreateConference, packetData);

        this.pipeline.send(ConferenceService.NAME, requestPacket, (pipeline, source, packet) => {
            if (null == packet || packet.getStateCode() != PipelineState.OK) {
                let error = new ModuleError(ConferenceService.NAME, ConferenceServiceState.ServerError, packetData);
                if (failureCallback) {
                    failureCallback(error);
                }
                return;
            }

            if (packet.data.code != ConferenceServiceState.Ok) {
                let error = new ModuleError(ConferenceService.NAME, packet.data.code, packetData);
                if (failureCallback) {
                    failureCallback(error);
                }
                return;
            }

            // 创建会议实例
            let conference = Conference.create(this, packet.data.data);

            (async () => {
                await this.fillConference(conference);

                // 更新列表
                this.confs.push(conference);

                if (successCallback) {
                    successCallback(conference);
                }
    
                this.notifyObservers(new ObservableEvent(ConferenceEvent.Created, conference));
            })();
        });
    }

    /**
     * 填充会议数据。
     * @private
     * @param {Conference} conference 
     * @returns {Promise}
     */
    fillConference(conference) {
        let gotFounder = false;
        let gotPresenter = false;
        let gotGroup = false;

        return new Promise((resolve, reject) => {
            let handler = () => {
                if (gotFounder && gotPresenter && gotGroup) {
                    resolve();
                }
            };

            // 获取创建人
            this.contact.getContact(conference.founder.getId(), (contact) => {
                conference.founder = contact;
                gotFounder = true;
                handler();
            }, (error) => {
                gotFounder = true;
                handler();
            });

            // 获取主持人
            this.contact.getContact(conference.presenter.getId(), (contact) => {
                conference.presenter = contact;
                gotPresenter = true;
                handler();
            }, (error) => {
                gotPresenter = true;
                handler();
            });

            // 获取群组
            this.contact.getGroup(conference.room.participantGroupId, (group) => {
                conference.room.participantGroup = group;
                gotGroup = true;
                handler();
            }, (error) => {
                gotGroup = true;
                handler();
            });
        });
    }
}
