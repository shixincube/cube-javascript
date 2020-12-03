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
import { Packet } from "../core/Packet";
import { StateCode } from "../core/StateCode";
import { ObservableState } from "../core/ObservableState";
import { ContactService } from "../contact/ContactService";
import { MultipointComm } from "../multipointcomm/MultipointComm";
import { Conference } from "./Conference";
import { ConferenceServiceState } from "./ConferenceServiceState";
import { ConferencePipelineListener } from "./ConferencePipelineListener";
import { ConferenceAction } from "./ConferenceAction";
import { ConferenceEvent } from "./ConferenceEvent";

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

        if (null == this.pipeline) {
            return;
        }

        this.pipeline.removeListener(ConferenceService.NAME, this.pipelineListener);
    }

    /**
     * 创建会议。
     * @param {string} title 会议标题。
     * @param {string} password 会议密码，设置为 {@linkcode null} 时表示不需要密码。
     * @param {function} successCallback
     * @param {function} failureCallback
     */
    createConference(title, password, successCallback, failureCallback) {
        let dataPacket = new Packet(ConferenceAction.Create, {
            "title": title,
            "password": (null == password) ? "" : password,
            "founder": this.contact.getSelf().toCompactJSON()
        });

        this.pipeline.send(ConferenceService.NAME, dataPacket, (pipeline, source, packet) => {
            if (null == packet) {
                // TODO
                if (failureCallback) {
                    failureCallback(title);
                }
                return;
            }

            if (packet.getStateCode() != StateCode.OK) {
                // TODO
                if (failureCallback) {
                    failureCallback(title);
                }
                return;
            }

            if (packet.data.code != ConferenceServiceState.Ok) {
                // TODO
                if (failureCallback) {
                    failureCallback(title);
                }
                return;
            }

            let conference = Conference.create(this, packet.data.data);

            if (successCallback) {
                successCallback(conference);
            }

            this.notifyObservers(new ObservableState(ConferenceEvent.Created, conference));
        });
    }
}
