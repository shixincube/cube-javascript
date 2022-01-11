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
import { OrderMap } from "../util/OrderMap";
import { ModuleError } from "../core/error/ModuleError";
import { Module } from "../core/Module";
import { Packet } from "../core/Packet";
import { PipelineState } from "../core/PipelineState";
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
import { ContactAppendix } from "./ContactAppendix";
import { GroupAppendix } from "./GroupAppendix";
import { ContactZone } from "./ContactZone";
import { ContactContextProvider } from "./ContactContextProvider";


/**
 * 联系人上下文数据回调。
 * @callback ContactContextProviderCallback
 * @param {Contact} contact 需要获取上下文的联系人实例。
 * @param {ContactContextProvider} provider 数据提供器。
 */


/**
 * 联系人模块。
 * @extends Module
 */
export class ContactService extends Module {

    /**
     * 联系人模块的模块名。
     * @type {string}
     */
    static NAME = 'Contact';

    /**
     */
    constructor() {
        super('Contact');

        /**
         * 当前有效的在线联系人。
         * @private
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
         * @private
         * @type {OrderMap<number,Contact>}
         */
        this.contacts = new OrderMap();

        /**
         * 群组内存缓存。
         * @private
         * @type {OrderMap<number,Group>}
         */
        this.groups = new OrderMap();

        /**
         * 数据通道监听器。
         * @private
         * @type {ContactPipelineListener}
         */
        this.pipelineListener = new ContactPipelineListener(this);

        /**
         * 联系人存储器。
         * @private
         * @type {ContactStorage}
         */
        this.storage = new ContactStorage(this);

        /**
         * List Groups 操作的上下文。
         * @private
         * @type {function}
         */
        this.listGroupsContext = null;

        /**
         * 附录记录。
         * @private
         * @type {OrderMap}
         */
        this.appendixMap = new OrderMap();

        /**
         * 联系人上下文数据提供器。
         * @private
         * @type {ContactContextProviderCallback}
         */
        this.contextProviderCallback = null;
    }

    /**
     * @inheritdoc  
     */
    start() {
        if (!super.start()) {
            return false;
        }

        this.kernel.inspector.depositMap(this.contacts);
        this.kernel.inspector.depositMap(this.groups);

        this.pipeline.addListener(ContactService.NAME, this.pipelineListener);

        return true;
    }

    /**
     * @inheritdoc
     */
    stop() {
        super.stop();

        this.kernel.inspector.withdrawMap(this.contacts);
        this.kernel.inspector.withdrawMap(this.groups);

        if (null == this.pipeline) {
            return;
        }

        this.pipeline.removeListener(ContactService.NAME, this.pipelineListener);

        // 关闭存储器
        this.storage.close();
    }

    /**
     * @inheritdoc
     */
    isReady() {
        return this.selfReady;
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
     * @param {JSON} [context] 指定关联的上下文。
     * @param {Device} [device] 指定设备。
     * @returns {boolean} 设置成功返回 {@linkcode true} ，否则返回 {@linkcode false} 。
     */
    signIn(self, name, context, device) {
        // 已经有联系人签入，不允许重复签入
        if (this.selfReady) {
            return false;
        }

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

        // 开启存储器
        this.storage.open(this.self.id, AuthService.DOMAIN);

        if (undefined !== name && null != name) {
            this.self.setName(name);
        }
        if (undefined !== context && null != context) {
            this.self.setContext(context);
        }
        if (undefined !== device && null != device) {
            this.self.resetDevice(device);
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
     * @returns {boolean} 是否执行了签出操作。
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
            if (null != responsePacket && responsePacket.getStateCode() == PipelineState.OK) {
                if (responsePacket.data.code == ContactServiceState.Ok) {
                    handler(current);
                }
            }
        } : undefined);
        return true;
    }

