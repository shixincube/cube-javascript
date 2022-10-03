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
import { PipelineListener } from "../core/PipelineListener";
import { ContactService } from "./ContactService";
import { ContactAction } from "./ContactAction";
import { PipelineState } from "../core/PipelineState";

/**
 * 联系人数据管道监听器。
 * @extends PipelineListener
 */
export class ContactPipelineListener extends PipelineListener {

    /**
     * @param {ContactService} contactService 联系人模块实例。
     */
    constructor(contactService) {
        super();

        /**
         * 联系人模块实例。
         * @type {ContactService}
         */
        this.contactService = contactService;
    }

    /**
     * @inheritdoc
     */
    onReceived(pipeline, source, packet) {
        super.onReceived(pipeline, source, packet);

        if (packet.getStateCode() != PipelineState.OK) {
            cell.Logger.w('ContactPipelineListener', 'Pipeline error: ' + packet.name + ' - ' + packet.getStateCode());

            if (packet.name == ContactAction.SignIn) {
                this.contactService.signing = false;
            }

            return;
        }

        if (packet.name == ContactAction.SignIn) {
            this.contactService.triggerSignIn(packet.data);
        }
        else if (packet.name == ContactAction.ListGroups) {
            this.contactService.triggerListGroups(packet.data);
        }
        else if (packet.name == ContactAction.ModifyGroup) {
            this.contactService.triggerModifyGroup(packet.data);
        }
        else if (packet.name == ContactAction.ModifyGroupMember) {
            this.contactService.triggerModifyGroupMember(packet.data);
        }
        else if (packet.name == ContactAction.CreateGroup) {
            this.contactService.triggerCreateGroup(packet.data);
        }
        else if (packet.name == ContactAction.DismissGroup) {
            this.contactService.triggerDismissGroup(packet.data);
        }
        else if (packet.name == ContactAction.RemoveGroupMember) {
            this.contactService.triggerRemoveMember(packet.data);
        }
        else if (packet.name == ContactAction.AddGroupMember) {
            this.contactService.triggerAddMember(packet.data);
        }
        else if (packet.name == ContactAction.GroupAppendixUpdated) {
            this.contactService.triggerGroupAppendixUpdated(packet.data);
        }
        else if (packet.name == ContactAction.SignOut) {
            this.contactService.triggerSignOut(packet.data);
        }
    }

    /**
     * @inheritdoc
     */
    onOpened(pipeline) {
        super.onOpened(pipeline);

        if (null != this.contactService.self) {
            if (!this.contactService.selfReady) {
                cell.Logger.d('ContactPipelineListener', 'Call "SignIn" in "onOpened": ' + this.contactService.self.getId());
                // 签入已经设置的 Self
                let timer = setTimeout(() => {
                    clearTimeout(timer);
                    this.contactService.signIn(this.contactService.self);
                }, 100);
            }
            else {
                // 恢复 Self
                let timer = setTimeout(() => {
                    clearTimeout(timer);
                    this.contactService.comeback();
                }, 100);
            }
        }
    }

    /**
     * @inheritdoc
     */
    onClosed(pipeline) {
        super.onClosed(pipeline);
    }

    /**
     * @inheritdoc
     */
    onFailed(pipeline, error) {
        super.onFailed(pipeline, error);
    }
}
