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

import cell from "@lib/cell-lib";
import { Entity } from "../core/Entity";
import { Contact } from "../contact/Contact";
import { OrderMap } from "../util/OrderMap";
import { ConferenceService } from "./ConferenceService";
import { Invitation } from "./Invitation";
import { Room } from "./Room";
import { Participant } from "./Participant";

/**
 * 会议描述。
 */
export class Conference extends Entity {

    /**
     * @param {ConferenceService} service 会议服务模块实例。
     */
    constructor(service) {
        super();

        /**
         * 会议服务模块实例。
         * @type {ConferenceService}
         * @private
         */
        this.service = service;

        /**
         * 会议 ID 。
         * @type {number}
         */
        this.id = 0;

        /**
         * 会议标题。
         * @type {string}
         */
        this.title = null;

        /**
         * 会议密码。
         * @type {string}
         */
        this.password = null;

        /**
         * 会议号/会议访问码。
         * @type {string}
         */
        this.access = null;

        /**
         * 会议预约开始时间。
         * @type {number}
         */
        this.appointmentTime = 0;

        /**
         * 会议预估时长，单位：分钟。
         * @type {number}
         */
        this.estimatedDurationInMinutes = 0;

        /**
         * 会议创建人。
         * @type {Contact}
         */
        this.founder = null;

        /**
         * 会议主持人。
         * @type {Contact}
         */
        this.presenter = null;

        /**
         * 会议邀请列表。
         * @type {OrderMap<string, Invitation>}
         */
        this.invitees = new OrderMap();

        /**
         * 会议房间。
         * @type {Room}
         */
        this.room = null;

        /**
         * 会议参与者列表。
         * @type {Array<Participant>}
         */
        this.participants = [];
    }

    /**
     * @returns {number} 返回会议 ID 。
     */
    getId() {
        return this.id;
    }

    /**
     * @returns {Contact}
     */
    getFounder() {
        return this.founder;
    }

    /**
     * @returns {Contact}
     */
    getPresenter() {
        return this.presenter;
    }

    /**
     * @returns {Room}
     */
    getRoom() {
        return this.room;
    }

    /**
     * 设置预约时间。
     * @param {number} time 
     */
    setAppointmentTime(time)  {
        this.appointmentTime =  time;
        this.service.updateAppointment(this);
    }

    sendOutInvitation(name, displayName) {
        this.invitees.put(name, new Invitation(name, displayName));
    }

    join() {

    }

    getParticipants() {
        return this.participants;
    }

    /**
     * @inheritdoc
     */
    toJSON() {
        let json = super.toJSON();
        json.id = this.id;
        json.title = this.title;
        if (null != this.password) {
            json.password = this.password;
        }

        json.founder = this.founder.toCompactJSON();
        json.access = this.access;

        if (null != this.presenter) {
            json.presenter = this.presenter.toCompactJSON();
        }

        let inviteeArray = [];
        let invitees = this.invitees.values();
        for (let i = 0; i < invitees.length; ++i) {
            let inv = invitees[i];
            inviteeArray.push(inv.toJSON());
        }
        json.invitees = inviteeArray;

        return json;
    }

    /**
     * @inheritdoc
     */
    toCompactJSON() {
        return this.toJSON();
    }

    /**
     * 从 JSON 数据创建 {@link Conference} 会议对象实例。
     * @param {ConferenceService} service 
     * @param {JSON} json 
     * @returns {Conference}
     */
    static create(service, json) {
        let conference = new Conference(service);
        conference.id = json.id;
        return conference;
    }
}
