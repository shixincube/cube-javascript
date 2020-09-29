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

import { Contact } from "./Contact";
import { OrderMap } from "../util/OrderMap";
import { ContactService } from "./ContactService";

/**
 * 群组类。包含了多个联系人的集合。
 */
export class Group extends Contact {

    /**
     * 构造函数。
     * @param {Contact} owner 指定群组的所有者。
     */
    constructor(owner) {
        super(0);

        /**
         * 群组的所有人。
         * @protected
         * @type {Contact}
         */
        this.owner = owner;

        /**
         * 联系人服务对象。
         * @protected
         * @type {ContactService}
         */
        this.service = null;

        /**
         * 群成员 ID 列表。
         * @protected
         * @type {Array<number>}
         */
        this.memberIdList = [owner.getId()];
    }

    /**
     * 获取群组的所有者。
     * @returns {Contact} 返回群组的所有者。
     */
    getOwner() {
        return this.owner;
    }

    /**
     * 获取群组的成员 ID 清单。
     * @returns {Array<number>} 返回群组的成员 ID 清单。
     */
    getMemberIdList() {
        return this.memberIdList;
    }

    /**
     * 设置成员列表。
     * @protected
     * @param {Array} members 
     */
    setMembers(members) {
        for (let i = 0; i < members.length; ++i) {
            let mem = members[i];
            let memId = (mem instanceof Contact) ? mem.getId() : mem;

            // 排重
            let index = this.memberIdList.indexOf(memId);
            if (index >= 0) {
                continue;
            }

            this.memberIdList.push(memId);
        }
    }

    /**
     * 添加群组成员。
     * @param {Contact} contact 指定群组成员。
     */
    addMember(contact) {
        if (this.hasMember(contact)) {
            return;
        }

        this.service._addGroupMember(this, contact, (group) => {
            if (null == group) {
                return;
            }

            this.memberIdList.push(contact.getId());
        });
    }

    /**
     * 移除群组成员。
     * @param {Contact} contact 指定群组成员。
     */
    removeMember(contact) {
        let index = this.memberIdList.indexOf(contact.getId());
        if (index < 0) {
            return;
        }

        this.service._removeGroupMember(this, contact, (group) => {
            if (null == group) {
                return;
            }

            index = this.memberIdList.indexOf(contact.getId());
            if (index >= 0) {
                this.memberIdList.splice(index, 1);
            }
        });
    }

    /**
     * 是否包含该成员。
     * @param {Contact} contact 指定成员。
     * @returns {boolean} 返回 {@linkcode true} 表示群组里包含该成员。
     */
    hasMember(contact) {
        return (this.memberIdList.indexOf(contact.getId()) >= 0);
    }

    /**
     * 获取群组成员列表。
     * 该方法以分页形式将指定分页数量的群成员依次传递给回调函数。
     * 回调函数会被调用一次或多次，直到获取到所有成员对象或者超时。
     * @param {function} handler 
     * @param {number} numMemPerPage 
     */
    getMembers(handler, numMemPerPage) {
        // 分页
        let pages = this._pagingMembers(numMemPerPage);

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
    _pagingMembers(numMemPerPage) {
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
        json.ownerId = this.owner.getId();
        json.members = this.memberIdList;
        return json;
    }

    /**
     * 创建指定信息的 {@linkcode Group} 对象实例。
     * @param {ContactService} service 
     * @param {JSON} json 
     * @param {function} callback 
     */
    static create(service, json, callback) {
        service.getContact(json.ownerId, (owner) => {
            if (null == owner) {
                callback(null);
                return;
            }

            let group = new Group(owner);
            group.id = json.id;
            group.name = json.name;
            group.memberIdList = json.members;
            group.service = service;

            if (undefined !== json.context) {
                group.context = json.context;
            }

            callback(group);
        });
    }
}
