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
import { OrderMap } from "../util/OrderMap";
import { ModuleError } from "../core/error/ModuleError";
import { Module } from "../core/Module";
import { Packet } from "../core/Packet";
import { StateCode } from "../core/StateCode";
import { EntityInspector } from "../core/EntityInspector";
import { AuthService } from "../auth/AuthService";
import { ContactPipelineListener } from "./ContactPipelineListener";
import { Self } from "./Self";
import { ObservableEvent } from "../core/ObservableEvent";
import { Contact } from "./Contact";
import { ContactAction } from "./ContactAction";
import { ContactEvent } from "./ContactEvent";
import { ContactStorage } from "./ContactStorage";
import { Device } from "./Device";
import { Group } from "./Group";
import { GroupState } from "./GroupState";
import { GroupBundle } from "./GroupBundle";
import { ContactServiceState } from "./ContactServiceState";

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

        if (null == this.pipeline) {
            return;
        }

        this.pipeline.removeListener(ContactService.NAME, this.pipelineListener);

        this.inspector.stop();

        // 关闭存储器
        this.storage.close();
    }

    /**
     * 获取当前的 {@link Self} 实例。
     * @returns {Self} 返回当前的 {@link Self} 实例。
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
     * @param {Self|number|string} self 指定 {@link Self} 对象或者自己的联系人 ID 。
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
            cell.Logger.d('ContactService', 'Pipeline "' + this.pipeline.getName() + '" is no ready');
            return false;
        }

        // 激活令牌
        (async ()=> {
            let token = await this.kernel.activeToken(this.self.getId());
            if (null == token) {
                cell.Logger.w('ContactService', 'Error auth token');
                return;
            }

            let data = {
                "self": this.self.toJSON(),
                "token": token.toJSON()
            };
            let signInPacket = new Packet(ContactAction.SignIn, data);
            this.pipeline.send(ContactService.NAME, signInPacket);
        })();

        return true;
    }

    /**
     * 将当前设置的联系人签出。
     * @param {function} [handler] 当签出成功时回调该函数，参数：({@linkcode self}:{@link Self}) 。
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
                    this.notifyObservers(new ObservableEvent(ContactEvent.Comeback, this.self));
                }
            }
        });
    }

    /**
     * 触发联系人签入。
     * @private
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

        this.notifyObservers(new ObservableEvent(ContactEvent.SignIn, this.self));
    }

    /**
     * 触发联系人签出。
     * @private
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

        this.notifyObservers(new ObservableEvent(ContactEvent.SignOut, current));
    }

    /**
     * 获取指定 ID 的联系人信息。
     * @param {number} id 指定联系人 ID 。
     * @param {function} handleSuccess 成功获取到数据回调该方法，参数：({@linkcode contact}:{@link Contact}) ，(联系人实例)。
     * @param {function} [handleFailure] 操作失败回调该方法，参数：({@linkcode error}:{@link ModuleError}) ，(故障信息))。
     */
    getContact(id, handleSuccess, handleFailure) {
        if (typeof id === 'string') {
            id = parseInt(id);
        }

        let promise = new Promise((resolve, reject) => {
            // 从缓存读取
            let contact = this.contacts.get(id);

            if (null == contact) {
                // 从存储读取
                this.storage.readContact(id, (contact) => {
                    if (null != contact) {
                        resolve(contact);
                        return;
                    }

                    let packet = new Packet(ContactAction.GetContact, {
                        "id": id,
                        "domain": AuthService.DOMAIN
                    });
                    this.pipeline.send(ContactService.NAME, packet, (pipeline, source, responsePacket) => {
                        if (null != responsePacket && responsePacket.getStateCode() == StateCode.OK) {
                            if (responsePacket.data.code == ContactServiceState.Ok) {
                                contact = Contact.create(responsePacket.data.data);
                                // 保存到内存
                                this.contacts.put(contact.getId(), contact);
                                // 更新存储
                                this.storage.writeContact(contact);

                                resolve(contact);
                            }
                            else {
                                reject(new ModuleError(ContactService.NAME, responsePacket.data.code, id));
                            }
                        }
                        else {
                            reject(new ModuleError(ContactService.NAME, ContactServiceState.ServerError, id));
                        }
                    });
                });
            }
            else {
                resolve(contact);
            }
        });

        if (handleSuccess && handleFailure) {
            promise.then((contact) => {
                handleSuccess(contact);
            }).catch((error) => {
                handleFailure(error);
            });
        }
        else if (handleSuccess) {
            promise.then((contact) => {
                handleSuccess(contact);
            }).catch(() => {
                // Nothing
            });
        }
        else {
            return promise;
        }
    }

    /**
     * 更新指定 ID 列表里的联系人信息。
     * @protected
     * @param {Array} idList 联系人 ID 列表。
     * @param {function} [handleSuccess] 操作成功回调该方法。
     * @param {function} [handleFailure] 操作失败回调该方法。
     */
    updateContactList(idList, handleSuccess, handleFailure) {
        let promise = new Promise((resolve, reject) => {
            let packet = new Packet(ContactAction.GetContactList, {
                "list": idList,
                "domain": AuthService.DOMAIN
            });
            this.pipeline.send(ContactService.NAME, packet, (pipeline, source, responsePacket) => {
                if (null != responsePacket && responsePacket.getStateCode() == StateCode.OK) {
                    if (responsePacket.data.code == ContactServiceState.Ok) {
                        let list = responsePacket.data.data;
                        let contactList = [];

                        for (let i = 0; i < list.length; ++i) {
                            let contact = Contact.create(list[i]);
                            contactList.push(contact);

                            // 更新到内存
                            this.contacts.put(contact.getId(), contact);

                            // 写入存储
                            this.storage.writeContact(contact);
                        }

                        resolve(contactList);
                    }
                    else {
                        reject(new ModuleError(ContactService.NAME, responsePacket.data.code, idList));
                    }
                }
                else {
                    reject(new ModuleError(ContactService.NAME, ContactServiceState.ServerError, idList));
                }
            });
        });

        if (handleSuccess && handleFailure) {
            promise.then((contactList) => {
                handleSuccess(contactList);
            }).catch((error) => {
                handleFailure(error);
            });
        }
        else if (handleSuccess) {
            promise.then((contactList) => {
                handleSuccess(contactList);
            }).catch(() => {
                // Nothing
            });
        }
        else {
            return promise;
        }
    }

    /**
     * 获取指定 ID 的群组信息。
     * @param {number} id 指定群组 ID 。
     * @param {function} handleSuccess 成功获取到数据回调该方法，参数：({@linkcode group}:{@link Group})，(群组实例)。
     * @param {function} [handleFailure] 操作失败回调该方法，参数：({@linkcode error}:{@link ModuleError}) 。
     */
    getGroup(id, handleSuccess, handleFailure) {
        if (typeof id === 'string') {
            id = parseInt(id);
        }

        let promise = new Promise((resolve, reject) => {
            // 从缓存读取
            let group = this.groups.get(id);
            if (null != group) {
                resolve(group);
                return;
            }

            // 从存储库读取
            this.storage.readGroup(id, (id, group) => {
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
                    if (null != responsePacket && responsePacket.getStateCode() == StateCode.OK) {
                        if (responsePacket.data.code == ContactServiceState.Ok) {
                            let group = Group.create(this, responsePacket.data.data);
                            // 写入缓存
                            this.groups.put(group.getId(), group);
                            // 写入存储
                            this.storage.writeGroup(group);

                            resolve(group);
                        }
                        else {
                            reject(new ModuleError(ContactService.NAME, responsePacket.data.code, id));
                        }
                    }
                    else {
                        reject(new ModuleError(ContactService.NAME, ContactServiceState.ServerError, id));
                    }
                });
            });
        });

        if (handleSuccess && handleFailure) {
            promise.then((group) => {
                handleSuccess(group);
            }).catch((error) => {
                handleFailure(error);
            });
        }
        else if (handleSuccess) {
            promise.then((group) => {
                handleSuccess(group);
            }).catch(() => {
                // Nothing
            });
        }
        else {
            return promise;
        }
    }

    /**
     * 更新群组的活跃时间。
     * @protected
     * @param {number} groupId 群组 ID 。
     * @param {number} timestamp 时间戳。
     */
    updateGroupActiveTime(groupId, timestamp) {
        let group = this.groups.get(groupId);
        if (null != group) {
            if (timestamp > group.lastActiveTime) {
                group.lastActiveTime = timestamp;
            }
        }

        this.storage.readGroup(groupId, (id, group) => {
            if (null != group) {
                if (timestamp > group.lastActiveTime) {
                    group.lastActiveTime = timestamp;

                    // 回写更新
                    this.storage.writeGroup(group);
                }
            }
        });
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
     * @param {Array<number>} [states] 匹配指定状态的群组，群组状态由 {@link GroupState} 描述。
     */
    queryGroups(beginning, ending, handler, states) {
        if (typeof beginning === 'function') {
            handler = beginning;
            states = ending;
            beginning = 0;
            ending = Date.now();
        }
        else if (typeof ending === 'function') {
            handler = ending;
            states = handler;
            ending = Date.now();
        }

        let ret = this.storage.readGroups(beginning, ending, (beginning, ending, result) => {
            let list = result.sort((a, b) => {
                return this.sortGroup(a, b);
            });
            for (let i = 0; i < list.length; ++i) {
                let group = list[i];
                this.groups.put(group.getId(), group);
            }
            handler(list);
        }, states);

        if (!ret) {
            handler([]);
        }
    }

    /**
     * 获取当前联系人所在的所有群。
     * @param {number} [beginning] 指定查询群的起始的最近一次活跃时间戳，单位：毫秒。
     * @param {number} [ending] 指定查询群的截止的最近一次活跃时间戳，单位：毫秒。
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
     * @private
     * @param {JSON} paylaod 
     */
    triggerListGroups(paylaod) {
        let data = paylaod.data;
        let list = data.list;
        let total = data.total;

        if (this.listGroupsContext.total < 0) {
            this.listGroupsContext.total = total;
        }

        let buf = new OrderMap();

        for (let i = 0; i < list.length; ++i) {
            let group = Group.create(this, list[i]);

            buf.put(group.getId(), group);

            if (group.getOwner().equals(this.self)) {
                group.owner = this.self;
            }

            // 与本地数据进行比较
            this.storage.readGroup(group.getId(), (id, current) => {
                if (null != current) {
                    // 比较两个群的活跃时间
                    if (current.lastActiveTime != group.lastActiveTime) {
                        // 回调更新
                        this.notifyObservers(new ObservableEvent(ContactEvent.GroupUpdated, buf.get(current.getId())));
                    }
                }
                else {
                    let g = buf.get(id);
                    if (g.getState() == GroupState.Normal || g.getState() == GroupState.Dismissed) {
                        this.notifyObservers(new ObservableEvent(ContactEvent.GroupUpdated, g));
                    }
                }

                this.storage.writeGroup(buf.get(id));
            });

            // 更新内存
            if (group.getState() == GroupState.Normal) {
                this.groups.put(group.getId(), group);
            }

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
     * @param {function} [handleFailure] 操作失败回调该方法。函数参数：({@linkcode error}:{@link ModuleError}) 。
     * @returns {number} 返回待创建群组的创建预 ID ，如果返回 {@linkcode 0} 则表示参数错误。
     */
    createGroup(name, members, handleSuccess, handleFailure) {
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
                let error = new ModuleError(ContactService.NAME, ContactServiceState.Failure, group);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            if (responsePacket.getStateCode() != StateCode.OK) {
                cell.Logger.w('ContactService', 'Create group failed: ' + responsePacket.getStateCode());
                let error = new ModuleError(ContactService.NAME, ContactServiceState.ServerError, group);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            if (responsePacket.getPayload().code != ContactServiceState.Ok) {
                cell.Logger.w('ContactService', 'Create group failed, state code: ' + responsePacket.getPayload().code);
                let error = new ModuleError(ContactService.NAME, responsePacket.getPayload().code, group);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            // 解析返回的数据
            let data = responsePacket.getPayload().data;
            let newGroup = Group.create(this, data, owner);
            // 设置上下文
            responsePacket.context = newGroup;

            // 保存到内存
            this.groups.put(newGroup.getId(), newGroup);

            // 保存到存储
            this.storage.writeGroup(newGroup);

            handleSuccess(newGroup);
        });

        return group.getId();
    }

    /**
     * 处理接收到创建群数据。
     * @private
     * @param {JSON} payload 数据包数据。
     * @param {object} context 数据包携带的上下文。
     */
    triggerCreateGroup(payload, context) {
        if (payload.code != 0) {
            return;
        }

        let group = (null == context) ? Group.create(this, payload.data) : context;

        if (group.getOwner().equals(this.self)) {
            // 本终端创建的群
            let cachedGroup = this.groups.get(group.getId());
            if (null == cachedGroup) {
                // 缓存到内存
                this.groups.put(group.getId(), group);
                // 保存到存储
                this.storage.writeGroup(group);
            }
            else {
                group = cachedGroup;
            }
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

        this.notifyObservers(new ObservableEvent(ContactEvent.GroupCreated, group));
    }

    /**
     * 解散指定的群组。
     * @param {Group} group 指定待解散的群组。
     * @param {function} [handleSuccess] 操作成功回调该方法，函数参数：({@linkcode group}:{@link Group}) ，解散成功的群组实例。
     * @param {function} [handleFailure] 操作失败回调该方法，函数参数：({@linkcode error}:{@link ModuleError}) 。
     * @returns {boolean} 返回该群是否允许由当前联系人解散。
     */
    dissolveGroup(group, handleSuccess, handleFailure) {
        if (group.getOwner().getId() != this.self.getId()) {
            // 群组的所有者不是自己，不能解散
            let error = new ModuleError(ContactService.NAME, ContactServiceState.NotAllowed, group);
            if (handleFailure) {
                handleFailure(error);
            }
            return false;
        }

        let packet = new Packet(ContactAction.DissolveGroup, group.toCompactJSON());
        this.pipeline.send(ContactService.NAME, packet, (pipeline, source, responsePacket) => {
            if (null == responsePacket || responsePacket.getStateCode() != StateCode.OK) {
                let error = new ModuleError(ContactService.NAME, ContactServiceState.ServerError, group);
                cell.Logger.w('ContactService', 'Dissolve group failed - ' + error);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            if (responsePacket.getPayload().code != ContactServiceState.Ok) {
                let error = new ModuleError(ContactService.NAME, responsePacket.getPayload().code, group);
                cell.Logger.w('ContactService', 'Dissolve group failed - ' + error);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            let updatedGroup = Group.create(this, responsePacket.getPayload().data, this.self);
            // 设置上下文
            responsePacket.context = updatedGroup;

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
     * @private
     * @param {JSON} payload 数据包数据。
     * @param {object} context 数据包携带的上下文。
     */
    triggerDissolveGroup(payload, context) {
        if (payload.code != 0) {
            return;
        }

        let group = (null == context) ? Group.create(this, payload.data) : context;

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

        this.notifyObservers(new ObservableEvent(ContactEvent.GroupDissolved, group));
    }

    /**
     * 退出指定的群组。
     * @param {Group} group 指定群组。
     * @param {function} [handleSuccess] 操作成功回调该方法，参数：({@linkcode group}:{@link Group}) 。
     * @param {function} [handleFailure] 操作失败回调该方法，参数：({@linkcode error}:{@link ModuleError}) 。
     * @returns {boolean} 返回是否能执行退出操作。
     */
    quitGroup(group, handleSuccess, handleFailure) {
        let selfId = this.self.getId();
        if (!group.hasMember(this.self)) {
            // 非群组成员
            let error = new ModuleError(ContactService.NAME, ContactServiceState.NotAllowed, group);
            if (handleFailure) {
                handleFailure(error);
            }
            return false;
        }

        if (group.getOwner().getId() == selfId) {
            // 群所有者不能退出
            let error = new ModuleError(ContactService.NAME, ContactServiceState.NotAllowed, group);
            if (handleFailure) {
                handleFailure(error);
            }
            return false;
        }

        // 操作员是本账号
        let operator = this.self.toCompactJSON();

        let packet = new Packet(ContactAction.RemoveGroupMember, {
            "groupId": group.getId(),
            "memberIdList": [ selfId ],
            "operator": operator
        });
        this.pipeline.send(ContactService.NAME, packet, (pipeline, source, responsePacket) => {
            if (null == responsePacket || responsePacket.getStateCode() != StateCode.OK) {
                let error = new ModuleError(ContactService.NAME, ContactServiceState.ServerError, group);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            if (responsePacket.getPayload().code != ContactServiceState.Ok) {
                let error = new ModuleError(ContactService.NAME, responsePacket.getPayload().code, group);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            // 读取数据
            let bundle = GroupBundle.create(this, responsePacket.getPayload().data);

            if (bundle.includeSelf) {
                // [TIP] 更新群组状态，这个状态位需要客户端进行维护
                bundle.group.state = GroupState.Disabled;
                // [TIP] 更新实例
                group.state = GroupState.Disabled;
            }

            // 更新实例
            let modified = bundle.modified;
            for (let i = 0; i < modified.length; ++i) {
                group._removeMember(modified[i]);
            }

            // 设置上下文
            responsePacket.context = bundle;

            if (handleSuccess) {
                handleSuccess(bundle.group);
            }
        });

        return true;
    }

    /**
     * 移除群组成员。
     * @param {Group} group 指定群组。
     * @param {Array<Contact|number>} members 指定群组成员列表。
     * @param {function} [handleSuccess] 操作成功回调该方法，参数：({@linkcode group}:{@link Group}, {@linkcode members}:Array, {@linkcode operator}:{@link Contact}) 。
     * @param {function} [handleFailure] 操作失败回调该方法，参数：({@linkcode error}:{@link ModuleError}) 。
     * @returns {boolean} 返回是否能执行该操作。
     */
    removeGroupMembers(group, members, handleSuccess, handleFailure) {
        // 检查传入的成员是否是群成员
        let memberIdList = [];
        // 群主 ID
        let ownerId = group.getOwner().getId();

        for (let i = 0; i < members.length; ++i) {
            let m = members[i];
            if (m instanceof Contact) {
                if (m.getId() == ownerId) {
                    continue;
                }

                if (group.hasMember(m)) {
                    memberIdList.push(m.getId());
                }
            }
            else {
                if (m == ownerId) {
                    continue;
                }

                if (group.hasMember(m)) {
                    memberIdList.push(m);
                }
            }
        }

        if (memberIdList.length == 0) {
            let error = new ModuleError(ContactService.NAME, ContactServiceState.NotAllowed, {
                group: group,
                members: members,
                operator: this.self
            });
            if (handleFailure) {
                handleFailure(error);
            }
            return false;
        }

        // 操作员是本账号
        let operator = this.self;

        let packet = new Packet(ContactAction.RemoveGroupMember, {
            "groupId": group.getId(),
            "memberIdList": memberIdList,
            "operator": operator.toCompactJSON()
        });

        this.pipeline.send(ContactService.NAME, packet, (pipeline, source, responsePacket) => {
            if (null == responsePacket || responsePacket.getStateCode() != StateCode.OK) {
                let error = new ModuleError(ContactService.NAME, ContactServiceState.ServerError, {
                    group: group,
                    members: members,
                    operator: operator
                });
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            if (responsePacket.getPayload().code != ContactServiceState.Ok) {
                let error = new ModuleError(ContactService.NAME, responsePacket.getPayload().code, {
                    group: group,
                    members: members,
                    operator: operator
                });
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            // 读取数据
            let bundle = GroupBundle.create(this, responsePacket.getPayload().data);

            if (bundle.includeSelf) {
                // [TIP] 更新群组状态，这个状态位需要客户端进行维护
                bundle.group.state = GroupState.Disabled;
                // [TIP] 更新实例
                group.state = GroupState.Disabled;
            }

            // 更新实例
            let modified = bundle.modified;
            for (let i = 0; i < modified.length; ++i) {
                group._removeMember(modified[i]);
            }

            // 设置上下文
            responsePacket.context = bundle;

            if (handleSuccess) {
                handleSuccess(bundle.group, bundle.modified, bundle.operator);
            }
        });

        return true;
    }

    /**
     * 接收移除群成员数据。
     * @private
     * @param {JSON} payload 数据包数据。
     * @param {object} context 数据包携带的上下文。
     */
    triggerRemoveMember(payload, context) {
        if (payload.code != 0) {
            return;
        }

        // 读取群信息
        let bundle = (null == context) ? GroupBundle.create(this, payload.data) : context;
        let group = bundle.group;

        if (bundle.includeSelf) {
            // 移除
            this.groups.remove(group.getId());
            // [TIP] 更新群组状态，这个状态位需要客户端进行维护
            group.state = GroupState.Disabled;
        }
        else {
            // 更新
            this.groups.put(group.getId(), group);
        }

        // 更新存储
        this.storage.writeGroup(group);

        this.notifyObservers(new ObservableEvent(ContactEvent.GroupMemberRemoved, {
            group: group,
            modified: bundle.modified,
            operator: bundle.operator
        }));
    }

    /**
     * 添加群组成员。
     * @param {Group} group 指定群组。
     * @param {Array<Contact|number>} members 指定群组成员列表。
     * @param {function} [handleSuccess] 操作成功回调该方法，参数：({@linkcode group}:{@link Group}, {@linkcode members}:Array, {@linkcode operator}:{@link Contact}) 。
     * @param {function} [handleFailure] 操作失败回调该方法，参数：({@linkcode error}:{@link ModuleError}) 。
     * @returns {boolean} 返回是否能执行该操作。
     */
    addGroupMembers(group, members, handleSuccess, handleFailure) {
        // 判读参数是 ID 还是 Contact
        let memberIdList = null;
        let memberList = null;
        if (members[0] instanceof Contact) {
            memberList = [];
        }
        else {
            memberIdList = [];
        }

        // 检查传入的成员是否是群成员，不能进行重复添加
        for (let i = 0; i < members.length; ++i) {
            let m = members[i];
            if (!group.hasMember(m)) {
                if (null != memberList) {
                    memberList.push(m.toCompactJSON());
                }
                else {
                    memberIdList.push(m);
                }
            }
        }

        if (null != memberList && memberList.length == 0) {
            let error = new ModuleError(ContactService.NAME, ContactServiceState.NotAllowed, {
                group: group,
                members: members,
                operator: this.self
            });
            if (handleFailure) {
                handleFailure(error);
            }
            return false;
        }
        else if (null != memberIdList && memberIdList.length == 0) {
            let error = new ModuleError(ContactService.NAME, ContactServiceState.NotAllowed, {
                group: group,
                members: members,
                operator: this.self
            });
            if (handleFailure) {
                handleFailure(error);
            }
            return false;
        }

        // 操作员是本账号
        let operator = this.self;

        let packet = null;
        if (null != memberList) {
            packet = new Packet(ContactAction.AddGroupMember, {
                "groupId": group.getId(),
                "memberList": memberList,
                "operator": operator.toCompactJSON()
            });
        }
        else {
            packet = new Packet(ContactAction.AddGroupMember, {
                "groupId": group.getId(),
                "memberIdList": memberIdList,
                "operator": operator.toCompactJSON()
            });
        }

        this.pipeline.send(ContactService.NAME, packet, (pipeline, source, responsePacket) => {
            if (null == responsePacket || responsePacket.getStateCode() != StateCode.OK) {
                let error = new ModuleError(ContactService.NAME, ContactServiceState.ServerError, {
                    group: group,
                    members: members,
                    operator: operator
                });
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            if (responsePacket.getPayload().code != ContactServiceState.Ok) {
                let error = new ModuleError(ContactService.NAME, ContactServiceState.ServerError, {
                    group: group,
                    members: members,
                    operator: operator
                });
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            // 读取数据
            let bundle = GroupBundle.create(this, responsePacket.getPayload().data);

            // 更新实例
            let modified = bundle.modified;
            for (let i = 0; i < modified.length; ++i) {
                group.memberList.push(modified[i]);
            }

            // 设置上下文
            responsePacket.context = bundle;

            if (handleSuccess) {
                handleSuccess(bundle.group, bundle.modified, bundle.operator);
            }
        });

        return true;
    }

    /**
     * 接收添加群成员数据。
     * @private
     * @param {JSON} payload 数据包数据。
     * @param {object} context 数据包携带的上下文。
     */
    triggerAddMember(payload, context) {
        if (payload.code != 0) {
            return;
        }

        // 读取群信息
        let bundle = (null == context) ? GroupBundle.create(this, payload.data) : context;
        let group = bundle.group;

        // 更新
        this.groups.put(group.getId(), group);

        // 更新存储
        this.storage.writeGroup(group);

        // [TIP] 新加入的人有自己则通知更新事件
        if (bundle.includeSelf) {
            // 回调群更新
            this.notifyObservers(new ObservableEvent(ContactEvent.GroupUpdated, group));
        }
        else {
            this.notifyObservers(new ObservableEvent(ContactEvent.GroupMemberAdded, {
                group: group,
                modified: bundle.modified,
                operator: bundle.operator
            }));
        }
    }

    /**
     * 修改群组信息。
     * @param {Group} group 指定需要修改信息的群组。
     * @param {Contact} owner 指定新的群主。如果不变更群主，此参数填写 {@linkcode null} 值。
     * @param {string} name 指定新的群名称。如果不变更群名称，此参数填写 {@linkcode null} 值。
     * @param {JSON} context 指定新的群附件上下文。如果不变更群上下文，此参数填写 {@linkcode null} 值。
     * @param {function} [handleSuccess] 操作成功回调该方法，参数：({@linkcode group}:{@link Group}) 。
     * @param {function} [handleFailure] 操作失败回调该方法，参数：({@linkcode error}:{@link ModuleError}) 。
     * @returns {boolean} 返回是否能执行该操作。
     */
    modifyGroup(group, owner, name, context, handleSuccess, handleFailure) {
        if (null == owner && null == name && null == context) {
            let error = new ModuleError(ContactService.NAME, ContactServiceState.NotAllowed, group);
            if (handleFailure) {
                handleFailure(error);
            }
            return false;
        }

        let data = {
            groupId: group.getId()
        };

        if (null != owner && owner instanceof Contact) {
            // 新群主不是群成员，不能修改群主
            // 当前联系人不是群主，不能修改群主
            if (group.isOwner(this.self) && group.hasMember(owner)) {
                data.owner = owner.toCompactJSON();
            }
        }

        if (null != name && typeof name === 'string') {
            data.name = name;
        }

        if (null != context) {
            data.context = context;
        }

        let packet = new Packet(ContactAction.ModifyGroup, data);

        this.pipeline.send(ContactService.NAME, packet, (pipeline, source, responsePacket) => {
            if (null == responsePacket || responsePacket.getStateCode() != StateCode.OK) {
                let error = new ModuleError(ContactService.NAME, ContactServiceState.ServerError, group);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            if (responsePacket.getPayload().code != ContactServiceState.Ok) {
                let error = new ModuleError(ContactService.NAME, responsePacket.getPayload().code, group);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            let modifiedGroup = Group.create(this, responsePacket.getPayload().data);

            group.owner = modifiedGroup.owner;
            group.name = modifiedGroup.name;
            group.context = modifiedGroup.context;
            group.lastActiveTime = modifiedGroup.lastActiveTime;

            // 设置上下文
            responsePacket.context = modifiedGroup;

            if (handleSuccess) {
                handleSuccess(group);
            }
        });

        return true;
    }

    /**
     * 接收修改群组数据。
     * @private
     * @param {JSON} payload 数据包数据。
     * @param {object} context 数据包携带的上下文。
     */
    triggerModifyGroup(payload, context) {
        if (payload.code != 0) {
            return;
        }

        let group = (null == context) ? Group.create(this, payload.data) : context;

        this.groups.put(group.getId(), group);

        this.storage.writeGroup(group);

        this.notifyObservers(new ObservableEvent(ContactEvent.GroupUpdated, group));
    }

    /**
     * 修改群成员的信息。
     * @param {Group} group 指定群组。
     * @param {Contact} member 指定修改信息的成员数据。
     * @param {function} [handleSuccess] 操作成功回调该方法，参数：({@linkcode group}:{@link Group}, {@linkcode member}:{@link Contact}) 。
     * @param {function} [handleFailure] 操作错误回调该方法，参数：({@linkcode error}:{@link ModuleError}) 。
     * @returns {boolean} 返回是否能执行该操作。
     */
    modifyGroupMember(group, member, handleSuccess, handleFailure) {
        if (!group.hasMember(member)) {
            let error = new ModuleError(ContactService.NAME, ContactServiceState.NotAllowed, group);
            if (handleFailure) {
                handleFailure(error);
            }
            return false;
        }

        let data = {
            groupId: group.getId(),
            member: member.toCompactJSON()
        };

        let packet = new Packet(ContactAction.ModifyGroupMember, data);

        this.pipeline.send(ContactService.NAME, packet, (pipeline, source, responsePacket) => {
            if (null == responsePacket || responsePacket.getStateCode() != StateCode.OK) {
                let error = new ModuleError(ContactService.NAME, ContactServiceState.ServerError, {
                    group: group,
                    member: member
                });
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            if (responsePacket.getPayload().code != ContactServiceState.Ok) {
                let error = new ModuleError(ContactService.NAME, ContactServiceState.ServerError, {
                    group: group,
                    member: member
                });
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            let bundle = GroupBundle.create(this, responsePacket.getPayload().data);
            // 设置上下文
            responsePacket.context = bundle;

            let modifiedMember = bundle.modified[0];

            group.lastActiveTime = bundle.group.lastActiveTime;
            group._replaceMember(modifiedMember);

            if (handleSuccess) {
                handleSuccess(group, modifiedMember);
            }
        });

        return true;
    }

    /**
     * 接收修改群成员数据。
     * @private
     * @param {JSON} payload 数据包数据。
     * @param {object} context 数据包携带的上下文。
     */
    triggerModifyGroupMember(payload, context) {
        if (payload.code != 0) {
            return;
        }

        let bundle = (null == context) ? GroupBundle.create(this, payload.data) : context;

        let modifiedGroup = bundle.group;
        let member = bundle.modified[0];

        let current = this.groups.get(modifiedGroup.getId());
        if (null != current) {
            current.lastActiveTime = modifiedGroup.lastActiveTime;
            current._replaceMember(member);

            this.storage.writeGroup(current);
        }
        else {
            this.storage.readGroup(group.getId(), (groupId, group) => {
                if (null != group) {
                    group.lastActiveTime = modifiedGroup.lastActiveTime;
                    group._replaceMember(member);

                    this.storage.writeGroup(group);
                }
            });
        }
    }
}
