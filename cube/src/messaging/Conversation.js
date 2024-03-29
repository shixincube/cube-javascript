/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020-2023 Cube Team.
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
import { AuthService } from "../auth/AuthService";

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

    /**
     * 获取关联的联系人。
     * @returns {Contact} 返回关联的联系人。
     */
    getContact() {
        if (this.type == ConversationType.Contact)
            return this.pivotal;
        else
            return null;
    }

    /**
     * 获取关联的群组。
     * @returns {Group} 返回关联的群组。
     */
    getGroup() {
        if (this.type == ConversationType.Group)
            return this.pivotal;
        else
            return null;
    }

    /**
     * 获取会话名。
     * @returns {string} 返回会话名称。
     */
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

    /**
     * 获取会话装填。
     * @see ConversationState
     * @returns {number} 返回会话状态，参看 {@link ConversationState} 。
     */
    getState() {
        return this.state;
    }

    /**
     * 获取会话类型。
     * @see ConversationType
     * @returns {number} 返回会话类型，参看 {@link ConversationType} 。
     */
    getType() {
        return this.type;
    }

    /**
     * 获取会话提醒类型。
     * @see ConversationReminding
     * @returns {number} 返回会话提醒类型，参看 {@link ConversationReminding} 。
     */
    getReminding() {
        return this.reminding;
    }

    /**
     * 设置最近一条消息。
     * @param {Message} message 
     */
    setRecentMessage(message) {
        this.recentMessage = message;
        if (this.recentMessage.timestamp > this.timestamp) {
            this.timestamp = this.recentMessage.timestamp;
        }
    }

    /**
     * 获取最近一条消息。
     * @returns {Message} 返回最近一条消息记录。
     */
    getRecentMessage() {
        return this.recentMessage;
    }

    getPivotal() {
        return this.pivotal;
    }

    /**
     * @inheritdoc
     */
    toJSON() {
        let json = super.toCompactJSON();
        json.domain = AuthService.DOMAIN;
        json.ownerId = this.ownerId;
        json.type = this.type;
        json.state = this.state;
        json.reminding = this.reminding;
        json.pivotalId = this.pivotalId;
        json.unread = this.unread;

        if (null != this.recentMessage) {
            json.recentMessage = this.recentMessage.toJSON();
        }

        if (null != this.avatarName) {
            json.avatarName = this.avatarName;
        }

        if (null != this.avatarURL) {
            json.avatarURL = this.avatarURL;
        }

        return json;
    }

    /**
     * @inheritdoc
     */
    toCompactJSON() {
        let json = this.toJSON();
        if (undefined !== json.recentMessage) {
            delete json.recentMessage;
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
        conversation.reminding = json.reminding;
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
