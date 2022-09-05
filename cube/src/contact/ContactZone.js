/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020-2022 Cube Team.
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
import { Contact } from "./Contact";
import { ContactService } from "./ContactService";
import { ContactZoneParticipant } from "./ContactZoneParticipant";

/**
 * 联系人分区数据。
 * @extends Entity
 */
export class ContactZone extends Entity {

    /**
     * 分区状态：正常状态。
     */
    static StateNormal = 1;

    /**
     * 分区状态：已删除的分区。
     */
    static StateDeleted = 0;

    constructor(json, service) {
        super(json.id, json.timestamp);

        /**
         * @private
         * @type {ContactService}
         */
        this.service = service;

        /**
         * @private
         * @type {string}
         */
        this.domain = json.domain;

        /**
         * @private
         * @type {number}
         */
        this.owner = json.owner;

        /**
         * 分区名。
         * @type {string}
         */
        this.name = json.name;

        /**
         * 分区显示名。
         * @type {string}
         */
        this.displayName = json.displayName;

        /**
         * 分区状态。
         * @type {int}
         */
        this.state = json.state;

        /**
         * 是否端到端对等模式。
         * @type {boolean}
         */
        this.peerMode = json.peerMode;

        /**
         * 分区参与者列表。
         * @type {Array<ContactZoneParticipant>}
         * @see ContactZoneParticipant
         */
        this.participants = [];

        for (let i = 0; i < json.participants.length; ++i) {
            let participant = new ContactZoneParticipant(json.participants[i], service);
            this.participants.push(participant);
        }
    }

    /**
     * 获取分区参与人数量。
     * @returns {number} 返回分区参与人数量。
     */
    numParticipants() {
        return this.participants.length;
    }

    /**
     * 获取指定的参与人。
     * @param {number} contactId 指定参与人的 ID 。
     * @returns {ContactZoneParticipant} 返回指定参与人。
     */
    getParticipant(contactId) {
        let index = this.contacts.indexOf(contactId);
        if (index >= 0) {
            return this.participants[index];
        }

        return null;
    }

    /**
     * 获取分区里的所有参与人。
     * @param {function} handler 数据回调句柄，参数：({@linkcode list}:Array<{@link ContactZoneParticipant}>}) 。
     */
    getParticipants(handler) {
        let readyCount = 0;

        let resultHandler = () => {
            if (readyCount == this.participants.length) {
                // 获取到全部数据
                handler(this.participants);
            }
        };

        for (let i = 0; i < this.participants.length; ++i) {
            let participant = this.participants[i];
            if (participant.isAssigned()) {
                ++readyCount;
            }
            else {
                participant._assigns(this.service, (participant) => {
                    ++readyCount;
                    resultHandler();
                });
            }
        }

        resultHandler();
    }

    /**
     * 指定的联系人是否包含在该联系人分区里。
     * @param {Contact} contact 指定联系人。
     * @returns {boolean} 如果该分区有该联系人返回 {@linkcode true} ，否则返回 {@linkcode false} 。
     */
    contains(contact) {
        for (let i = 0; i < this.participants.length; ++i) {
            let participant = this.participants[i];
            if (participant.id == contact.id) {
                return true;
            }
        }

        return false;
    }
}
