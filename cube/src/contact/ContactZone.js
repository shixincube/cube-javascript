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
import { ModuleError } from "../core/error/ModuleError";
import { Contact } from "./Contact";
import { ContactService } from "./ContactService";
import { ContactServiceState } from "./ContactServiceState";
import { ContactZoneParticipant } from "./ContactZoneParticipant";
import { ContactZoneParticipantType } from "./ContactZoneParticipantType";
import { ContactZoneParticipantState } from "./ContactZoneParticipantState";

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
     * 获取分区名。
     * @returns {string} 返回字符串形式的分区名。
     */
    getName() {
        return this.name;
    }

    /**
     * 获取分区显示名。
     * @returns {string} 返回字符串形式的分区显示名。
     */
    getDisplayName() {
        return this.displayName;
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
        for (let i = 0; i < this.participants.length; ++i) {
            if (this.participants[i].id == contactId) {
                return this.participants[i];
            }
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
                participant._assigns((participant) => {
                    ++readyCount;
                    resultHandler();
                });
            }
        }

        resultHandler();
    }

    /**
     * 获取参与人列表。
     * @param {number} excludedState 指定排除的参与人状态。
     * @param {function} handler 数据回调句柄，参数：({@linkcode list}:Array<{@link ContactZoneParticipant}>}) 。
     */
    getParticipantsByExcluding(excludedState, handler) {
        let resultList = [];

        this.getParticipants((list) => {
            for (let i = 0; i < list.length; ++i) {
                let participant = list[i];
                if (participant.state != excludedState) {
                    resultList.push(participant);
                }
            }

            // 时间倒序
            resultList.sort((a, b) => b.timestamp - a.timestamp);

            handler(resultList);
        });
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

    /**
     * 添加联系人为分区的参与人。
     * @param {Contact|number} contactOrId 指定联系人或联系人 ID 。
     * @param {string} postscript 加入分区的附言信息。
     * @param {function} handleSuccess 操作成功回调该方法，参数：({@linkcode zone}:{@link ContactZone}, {@linkcode participant}:{@link ContactZoneParticipant})。
     * @param {function} handleFailure 操作失败回调该方法，参数：({@linkcode error}:{@link ModuleError})。
     */
    addParticipant(contactOrId, postscript, handleSuccess, handleFailure) {
        if (contactOrId instanceof ContactZoneParticipant) {
            for (let i = 0; i < this.participants.length; ++i) {
                let p = this.participants[i];
                if (p.id == contactOrId.id) {
                    // 已添加
                    return;
                }
            }

            // 添加
            this.participants.push(contactOrId);
        }
        else {
            let contactId = (typeof contactOrId === 'number') ? contactOrId : contactOrId.id;
            for (let i = 0; i < this.participants.length; ++i) {
                let participant = this.participants[i];
                if (participant.id == contactId) {
                    // 已包含
                    handleFailure(new ModuleError(ContactService.NAME, ContactServiceState.NotAllowed, this));
                    return;
                }
            }

            if (null == postscript) {
                postscript = '';
            }

            let participant = new ContactZoneParticipant({
                id: contactId,
                timestamp: Date.now(),
                type: ContactZoneParticipantType.Contact,
                state: ContactZoneParticipantState.Pending,
                inviterId: this.service.getSelf().id,
                postscript: postscript
            }, this.service);

            // 添加操作
            this.service.addParticipantToZone(this, participant, handleSuccess, handleFailure);
        }
    }

    /**
     * 移除参与人。
     * @param {Contact|number} contactOrId 指定联系人或联系人 ID 。
     * @param {function} handleSuccess 操作成功回调该方法，参数：({@linkcode zone}:{@link ContactZone}, {@linkcode participant}:{@link ContactZoneParticipant})。
     * @param {function} handleFailure 操作失败回调该方法，参数：({@linkcode error}:{@link ModuleError})。
     */
    removeParticipant(contactOrId, handleSuccess, handleFailure) {
        if (contactOrId instanceof ContactZoneParticipant) {
            let index = -1;
            for (let i = 0; i < this.participants.length; ++i) {
                let p = this.participants[i];
                if (p.id == contactOrId.id) {
                    index = i;
                    break;
                }
            }

            // 移除
            if (index >= 0) {
                this.participants.splice(index, 1);
            }
        }
        else {
            let participant = null;

            let contactId = (typeof contactOrId === 'number') ? contactOrId : contactOrId.id;
            for (let i = 0; i < this.participants.length; ++i) {
                let p = this.participants[i];
                if (p.id == contactId) {
                    participant = p;
                    break;
                }
            }

            if (null == participant) {
                handleFailure(new ModuleError(ContactService.NAME, ContactServiceState.NotAllowed, this));
                return;
            }

            // 移除操作
            this.service.removeParticipantFromZone(this, participant, handleSuccess, handleFailure);
        }
     }

    /**
     * 修改参与人状态。
     * @param {Contact|ContactZoneParticipant} contactOrParticipant 指定联系人或者参与人。
     * @param {ContactZoneParticipantState} state 指定状态。
     * @param {function} handleSuccess 操作成功回调该方法，参数：({@linkcode zone}:{@link ContactZone}, {@linkcode participant}:{@link ContactZoneParticipant})。
     * @param {function} handleFailure 操作失败回调该方法，参数：({@linkcode error}:{@link ModuleError})。
     */
    modifyParticipantState(contactOrParticipant, state, handleSuccess, handleFailure) {
        let participant = null;
        if (contactOrParticipant instanceof Contact) {
            participant = this.getParticipant(contactOrParticipant.id);
        }
        else if (contactOrParticipant instanceof ContactZoneParticipant) {
            participant = contactOrParticipant;
        }
        else {
            participant = this.getParticipant(contactOrParticipant);
        }

        if (null == participant) {
            handleFailure(new ModuleError(ContactService.NAME, ContactServiceState.InvalidParameter, contactOrParticipant));
            return;
        }

        // 修改参与人状态
        this.service.modifyParticipantState(this, participant, state, handleSuccess, handleFailure);
    }
}
