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
import InDB from "indb";
import { OrderMap } from "../util/OrderMap";
import { Module } from "../core/Module";
import { Packet } from "../core/Packet";
import { StateCode } from "../core/StateCode";
import { ContactPipelineListener } from "./ContactPipelineListener";
import { Self } from "./Self";
import { ObservableState } from "../core/ObservableState";
import { Contact } from "./Contact";
import { ContactAction } from "./ContactAction";
import { ContactEvent } from "./ContactEvent";
import { Device } from "./Device";
import { Group } from "./Group";
import { EntityInspector } from "../core/EntityInspector";
import { Announcer } from "../util/Announcer";

/**
 * 联系人模块。
 */
export class ContactService extends Module {

    /**
     * 联系人模块的模块名。
     * @type {string}
     */
    static NAME = 'Contact';

    /**
     * 构造函数。
     */
    constructor() {
        super('Contact');

        /**
         * 当前有效的在线联系人。
         * @type {Self}
         */
        this.self = null;

        /**
         * 当前联系人是否已设置。
         * @private
         * @type {boolean}
         */
        this.selfReady = false;

        /**
         * 联系人内存缓存。
         * @type {OrderMap<number,Contact>}
         */
        this.contacts = new OrderMap();

        /**
         * 群组内存缓存。
         * @type {OrderMap<number,Contact>}
         */
        this.groups = new OrderMap();

        /**
         * 实体生命周期管理器。
         * @type {EntityInspector}
         */
        this.inspector = new EntityInspector();
        this.inspector.depositMap(this.contacts);
        this.inspector.depositMap(this.groups);

        /**
         * 数据通道监听器。
         * @type {ContactPipelineListener}
         */
        this.pipelineListener = new ContactPipelineListener(this);

        // 数据库配置
        let options = {
            name: 'CubeContact',
            version: 1,
            stores: [{
                name: 'Contacts',
                keyPath: 'id',
                autoIncrement: false,
                isKv: true
            }]
        };
        /**
         * 数据库操作封装。
         */
        this.db = new InDB(options);
        this.storeContact = this.db.use('Contacts');
    }

    /**
     * @inheritdoc
     */
    start() {
        if (!super.start()) {
            return false;
        }

        // 设置域
        Self.DOMAIN = this.getAuthToken().domain;

        this.inspector.start();

        this.pipeline.addListener(ContactService.NAME, this.pipelineListener);

        return true;
    }

    /**
     * @inheritdoc
     */
    stop() {
        super.stop();

        this.pipeline.removeListener(ContactService.NAME, this.pipelineListener);

        this.inspector.stop();
    }

    /**
     * 签入当前终端的联系人。
     * @param {Self|number|string} self 指定 {@linkcode Self} 对象或者自己的联系人 ID 。
     * @returns {boolean} 设置成功返回 {@linkcode true} ，否则返回 {@linkcode false} 。
     */
    signIn(self) {
        if (!this.started) {
            this.start();
        }

        if (self instanceof Self) {
            this.self = self;
            this.self.domain = Self.DOMAIN;
        }
        else {
            this.self = new Self(parseInt(self));
        }

        if (!this.pipeline.isReady()) {
            cell.Logger.w('ContactService', 'Pipeline "' + this.pipeline.getName() + '" is no ready');
            return false;
        }

        let data = {
            "self": this.self.toJSON(),
            "token": this.getAuthToken().toJSON()
        };
        let signInPacket = new Packet(ContactAction.SignIn, data);
        this.pipeline.send(ContactService.NAME, signInPacket);

        return true;
    }

    /**
     * 将当前设置的联系人签出。
     */
    signOut() {
        if (!this.selfReady || null == this.self) {
            return false;
        }

        if (!this.pipeline.isReady()) {
            cell.Logger.w('ContactService', 'Pipeline "' + this.pipeline.getName() + '" is no ready');
            return false;
        }

        let signOutPacket = new Packet(ContactAction.SignOut, this.self.toJSON());
        this.pipeline.send(ContactService.NAME, signOutPacket);
        return true;
    }

