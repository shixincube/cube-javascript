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
import { ContactService } from "../contacts/ContactService";
import { MultipointComm } from "../multipointcomm/MultipointComm";
import { Conference } from "./Conference";
import { ConferencePipelineListener } from "./ConferencePipelineListener";
import { Packet } from "../core/Packet";
import { ConferenceAction } from "./ConferenceAction";
import { StateCode } from "../core/StateCode";
import { ConferenceRoom } from "./ConferenceRoom";
import { Announcer } from "../util/Announcer";

/**
 * 会议服务。
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

        this.pipeline.removeListener(ConferenceService.NAME, this.pipelineListener);
    }

    /**
     * 创建会议。
     * @param {Conference} conference 
     * @param {function} handleSuccess 
     * @param {function} handleError 
     */
    createConference(conference, handleSuccess, handleError) {
        conference.founder = this.contact.getSelf();

        let data = new Packet(ConferenceAction.Create, conference.toJSON());
        this.pipeline.send(ConferenceService.NAME, data, (pipeline, source, packet) => {
            if (null == packet || packet.getStateCode() != StateCode.OK) {
                // TODO 错误处理
                return;
            }

            // 建立通知方式进行回调
            let announcer = new Announcer(3, 5000);
            announcer.addAudience((count, map) => {
                if (count == announcer.getTotal()) {
                    handleSuccess(conference);
                }
                else {
                    handleError();
                }
            });

            let rdata = packet.data;
            conference.id = rdata.id;
            conference.access = rdata.access;

            // 获取主持人信息
            this.contact.getContact(rdata.presenter, (contact) => {
                conference.presenter = contact;
                announcer.announce();
            });

            // 获取房间对应的通信场域
            this.mpcomm.getField(rdata.room.field, (filed) => {
                conference.room = new ConferenceRoom(filed);
                conference.room.configure(rdata.room);
                announcer.announce();
            });

            // 获取房间对应的群组
            this.contact.getGroup(rdata.group, (group) => {
                conference.group = group;
                announcer.announce();
            });
        });
    }
}
