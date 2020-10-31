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
import { Contact } from "./Contact";
import { ContactService } from "./ContactService";
import { GroupState } from "./GroupState";
import { AuthService } from "../auth/AuthService";

/**
 * 群组类。包含了多个联系人的集合。
 */
export class Group extends Contact {

    /**
     * 构造函数。
     * @param {ContactService} service 联系人服务。
     * @param {Contact} owner 群组的所有人。
     * @param {number} [id] 群组的 ID 。
     * @param {string} [name] 群组的名称。
     * @param {string} [domain] 群组的所在的域。
     */
    constructor(service, owner, id, name, domain) {
        super((undefined === id) ? cell.Utils.generateSerialNumber() : id,
            name, (undefined === domain) ? AuthService.DOMAIN : domain);

        /**
         * 联系人服务对象。
         * @protected
         * @type {ContactService}
         */
        this.service = service;

        /**
         * 群组的所有人。
         * @protected
         * @type {Contact}
         */
        this.owner = owner;

        /**
         * 创建时间。
         * @protected
         * @type {number}
         */
        this.creationTime = 0;

        /**
         * 活跃时间。
         * @protected
         * @type {number}
         */
        this.lastActiveTime = 0;

        /**
         * 群成员 ID 列表。
         * @protected
         * @type {Array<Contact>}
         */
        this.memberList = [ owner ];

        /**
         * 群组状态。
         * @protected
         * @type {number}
         */
        this.state = GroupState.Normal;
    }

    /**
     * 获取群组的所有者。
     * @returns {Contact} 返回群组的所有者。
     */
    getOwner() {
        return this.owner;
    }

    /**
     * 判断指定联系人是否是该群所有者。
     * @param {Contact|number} contact 指定联系人。
     * @returns {boolean} 如果联系人是群主返回 {@linkcode true} 。
     */
    isOwner(contact) {
        let id = 0;
        if (contact instanceof Contact) {
            id = contact.getId();
        }
        else {
            id = contact;
        }

        return (id == this.owner.id);
    }

    /**
     * 获取群组的创建时间。
     * @returns {number} 返回群组的创建时间。
     */
    getCreationTime() {
        return this.creationTime;
    }

    /**
     * 获取群组的活跃时间。
     */
    getLastActiveTime() {
        return this.lastActiveTime;
    }

    /**
     * 获取群组的状态。
     * @returns {number} 返回状态描述码 {@link GroupState} 。
     */
    getState() {
        return this.state;
    }

    /**
     * 获取群成员数量。
     * @returns {number} 返回群成员数量。
     */
    numMembers() {
        return this.memberList.length;
    }

    /**
     * 获取群组的成员清单。
     * @returns {Array<Contact>} 返回群组成员列表。
     */
    getMembers() {
        return this.memberList.concat();
    }

    /**
     * 添加群组成员。
     * @param {Array<Contact|number>} members 指定群组成员或者群组成员 ID 。
     * @param {function} [handleSuccess] 操作成功回调该方法，参数：({@linkcode group}:{@link Group}, {@linkcode members}:Array, {@linkcode operator}:{@link Contact}) 。
     * @param {function} [handleError] 操作失败回调该方法，参数：({@linkcode group}:{@link Group}, {@linkcode members}:Array, {@linkcode operator}:{@link Contact}) 。
     * @returns {boolean} 返回是否能执行该操作。
     */
    addMembers(members, handleSuccess, handleError) {
        return this.service.addGroupMembers(this, members, handleSuccess, handleError);
    }

    /**
     * 移除群组成员。
     * @param {Array<Contact|number>} members 指定群组成员或者群组成员 ID 。
     * @param {function} [handleSuccess] 操作成功回调该方法，参数：({@linkcode group}:{@link Group}, {@linkcode members}:Array, {@linkcode operator}:{@link Contact}) 。
     * @param {function} [handleError] 操作失败回调该方法，参数：({@linkcode group}:{@link Group}, {@linkcode members}:Array, {@linkcode operator}:{@link Contact}) 。
     * @returns {boolean} 返回是否能执行该操作。
     */
    removeMembers(members, handleSuccess, handleError) {
        return this.service.removeGroupMembers(this, members, handleSuccess, handleError);
    }

    /**
     * 是否包含该成员。
     * @param {Contact|number} contact 指定成员。
     * @returns {boolean} 返回 {@linkcode true} 表示群组里包含该成员。
     */
    hasMember(contact) {
        let id = 0;
        if (contact instanceof Contact) {
            id = contact.getId();
        }
        else {
            id = parseInt(contact);
        }

        for (let i = 0; i < this.memberList.length; ++i) {
            let member = this.memberList[i];
            if (member.getId() == id) {
                return true;
            }
        }

        return false;
    }

    /**
     * 仅用于维护 memberList 数据。
     * @private
     * @param {Contact} member 
     */
    _removeMember(member) {
        let id = member.getId();
        for (let i = 0; i < this.memberList.length; ++i) {
            let m = this.memberList[i];
            if (m.getId() == id) {
                this.memberList.splice(i, 1);
                return;
            }
        }
    }

    /**
     * @inheritdoc
     */
    toJSON() {
        let json = super.toJSON();
        delete json.devices;
        json.owner = this.owner.toCompactJSON();
        json.creation = this.creationTime;
        json.lastActive = this.lastActiveTime;
        json.state = this.state;
        json.members = [];
        for (let i = 0; i < this.memberList.length; ++i) {
            json.members.push(this.memberList[i].toCompactJSON());
        }
        return json;
    }

    /**
     * @inheritdoc
     */
    toCompactJSON() {
        let json = super.toCompactJSON();
        json.domain = this.domain;
        json.owner = this.owner.toCompactJSON();
        json.creation = this.creationTime;
        json.lastActive = this.lastActiveTime;
        json.state = this.state;
        return json;
    }

    /**
     * 创建 {@link Group} 对象实例。
     * 
     * @param {ContactService} service 
     * @param {JSON} json 
     * @param {Contact} [owner]
     */
    static create(service, json, owner) {
        if (undefined === owner) {
            owner = new Contact.create(json.owner, json.domain);
        }

        let group = new Group(service, owner, json.id, json.name, json.domain);
        group.creationTime = json.creation;
        group.lastActiveTime = json.lastActive;
        group.state = json.state;

        for (let i = 0; i < json.members.length; ++i) {
            let member = Contact.create(json.members[i], json.domain);
            if (!group.hasMember(member)) {
                group.memberList.push(member);
            }
        }

        if (undefined !== json.context) {
            group.context = json.context;
        }

        return group;
    }
}
