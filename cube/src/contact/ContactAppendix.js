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
import { StateCode } from "../core/StateCode";
import { Contact } from "./Contact";
import { ContactAction } from "./ContactAction";
import { ContactService } from "./ContactService";
import { ContactServiceState } from "./ContactServiceState";

/**
 * 联系人附录。
 */
export class ContactAppendix {

    /**
     * @param {ContactService} service 
     * @param {Contact} owner 
     */
    constructor(service, owner) {
        /**
         * @private
         * @type {ContactService}
         */
        this.service = service;

        /**
         * @private
         * @type {Contact}
         */
        this.owner = owner;

        /**
         * 该联系人针对当前签入联系人的备注名。
         * @private
         * @type {string}
         */
        this.remarkName = '';

        /**
         * 该联系人的赋值数据。
         * @private
         * @type {object}
         */
        this.assignedData = null;
    }

    /**
     * 是否设置了备注名。
     * @returns {boolean} 如果设置了备注名返回 {@linkcode true} 。
     */
    hasRemarkName() {
        if (null != this.remarkName && this.remarkName.length > 0) {
            return true;
        }
        else {
            return false;
        }
    }

    /**
     * 获取备注名。
     * @returns {string} 返回备注名。
     */
    getRemarkName() {
        return this.remarkName;
    }

    /**
     * 更新备注名。
     * @param {string} name 新的备注名。
     * @param {function} [handleSuccess] 成功回调。参数：({@linkcode appendix}:{@link ContactAppendix}) 。
     * @param {function} [handleFailure] 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    updateRemarkName(name, handleSuccess, handleFailure) {
        let request = new Packet(ContactAction.UpdateAppendix, {
            "contactId": this.owner.getId(),
            "remarkName": name
        });

        this.service.pipeline.send(ContactService.NAME, request, (pipeline, source, packet) => {
            if (null == packet || packet.getStateCode() != StateCode.OK) {
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

            // 修改备注名
            this.remarkName = name;

            if (handleSuccess) {
                handleSuccess(this);
            }
        });
    }

    getAssignedData(key) {
        if (null == this.assignedData) {
            return null;
        }

        return this.assignedData[key];
    }

    /**
     * 
     * @param {string} key 
     * @param {JSON} value 
     * @param {function} [handleSuccess] 成功回调。参数：({@linkcode appendix}:{@link ContactAppendix}) 。
     * @param {function} [handleFailure] 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     * @returns {boolean}
     */
    setAssignedData(key, value, handleSuccess, handleFailure) {
        if (this.service.self.id != this.owner.id || typeof value != 'object') {
            return false;
        }

        if (null == this.assignedData) {
            this.assignedData = {};
        }

        // 赋值
        this.assignedData[key] = value;

        let request = new Packet(ContactAction.UpdateAppendix, {
            "contactId": this.owner.getId(),
            "assignedData": this.assignedData
        });

        this.service.pipeline.send(ContactService.NAME, request, (pipeline, source, packet) => {
            if (null == packet || packet.getStateCode() != StateCode.OK) {
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

            if (handleSuccess) {
                handleSuccess(this);
            }
        });

        return true;
    }
}
