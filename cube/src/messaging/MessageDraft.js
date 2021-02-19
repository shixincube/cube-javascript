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

import { Entity } from "../core/Entity";
import { Contact } from "../contact/Contact";
import { Group } from "../contact/Group";
import { Message } from "./Message";

/**
 * 消息草稿。
 * @extends Entity
 */
export class MessageDraft extends Entity {

    /**
     * @param {Contact|Group|number} owner 草稿归属的实体对象。
     * @param {Message} message 草稿的消息内容。
     */
    constructor(owner, message) {
        super();

        /**
         * 草稿归属的实体对象。
         * @type {Contact|Group|number}
         */
        this.ownerId = (typeof owner === 'number') ? owner : owner.getId();

        /**
         * 草稿的消息内容。
         * @type {Message}
         */
        this.message = message;
    }

    /**
     * 返回草稿的所属实体 ID 。
     * @returns {number} 返回草稿的所属实体 ID 。
     */
    getOwnerId() {
        return this.ownerId;
    }

    /**
     * 获取草稿的消息实体。
     * @returns {Message} 返回草稿的消息实体。
     */
    getMessage() {
        return this.message;
    }

    /**
     * @inheritdoc
     */
    toJSON() {
        let json = super.toJSON();
        json.owner = this.ownerId;
        json.message = this.message.toJSON();
        return json;
    }
}
