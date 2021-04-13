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

import cell from "@lib/cell-lib";
import { Entity } from "../core/Entity";
import { MessageState } from "./MessageState";
import { AuthService } from "../auth/AuthService";
import { FileAttachment } from "../filestorage/FileAttachment";
import { Contact } from "../contact/Contact";
import { Group } from "../contact/Group";

/**
 * 消息实体。
 * @extends Entity
 */
export class Message extends Entity {

    /**
     * @param {JSON|Message|File} payload 消息负载或者消息文件附件。
     * @param {File} [file] 文件附件。
     */
    constructor(payload, file) {
        super();

        // 是否从源克隆
        let cloning = (undefined !== payload && payload instanceof Message);

        /**
         * 消息 ID 。
         * @type {number}
         */
        this.id = cloning ? payload.id : cell.Utils.generateSerialNumber();

        /**
         * 所在域。
         * @private
         * @type {string}
         */
        this.domain = cloning ? payload.domain : AuthService.DOMAIN;

        /**
         * 消息负载数据。
         * @type {JSON}
         */
        this.payload = null;

        if (cloning) {
            this.payload = payload.payload;
        }
        else {
            if (undefined !== payload && null != payload && !(payload instanceof File)) {
                this.payload = payload;
            }
            else {
                this.payload = {};
            }
        }

        /**
         * 消息发送方 ID 。
         * @type {number}
         */
        this.from = cloning ? payload.from : 0;

        /**
         * 消息发件人。
         * @type {Contact}
         */
        this.sender = cloning ? payload.sender : null;

        /**
         * 消息接收方 ID 。
         * @type {number}
         */
        this.to = cloning ? payload.to : 0;

        /**
         * 消息收件人。
         * @type {Contact}
         */
        this.receiver = cloning ? payload.receiver : null;

        /**
         * 消息的收发源。该属性表示消息在一个广播域里的域标识或者域 ID 。
         * @type {number}
         */
        this.source = cloning ? payload.source : 0;

        /**
         * 消息的收发群组。
         * @type {Group}
         */
        this.sourecGroup = cloning ? payload.sourecGroup : null;

        /**
         * 消息持有者 ID 。
         * @type {number}
         */
        this.owner = cloning ? payload.owner : 0;

        /**
         * 本地时间戳。
         * @type {number}
         */
        this.localTS = cloning ? payload.localTS : 0;

        /**
         * 服务器端时间戳。
         * @type {number}
         */
        this.remoteTS = cloning ? payload.remoteTS : 0;

        /**
         * 消息附件。
         * @type {FileAttachment}
         */
        this.attachment = null;

        if (cloning) {
            this.attachment = payload.attachment;
        }
        else if (payload instanceof File) {
            this.attachment = new FileAttachment(payload);
        }
        else if (undefined !== file && null != file && file instanceof File) {
            this.attachment = new FileAttachment(file);
        }

        /**
         * 消息状态描述。
         * @type {number}
         * @see MessageState
         */
        this.state = cloning ? payload.state : MessageState.Unknown;

        /**
         * 消息作用域。
         * 0 - 无限制
         * 1 - 仅作用于发件人
         * @private
         * @type {number}
         */
        this.scope = cloning ? payload.scope : 0;
    }

    /**
     * 获取域。
     * @returns {string} 返回域。
     */
    getDomain() {
        return this.domain;
    }

    /**
     * 获取消息发送方的 ID 。
     * @returns {number} 返回消息发送方的 ID 。
     */
    getFrom() {
        return this.from;
    }

    /**
     * 获取消息的发件人。
     * @returns {Contact} 返回消息发件人对象实例。
     */
    getSender() {
        return this.sender;
    }

    /**
     * 获取消息接收方的 ID 。
     * @returns {number} 返回消息接收方的 ID 。
     */
    getTo() {
        return this.to;
    }

    /**
     * 获取消息的收件人。
     * @returns {Contact} 返回消息的收件人对象实例。
     */
    getReceiver() {
        return this.receiver;
    }

    /**
     * 获取消息的收发源。该属性表示消息在一个广播域里的域标识或者域 ID 。
     * @returns {number}
     */
    getSource() {
        return this.source;
    }

    /**
     * 获取消息的收发来源群组。
     * @returns {Group} 返回消息的收发来源的群组对象实例。
     */
    getSourceGroup() {
        return this.sourecGroup;
    }