    /**
     * 恢复连接状态。
     */
    comeback() {
        if (null == this.self) {
            return;
        }

        let packet = new Packet(ContactAction.Comeback, this.self.toJSON());
        this.pipeline.send(ContactService.NAME, packet, (pipeline, source, responsePacket) => {
            if (null != responsePacket && responsePacket.getStateCode() == StateCode.OK) {
                if (responsePacket.data.code == 0) {
                    cell.Logger.d('ContactService', 'Self comeback OK');
                }
            }
        });
    }

    /**
     * 获取当前的 {@linkcode Self} 实例。
     * @returns {Self} 返回当前的 {@linkcode Self} 实例。
     */
    getSelf() {
        return this.self;
    }

    /**
     * 触发用户签入事件。
     * @protected
     * @param {object} payload 来自服务器数据。
     */
    triggerSignIn(payload) {
        if (payload.code != 0) {
            cell.Logger.e('ContactService', 'SignIn failed: ' + payload.code);
            return;
        }

        let data = payload.data;

        if (null == this.self) {
            this.self = new Self(data["id"]);
        }

        cell.Logger.d('ContactService', 'Trigger SignIn: ' + this.self.getId());

        this.self.name = data["name"];
        let devices = data["devices"];
        for (let i = 0; i < devices.length; ++i) {
            this.self.devices[i] = Device.create(devices[i]);
        }

        if (data["context"] !== undefined) {
            this.self.ctx = data["context"];
        }

        // 更新状态
        this.selfReady = true;

        this.nodifyObservers(new ObservableState(ContactEvent.SignIn, this.self));
    }

    /**
     * 获取指定 ID 的联系人信息。
     * @param {number} id 指定联系人 ID 。
     * @param {function} handleSuccess 成功获取到数据回调该方法。
     * @param {function} [handleError] 操作失败回调该方法。
     */
    getContact(id, handleSuccess, handleError) {
        if (typeof id === 'string') {
            id = parseInt(id);
        }

        let promise = new Promise((resolve, reject) => {
            // 从缓存读取
            let contact = this.contacts.get(id);

            // TODO 从数据库读取

            if (null == contact) {
                let packet = new Packet(ContactAction.GetContact, {
                    "id": id,
                    "domain": Self.DOMAIN
                });
                this.pipeline.send(ContactService.NAME, packet, (pipeline, source, responsePacket) => {
                    if (null != responsePacket) {
                        if (responsePacket.getStateCode() == StateCode.OK && responsePacket.data.code == 0) {
                            contact = Contact.create(responsePacket.data.data);
                            this.contacts.put(contact.getId(), contact);
                            resolve(contact);
                        }
                        else {
                            reject();
                        }
                    }
                    else {
                        reject();
                    }
                });
            }
            else {
                resolve(contact);
            }
        });

        if (handleSuccess && handleError) {
            promise.then((contact) => {
                handleSuccess(contact);
            }).catch(() => {
                handleError();
            });
        }
        else if (handleSuccess) {
            promise.then((contact) => {
                handleSuccess(contact);
            }).catch(() => {
                handleSuccess(null);
            });
        }
        else {
            return promise;
        }
    }

    /**
     * 获取指定 ID 列表里的联系人信息。
     * @protected
     * @param {Array} idList 
     * @param {function} handleSuccess 
     * @param {function} handleError 
     */
    getContactList(idList, handleSuccess, handleError) {
        if (typeof id === 'string') {
            id = parseInt(id);
        }

        let promise = new Promise((resolve, reject) => {
            let packet = new Packet(ContactAction.GetContactList, {
                "list": idList,
                "domain": Self.DOMAIN
            });
            this.pipeline.send(ContactService.NAME, packet, (pipeline, source, responsePacket) => {
                if (null != responsePacket) {
                    if (responsePacket.getStateCode() == StateCode.OK && responsePacket.data.code == 0) {
                        let list = responsePacket.data.data.list;
                        let contactList = [];

                        for (let i = 0; i < list.length; ++i) {
                            let contact = Contact.create(list[i]);
                            contactList.push(contact);

                            this.contacts.put(contact.getId(), contact);
                        }

                        resolve(contactList);
                    }
                    else {
                        reject();
                    }
                }
                else {
                    reject();
                }
            });
        });

        if (handleSuccess && handleError) {
            promise.then((contactList) => {
                handleSuccess(contactList);
            }).catch(() => {
                handleError();
            });
        }
        else if (handleSuccess) {
            promise.then((contactList) => {
                handleSuccess(contactList);
            }).catch(() => {
                handleSuccess(null);
            });
        }
        else {
            return promise;
        }
    }

