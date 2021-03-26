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
import { Entity } from "../core/Entity";
import { Contact } from "../contact/Contact";
import { OrderMap } from "../util/OrderMap";
import { ConferenceService } from "./ConferenceService";
import { Invitation } from "./Invitation";
import { Room } from "./Room";

/**
 * 会议描述。
 * @extends Entity
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
         * 会议号/会议访问码。
         * @type {string}
         */
         this.code = null;

        /**
         * 会议主题。
         * @type {string}
         */
        this.subject = null;

        /**
         * 会议是否有密码。
         * @type {boolean}
         */
        this.existingPwd = false;

        /**
         * 会议摘要。
         * @type {string}
         */
        this.summary = '';

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
         * 会议创建时间。
         * @type {number}
         */
        this.creation = 0;

        /**
         * 会议预约开始时间。
         * @type {number}
         */
        this.scheduleTime = 0;

        /**
         * 会议到期时间。
         * @type {number}
         */
        this.expireTime = 0;

        /*
         * 会议预估时长，单位：分钟。
         * @type {number}
         */
        // this.estimatedDurationInMinutes = 0;

        /**
         * 会议邀请列表。
         * @type {OrderMap<number, Invitation>}
         */
        this.invitees = new OrderMap();

        /**
         * 会议房间。
         * @type {Room}
         */
        this.room = null;

        /**
         * 会议是否已取消。
         * @type {boolean}
         */
        this.cancelled = false;
    }

    /**
     * 获取会议 ID 。
     * @returns {number} 返回会议 ID 。
     */
    getId() {
        return this.id;
    }

    /**
     * 获取会议的访问码。
     * @returns {string} 返回会议的访问码。
     */
    getCode() {
        return this.code;
    }

    /**
     * 会议是否设置了密码。
     * @returns {boolean} 是否存在密码。
     */
    hasPassword() {
        return this.existingPwd;
    }

    /**
     * 获取会议创建人。
     * @returns {Contact} 返回会议创建人。
     */
    getFounder() {
        return this.founder;
    }

    /**
     * 获取会议主持人。
     * @returns {Contact} 返回会议主持人。
     */
    getPresenter() {
        return this.presenter;
    }

    /**
     * 获取会议房间。
     * @returns {Room} 返回会议房间。
     */
    getRoom() {
        return this.room;
    }

    /**
     * 获取被邀请人。
     * @returns {Array<Invitation>} 返回被邀请人列表。
     */
    getInvitees() {
        return this.invitees.values();
    }

    /**
     * @inheritdoc
     */
    toJSON() {
        let json = super.toJSON();
        json.id = this.id;
        json.code = this.code;
        json.subject = this.subject;
        json.existingPwd = this.existingPwd;
        json.summary = this.summary;
        json.founder = this.founder.toCompactJSON();
        json.presenter = this.presenter.toCompactJSON();
        json.creation = this.creation;
        json.scheduleTime = this.scheduleTime;
        json.expireTime = this.expireTime;

        json.invitees = [];
        this.invitees.values().forEach((value) => {
            json.invitees.push(value.toJSON());
        });

        json.room = this.room.toJSON();

        json.cancelled = this.cancelled;

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
     * @private
     * @param {ConferenceService} service 
     * @param {JSON} json 
     * @returns {Conference}
     */
    static create(service, json) {
        let conference = new Conference(service);
        conference.id = json.id;
        conference.code = json.code;
        conference.subject = json.subject;
        conference.existingPwd = json.existingPwd;
        conference.summary = json.summary;
        conference.founder = Contact.create(json.founder);
        conference.presenter = Contact.create(json.presenter);
        conference.creation = json.creation;
        conference.scheduleTime = json.scheduleTime;
        conference.expireTime = json.expireTime;

        json.invitees.forEach((value) => {
            let inv = Invitation.create(value);
            conference.invitees.put(inv.id, inv);
        });

        conference.room = Room.create(json.room);

        conference.cancelled = json.cancelled;

        return conference;
    }
}