    /**
     * 获取消息的负载数据。
     * @returns {JSON} 返回消息的负载数据。
     */
    getPayload() {
        return this.payload;
    }

    /**
     * 设置消息的负载。
     * @param {JSON} payload 负载数据。
     */
    setPayload(payload) {
        this.payload = payload;
    }

    /**
     * 获取消息的本地时间戳。
     * @returns {number} 返回消息的本地时间戳。
     */
    getLocalTimestamp() {
        return this.localTS;
    }

    /**
     * 获取消息的服务器时间戳。
     * @returns {number} 返回消息的服务器时间戳。
     */
    getRemoteTimestamp() {
        return this.remoteTS;
    }

    /**
     * 获取消息的摘要。
     * @returns {string} 返回消息的摘要。
     */
    getSummary() {
        return this.payload.toString();
    }

    /**
     * 获取消息的状态。
     * @returns {number} 返回消息状态。
     * @see MessageState
     */
    getState() {
        return this.state;
    }

    /**
     * 标记消息仅作用于发件人的设备。
     */
    markOnlyOwner() {
        this.scope = 1;
    }

    /**
     * 消息是否是已读状态。
     * @returns {boolean} 如果消息是已读状态返回 {@linkcode true} 。
     */
    isRead() {
        if (this.owner == 0 || this.from == this.owner) {
            return true;
        }

        return (this.state == MessageState.Read);
    }

    /**
     * 设置文件附件。
     * @param {File|FileAttachment} file 指定文件实例。
     */
    setAttachment(file) {
        if (file instanceof File) {
            this.attachment = new FileAttachment(file);
        }
        else if (file instanceof FileAttachment) {
            this.attachment = file;
        }
    }

    /**
     * 获取消息的文件附件。
     * @returns {FileAttachment} 返回消息的文件附件。
     */
    getAttachment() {
        return this.attachment;
    }

    /**
     * 消息是否有附件。
     * @returns {boolean} 如果有附件返回 {@linkcode true} ，否则返回 {@linkcode false} 。
     */
    hasAttachment() {
        return (null != this.attachment);
    }

    /**
     * 是否来自群组。
     * @returns {number} 如果消息来自群组返回 {@linkcode true} ，否则返回 {@linkcode false} 。
     */
    isFromGroup() {
        return this.source > 0;
    }

    /**
     * 获取群组 ID 。
     * @returns {number} 返回群组 ID 。
     */
    getGroupId() {
        return this.source;
    }

    /**
     * 从指定源复制消息数据。
     * @protected
     * @param {Message} src 指定复制源。
     */
    clone(src) {
        this.id = src.id;
        this.domain = src.domain;
        this.from = src.from;
        this.to = src.to;
        this.source = src.source;
        this.owner = src.owner;
        this.localTS = src.localTS;
        this.remoteTS = src.remoteTS;
        this.state = src.state;
        this.scope = src.scope;
        this.payload = src.payload;
        this.attachment = src.attachment;
    }

    /**
     * @inheritdoc
     */
    toJSON() {
        let json = super.toJSON();
        json["id"] = this.id;
        json["domain"] = this.domain;
        json["from"] = this.from;
        json["to"] = this.to;
        json["source"] = this.source;
        json["owner"] = this.owner;
        json["lts"] = this.localTS;
        json["rts"] = this.remoteTS;
        json["state"] = this.state;
        json["scope"] = this.scope;
        json["payload"] = this.payload;

        if (null != this.attachment) {
            json["attachment"] = this.attachment.toJSON();
        }
        return json;
    }

    /**
     * 从 JSON 数据创建 {@link Message} 对象。
     * @private
     * @param {JSON} json 符合格式的 JSON 对象。
     * @returns {Message} 返回 {@link Message} 实例。
     */
    static create(json) {
        let message = new Message();
        message.id = json.id;
        message.domain = json.domain;
        message.from = json.from;
        message.to = json.to;
        message.source = json.source;
        message.owner = json.owner;
        message.localTS = json.lts;
        message.remoteTS = json.rts;
        message.state = json.state;
        message.scope = json.scope;

        if (json.payload !== undefined) {
            message.payload = json.payload;
        }

        if (json.attachment !== undefined) {
            message.attachment = FileAttachment.create(json.attachment);
        }

        return message;
    }
}
