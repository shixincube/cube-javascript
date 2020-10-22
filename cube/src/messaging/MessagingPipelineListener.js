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

import { PipelineListener } from "../core/PipelineListener";
import { MessagingService } from "./MessagingService";
import { MessagingAction } from "./MessagingAction";
import { StateCode } from "../core/StateCode";

/**
 * 消息模块数据管道监听器。
 */
export class MessagingPipelineListener extends PipelineListener {

    /**
     * 构造函数。
     * @param {MessagingService} messagingService 
     */
    constructor(messagingService) {
        super();
        this.messagingService = messagingService;
    }

    /**
     * @inheritdoc
     */
    onReceived(pipeline, source, packet) {
        super.onReceived(pipeline, source, packet);

        if (packet.getStateCode() != StateCode.OK) {
            cell.Logger.w('MessagingPipelineListener', 'Pipeline error: ' + packet.name + ' - ' + packet.getStateCode());
            return;
        }

        if (packet.name == MessagingAction.Notify) {
            this.messagingService.triggerNotify(packet.data);
        }
        else if (packet.name == MessagingAction.Pull) {
            this.messagingService.triggerPull(packet.data);
        }
    }

    /**
     * @inheritdoc
     */
    onOpened(pipeline) {
        super.onOpened(pipeline);
    }
}