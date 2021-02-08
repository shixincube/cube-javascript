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
import { ContactAction } from "./ContactAction";
import { ContactService } from "./ContactService";
import { ContactServiceState } from "./ContactServiceState";
import { Group } from "./Group";

/**
 * 群组附录。
 */
export class GroupAppendix {

    /**
     * @param {ContactService} service 
     * @param {Group} owner 
     */
    constructor(service, owner) {
        /**
         * @type {ContactService}
         */
        this.service = service;

        /**
         * @type {Group}
         */
        this.owner = owner;

        /**
         * @type {string}
         */
        this.remark = null;

        /**
         * @type {string}
         */
        this.notice = '';
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
     * 更新备注信息。
     * @param {string} content 新的备注信息。
     * @param {function} [handleSuccess] 成功回调。参数：({@linkcode appendix}:{@link GroupAppendix}) 。
     * @param {function} [handleFailure] 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    updateRemark(content, handleSuccess, handleFailure) {
        let request = new Packet(ContactAction.UpdateAppendix, {
            "groupId": this.owner.getId(),
            "remark": content
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
            "groupId": this.owner.getId(),
            "notice": notice
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

            // 修改公告
            this.notice = notice;

            if (handleSuccess) {
                handleSuccess(this);
            }
        });
    }
}
