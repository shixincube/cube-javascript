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
    }

    /**
     * 获取群组的所有者。
     * @returns {Contact} 返回群组的所有者。
     */
    getOwner() {
        return this.owner;
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
     * 获取群组的成员清单。
     * @returns {Array<Contact>} 返回群组成员列表。
     */
    getMembers() {
        return this.memberList;
    }

    /**
     * 添加群组成员。
     * @param {Contact} contact 指定群组成员。
     */
    addMember(contact) {
        if (this.hasMember(contact)) {
            return;
        }

        this.service.addGroupMember(this, contact, (group, contact) => {
            if (null == group) {
                return;
            }

            this.memberList.push(contact);
        });
    }

    /**
     * 移除群组成员。
     * @param {Contact} contact 指定群组成员。
     */
    removeMember(contact) {
        if (!this.hasMember(contact)) {
            return;
        }

        this.service.removeGroupMember(this, contact, (group, contact) => {
            if (null == group) {
                return;
            }

            for (let i = 0; i < this.memberList.length; ++i) {
                let member = this.memberList[i];
                if (member.equals(contact)) {
                    this.memberList.splice(i, 1);
                    break;
                }
            }
        });
    }

    /**
     * 是否包含该成员。
     * @param {Contact} contact 指定成员。
     * @returns {boolean} 返回 {@linkcode true} 表示群组里包含该成员。
     */
    hasMember(contact) {
        for (let i = 0; i < this.memberList.length; ++i) {
            let member = this.memberList[i];
            if (member.equals(contact)) {
                return true;
            }
        }

        return false;
    }

    /**
     * 获取群组成员列表。
     * 该方法以分页形式将指定分页数量的群成员依次传递给回调函数。
     * 回调函数会被调用一次或多次，直到获取到所有成员对象或者超时。
     * @param {function} handler 
     * @param {number} numMemPerPage 
     */
    refreshMembers(handler, numMemPerPage) {
        // 分页
        let pages = this.pagingMembers(numMemPerPage);

        // 执行函数
        let go = (list) => {
            this.service.getContactList(list, (clist) => {
                handler(clist);
    
                if (pages.length > 0) {
                    // 还有数据继续获取
                    let newList = pages.shift();
    
                    go(newList);
                }
            });
        };

        let list = pages.shift();
        // 执行
        go(list);
    }

    /**
     * 对成员列表按照每页数量进行分页。
     * @private
     * @param {number} numMemPerPage 
     * @returns {Array<Array<number>>} 返回分页结果。
     */
    pagingMembers(numMemPerPage) {
        let result = [];

        let page = [];
        let index = 0;
        while (index < this.memberIdList.length) {
            let id = this.memberIdList[index];
            page.push(id);

            if (page.length == numMemPerPage) {
                result.push(page);
                page = [];
            }

            ++index;
        }

        return result;
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
        json.members = [];
        for (let i = 0; i < this.memberList.length; ++i) {
            json.members.push(this.memberList[i].toCompactJSON());
        }
        return json;
    }
    
    /**
     * 创建 {@linkcode Group} 对象实例。
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
