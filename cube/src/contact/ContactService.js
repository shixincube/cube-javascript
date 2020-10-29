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
import { OrderMap } from "../util/OrderMap";
import { Module } from "../core/Module";
import { Packet } from "../core/Packet";
import { StateCode } from "../core/StateCode";
import { AuthService } from "../auth/AuthService";
import { ContactPipelineListener } from "./ContactPipelineListener";
import { Self } from "./Self";
import { ObservableState } from "../core/ObservableState";
import { Contact } from "./Contact";
import { ContactAction } from "./ContactAction";
import { ContactEvent } from "./ContactEvent";
import { ContactStorage } from "./ContactStorage";
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

        /**
         * 联系人存储器。
         * @type {ContactStorage}
         */
        this.storage = new ContactStorage(this);

        /**
         * List Groups 操作的上下文。
         * @type {function}
         */
        this.listGroupsContext = null;
    }

    /**
     * @inheritdoc
     */
    start() {
        if (!super.start()) {
            return false;
        }

        // 开启存储器
        this.storage.open(AuthService.DOMAIN);

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

        // 关闭存储器
        this.storage.close();
    }

    /**
     * 获取当前的 {@linkcode Self} 实例。
     * @returns {Self} 返回当前的 {@linkcode Self} 实例。
     */
    getSelf() {
        return this.self;
    }

    /**
     * 当前终端是否已在服务器上签入。
     * @returns {boolean} 如果当前终端已签入，返回 {@linkcode true} ，否则返回 {@linkcode false} 。
     */
    hasSignedIn() {
        return this.selfReady;
    }

    /**
     * 签入当前终端的联系人。
     * @param {Self|number|string} self 指定 {@linkcode Self} 对象或者自己的联系人 ID 。
     * @param {string} [name] 指定名称/昵称。
     * @param {object} [context] 指定关联的上下文。
     * @returns {boolean} 设置成功返回 {@linkcode true} ，否则返回 {@linkcode false} 。
     */
    signIn(self, name, context) {
        if (!this.started) {
            this.start();
        }

        if (self instanceof Self) {
            this.self = self;
            this.self.domain = AuthService.DOMAIN;
        }
        else {
            this.self = new Self(parseInt(self));
        }

        if (undefined !== name) {
            this.self.setName(name);
        }
        if (undefined !== context) {
            this.self.setContext(context);
        }

        if (!this.pipeline.isReady()) {
            cell.Logger.w('ContactService', 'Pipeline "' + this.pipeline.getName() + '" is no ready');
            return false;
        }

        // 激活令牌
        let token = this.kernel.activeToken(this.self.getId());
        if (null == token) {
            cell.Logger.w('ContactService', 'Error auth token');
            return false;
        }

        let data = {
            "self": this.self.toJSON(),
            "token": token.toJSON()
        };
        let signInPacket = new Packet(ContactAction.SignIn, data);
        this.pipeline.send(ContactService.NAME, signInPacket);

        return true;
    }

    /**
     * 将当前设置的联系人签出。
     * @param {function} [handler] 当签出成功时回调该函数。
     */
    signOut(handler) {
        if (!this.selfReady || null == this.self) {
            return false;
        }

        if (!this.pipeline.isReady()) {
            cell.Logger.w('ContactService', 'Pipeline "' + this.pipeline.getName() + '" is no ready');
            return false;
        }

        let current = this.self;

        let signOutPacket = new Packet(ContactAction.SignOut, this.self.toJSON());
        this.pipeline.send(ContactService.NAME, signOutPacket, (undefined !== handler) ? (pipeline, source, responsePacket) => {
            if (null != responsePacket && responsePacket.getStateCode() == StateCode.OK) {
                if (responsePacket.data.code == 0) {
                    handler(current);
                }
            }
        } : undefined);
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
                    this.nodifyObservers(new ObservableState(ContactEvent.Comeback, this.self));
                }
            }
        });
    }

    /**
     * 触发联系人签入事件。
     * @protected
     * @param {object} payload 来自服务器数据。
     */
    triggerSignIn(payload) {
        if (payload.code != 0) {
            cell.Logger.e('ContactService', 'SignIn failed: ' + payload.code);
            return;
        }

        // 更新群组
        let now = Date.now();
        this.listGroups(now - this.defaultRetrospect, now, (groupList) => {
            cell.Logger.i('ContactService', 'List groups number: ' + groupList.length);
        });

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
            this.self.setContext(data["context"]);
        }

        // 更新状态
        this.selfReady = true;

        this.nodifyObservers(new ObservableState(ContactEvent.SignIn, this.self));
    }

    /**
     * 触发联系人签出事件。
     * @protected
     * @param {object} payload 来自服务器数据。
     */
    triggerSignOut(payload) {
        if (payload.code != 0) {
            cell.Logger.e('ContactService', 'SignOut failed: ' + payload.code);
            return;
        }

        cell.Logger.d('ContactService', 'Trigger SignOut: ' + this.self.getId());

        let current = this.self;

        this.self = null;
        this.selfReady = false;

        this.nodifyObservers(new ObservableState(ContactEvent.SignOut, current));
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
                    "domain": AuthService.DOMAIN
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
        let promise = new Promise((resolve, reject) => {
            let packet = new Packet(ContactAction.GetContactList, {
                "list": idList,
                "domain": AuthService.DOMAIN
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

            // 从存储库读取
            if (null != group) {
                resolve(group);
                return;
            }

            this.storage.readGroup(id, (group) => {
                if (null != group) {
                    resolve(group);
                    return;
                }

                // 从服务器上读取
                let packet = new Packet(ContactAction.GetGroup, {
                    "id": id,
                    "domain": AuthService.DOMAIN
                });
                this.pipeline.send(ContactService.NAME, packet, (pipeline, source, responsePacket) => {
                    if (null != responsePacket) {
                        if (responsePacket.getStateCode() == StateCode.OK && responsePacket.data.code == 0) {
                            let group = Group.create(this, responsePacket.data.data);
                            // 写入缓存
                            this.groups.put(group.getId(), group);
                            // 写入存储
                            this.storage.writeGroup(group);

                            resolve(group);
                        }
                        else {
                            reject(id);
                        }
                    }
                    else {
                        reject(id);
                    }
                });
            });
        });

        if (handleSuccess && handleError) {
            promise.then((group) => {
                handleSuccess(group);
            }).catch(() => {
                handleError(id);
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

    /**
     * 按照活跃时间从大到小排序群组。
     * @private
     * @param {Group} groupA 
     * @param {Group} groupB 
     */
    sortGroup(groupA, groupB) {
        var lastActiveA = groupA.lastActiveTime;
        var lastActiveB = groupB.lastActiveTime;
        if (lastActiveA < lastActiveB) {
            return 1;
        }
        else if (lastActiveA > lastActiveB) {
            return -1;
        }
        else {
            return 0;
        }
    }

    /**
     * 查询指定活跃时间范围内的群组。
     * @param {number} [beginning] 指定查询群的起始的最近一次活跃时间戳。
     * @param {number} [ending] 指定查询群的截止的最近一次活跃时间戳。
     * @param {function} handler 查询回调函数，函数参数：({@linkcode list}:Array<{@link Group}>) 。
     * @param {boolean|number} [filter] 是否过滤已失效的群组。
     */
    queryGroups(beginning, ending, handler, filter) {
        if (typeof beginning === 'function') {
            handler = beginning;
            beginning = 0;
            ending = Date.now();
        }
        else if (typeof ending === 'function') {
            handler = ending;
            ending = Date.now();
        }

        if (undefined === filter) {
            filter = false;
        }

        this.storage.readGroups(beginning, ending, (beginning, ending, result) => {
            let list = result.sort((a, b) => {
                return this.sortGroup(a, b);
            });
            handler(list);
        });
    }

    /**
     * 获取当前联系人所在的所有群。
     * @param {number} [beginning] 指定查询群的起始的最近一次活跃时间戳。
     * @param {number} [ending] 指定查询群的截止的最近一次活跃时间戳。
     * @param {function} handler 获取到数据后的回调函数，函数参数：({@linkcode list}:Array<{@link Group}>) 。
     */
    listGroups(beginning, ending, handler) {
        if (undefined === beginning || null != this.listGroupsContext) {
            return false;
        }

        if (typeof beginning === 'function') {
            handler = beginning;
            beginning = 0;
            ending = 0;
        }
        else if (typeof ending === 'function') {
            handler = ending;
            ending = Date.now();
        }

        if (beginning > ending) {
            return false;
        }

        this.listGroupsContext = {
            total: -1,
            list: [],
            timer: 0,
            handler: handler
        };

        this.listGroupsContext.timer = setTimeout(() => {
            clearTimeout(this.listGroupsContext.timer);
            this.listGroupsContext.handler([]);
            this.listGroupsContext = null;
        }, 10000);

        let packet = new Packet(ContactAction.ListGroups, {
            "beginning": beginning,
            "ending": ending
        });
        this.pipeline.send(ContactService.NAME, packet);

        return true;
    }

    /**
     * 处理接收到的 List Groups 数据。
     * @param {JSON} paylaod 
     */
    triggerListGroups(paylaod) {
        let data = paylaod.data;
        let list = data.list;
        let total = data.total;

        if (this.listGroupsContext.total < 0) {
            this.listGroupsContext.total = total;
        }

        for (let i = 0; i < list.length; ++i) {
            let group = Group.create(this, list[i]);

            if (group.getOwner().equals(this.self)) {
                group.owner = this.self;
            }

            // 保存在内存
            this.groups.put(group.getId(), group);

            this.storage.containsGroup(group.getId(), (id, existed) => {
                // 保存到存储
                this.storage.writeGroup(this.groups.get(id));

                if (!existed) {
                    // 进行事件通知
                    this.nodifyObservers(new ObservableState(ContactEvent.GroupUpdated, this.groups.get(id)));
                }
            });

            this.listGroupsContext.list.push(group);
        }

        if (this.listGroupsContext.list.length == total) {
            clearTimeout(this.listGroupsContext.timer);

            this.listGroupsContext.handler(this.listGroupsContext.list);
            this.listGroupsContext = null;
        }
    }

    /**
     * 创建群组。
     * @param {string} name 指定群组名。
     * @param {Array<number|Contact>} members 指定初始成员列表或者初始成员 ID 列表。
     * @param {function} handleSuccess 成功创建群组回调该方法。参数：({@linkcode group}:{@link Group}) ，创建成功的群组实例。
     * @param {function} [handleError] 操作失败回调该方法。函数参数：({@linkcode groupId}:number, {@linkcode groupName}:number) ，创建失败的群组预 ID 和群名称。
     * @returns {number} 返回待创建群组的创建预 ID ，如果返回 {@linkcode 0} 则表示参数错误。
     */
    createGroup(name, members, handleSuccess, handleError) {
        if (name.length == 0 || null == members) {
            return 0;
        }

        let owner = this.self;
        let group = new Group(this, owner);
        group.setName(name);

        let memberList = [];
        for (let i = 0; i < members.length; ++i) {
            let member = members[i];
            if (member instanceof Contact) {
                memberList.push(member.toCompactJSON());
            }
            else if (typeof member === 'number') {
                memberList.push({
                    "id": member,
                    "name": 'Cube-' + member
                });
            }
            else if (typeof member === 'string') {
                memberList.push({
                    "id": parseInt(member),
                    "name": 'Cube-' + member
                });
            }
            else if (undefined !== member.id && undefined !== member.name) {
                memberList.push({
                    "id": parseInt(member.id),
                    "name": member.name
                });
            }
        }

        let payload = {
            group: group.toJSON(),
            members: memberList
        };
        let packet = new Packet(ContactAction.CreateGroup, payload);
        this.pipeline.send(ContactService.NAME, packet, (pipeline, source, responsePacket) => {
            if (null == responsePacket) {
                cell.Logger.w('ContactService', 'Create group failed: response packet is null');
                if (handleError) {
                    handleError(group.getId(), group.getName());
                }
                return;
            }

            if (responsePacket.getStateCode() != StateCode.OK) {
                cell.Logger.w('ContactService', 'Create group failed: ' + responsePacket.getStateCode());
                if (handleError) {
                    handleError(group.getId(), group.getName());
                }
                return;
            }

            if (responsePacket.getPayload().code != 0) {
                cell.Logger.w('ContactService', 'Create group failed, state code: ' + responsePacket.getPayload().code);
                if (handleError) {
                    handleError(group.getId(), group.getName());
                }
                return;
            }

            // 解析返回的数据
            let data = responsePacket.getPayload().data;
            let newGroup = Group.create(this, data, owner);
            // 保存在内存
            this.groups.put(newGroup.getId(), newGroup);

            // 保存到存储
            this.storage.writeGroup(newGroup);

            handleSuccess(newGroup);
        });

        return group.getId();
    }

    /**
     * 处理接收到创建群数据。
     * @param {JSON} payload 数据包数据。
     */
    triggerCreateGroup(payload) {
        if (payload.code != 0) {
            return;
        }

        let group = Group.create(this, payload.data);
        if (group.getOwner().equals(this.self)) {
            // 本终端创建的群
            group = this.groups.get(group.getId());
        }
        else {
            let members = group.getMembers();
            for (let i = 0; i < members.length; ++i) {
                let member = members[i];
                if (member.equals(this.self)) {
                    members[i] = this.self;
                    break;
                }
            }

            // 其他终端创建的群，本终端被邀请进入
            this.groups.put(group.getId(), group);
            // 写入存储
            this.storage.writeGroup(group);
        }

        this.nodifyObservers(new ObservableState(ContactEvent.GroupCreated, group));
    }

    /**
     * 解散指定的群组。
     * @param {Group} group 指定待解散的群组。
     * @param {function} [handleSuccess] 操作成功回调该方法，函数参数：({@linkcode group}:{@link Group}) ，解散成功的群组实例。
     * @param {function} [handleError] 操作失败回调该方法，函数参数：({@linkcode group}:{@link Group}) ，解散失败的群组实例。
     * @returns {boolean} 返回该群是否允许由当前联系人解散。
     */
    dissolveGroup(group, handleSuccess, handleError) {
        if (group.getOwner().getId() != this.self.getId()) {
            // 群组的所有者不是自己，不能解散
            if (handleError) {
                handleError(group);
            }
            return false;
        }

        let packet = new Packet(ContactAction.DissolveGroup, group.toCompactJSON());
        this.pipeline.send(ContactService.NAME, packet, (pipeline, source, responsePacket) => {
            if (null == responsePacket || responsePacket.getStateCode() != StateCode.OK) {
                cell.Logger.w('ContactService', 'Dissolve group failed');
                if (handleError) {
                    handleError(group);
                }
                return;
            }

            if (responsePacket.getPayload().code != 0) {
                cell.Logger.w('ContactService', 'Dissolve group failed, state code: ' + responsePacket.getPayload().code);
                if (handleError) {
                    handleError(group);
                }
                return;
            }

            let updatedGroup = Group.create(this, responsePacket.getPayload().data, this.self);

            // 更新存储
            this.storage.writeGroup(updatedGroup);

            // 更新内存
            this.groups.put(updatedGroup.getId(), updatedGroup);

            if (handleSuccess) {
                handleSuccess(updatedGroup);
            }
        });

        return true;
    }

    /**
     * 处理接收到解散群数据。
     * @param {JSON} payload 数据包数据。
     */
    triggerDissolveGroup(payload) {
        if (payload.code != 0) {
            return;
        }

        let group = Group.create(this, payload.data);
        if (group.getOwner().equals(this.self)) {
            // 本终端解散的群
            group = this.groups.get(group.getId());
        }
        else {
            // 其他终端解散了该群，更新数据
            this.groups.put(group.getId(), group);

            // 写入存储
            this.storage.writeGroup(group);
        }

        this.nodifyObservers(new ObservableState(ContactEvent.GroupDissolved, group));
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
    addGroupMember(group, member, handler) {
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
    removeGroupMember(group, member, handler) {
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
