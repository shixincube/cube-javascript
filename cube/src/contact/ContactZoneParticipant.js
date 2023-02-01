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

import { Entity } from "../core/Entity";
import { Contact } from "./Contact";
import { Group } from "./Group";
import { ContactService } from "./ContactService";
import { ContactZoneParticipantType } from "./ContactZoneParticipantType";
import { ContactZoneParticipantState } from "./ContactZoneParticipantState";

/**
 * 联系人分区数据。
 * @extends Entity
 */
 export class ContactZoneParticipant extends Entity {

    constructor(json, service) {
        super(json.id, json.timestamp);

        /**
         * 参与人类型。
         * @type {number}
         * @see ContactZoneParticipantType
         */
        this.type = json.type;

        /**
         * 参与者的状态。
         * @type {number}
         * @see ContactZoneParticipantState
         */
        this.state = json.state;

        /**
         * 邀请人 ID。
         * @type {number}
         */
        this.inviterId = json.inviterId;

        /**
         * 分区所有人留给该参与者的附言。
         * @type {string}
         */
        this.postscript = '';

        if (undefined !== json.postscript) {
            this.postscript = json.postscript;
        }

        /**
         * 联系人实例。
         * @type {Contact}
         */
        this.contact = null;

        /**
         * 群组实例。
         * @type {Group}
         */
        this.group = null;

        /**
         * @private
         * @type {ContactService}
         */
        this.service = service;

        if (service) {
            // 赋值操作
            this._assigns();
        }
    }

    /**
     * 获取参与人名称。
     * @returns {string} 返回参与人名称。
     */
    getName() {
        if (this.type == ContactZoneParticipantType.Contact) {
            return (null != this.contact) ? this.contact.getName() : '';
        }
        else if (this.type == ContactZoneParticipantType.Group) {
            return (null != this.group) ? this.group.getName() : '';
        }
        else {
            return '';
        }
    }

    /**
     * 当前签入的联系人是否是该参与者的邀请人。
     * @returns {boolean}
     */
    isInviter() {
        return this.service.getSelf().id == this.inviterId;
    }

    /**
     * @private
     * @param {function} [callback]
     */
    _assigns(callback) {
        if (this.type == ContactZoneParticipantType.Contact) {
            this.service.getContact(this.id, (contact) => {
                this.contact = contact;

                if (undefined !== callback) {
                    callback(this);
                }
            }, (error) => {
                if (undefined !== callback) {
                    callback(this);
                }
            });
        }
        else if (this.type == ContactZoneParticipantType.Group) {
            this.service.getGroup(this.id, (group) => {
                this.group = group;

                if (undefined !== callback) {
                    callback(this);
                }
            }, (error) => {
                if (undefined !== callback) {
                    callback(this);
                }
            });
        }
    }

    isAssigned() {
        if (this.type == ContactZoneParticipantType.Contact) {
            return (null != this.contact);
        }
        else if (this.type == ContactZoneParticipantType.Group) {
            return (null != this.group);
        }
        else {
            return true;
        }
    }

    /**
     * @inheritdoc
     */
     toJSON() {
        let json = this.toCompactJSON();
        json.postscript = this.postscript;
        return json;
     }

     /**
     * @inheritdoc
     */
     toCompactJSON() {
        let json = super.toCompactJSON();
        json.type = this.type;
        json.state = this.state;
        json.inviterId = this.inviterId;
        return json;
     }
 }
