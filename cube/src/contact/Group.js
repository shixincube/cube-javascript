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

import cell from "@lib/cell-lib";
import { AbstractContact } from "./AbstractContact";
import { Contact } from "./Contact";
import { ContactService } from "./ContactService";
import { GroupState } from "./GroupState";
import { Self } from "./Self";
import { AuthService } from "../auth/AuthService";
import { ModuleError } from "../core/error/ModuleError";
import { ContactServiceState } from "./ContactServiceState";
import { GroupAppendix } from "./GroupAppendix";

/**
 * 群组类。包含了多个联系人的集合。
 * @extends AbstractContact
 */
export class Group extends AbstractContact {

    /**
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
         * 群组的标签。
         * @protected
         * @type {string}
         */
        this.tag = 'public';

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
         * @type {Array<number>}
         */
        this.memberIdList = [ owner.id ];

        /**
         * 群组状态。
         * @protected
         * @type {number}
         */
        this.state = GroupState.Normal;

        /**
         * 群组的附录。
         * @protected
         * @type {GroupAppendix}
         */
        this.appendix = null;
    }

    /**
     * 修改群主。
     * @param {Contact} newOwner 指定新群组。
     * @param {function} [handleSuccess] 操作成功回调该方法，参数：({@linkcode group}:{@link Group}) 。
     * @param {function} [handleFailure] 操作失败回调该方法，参数：({@linkcode error}:{@link ModuleError}) 。
     * @returns {boolean} 返回是否能执行该操作。
     */
    changeOwner(newOwner, handleSuccess, handleFailure) {
        if (!(newOwner instanceof Contact)) {
            if (handleFailure) {
                let error = new ModuleError(ContactService.NAME, ContactServiceState.NotAllowed, this);
                handleFailure(error);
            }
            return false;
        }

        return this.service.modifyGroup(this, newOwner, null, null, handleSuccess, handleFailure);
    }

    /**
     * 修改群组名称。
     * @param {string} name 指定新的群组名称。
     * @param {function} [handleSuccess] 操作成功回调该方法，参数：({@linkcode group}:{@link Group}) 。
     * @param {function} [handleFailure] 操作失败回调该方法，参数：({@linkcode error}:{@link ModuleError}) 。
     * @returns {boolean} 返回是否能执行该操作。
     */
    modifyName(name, handleSuccess, handleFailure) {
        if (name == this.name) {
            if (handleFailure) {
                let error = new ModuleError(ContactService.NAME, ContactServiceState.NotAllowed, this);
                handleFailure(error);
            }
            return false;
        }

        return this.service.modifyGroup(this, null, name, null, handleSuccess, handleFailure);
    }

    /**
     * 修改群组上下文数据。
     * @param {JSON|object} context 指定新的上下文数据。
     * @param {function} [handleSuccess] 操作成功回调该方法，参数：({@linkcode group}:{@link Group}) 。
     * @param {function} [handleFailure] 操作失败回调该方法，参数：({@linkcode error}:{@link ModuleError}) 。
     * @returns {boolean} 返回是否能执行该操作。
     */
    modifyContext(context, handleSuccess, handleFailure) {
        return this.service.modifyGroup(this, null, null, context, handleSuccess, handleFailure);
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
     * @param {Contact|number} [contact] 指定联系人，当不指定联系人时，判断该群是否是当前联系人所有。
     * @returns {boolean} 如果联系人是群主返回 {@linkcode true} 。
     */
    isOwner(contact) {
        let id = 0;
        if (contact instanceof Contact) {
            id = contact.getId();
        }
        else if (contact instanceof Self) {
            id = contact.getId();
        }
        else if (typeof contact === 'number') {
            id = contact;
        }
        else {
            id = this.service.getSelf().getId();
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
     * @returns {number} 返回群组的活跃时间。
     */
    getLastActiveTime() {
        return this.lastActiveTime;
    }

    /**
     * 获取群组的状态。群组状态由 {@link GroupState} 描述。
     * @returns {number} 返回状态描述码 {@link GroupState} 。
     */
    getState() {
        return this.state;
    }

    /**
     * 获取群组的附录。
     * @returns {GroupAppendix} 返回群组的附录。
     */
    getAppendix() {
        if (null == this.appendix) {
            this.appendix = this.service.appendixMap.get(this.id);
        }
        return this.appendix;
    }

    /**
     * 获取成员名称。以优先显示方式进行显示。
     * @param {Contact} member 
     * @returns {string} 返回优先的成员名称。
     */
    getMemberName(member) {
        if (this.appendix.hasMemberRemark(member)) {
            return this.appendix.getMemberRemark(member);
        }
        else {
            return member.getPriorityName();
        }
    }

    /**
     * 获取指定 ID 的成员。
     * @param {number} memberId 指定成员 ID 。
     * @param {function} handler 指定数据回调句柄，参数：({@linkcode contact}:{@link Contact})  。
     */
    getMemberById(memberId, handler) {
        if (this.memberIdList.indexOf(memberId) >= 0) {
            this.service.getContact(memberId, handler, (error) => {
                handler(null);
            });
        }
        else {
            handler(null);
        }
    }

    /**
     * 获取群成员数量。
     * @returns {number} 返回群成员数量。
     */
    numMembers() {
        return this.memberIdList.length;
    }

    /**
     * 获取群组的成员 ID 清单。
     * @returns {Array<long>} 返回群组成员列表，该列表为群组列表的副本。
     */
    getMemberIds() {
        return this.memberIdList.concat();
    }

    /**
     * 修改群组成员数据。该方法仅改变本地数据。
     * @param {number} member 成员的联系人实例。
     */
    modifyMember(member) {
        let cur = this.getMemberById(member.getId());
        if (null == cur) {
            return;
        }
        
        cur.context = member.context;
        cur.name = member.name;
    }

    /**
     * 列出所有成员数据。
     * @param {function} handler 回调成员数据清单，参数：({@linkcode list}:{@linkcode Array<Contact>}, {@linkcode group}:{@link Group}) 。
     */
    listMembers(handler) {
        (new Promise((resolve, reject) => {
            let list = [];
            for (let i = 0; i < this.memberIdList.length; ++i) {
                let memberId = this.memberIdList[i];
                this.service.getContact(memberId, (contact) => {
                    list.push(contact);
                    if (list.length == this.memberIdList.length) {
                        resolve(list);
                    }
                }, (error) => {
                    reject(error);
                });
            }
        })).then((list) => {
            handler(list, this);
        }).catch((error) => {
            console.error(error);
            handler([], this);
        });
    }

    /**
     * 添加群组成员。
     * @param {Array<Contact|number>} members 指定群组成员或者群组成员 ID 。
     * @param {function} [handleSuccess] 操作成功回调该方法，参数：({@linkcode group}:{@link Group}, {@linkcode members}:Array<{@link Contact}>, {@linkcode operator}:{@link Contact}) 。
     * @param {function} [handleFailure] 操作失败回调该方法，参数：({@linkcode error}:{@link ModuleError}) 。
     * @returns {boolean} 返回是否能执行该操作。
     */
    addMembers(members, handleSuccess, handleFailure) {
        return this.service.addGroupMembers(this, members, handleSuccess, handleFailure);
    }

    /**
     * 移除群组成员。
     * @param {Array<Contact|number>} members 指定群组成员或者群组成员 ID 。
     * @param {function} [handleSuccess] 操作成功回调该方法，参数：({@linkcode group}:{@link Group}, {@linkcode members}:Array<{@link Contact}>, {@linkcode operator}:{@link Contact}) 。
     * @param {function} [handleFailure] 操作失败回调该方法，参数：({@linkcode error}:{@link ModuleError}) 。
     * @returns {boolean} 返回是否能执行该操作。
     */
    removeMembers(members, handleSuccess, handleFailure) {
        return this.service.removeGroupMembers(this, members, handleSuccess, handleFailure);
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

        for (let i = 0; i < this.memberIdList.length; ++i) {
            let memberId = this.memberIdList[i];
            if (memberId == id) {
                return true;
            }
        }

        return false;
    }

    /**
     * 仅用于维护 memberIdList 数据。
     * @private
     * @param {Contact} member 
     */
    _removeMember(member) {
        let id = member.getId();
        for (let i = 0; i < this.memberIdList.length; ++i) {
            let mid = this.memberIdList[i];
            if (mid == id) {
                this.memberIdList.splice(i, 1);
                return;
            }
        }
    }

    /**
     * 仅用于维护 memberIdList 数据。
     * @private
     * @param {Contact} member 
     */
    _replaceMember(member) {
        this._removeMember(member);
        this.memberIdList.push(member);
        if (this.owner.getId() == member.getId()) {
            this.owner = member;
        }
    }

    /**
     * @inheritdoc
     */
    toJSON() {
        let json = super.toJSON();

        json.owner = this.owner.toCompactJSON();
        json.tag = this.tag;
        json.creation = this.creationTime;
        json.lastActive = this.lastActiveTime;
        json.state = this.state;
        json.members = this.memberIdList;

        return json;
    }

    /**
     * @inheritdoc
     */
    toCompactJSON() {
        let json = super.toCompactJSON();
        json.domain = this.domain;
        json.owner = this.owner.toCompactJSON();
        json.tag = this.tag;
        json.creation = this.creationTime;
        json.lastActive = this.lastActiveTime;
        json.state = this.state;
        return json;
    }

    /**
     * 由 JSON 格式数据创建 {@link Group} 实例。
     * @private
     * @param {ContactService} service 联系人服务。
     * @param {JSON} json 符合 {@link Group} 格式的 JSON 数据。
     * @param {Contact} [owner] 群主。
     * @returns {Group} 返回 {@link Group} 实例。
     */
    static create(service, json, owner) {
        if (undefined === owner) {
            owner = new Contact.create(json.owner, json.domain);
            if (service) {
                service.getAppendix(owner);
            }
        }

        let group = new Group(service, owner, json.id, json.name, json.domain);
        group.tag = json.tag;
        group.creationTime = json.creation;
        group.lastActiveTime = json.lastActive;
        group.state = json.state;

        if (undefined !== json.members) {
            for (let i = 0; i < json.members.length; ++i) {
                let memeberId = json.members[i];
                if (memeberId == owner.id) {
                    continue;
                }

                group.memberIdList.push(memeberId);
            }
        }

        if (undefined !== json.context) {
            group.context = json.context;
        }

        return group;
    }
}