    /**
     * 通过向服务发送状态信息验证自身连接状态。
     */
    comeback() {
        if (null == this.self) {
            return;
        }

        let packet = new Packet(ContactAction.Comeback, this.self.toJSON());
        this.pipeline.send(ContactService.NAME, packet, (pipeline, source, responsePacket) => {
            if (null != responsePacket && responsePacket.getStateCode() == PipelineState.OK) {
                if (responsePacket.data.code == ContactServiceState.Ok) {
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
        if (payload.code != ContactServiceState.Ok) {
            cell.Logger.e('ContactService', 'SignIn failed: ' + payload.code);
            return;
        }

        let data = payload.data;

        if (null == this.self) {
            this.self = new Self(data["id"]);
        }

        cell.Logger.d('ContactService', 'Trigger SignIn: ' + this.self.getId());

        let gotGroups = false;
        let gotBlockList = false;
        let gotTopList = false;
        let gotAppendix = false;

        let trigger = () => {
            if (gotGroups && gotBlockList && gotTopList && gotAppendix) {
                (new Promise((resolve, reject) => {
                    resolve();
                })).then(() => {
                    // 更新状态
                    this.selfReady = true;

                    this.notifyObservers(new ObservableEvent(ContactEvent.SignIn, this.self));
                }).catch((error) => {
                    // Noting
                });
            }
        };

        // 更新群组
        let now = Date.now();
        this.listGroups(now - this.defaultRetrospect, now, (groupList) => {
            cell.Logger.d('ContactService', 'List groups number: ' + groupList.length);
            gotGroups = true;
            trigger();
        });

        // 更新阻止列表
        this.listBlockList(() => {
            cell.Logger.d('ContactService', 'List block list finish');
            gotBlockList = true;
            trigger();
        }, (error) => {
            gotBlockList = true;
            trigger();
        });

        // 更新置顶列表
        this.listTopList(() => {
            cell.Logger.d('ContactService', 'List top list finish');
            gotTopList = true; 
            trigger();
        }, (error) => {
            gotTopList = true; 
            trigger();
        });

        this.self.name = data["name"];
        let devices = data["devices"];
        for (let i = 0; i < devices.length; ++i) {
            this.self.devices[i] = Device.create(devices[i]);
        }

        if (data["context"] !== undefined) {
            this.self.setContext(data["context"]);
        }

        // 获取附录
        this.getAppendix(this.self, (appendix) => {
            cell.Logger.d('ContactService', 'Get appendix finish');
            gotAppendix = true;
            trigger();
        }, (error) => {
            cell.Logger.w('ContactService', 'Get self appendix: ' + error);

            gotAppendix = true;
            trigger();
        });
    }

    /**
     * 触发联系人签出。
     * @private
     * @param {object} payload 来自服务器数据。
     */
    triggerSignOut(payload) {
        if (payload.code != ContactServiceState.Ok) {
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
     * 设置联系人上下文提供器回调。
     * @param {ContactContextProviderCallback} callback 
     */
    setContextProviderCallback(callback) {
        this.contextProviderCallback = callback;
    }

    /**
     * 获取指定 ID 的联系人信息。
     * @param {number} contactId 指定联系人 ID 。
     * @param {function} [handleSuccess] 成功获取到数据回调该方法，参数：({@linkcode contact}:{@link Contact}) ，(联系人实例)。
     * @param {function} [handleFailure] 操作失败回调该方法，参数：({@linkcode error}:{@link ModuleError}) ，(故障信息))。
     * @returns {Promise} 当参数 {@linkcode handleSuccess} 和 {@linkcode handleFailure} 均不设置时，返回 {@linkcode Promise} 。
     */
    getContact(contactId, handleSuccess, handleFailure) {
        if (!this.selfReady) {
            if (handleFailure) {
                handleFailure(new ModuleError(ContactService.NAME, ContactServiceState.NotAllowed, contactId));
            }
            return;
        }

        let id = contactId;
        if (typeof contactId === 'string') {
            id = parseInt(contactId);
        }
        else if (contactId instanceof Contact) {
            id = contactId.getId();
        }

        let promise = new Promise((resolve, reject) => {
            // 判断是不是 Self
            if (id == this.self.id) {
                if (null == this.self.context && null != this.contextProviderCallback) {
                    this.contextProviderCallback(contact, new ContactContextProvider(contact, (contact) => {
                        resolve(this.self);
                    }));
                }
                else {
                    resolve(this.self);
                }

                return;
            }

            // 从缓存读取
            let contact = this.contacts.get(id);

            if (null == contact) {
                // 从存储读取
                this.storage.readContact(id, (contact) => {
                    if (null != contact && contact.isValid()) {
                        if (null == contact.context && null != this.contextProviderCallback) {
                            this.contextProviderCallback(contact, new ContactContextProvider(contact, (contact) => {
                                // 保存到内存
                                this.contacts.put(contact.getId(), contact);

                                // 获取附录
                                this.getAppendix(contact, (appendix) => {
                                    contact.appendix = appendix;
                                    resolve(contact);
                                }, (error) => {
                                    reject(error);
                                });
                            }));
                        }
                        else {
                            // 保存到内存
                            this.contacts.put(contact.getId(), contact);

                            // 获取附录
                            this.getAppendix(contact, (appendix) => {
                                contact.appendix = appendix;
                                resolve(contact);
                            }, (error) => {
                                reject(error);
                            });
                        }

                        return;
                    }

                    let packet = new Packet(ContactAction.GetContact, {
                        "id": id,
                        "domain": AuthService.DOMAIN
                    });
                    this.pipeline.send(ContactService.NAME, packet, (pipeline, source, responsePacket) => {
                        if (null != responsePacket && responsePacket.getStateCode() == PipelineState.OK) {
                            if (responsePacket.data.code == ContactServiceState.Ok) {
                                // 创建联系人实例
                                let contact = Contact.create(responsePacket.data.data);

                                if (null == contact.context && null != this.contextProviderCallback) {
                                    this.contextProviderCallback(contact, new ContactContextProvider(contact, (contact) => {
                                        // 保存到内存
                                        this.contacts.put(contact.getId(), contact);
                                        // 更新存储
                                        this.storage.writeContact(contact);

                                        // 获取附录
                                        this.getAppendix(contact, (appendix) => {
                                            contact.appendix = appendix;
                                            resolve(contact);
                                        }, (error) => {
                                            reject(error);
                                        });
                                    }));
                                }
                                else {
                                    // 保存到内存
                                    this.contacts.put(contact.getId(), contact);
                                    // 更新存储
                                    this.storage.writeContact(contact);

                                    // 获取附录
                                    this.getAppendix(contact, (appendix) => {
                                        contact.appendix = appendix;
                                        resolve(contact);
                                    }, (error) => {
                                        reject(error);
                                    });
                                }

                                // 设置更新时间
                                contact.resetUpdateTime(Date.now());
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
     * 获取指定名称的联系人分区。
     * @param {string} name 分区名。
     * @param {function} handleSuccess 操作成功回调该方法，参数：({@linkcode contactZone}:{@link ContactZone})。
     * @param {function} [handleFailure] 操作失败回调该方法，参数：({@linkcode error}:{@link ModuleError})。
     */
    getContactZone(name, handleSuccess, handleFailure) {
        let packet = new Packet(ContactAction.GetContactZone, {
            "name": name
        });
        this.pipeline.send(ContactService.NAME, packet, (pipeline, source, responsePacket) => {
            if (null != responsePacket && responsePacket.getStateCode() == PipelineState.OK) {
                if (responsePacket.data.code == ContactServiceState.Ok) {
                    handleSuccess(new ContactZone(responsePacket.data.data, this));
                }
                else {
                    if (handleFailure) {
                        handleFailure(new ModuleError(ContactService.NAME, responsePacket.data.code, name));
                    }
                }
            }
            else {
                if (handleFailure) {
                    handleFailure(new ModuleError(ContactService.NAME, ContactServiceState.ServerError, name));
                }
            }
        });
    }

    /**
     * 创建新的联系人分区。
     * @param {string} name 分区名。
     * @param {string} displayName 分区显示名，可以为 {@linkcode null} 值。
     * @param {Array} contactIdList 分区里包含的联系人 ID 列表。
     * @param {function} handleSuccess 操作成功回调该方法，参数：({@linkcode contactZone}:{@link ContactZone})。
     * @param {function} handleFailure 操作失败回调该方法，参数：({@linkcode error}:{@link ModuleError})。
     */
    createContactZone(name, displayName, contactIdList, handleSuccess, handleFailure) {
        let packet = new Packet(ContactAction.CreateContactZone, {
            "name": name,
            "contacts": contactIdList,
            "displayName": (null != displayName && undefined !== displayName) ? displayName : name
        });
        this.pipeline.send(ContactService.NAME, packet, (pipeline, source, responsePacket) => {
            if (null != responsePacket && responsePacket.getStateCode() == PipelineState.OK) {
                if (responsePacket.data.code == ContactServiceState.Ok) {
                    handleSuccess(new ContactZone(responsePacket.data.data, this));
                }
                else {
                    if (handleFailure) {
                        handleFailure(new ModuleError(ContactService.NAME, responsePacket.data.code, name));
                    }
                }
            }
            else {
                if (handleFailure) {
                    handleFailure(new ModuleError(ContactService.NAME, ContactServiceState.ServerError, name));
                }
            }
        });
    }

    /**
     * FIXME XJW 可作废的接口
     * 获取指定名称的待处理联系人分区。
     * @param {string} name 分区名。
     * @param {function} handleSuccess 操作成功回调该方法，参数：({@linkcode contactZone}:{@link ContactZone})。
     * @param {function} [handleFailure] 操作失败回调该方法，参数：({@linkcode error}:{@link ModuleError})。
     */
    getPendingZone(name, handleSuccess, handleFailure) {
        /*let packet = new Packet(ContactAction.GetContactZone, {
            "name": name,
            "pending": true
        });
        this.pipeline.send(ContactService.NAME, packet, (pipeline, source, responsePacket) => {
            if (null != responsePacket && responsePacket.getStateCode() == PipelineState.OK) {
                if (responsePacket.data.code == ContactServiceState.Ok) {
                    handleSuccess(new ContactZone(responsePacket.data.data, this));
                }
                else {
                    if (handleFailure) {
                        handleFailure(new ModuleError(ContactService.NAME, responsePacket.data.code, name));
                    }
                }
            }
            else {
                if (handleFailure) {
                    handleFailure(new ModuleError(ContactService.NAME, ContactServiceState.ServerError, name));
                }
            }
        });*/
    }

    /**
     * 指定分区是否包含指定联系人。
     * @param {string} name 分区名。
     * @param {number|Contact} contactId 指定联系人 ID 。
     * @param {function} handleSuccess 操作成功回调该方法，参数：({@linkcode contained}:{@linkcode boolean}, {@linkcode zoneName}:{@linkcode string}, {@linkcode contactId}:{@linkcode number})。
     * @param {function} [handleFailure] 操作失败回调该方法，参数：({@linkcode error}:{@link ModuleError})。
     */
    containsContactInZone(name, contactId, handleSuccess, handleFailure) {
        if (contactId instanceof Contact) {
            contactId = contactId.getId();
        }

        let packet = new Packet(ContactAction.ContainsContactInZone, {
            "name": name,
            "contactId": contactId
        });
        this.pipeline.send(ContactService.NAME, packet, (pipeline, source, responsePacket) => {
            if (null != responsePacket && responsePacket.getStateCode() == PipelineState.OK) {
                if (responsePacket.data.code == ContactServiceState.Ok) {
                    let data = responsePacket.data.data;
                    handleSuccess(data.contained, data.name, data.contactId);
                }
                else {
                    if (handleFailure) {
                        handleFailure(new ModuleError(ContactService.NAME, responsePacket.data.code, name));
                    }
                }
            }
            else {
                if (handleFailure) {
                    handleFailure(new ModuleError(ContactService.NAME, ContactServiceState.ServerError, name));
                }
            }
        });
    }

    /**
     * 添加联系人到分区。
     * @param {string} name 分区名。
     * @param {number|Contact} contactId 指定联系人 ID 。
     * @param {string} postscript 指定附言。
     * @param {function} [handleSuccess] 操作成功回调该方法，参数：({@linkcode zoneName}:{@linkcode string}, {@linkcode contactId}:{@linkcode number})。
     * @param {function} [handleFailure] 操作失败回调该方法，参数：({@linkcode error}:{@link ModuleError})。
     */
    addContactToZone(name, contactId, postscript, handleSuccess, handleFailure) {
        if (contactId instanceof Contact) {
            contactId = contactId.getId();
        }

        if (contactId == this.self.getId()) {
            if (handleFailure) {
                handleFailure(new ModuleError(ContactService.NAME, ContactServiceState.IllegalOperation, name));
            }
            return;
        }

        if (undefined === postscript || null == postscript) {
            postscript = '';
        }

        let packet = new Packet(ContactAction.AddContactToZone, {
            "name": name,
            "contactId": contactId,
            "postscript": postscript
        });
        this.pipeline.send(ContactService.NAME, packet, (pipeline, source, responsePacket) => {
            if (null != responsePacket && responsePacket.getStateCode() == PipelineState.OK) {
                if (responsePacket.data.code == ContactServiceState.Ok) {
                    if (handleSuccess) {
                        handleSuccess(name, contactId);
                    }
                }
                else {
                    if (handleFailure) {
                        handleFailure(new ModuleError(ContactService.NAME, responsePacket.data.code, name));
                    }
                }
            }
            else {
                if (handleFailure) {
                    handleFailure(new ModuleError(ContactService.NAME, ContactServiceState.ServerError, name));
                }
            }
        });
    }

    /**
     * 从分区中移除联系人。
     * @param {string} name 分区名。
     * @param {number|Contact} contactId 指定联系人 ID 。
     * @param {function} [handleSuccess] 操作成功回调该方法，参数：({@linkcode zoneName}:{@linkcode string}, {@linkcode contactId}:{@linkcode number})。
     * @param {function} [handleFailure] 操作失败回调该方法，参数：({@linkcode error}:{@link ModuleError})。
     */
    removeContactFromZone(name, contactId, handleSuccess, handleFailure) {
        if (contactId instanceof Contact) {
            contactId = contactId.getId();
        }

        let packet = new Packet(ContactAction.RemoveContactFromZone, {
            "name": name,
            "contactId": contactId
        });
        this.pipeline.send(ContactService.NAME, packet, (pipeline, source, responsePacket) => {
            if (null != responsePacket && responsePacket.getStateCode() == PipelineState.OK) {
                if (responsePacket.data.code == ContactServiceState.Ok) {
                    if (handleSuccess) {
                        handleSuccess(name, contactId);
                    }
                }
                else {
                    if (handleFailure) {
                        handleFailure(new ModuleError(ContactService.NAME, responsePacket.data.code, name));
                    }
                }
            }
            else {
                if (handleFailure) {
                    handleFailure(new ModuleError(ContactService.NAME, ContactServiceState.ServerError, name));
                }
            }
        });
    }

    /**
     * 修改当前签入联系人的信息。
     * @param {string} newName 指定新的名称，如果不修改设置为 {@linkcode null} 值。
     * @param {object} newContext 指定新的上下文，如果不修改设置为 {@linkcode null} 值。
     * @param {function} [handleSuccess] 操作成功回调该方法。参数：({@linkcode contact}:{@link Contact}) 。
     * @param {function} [handleFailure] 操作失败回调该方法。参数：({@linkcode error}:{@link ModuleError}) 。
     * @returns {Promise} 如果不设置任何回调函数，返回 {@linkcode Promise} 实例。
     */
    modifyContact(newName, newContext, handleSuccess, handleFailure) {
        if (!this.selfReady) {
            if (handleFailure) {
                handleFailure(new ModuleError(ContactService.NAME, ContactServiceState.NotAllowed, contactId));
            }
            return;
        }

        let promise = new Promise((resolve, reject) => {
            let requestData = {
                "name": newName,
                "context": newContext
            };
            if (null == newName) {
                delete requestData["name"];
            }
            if (null == newContext) {
                delete requestData["context"];
            }

            let packet = new Packet(ContactAction.ModifyContact, requestData);
            this.pipeline.send(ContactService.NAME, packet, (pipeline, source, responsePacket) => {
                if (null != responsePacket && responsePacket.getStateCode() == PipelineState.OK) {
                    if (responsePacket.data.code == ContactServiceState.Ok) {
                        let json = responsePacket.data.data;

                        this.self.name = json.name;
                        this.self.context = json.context;

                        resolve(this.self);
                    }
                    else {
                        reject(new ModuleError(ContactService.NAME, responsePacket.data.code, requestData));
                    }
                }
                else {
                    reject(new ModuleError(ContactService.NAME, ContactServiceState.ServerError, requestData));
                }
            });
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
     * 获取指定 ID 的群组信息。
     * @param {number} id 指定群组 ID 。
     * @param {function} [handleSuccess] 成功获取到数据回调该方法，参数：({@linkcode group}:{@link Group})，(群组实例)。
     * @param {function} [handleFailure] 操作失败回调该方法，参数：({@linkcode error}:{@link ModuleError}) 。
     * @returns {Promise} 当 {@linkcode handleSuccess} 和 {@linkcode handleFailure} 参数都不设置时，返回 {@linkcode Promise} 。
     */
    getGroup(id, handleSuccess, handleFailure) {
        if (typeof id === 'string') {
            id = parseInt(id);
        }

        let promise = new Promise((resolve, reject) => {
            // 从缓存读取
            let group = this.groups.get(id);
            if (null != group) {
                if (null == group.getAppendix()) {
                    // 设置群组的附录
                    this.getAppendix(group, (appendix) => {
                        resolve(group);
                    }, (error) => {
                        reject(error);
                    });
                }
                else {
                    resolve(group);
                }
                return;
            }

            // 从存储库读取
            this.storage.readGroup(id, (id, group) => {
                if (null != group) {
                    // 设置群组的附录
                    this.getAppendix(group, (appendix) => {
                        resolve(group);
                    }, (error) => {
                        reject(error);
                    });
                    return;
                }

                // 从服务器上读取
                let packet = new Packet(ContactAction.GetGroup, {
                    "id": id,
                    "domain": AuthService.DOMAIN
                });
                this.pipeline.send(ContactService.NAME, packet, (pipeline, source, responsePacket) => {
                    if (null != responsePacket && responsePacket.getStateCode() == PipelineState.OK && null != responsePacket.data) {
                        if (responsePacket.data.code == ContactServiceState.Ok) {
                            // 实例化
                            let group = Group.create(this, responsePacket.data.data);
                            // 获取附录
                            this.getAppendix(group, (appendix, group) => {
                                // 写入缓存
                                this.groups.put(group.getId(), group);

                                // 写入存储
                                this.storage.writeGroup(group);

                                resolve(group);
                            }, (error) => {
                                reject(error);
                            });
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
            }).catch((error) => {
                cell.Logger.d(ContactService.NAME, '#getGroup ' + error.toString());
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

        if (undefined === states) {
            states = [GroupState.Normal];
        }

        let ret = this.storage.readGroups(beginning, ending, (beginning, ending, result) => {
            let list = result.sort((a, b) => {
                return this.sortGroup(a, b);
            });
            let resultList = [];
            let count = 0;
            for (let i = 0; i < list.length; ++i) {
                let group = list[i];

                let current = this.groups.get(group.id);
                if (null != current) {
                    group = current;
                }

                if (group.state == GroupState.Normal && group.tag == 'public') {
                    // 更新计数
                    ++count;

                    if (null == group.appendix) {
                        this.getAppendix(group, (appendix, group) => {
                            resultList.push(group);

                            if (count == resultList.length) {
                                handler(resultList);
                            }
                        }, (error) => {
                            error.data.appendix = new GroupAppendix(this, error.data);
                            resultList.push(error.data);

                            if (count == resultList.length) {
                                handler(resultList);
                            }
                        });
                    }
                    else {
                        resultList.push(group);
                    }

                    if (null == current) {
                        this.groups.put(group.getId(), group);
                    }
                }
            }

            if (count == resultList.length) {
                handler(resultList);
            }
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

        if (list.length == 0) {
            clearTimeout(this.listGroupsContext.timer);
            this.listGroupsContext.timer = 0;

            this.listGroupsContext.handler(this.listGroupsContext.list);
            this.listGroupsContext = null;
            return;
        }

        let buf = new OrderMap();

        for (let i = 0; i < list.length; ++i) {
            let group = Group.create(this, list[i]);

            buf.put(group.getId(), group);

            if (group.getOwner().equals(this.self)) {
                group.owner = this.self;
            }

            // 更新内存
            if (group.getState() == GroupState.Normal) {
                this.groups.put(group.getId(), group);
            }

            // 获取群组的附录
            this.getAppendix(group, (appendix, group) => {
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

                // 更新本次请求的清单
                this.listGroupsContext.list.push(group);

                if (this.listGroupsContext.list.length == total) {
                    clearTimeout(this.listGroupsContext.timer);
                    this.listGroupsContext.timer = 0;
        
                    this.listGroupsContext.handler(this.listGroupsContext.list);
                    this.listGroupsContext = null;
                }
            }, (error) => {
                cell.Logger.e('ContactService', '#triggerListGroups() - #getAppendix(): ' + error);
                // 更新本次请求的清单
                this.listGroupsContext.list.push(error.data);

                if (this.listGroupsContext.list.length == total) {
                    clearTimeout(this.listGroupsContext.timer);
                    this.listGroupsContext.timer = 0;

                    this.listGroupsContext.handler(this.listGroupsContext.list);
                    this.listGroupsContext = null;
                }
            });
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
                // memberList.push(member.toCompactJSON());
                memberList.push(member.id);
            }
            else if (typeof member === 'number') {
                // memberList.push({
                //     "id": member,
                //     "name": 'Cube-' + member
                // });
                memberList.push(member);
            }
            else if (typeof member === 'string') {
                // memberList.push({
                //     "id": parseInt(member),
                //     "name": 'Cube-' + member
                // });
                memberList.push(parseInt(member));
            }
            // else if (undefined !== member.id && undefined !== member.name) {
            //     memberList.push({
            //         "id": parseInt(member.id),
            //         "name": member.name
            //     });
            // }
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

            if (responsePacket.getStateCode() != PipelineState.OK) {
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

            // 获取群组附录
            this.getAppendix(newGroup, (appendix, newGroup) => {
                // 写入存储
                this.storage.writeGroup(newGroup);
                // 写入内存
                this.groups.put(newGroup.getId(), newGroup);
                // 回调
                setTimeout(() => {
                    handleSuccess(newGroup);
                }, 1);
            }, (error) => {
                if (handleFailure) {
                    handleFailure(error);
                }
            });
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
        if (payload.code != ContactServiceState.Ok) {
            return;
        }

        let handler = (group) => {
            if (group.getOwner().equals(this.self)) {
                // 本终端创建的群
                // 缓存到内存
                this.groups.put(group.getId(), group);
                // 保存到存储
                this.storage.writeGroup(group);
            }
            else {
                group.getMembers((members, group) => {
                    for (let i = 0; i < members.length; ++i) {
                        let member = members[i];
                        if (member.equals(this.self)) {
                            members[i] = this.self;
                            break;
                        }
                    }
                });

                // 其他终端创建的群，本终端被邀请进入
                this.groups.put(group.getId(), group);
                // 写入存储
                this.storage.writeGroup(group);
            }

            this.notifyObservers(new ObservableEvent(ContactEvent.GroupCreated, group));
        };

        let group = (null == context) ? Group.create(this, payload.data) : context;

        if (null == group.appendix) {
            // 获取群组附录
            this.getAppendix(group, (appendix) => {
                handler(group);
            }, (error) => {
                cell.Logger.e('ContactService', error.toString());
            });
        }
        else {
            handler(group);
        }
    }

    /**
     * 解散指定的群组。
     * @param {Group} group 指定待解散的群组。
     * @param {function} [handleSuccess] 操作成功回调该方法，函数参数：({@linkcode group}:{@link Group}) ，解散成功的群组实例。
     * @param {function} [handleFailure] 操作失败回调该方法，函数参数：({@linkcode error}:{@link ModuleError}) 。
     * @returns {boolean} 返回该群是否允许由当前联系人解散。
     */
    dismissGroup(group, handleSuccess, handleFailure) {
        if (group.getOwner().getId() != this.self.getId()) {
            // 群组的所有者不是自己，不能解散
            let error = new ModuleError(ContactService.NAME, ContactServiceState.NotAllowed, group);
            if (handleFailure) {
                handleFailure(error);
            }
            return false;
        }

        let packet = new Packet(ContactAction.DismissGroup, group.toCompactJSON());
        this.pipeline.send(ContactService.NAME, packet, (pipeline, source, responsePacket) => {
            if (null == responsePacket || responsePacket.getStateCode() != PipelineState.OK) {
                let error = new ModuleError(ContactService.NAME, ContactServiceState.ServerError, group);
                cell.Logger.w('ContactService', 'Dismiss group failed - ' + error);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            if (responsePacket.getPayload().code != ContactServiceState.Ok) {
                let error = new ModuleError(ContactService.NAME, responsePacket.getPayload().code, group);
                cell.Logger.w('ContactService', 'Dismiss group failed - ' + error);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            let updatedGroup = Group.create(this, responsePacket.getPayload().data, this.self);
            // 设置上下文
            responsePacket.context = updatedGroup;

            this.getAppendix(updatedGroup, () => {
                // 更新内存
                this.groups.put(updatedGroup.getId(), updatedGroup);

                if (handleSuccess) {
                    setTimeout(() => {
                        handleSuccess(updatedGroup);
                    }, 1);
                }
            }, (error) => {
                if (handleFailure) {
                    handleFailure(error);
                }
            });
        });

        return true;
    }

    /**
     * 处理接收到解散群数据。
     * @private
     * @param {JSON} payload 数据包数据。
     * @param {object} context 数据包携带的上下文。
     */
    triggerDismissGroup(payload, context) {
        if (payload.code != ContactServiceState.Ok) {
            return;
        }

        let group = (null == context) ? Group.create(this, payload.data) : context;

        (new Promise((resolve, reject) => {
            if (null == group.appendix) {
                this.getAppendix(group, () => {
                    resolve(group);
                }, (error) => {
                    reject(error);
                });
            }
            else {
                resolve(group);
            }
        })).then((group) => {
            if (group.getOwner().equals(this.self)) {
                // 该联系人解散的群
                this.groups.put(group.getId(), group);
                // 写入存储
                this.storage.writeGroup(group);
            }
            else {
                // 其他联系人解散了该群，更新数据
                this.groups.put(group.getId(), group);
                // 写入存储
                this.storage.writeGroup(group);
            }

            this.notifyObservers(new ObservableEvent(ContactEvent.GroupDismissed, group));
        }).catch((error) => {
            cell.Logger.e('ContactService', '#triggerDismissGroup() ' + error);
        });
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
            if (null == responsePacket || responsePacket.getStateCode() != PipelineState.OK) {
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

            // 设置附录
            bundle.group.appendix = group.appendix;

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
     * @param {function} [handleSuccess] 操作成功回调该方法，参数：({@linkcode group}:{@link Group}, {@linkcode members}:Array<{@link Contact}>, {@linkcode operator}:{@link Contact}) 。
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
            if (null == responsePacket || responsePacket.getStateCode() != PipelineState.OK) {
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

            // 设置附录
            bundle.group.appendix = group.appendix;

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
        if (payload.code != ContactServiceState.Ok) {
            return;
        }

        let response = (null != context);

        if (response) {
            // 如果是应答，则直接返回
            return;
        }

        // 读取群信息
        let bundle = response ? context : GroupBundle.create(this, payload.data);
        let group = bundle.group;

        (new Promise((resolve, reject) => {
            if (null == group.appendix) {
                // 获取附录
                this.getAppendix(group, () => {
                    resolve(group);            
                });
            }
            else {
                resolve(group);
            }
        })).then((group) => {
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
        }).catch((error) => {
            // Nothing
        });
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
            if (null == responsePacket || responsePacket.getStateCode() != PipelineState.OK) {
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

            // 设置附录
            bundle.group.appendix = group.appendix;

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
        if (payload.code != ContactServiceState.Ok) {
            return;
        }

        let response = (null != context);

        if (response) {
            // 如果是应答，则直接返回
            return;
        }

        // 读取群信息
        let bundle = response ? context : GroupBundle.create(this, payload.data);
        let group = bundle.group;

        (new Promise((resolve, reject) => {
            if (null == group.appendix) {
                this.getAppendix(group, () => {
                    resolve(group);
                });
            }
            else {
                resolve(group);
            }
        })).then((group) => {
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
        }).catch((error) => {
            // Nothing
        });
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
            if (null == responsePacket || responsePacket.getStateCode() != PipelineState.OK) {
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

            // 设置附录
            modifiedGroup.appendix = group.appendix;

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
        if (payload.code != ContactServiceState.Ok) {
            return;
        }

        let group = (null == context) ? Group.create(this, payload.data) : context;

        (new Promise((resolve, reject) => {
            if (null == group.appendix) {
                this.getAppendix(group, () => {
                    resolve(group);
                });
            }
            else {
                resolve(group);
            }
        })).then((group) => {
            // 更新缓存
            this.groups.put(group.getId(), group);

            // 更新存储
            this.storage.writeGroup(group);

            this.notifyObservers(new ObservableEvent(ContactEvent.GroupUpdated, group));
        }).catch((error) => {
            // Nothig
        });
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
            if (null == responsePacket || responsePacket.getStateCode() != PipelineState.OK) {
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
                let error = new ModuleError(ContactService.NAME, responsePacket.getPayload().code, {
                    group: group,
                    member: member
                });
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            let bundle = GroupBundle.create(this, responsePacket.getPayload().data);

            // 设置附录
            bundle.group.appendix = group.appendix;

            let modifiedMember = bundle.modified[0];

            group.lastActiveTime = bundle.group.lastActiveTime;
            group._replaceMember(modifiedMember);

            // 设置上下文
            responsePacket.context = bundle;

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
        if (payload.code != ContactServiceState.Ok) {
            return;
        }

        let bundle = (null == context) ? GroupBundle.create(this, payload.data) : context;

        let modifiedGroup = bundle.group;
        let member = bundle.modified[0];

        (new Promise((resolve, reject) => {
            if (null == modifiedGroup.appendix) {
                this.getAppendix(modifiedGroup, () => {
                    resolve(modifiedGroup);
                });
            }
            else {
                resolve(modifiedGroup);
            }
        })).then((group) => {
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
        }).catch((error) => {
            // Nothing
        });
    }

    /**
     * 获取指定联系人或群组的附录。
     * @param {Contact|Group} contactOrGroup 指定联系人或群组。
     * @param {function} [handleSuccess] 成功回调，参数：({@linkcode appendix}:{@link ContactAppendix}|{@link GroupAppendix},{@linkcode entity}:{@link Contact}|{@link Group}) 。
     * @param {function} [handleFailure] 失败回调，参数：({@linkcode error}:{@link ModuleError}) 。
     */
    getAppendix(contactOrGroup, handleSuccess, handleFailure) {
        let requestData = null;
        if (contactOrGroup instanceof Group) {
            let appendix = this.appendixMap.get(contactOrGroup.getId());
            if (null != appendix) {
                if (null == contactOrGroup.appendix) {
                    contactOrGroup.appendix = appendix;
                }
                if (handleSuccess) {
                    handleSuccess(appendix, contactOrGroup);
                }
                return;
            }

            requestData = {
                "groupId": contactOrGroup.getId()
            };
        }
        else if (contactOrGroup instanceof Contact) {
            let appendix = this.appendixMap.get(contactOrGroup.getId());
            if (null != appendix) {
                if (null == contactOrGroup.appendix) {
                    contactOrGroup.appendix = appendix;
                }
                if (handleSuccess) {
                    handleSuccess(appendix, contactOrGroup);
                }
                return;
            }

            requestData = {
                "contactId": contactOrGroup.getId()
            };
        }
        else {
            let error = new ModuleError(ContactService.NAME, ContactServiceState.NotAllowed, contactOrGroup);
            if (handleFailure) {
                handleFailure(error);
            }
            return;
        }

        let request = new Packet(ContactAction.GetAppendix, requestData);
        this.pipeline.send(ContactService.NAME, request, (pipeline, source, packet) => {
            if (null == packet || packet.getStateCode() != PipelineState.OK) {
                let error = new ModuleError(ContactService.NAME, ContactServiceState.ServerError, contactOrGroup);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            if (packet.getPayload().code != ContactServiceState.Ok) {
                let error = new ModuleError(ContactService.NAME, packet.getPayload().code, contactOrGroup);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            let data = packet.getPayload().data;
            if (undefined !== requestData.contactId && undefined !== data.contact) {
                let owner = contactOrGroup;
                if (null == owner) {
                    owner = Contact.create(data.contact, AuthService.DOMAIN);
                }

                let contactAppendix = new ContactAppendix(this, owner);
                // 备注名
                contactAppendix.remarkName = data.remarkName;

                // 赋值数据
                if (data.assignedData) {
                    contactAppendix.assignedData = data.assignedData;
                }

                // 设置附录
                owner.appendix = contactAppendix;

                this.appendixMap.put(owner.getId(), contactAppendix);

                if (handleSuccess) {
                    handleSuccess(contactAppendix, contactOrGroup);
                }
            }
            else {
                let owner = contactOrGroup;
                if (null == owner) {
                    owner = Group.create(this, data.group);
                }

                let groupAppendix = new GroupAppendix(this, owner);
                groupAppendix.remark = data.remark;
                groupAppendix.notice = data.notice;
                groupAppendix.commId = data.commId;
                groupAppendix.setMemberRemarks(data.memberRemarks);

                // 设置附录
                owner.appendix = groupAppendix;

                this.appendixMap.put(owner.getId(), groupAppendix);

                if (handleSuccess) {
                    handleSuccess(groupAppendix, contactOrGroup);
                }
            }
        });
    }

    /**
     * 备注群组，群组备注仅对当前联系人有效。
     * @param {Group} group 指定群组。
     * @param {string} remark 指定备注信息。
     * @param {function} handleSuccess 成功回调，参数：({@linkcode appendix}:{@link GroupAppendix}) 。
     * @param {function} handleFailure 失败回调，参数：({@linkcode error}:{@link ModuleError}) 。
     */
    remarkGroup(group, remark, handleSuccess, handleFailure) {
        this.getAppendix(group, (appendix) => {
            appendix.updateRemark(remark, handleSuccess, handleFailure);
        }, (error) => {
            if (handleFailure) {
                handleFailure(error);
            }
        });
    }

    /**
     * 备注联系人。
     * @param {Contact} contact 指定需要备注的联系人。
     * @param {string} name 联系人的备注名。
     * @param {function} handleSuccess 成功回调，参数：({@linkcode appendix}:{@link ContactAppendix}) 。
     * @param {function} handleFailure 失败回调，参数：({@linkcode error}:{@link ModuleError}) 。
     */
    remarkContactName(contact, name, handleSuccess, handleFailure) {
        this.getAppendix(contact, (appendix) => {
            appendix.updateRemarkName(name, handleSuccess, handleFailure);
        }, (error) => {
            if (handleFailure) {
                handleFailure(error);
            }
        });
    }

    /**
     * @private
     * @param {object} payload 
     */
    triggerGroupAppendixUpdated(payload) {
        let data = payload.data;
        this.getGroup(data.group.id, (group) => {
            let groupAppendix = GroupAppendix.create(this, group, data);
            group.appendix = groupAppendix;

            // 更新附录
            this.appendixMap.put(group.getId(), groupAppendix);

            this.notifyObservers(new ObservableEvent(ContactEvent.GroupAppendixUpdated, group));
        }, (error) => {
            cell.Logger.e(ContactService.NAME, error.toString());
        });
    }

    /**
     * 从服务更新阻止清单列表。
     * @private
     * @param {function} [handleSuccess] 
     * @param {function} [handleFailure] 
     */
    listBlockList(handleSuccess, handleFailure) {
        let packet = new Packet(ContactAction.BlockList, {
            "action": "get"
        });
        this.pipeline.send(ContactService.NAME, packet, (pipeline, source, responsePacket) => {
            if (null == responsePacket || responsePacket.getStateCode() != PipelineState.OK) {
                let error = new ModuleError(ContactService.NAME, ContactServiceState.ServerError, 'get');
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            if (responsePacket.data.code != ContactServiceState.Ok) {
                let error = new ModuleError(ContactService.NAME, responsePacket.data.code, 'get');
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            let list = responsePacket.data.data.list;

            // 更新列表
            this.storage.writeBlockList(list);

            if (handleSuccess) {
                handleSuccess(list);
            }
        });
    }

    /**
     * 查询当前联系人的阻止清单。
     * @param {function} handleSuccess 成功回调。参数：({@linkcode list}:{@linkcode Array})。 被阻止的联系人的 ID 列表。
     * @param {function} [handleFailure] 失败回调，参数：({@linkcode error}:{@link ModuleError}) 。
     */
    queryBlockList(handleSuccess, handleFailure) {
        if (!this.storage.readBlockList((list) => {
            handleSuccess(list);
        })) {
            if (handleFailure) {
                handleFailure(new ModuleError(ContactService.NAME, ContactServiceState.IllegalOperation, null));
            }
        }
    }

    /**
     * 将指定联系人添加到阻止清单。
     * @param {Contact|number} contact 指定联系人或联系人 ID 。
     * @param {function} [handleSuccess] 成功回调。参数：({@linkcode id}:{@linkcode number}, {@linkcode blockList}:{@linkcode Array})。
     * @param {function} [handleFailure] 失败回调，参数：({@linkcode error}:{@link ModuleError}) 。
     */
    addBlockList(contact, handleSuccess, handleFailure) {
        let contactId = (contact instanceof Contact) ? contact.getId() : contact;
        if (contactId == this.self.getId()) {
            return;
        }

        let packet = new Packet(ContactAction.BlockList, {
            "action": "add",
            "blockId": contactId
        });
        this.pipeline.send(ContactService.NAME, packet, (pipeline, source, responsePacket) => {
            if (null == responsePacket || responsePacket.getStateCode() != PipelineState.OK) {
                let error = new ModuleError(ContactService.NAME, ContactServiceState.ServerError, contactId);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            if (responsePacket.data.code != ContactServiceState.Ok) {
                let error = new ModuleError(ContactService.NAME, responsePacket.data.code, contactId);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            let data = responsePacket.data.data;
            // 更新到存储
            this.storage.writeBlockList(data.list);

            if (handleSuccess) {
                handleSuccess(contactId, data.list);
            }
        });
    }

    /**
     * 从阻止清单移除联系人。
     * @param {Contact|number} contact 指定联系人或联系人 ID 。
     * @param {function} [handleSuccess] 成功回调。参数：({@linkcode id}:{@linkcode number}, {@linkcode blockList}:{@linkcode Array})。
     * @param {function} [handleFailure] 失败回调，参数：({@linkcode error}:{@link ModuleError}) 。
     */
    removeBlockList(contact, handleSuccess, handleFailure) {
        let contactId = (contact instanceof Contact) ? contact.getId() : contact;
        let packet = new Packet(ContactAction.BlockList, {
            "action": "remove",
            "blockId": contactId
        });
        this.pipeline.send(ContactService.NAME, packet, (pipeline, source, responsePacket) => {
            if (null == responsePacket || responsePacket.getStateCode() != PipelineState.OK) {
                let error = new ModuleError(ContactService.NAME, ContactServiceState.ServerError, contactId);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            if (responsePacket.data.code != ContactServiceState.Ok) {
                let error = new ModuleError(ContactService.NAME, responsePacket.data.code, contactId);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            let data = responsePacket.data.data;
            // 更新到存储
            this.storage.writeBlockList(data.list);

            if (handleSuccess) {
                handleSuccess(contactId, data.list);
            }
        });
    }

    /**
     * 从服务器更新置顶列表数据。
     * @protected
     * @param {function} [handleSuccess] 
     * @param {function} [handleFailure] 
     */
    listTopList(handleSuccess, handleFailure) {
        let packet = new Packet(ContactAction.TopList, {
            "action": "get"
        });
        this.pipeline.send(ContactService.NAME, packet, (pipeline, source, responsePacket) => {
            if (null == responsePacket || responsePacket.getStateCode() != PipelineState.OK) {
                let error = new ModuleError(ContactService.NAME, ContactServiceState.ServerError, 'get');
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            if (responsePacket.data.code != ContactServiceState.Ok) {
                let error = new ModuleError(ContactService.NAME, responsePacket.data.code, 'get');
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            // 清空旧数据
            this.storage.emptyTopList();

            let list = responsePacket.data.data.list;
            for (let i = 0; i < list.length; ++i) {
                let value = list[i];
                this.storage.writeTopList(value.id, value.type);
            }

            if (handleSuccess) {
                handleSuccess(list);
            }
        });
    }

    /**
     * 查询置顶数据。
     * @param {function} handleSuccess 查询成功回调。参数：({@linkcode list}:{@linkcode Array}) 。
     * @param {function} [handleFailure] 查询失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    queryTopList(handleSuccess, handleFailure) {
        if (!this.storage.readTopList((list) => {
            handleSuccess(list);
        })) {
            if (handleFailure) {
                handleFailure(new ModuleError(ContactService.NAME, ContactServiceState.IllegalOperation, null));
            }
        }
    }

    /**
     * 添加指定的置顶数据。
     * @param {Contact|Group} contactOrGroup 指定置顶的联系人或群组。
     * @param {function} [handleSuccess] 成功回调，参数：({@linkcode entity}:{@link Contact}|{@link Group}) 。
     * @param {function} [handleFailure] 失败回调，参数：({@linkcode error}:{@link ModuleError}) 。
     */
    addTopList(contactOrGroup, handleSuccess, handleFailure) {
        let packet = new Packet(ContactAction.TopList, {
            "action": "add",
            "topId": contactOrGroup.getId(),
            "type": (contactOrGroup instanceof Group) ? "group" : "contact"
        });
        this.pipeline.send(ContactService.NAME, packet, (pipeline, source, responsePacket) => {
            if (null == responsePacket || responsePacket.getStateCode() != PipelineState.OK) {
                let error = new ModuleError(ContactService.NAME, ContactServiceState.ServerError, contactOrGroup);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            if (responsePacket.data.code != ContactServiceState.Ok) {
                let error = new ModuleError(ContactService.NAME, responsePacket.data.code, contactOrGroup);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            let data = responsePacket.data.data;
            // 更新到存储
            this.storage.writeTopList(data.topId, data.type);

            if (handleSuccess) {
                handleSuccess(contactOrGroup);
            }
        });
    }

    /**
     * 移除指定的置顶数据。
     * @param {Contact|Group} contactOrGroup 指定移除置顶的联系人或群组。
     * @param {function} [handleSuccess] 成功回调，参数：({@linkcode entity}:{@link Contact}|{@link Group}) 。
     * @param {function} [handleFailure] 失败回调，参数：({@linkcode error}:{@link ModuleError}) 。
     */
    removeTopList(contactOrGroup, handleSuccess, handleFailure) {
        let packet = new Packet(ContactAction.TopList, {
            "action": "remove",
            "topId": contactOrGroup.getId()
        });
        this.pipeline.send(ContactService.NAME, packet, (pipeline, source, responsePacket) => {
            if (null == responsePacket || responsePacket.getStateCode() != PipelineState.OK) {
                let error = new ModuleError(ContactService.NAME, ContactServiceState.ServerError, contactOrGroup);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            if (responsePacket.data.code != ContactServiceState.Ok) {
                let error = new ModuleError(ContactService.NAME, responsePacket.data.code, contactOrGroup);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            let data = responsePacket.data.data;
            // 更新到存储
            this.storage.deleteTopList(data.topId);

            if (handleSuccess) {
                handleSuccess(contactOrGroup);
            }
        });
    }

    /**
     * 搜索指定关键字的联系人或群组。
     * @param {string} keyword 
     * @param {function} handleSuccess 搜索执行成功回调。参数：({@linkcode result}:{@link ContactSearchResult}) 。
     * @param {function} handleFailure 搜索执行失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    search(keyword, handleSuccess, handleFailure) {
        let packet = new Packet(ContactAction.Search, {
            "keyword": keyword.toString()
        });
        this.pipeline.send(ContactService.NAME, packet, (pipeline, source, responsePacket) => {
            if (null == responsePacket || responsePacket.getStateCode() != PipelineState.OK) {
                let error = new ModuleError(ContactService.NAME, ContactServiceState.ServerError, keyword);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            if (responsePacket.data.code != ContactServiceState.Ok) {
                let error = new ModuleError(ContactService.NAME, responsePacket.data.code, keyword);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            let resultData = responsePacket.data.data;
            let numContacts = resultData.contactList.length;
            let numGroups = resultData.groupList.length;

            let gotContact = (0 == numContacts);
            let gotGroup = (0 == numGroups);

            if (gotContact && gotGroup) {
                handleSuccess(resultData);
                return;
            }

            let contactList = [];
            let groupList = [];

            let handler = () => {
                if (gotContact && gotGroup) {
                    resultData.contactList = contactList;
                    resultData.groupList = groupList;
                    handleSuccess(resultData);
                }
            };

            for (let i = 0; i < numContacts; ++i) {
                let json = resultData.contactList.shift();
                this.getContact(json.id, (contact) => {
                    contactList.push(contact);

                    if (contactList.length == numContacts) {
                        gotContact = true;
                        handler();
                    }
                });
            }

            for (let i = 0; i < numGroups; ++i) {
                let json = resultData.groupList.shift();
                this.getGroup(json.id, (group) => {
                    groupList.push(group);

                    if (groupList.length == numGroups) {
                        gotGroup = true;
                        handler();
                    }
                });
            }
        });
    }
}

/**
 * 搜索结果定义。
 * @typedef {object} ContactSearchResult
 * @property {string} keyword 检索的关键词。
 * @property {Array} contactList 联系人列表。
 * @property {Array} groupList 群组列表。
 */
