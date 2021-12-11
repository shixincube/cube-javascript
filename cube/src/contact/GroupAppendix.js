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

import { ModuleError } from "../core/error/ModuleError";
import { Packet } from "../core/Packet";
import { PipelineState } from "../core/PipelineState";
import { JSONable } from "../util/JSONable";
import { OrderMap } from "../util/OrderMap";
import { Contact } from "./Contact";
import { ContactAction } from "./ContactAction";
import { ContactService } from "./ContactService";
import { ContactServiceState } from "./ContactServiceState";
import { Group } from "./Group";

/**
 * 群组附录。
 * 
 * FIXME 2021-11-17 XJW 增加了 following 属性
 */
export class GroupAppendix extends JSONable {

    /**
     * @param {ContactService} service 
     * @param {Group} group 
     */
    constructor(service, group) {
        super();

        /**
         * @private
         * @type {ContactService}
         */
        this.service = service;

        /**
         * @private
         * @type {Group}
         */
        this.group = group;

        /**
         * 当前联系人对该群的备注。
         * @private
         * @type {string}
         */
        this.remark = null;

        /**
         * 群组的公告。
         * @private
         * @type {string}
         */
        this.notice = '';

        /**
         * @private
         * @type {OrderMap}
         */
        this.memberRemarkMap = new OrderMap();

        /**
         * 当前联系人对该群组的标记上下文。
         * @private
         * @type {JSON}
         */
        this.context = null;

        /**
         * 当前关联的通讯 ID 。
         * @private
         * @type {number}
         */
        this.commId = 0;
    }

    /**
     * 是否设置了群的备注。
     * @returns {boolean} 如果设置了备注名返回 {@linkcode true} 。
     */
    hasRemark() {
        if (null != this.remark && this.remark.length > 0) {
            return true;
        }
        else {
            return false;
        }
    }

    /**
     * 获取群的备注信息。
     * @returns {string} 返回群的备注信息。
     */
    getRemark() {
        return this.remark;
    }

    /**
     * 获取群的公告。
     * @returns {string} 返回群的公告。
     */
    getNotice() {
        return this.notice;
    }

    /**
     * 获取群组成员的备注。
     * @param {Contact|number} member 指定群成员或者成员 ID 。
     * @returns {string} 返回群组成员的备注。
     */
    getMemberRemark(member) {
        if (member instanceof Contact) {
            return this.memberRemarkMap.get(member.getId());
        }
        else {
            return this.memberRemarkMap.get(parseInt(member));
        }
    }

    /**
     * 是否备注了指定成员。
     * @param {Contact|number} member 指定群成员或者成员 ID 。
     * @returns {boolea} 如果有该成员的备注，返回 {@linkcode true} 。
     */
    hasMemberRemark(member) {
        if (member instanceof Contact) {
            return this.memberRemarkMap.containsKey(member.getId());
        }
        else {
            return this.memberRemarkMap.containsKey(parseInt(member));
        }
    }

    /**
     * 仅用于维护本地数据。
     * @private
     * @param {Contact|number|string} member 
     * @param {string} remark 
     */
    setMemberRemark(member, remark) {
        this.memberRemarkMap.put((member instanceof Contact) ? member.getId() : parseInt(member), remark);
    }

    /**
     * 仅用于维护本地数据。
     * @private
     * @param {Array} array 
     */
    setMemberRemarks(array) {
        for (let i = 0; i < array.length; ++i) {
            let mr = array[i];
            this.memberRemarkMap.put(mr.id, mr.name);
        }
    }

