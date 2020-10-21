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

import cell from "@lib/cell-lib";
import { Entity } from "../core/Entity";
import { MessageState } from "./MessageState";
import { AuthService } from "../auth/AuthService";

/**
 * 消息实体。
 */
export class Message extends Entity {

    /**
     * 构造函数。
     * @param {JSON} payload 消息负载。
     */
    constructor(payload) {
        super();

        /**
         * 消息 ID 。
         * @type {number}
         */
        this.id = cell.Utils.generateSerialNumber();

        /**
         * 所在域。
         * @private
         * @type {string}
         */
        this.domain = AuthService.DOMAIN;

        /**
         * 消息负载数据。
         * @type {JSON}
         */
        this.payload = {};

        if (undefined !== payload && !(payload instanceof File)) {
            this.payload = payload;
        }

        /**
         * 消息发送方 ID 。
         * @type {number}
         */
        this.from = 0;

        /**
         * 消息接收方 ID 。
         * @type {number}
         */
        this.to = 0;

        /**
         * 消息的收发源。该属性表示消息在一个广播域里的域标识或者域 ID 。
         * @type {number}
         */
        this.source = 0;

        /**
         * 本地时间戳。
         * @type {number}
         */
        this.localTS = 0;

        /**
         * 服务器端时间戳。
         * @type {number}
         */
        this.remoteTS = 0;

        /**
         * 消息状态描述。
         * @type {number}
         * @see MessageState
         */
        this.state = MessageState.Unknown;
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
     * 获取消息接收方的 ID 。
     * @returns {number} 返回消息接收方的 ID 。
     */
    getTo() {
        return this.to;
    }

    /**
     * 获取消息的负载数据。
     * @returns {JSON} 返回消息的负载数据。
     */
    getPayload() {
        return this.payload;
    }

    /**
     * 获取消息的收发源。该属性表示消息在一个广播域里的域标识或者域 ID 。
     * @returns {number}
     */
    getSource() {
        return this.source;
    }

    /**
     * 获取消息的服务器时间戳。
     * @returns {number} 返回消息的服务器时间戳。
     */
    getRemoteTimestamp() {
        return this.remoteTS;
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
        this.localTS = src.localTS;
        this.remoteTS = src.remoteTS;
        this.payload = src.payload;
        this.state = src.state;
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
        json["lts"] = this.localTS;
        json["rts"] = this.remoteTS;
        json["payload"] = this.payload;
        json["state"] = this.state;
        return json;
    }

    /**
     * 从 JSON 数据创建 {@linkcode Message} 对象。
     * @param {JSON} json 符合格式的 JSON 对象。
     * @returns {Message} 返回 {@linkcode Message} 实例。
     */
    static create(json) {
        let message = new Message();
        message.id = json.id;
        message.domain = json.domain;
        message.from = json.from;
        message.to = json.to;
        message.source = json.source;
        message.localTS = json.lts;
        message.remoteTS = json.rts;

        if (json.payload !== undefined) {
            message.payload = json.payload;
        }

        if (json.state !== undefined) {
            message.state = json.state;
        }
        return message;
    }
}
