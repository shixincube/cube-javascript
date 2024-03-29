/**
 * This source file is part of Cell.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020-2023 Shixin Cube Team.
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

import { MessagePlugin } from "../MessagePlugin";
import { TextMessage } from "./TextMessage";
import { ImageMessage } from "./ImageMessage";
import { FileMessage } from "./FileMessage";
import { CallRecordMessage } from "./CallRecordMessage";
import { HyperTextMessage } from "./HyperTextMessage";
import { LocalNoteMessage } from "./LocalNoteMessage";

/**
 * 消息类型插件。
 */
export class MessageTypePlugin extends MessagePlugin {

    constructor() {
        super();
    }

    /**
     * 当消息需要实例化（分化）时调用该回调。
     * @param {Message} message 原始消息实例。
     * @returns {*} 消息实例。
     */
    onInstantiate(message) {
        let payload = message.getPayload();

        if (undefined !== payload.type) {
            if (payload.type == 'text') {
                return new TextMessage(message);
            }
            else if (payload.type == 'hypertext') {
                return new HyperTextMessage(message);
            }
            else if (payload.type == 'file') {
                return new FileMessage(message);
            }
            else if (payload.type == 'image') {
                return new ImageMessage(message);
            }
            else if (payload.type == 'call') {
                return new CallRecordMessage(message);
            }
            else if (payload.type == 'localnote') {
                return new LocalNoteMessage(message);
            }
        }

        return message;
    }
}