    /**
     * 获取指定 ID 的群组信息。
     * @param {number} id 指定群组 ID 。
     * @param {function} handleSuccess 成功获取到数据回调该方法。
     * @param {function} [handleError] 操作失败回调该方法。
     */
    getGroup(id, handleSuccess, handleError) {
        if (typeof id === 'string') {
            id = parseInt(id);
        }

        let promise = new Promise((resolve, reject) => {
            // 从缓存读取
            let group = this.groups.get(id);

            // TODO 从数据库读取

            if (null == group) {
                let packet = new Packet(ContactAction.GetGroup, {
                    "id": id,
                    "domain": Self.DOMAIN
                });
                this.pipeline.send(ContactService.NAME, packet, (pipeline, source, responsePacket) => {
                    if (null != responsePacket) {
                        if (responsePacket.getStateCode() == StateCode.OK && responsePacket.data.code == 0) {
                            Group.create(this, responsePacket.data.data, (result) => {
                                if (null == result) {
                                    // 创建失败
                                    reject();
                                    return;
                                }

                                group = result;
                                this.groups.put(group.getId(), group);
                                resolve(group);
                            });
                        }
                        else {
                            reject();
                        }
                    }
                    else {
                        reject();
                    }
                });
            }
            else {
                resolve(group);
            }
        });

        if (handleSuccess && handleError) {
            promise.then((group) => {
                handleSuccess(group);
            }).catch(() => {
                handleError();
            });
        }
        else if (handleSuccess) {
            promise.then((group) => {
                handleSuccess(group);
            }).catch(() => {
                handleSuccess(null);
            });
        }
        else {
            return promise;
        }
    }

    listGroups(output, handleSuccess, handleError) {
        
    }

    /**
     * 创建群组。
     * @param {string} name 指定群组名。
     * @param {Array} members 指定初始成员列表。
     * @param {function} handleSuccess 成功创建群组回调该方法。
     * @param {function} handleError 操作失败回调该方法。
     */
    createGroup(name, members, handleSuccess, handleError) {
        let owner = this.self;
        let group = new Group(owner);
        group.setName(name);
        group.setMembers(members);
        group.service = this;

        let packet = new Packet(ContactAction.CreateGroup, group.toJSON());
        this.pipeline.send(ContactService.NAME, packet, (pipeline, source, responsePacket) => {
            if (null == responsePacket || responsePacket.getStateCode() != StateCode.OK) {
                handleError();
                return;
            }

            // 设置 ID
            group.id = responsePacket.data.data.id;
            this.groups.put(group.getId(), group);
            handleSuccess(group);
        });
    }

    /**
     * 解散指定的群组。
     * @param {Group} group 指定待解散的群组。
     * @param {function} [handleSuccess] 操作成功回调该方法。
     * @param {function} [handleError] 操作失败回调该方法。
     */
    dissolveGroup(group, handleSuccess, handleError) {
        if (group.getOwner().getId() != this.self.getId()) {
            // 群组的所有者不是自己，不能解散
            handleError();
            return;
        }

        let packet = new Packet(ContactAction.DissolveGroup, { "groupId": group.getId() });
        this.pipeline.send(ContactService.NAME, packet, (pipeline, source, responsePacket) => {
            if (null == responsePacket || responsePacket.getStateCode() != StateCode.OK) {
                if (handleError) {
                    handleError();
                }
                return;
            }

            this.groups.remove(group.getId());
            if (handleSuccess) {
                handleSuccess(group);
            }
        });
    }

