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
 import { Entity } from "../core/Entity";
 import { ConversationType } from "./ConversationType";
 import { ConversationState } from "./ConversationState";
 import { ConversationReminding } from "./ConversationReminding";
 import { Message } from "./Message";

/**
 * 消息会话。
 * @extends Entity
 */
export class Conversation extends Entity {

    constructor(id, timestamp) {
        super(id, timestamp);

        /**
         * 会话所属的联系人 ID 。
         * @type {number}
         */
        this.ownerId = 0;

        /**
         * 会话类型。
         * @type {ConversationType}
         */
        this.type = ConversationType.Other;

        /**
         * 会话状态。
         * @type {ConversationState}
         */
        this.state = ConversationState.Normal;

        /**
         * 会话的提醒类型。
         * @type {ConversationReminding}
         */
        this.reminding = ConversationReminding.Normal;

        /**
         * 与会话相关的关键实体的 ID 。
         * @type {number}
         */
        this.pivotalId = 0;

        /**
         * 与会话相关的关键实体。
         * @type {Entity}
         */
        this.pivotal = null;

        /**
         * 未读数量。
         * @type {number}
         */
        this.unread = 0;

        /**
         * 最近的消息。
         * @type {Message}
         */
        this.recentMessage = null;

        /**
         * 会话头像的 URL 。
         * @type {string}
         */
        this.avatarURL = null;

        /**
         * 会话头像名。
         * @type {string}
         */
        this.avatarName = null;
    }

    getContact() {
        if (this.type == ConversationType.Contact)
            return this.pivotal;
        else
            return null;
    }

    getGroup() {
        if (this.type == ConversationType.Group)
            return this.pivotal;
        else
            return null;
    }

    getName() {
        if (this.type == ConversationType.Contact) {
            return this.pivotal.getPriorityName();
        }
        else if (this.type == ConversationType.Group) {
            return this.pivotal.getName();
        }
        else {
            return '';
        }
    }

    getState() {
        return this.state;
    }

    getType() {
        return this.type;
    }

    getReminding() {
        return this.reminding;
    }

    getPivotal() {
        return this.pivotal;
    }

    /**
     * @inheritdoc
     */
    toJSON() {
        let json = super.toJSON();
        json.ownerId = this.ownerId;
        json.type = this.type;
        json.state = this.state;
        json.reminding = this.reminding;
        json.pivotalId = this.pivotalId;
        json.unread = this.unread;

        if (null != this.recentMessage) {
            json.recentMessage = this.recentMessage.toJSON();
        }

        return json;
    }

    /**
     * 从 JSON 数据创建 {@link Conversation} 对象。
     * @private
     * @param {JSON} json 符合格式的 JSON 对象。
     * @returns {Conversation} 返回 {@link Conversation} 实例。
     */
    static create(json) {
        let conversation = new Conversation(json.id, json.timestamp);
        conversation.ownerId = (undefined !== json.owner) ? json.owner : json.ownerId;
        conversation.type = json.type;
        conversation.state = json.state;
        conversation.reminding = (undefined !== json.remind) ? json.remind : json.reminding;
        conversation.pivotalId = (undefined !== json.pivotal) ? json.pivotal : json.pivotalId;

        if (undefined !== json.unread) {
            conversation.unread = json.unread;
        }

        if (undefined !== json.recentMessage) {
            conversation.recentMessage = Message.create(json.recentMessage);
        }

        if (undefined !== json.avatarURL) {
            conversation.avatarURL = json.avatarURL;
        }

        if (undefined !== json.avatarName) {
            conversation.avatarName = json.avatarName;
        }

        return conversation;
    }
}