    /**
     * 获取当前通讯 ID 。
     * @param {function} handleSuccess
     * @param {function} handleFailure
     * @returns {number} 当 {@linkcode handleSuccess} 和 {@linkcode handleFailure} 返回当前通讯 ID 。
     */
    getCommId(handleSuccess, handleFailure) {
        if (undefined === handleSuccess && undefined === handleFailure) {
            return this.commId;
        }

        let request = new Packet(ContactAction.GetAppendix, {
            "groupId": this.group.getId(),
            "commId": this.commId
        });
        this.service.pipeline.send(ContactService.NAME, request, (pipeline, source, packet) => {
            if (null == packet || packet.getStateCode() != PipelineState.OK) {
                let error = new ModuleError(ContactService.NAME, ContactServiceState.ServerError, this);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            if (packet.getPayload().code != ContactServiceState.Ok) {
                let error = new ModuleError(ContactService.NAME, packet.getPayload().code, this);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            // 更新
            this.commId = packet.getPayload().data.commId;

            handleSuccess(this.commId, this, this.group);
        });
    }

    /**
     * 更新备注信息。
     * @param {string} content 新的备注信息。
     * @param {function} [handleSuccess] 成功回调。参数：({@linkcode appendix}:{@link GroupAppendix}) 。
     * @param {function} [handleFailure] 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    updateRemark(content, handleSuccess, handleFailure) {
        let request = new Packet(ContactAction.UpdateAppendix, {
            "groupId": this.group.getId(),
            "remark": content
        });

        this.service.pipeline.send(ContactService.NAME, request, (pipeline, source, packet) => {
            if (null == packet || packet.getStateCode() != PipelineState.OK) {
                let error = new ModuleError(ContactService.NAME, ContactServiceState.ServerError, this);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            if (packet.getPayload().code != ContactServiceState.Ok) {
                let error = new ModuleError(ContactService.NAME, packet.getPayload().code, this);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            // 修改备注信息
            this.remark = content;

            if (handleSuccess) {
                handleSuccess(this);
            }
        });
    }

    /**
     * 更新公告信息。
     * @param {string} notice 新的群组公告。
     * @param {function} [handleSuccess] 成功回调。参数：({@linkcode appendix}:{@link GroupAppendix}) 。
     * @param {function} [handleFailure] 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    updateNotice(notice, handleSuccess, handleFailure) {
        let request = new Packet(ContactAction.UpdateAppendix, {
            "groupId": this.group.getId(),
            "notice": notice
        });

        this.service.pipeline.send(ContactService.NAME, request, (pipeline, source, packet) => {
            if (null == packet || packet.getStateCode() != PipelineState.OK) {
                let error = new ModuleError(ContactService.NAME, ContactServiceState.ServerError, this);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            if (packet.getPayload().code != ContactServiceState.Ok) {
                let error = new ModuleError(ContactService.NAME, packet.getPayload().code, this);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            // 修改公告
            this.notice = notice;

            if (handleSuccess) {
                handleSuccess(this);
            }
        });
    }

    /**
     * 更新群组成员备注。
     * @param {Contact|number} member 指定群成员。
     * @param {string} remark 指定群成员的备注。
     * @param {function} [handleSuccess] 成功回调。参数：({@linkcode appendix}:{@link GroupAppendix}) 。
     * @param {function} [handleFailure] 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    updateMemberRemark(member, remark, handleSuccess, handleFailure) {
        let request = new Packet(ContactAction.UpdateAppendix, {
            "groupId": this.group.getId(),
            "memberRemark": {
                "id": (member instanceof Contact) ? member.getId() : parseInt(member),
                "name": remark
            }
        });

        this.service.pipeline.send(ContactService.NAME, request, (pipeline, source, packet) => {
            if (null == packet || packet.getStateCode() != PipelineState.OK) {
                let error = new ModuleError(ContactService.NAME, ContactServiceState.ServerError, this);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            if (packet.getPayload().code != ContactServiceState.Ok) {
                let error = new ModuleError(ContactService.NAME, packet.getPayload().code, this);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            // 修改成员备注
            this.setMemberRemark(member, remark);

            if (handleSuccess) {
                handleSuccess(this);
            }
        });
    }

    /**
     * 更新群组对应的通讯 ID 。
     * @param {number} id 指定通讯 ID 。
     * @param {function} [handleSuccess] 成功回调。参数：({@linkcode appendix}:{@link GroupAppendix}) 。
     * @param {function} [handleFailure] 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    updateCommId(id, handleSuccess, handleFailure) {
        let request = new Packet(ContactAction.UpdateAppendix, {
            "groupId": this.group.getId(),
            "commId": id
        });

        this.service.pipeline.send(ContactService.NAME, request, (pipeline, source, packet) => {
            if (null == packet || packet.getStateCode() != PipelineState.OK) {
                let error = new ModuleError(ContactService.NAME, ContactServiceState.ServerError, this);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            if (packet.getPayload().code != ContactServiceState.Ok) {
                let error = new ModuleError(ContactService.NAME, packet.getPayload().code, this);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            // 更新通讯 ID
            this.commId = id;

            if (handleSuccess) {
                handleSuccess(this);
            }
        });
    }

    /**
     * @inheritdoc
     */
     toJSON() {
        let json = super.toJSON();
        json.id = this.group.getId();

        json.notice = this.notice;

        if (null != this.remark) {
            json.remark = this.remark;
        }

        json.memberRemarks = [];
        this.memberRemarkMap.keySet().forEach((key) => {
            let value = this.memberRemarkMap.get(key);
            json.memberRemarks.push({ id: key, name: value });
        });

        if (null != this.context) {
            json.context = this.context;
        }

        json.commId = this.commId;

        return json;
    }

    /**
     * @inheritdoc
     */
    toCompactJSON() {
        return this.toJSON();
    }

    /**
     * 创建群组附录实例。
     * @param {ContactService} service 
     * @param {Group} group 
     * @param {JSON} json 
     * @returns {GroupAppendix}
     */
    static create(service, group, json) {
        let appendix = new GroupAppendix(service, group);

        appendix.notice = json.notice;

        json.memberRemarks.forEach((value) => {
            appendix.memberRemarkMap.put(value.id, value.name);
        });

        if (json.remark) {
            appendix.remark = json.remark;
        }

        if (json.context) {
            appendix.context = json.context;
        }

        if (undefined !== json.commId) {
            appendix.commId = json.commId;
        }

        return appendix;
    }
}