    /**
     * 退出指定的群组。
     * @param {Group} group 
     * @param {function} handleSuccess 操作成功回调该方法。
     * @param {function} handleError 操作失败回调该方法。
     */
    quitGroup(group, handleSuccess, handleError) {
        let selfId = this.self.getId();
        if (!group.hasMember(this.self)) {
            handleError();
            return;
        }

        if (group.getOwner().getId() == selfId) {
            handleError();
            return;
        }

        let packet = new Packet(ContactAction.QuitGroup, {
            "groupId": group.getId(),
            "memberId": selfId
        });
        this.pipeline.send(ContactService.NAME, packet, (pipeline, source, responsePacket) => {
            if (null == responsePacket || responsePacket.getStateCode() != StateCode.OK) {
                handleError();
                return;
            }

            let index = group.memberIdList.indexOf(this.self.getId());
            if (index >= 0) {
                group.memberIdList.splice(index, 1);
            }

            handleSuccess(group);
        });
    }

    changeGroupOwner(group, newOwner) {
        let packet = new Packet(ContactAction.ChangeOwner, {
            "groupId" : group.getId(),
            "newOwnerId" : newOwner.getId()
        });

    }

    /**
     * 添加群组成员。
     * @param {Group} group 指定群组。
     * @param {Contact} member 指定群组成员。
     * @param {function} handler 指定处理回调。
     */
    _addGroupMember(group, member, handler) {
        let packet = new Packet(ContactAction.AddGroupMember, {
            "groupId": group.getId(),
            "memberId": member.getId()
        });

        this.pipeline.send(ContactService.NAME, packet, (pipeline, source, responsePacket) => {
            if (null == responsePacket || responsePacket.getStateCode() != StateCode.OK) {
                handler(null);
                return;
            }

            handler(group);
        });
    }

    /**
     * 移除群组成员。
     * @param {Group} group 指定群组。
     * @param {Contact} member 指定群组成员。
     * @param {function} handler 指定处理回调。
     */
    _removeGroupMember(group, member, handler) {
        let packet = new Packet(ContactAction.RemoveGroupMember, {
            "groupId": group.getId(),
            "memberId": member.getId()
        });

        this.pipeline.send(ContactService.NAME, packet, (pipeline, source, responsePacket) => {
            if (null == responsePacket || responsePacket.getStateCode() != StateCode.OK) {
                handler(null);
                return;
            }

            handler(group);
        });
    }

    /**
     * 收到 Invited 数据。
     * @protected
     * @param {JSON} payload 
     */
    triggerInviteMember(payload) {
        Group.create(this, payload.data, (result) => {
            if (null == result) {
                // 创建失败
                return;
            }

            let group = result;
            this.groups.put(group.getId(), group);

            let state = new ObservableState(ContactEvent.Invited, group);
            this.nodifyObservers(state);
        });
    }

    /**
     * 收到 Group Dissolved 数据。
     * @param {JSON} payload 
     */
    triggerDissolveGroup(payload) {
        Group.create(this, payload.data, (result) => {
            if (null == result) {
                // 创建失败
                return;
            }

            // 解散的群组
            let group = result;

            let state = new ObservableState(ContactEvent.GroupDissolved, group);
            this.nodifyObservers(state);
        });
    }

    triggerChangeOwner(payload) {
        let groupId = payload.data.groupId;
        let newOwnerId = payload.data.newOwnerId;
    }

    triggerAddMember(payload) {
        let groupJson = payload.data.group;
        let memberId = payload.data.memberId;

        let announcer = new Announcer(2, 10000);
        announcer.addAudience((count, map) => {
            let state = new ObservableState(ContactEvent.GroupMemberAdded, {
                group: map.get('group'),
                member: map.get('member')
            });
            this.nodifyObservers(state);
        });

        Group.create(this, groupJson, (result) => {
            if (null == result) {
                // 创建失败
                return;
            }

            announcer.announce('group', result);
        });

        this.getContact(memberId, (contact) => {
            announcer.announce('member', contact);
        });
    }

    triggerRemoveMember(payload) {
        let groupJson = payload.data.group;
        let memberId = payload.data.memberId;

        let announcer = new Announcer(2, 10000);
        announcer.addAudience((count, map) => {
            let state = new ObservableState(ContactEvent.GroupMemberRemoved, {
                group: map.get('group'),
                member: map.get('member')
            });
            this.nodifyObservers(state);
        });

        Group.create(this, groupJson, (result) => {
            if (null == result) {
                // 创建失败
                return;
            }

            announcer.announce('group', result);
        });

        this.getContact(memberId, (contact) => {
            announcer.announce('member', contact);
        });
    }
}
