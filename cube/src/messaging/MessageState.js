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

/**
 * 消息状态描述。
 * @readonly
 * @enum
 * @property {number} Unknown 未知。
 * @property {number} Unsent 未发送。
 * @property {number} Sending 发送中。
 * @property {number} Sent 已发送。
 * @property {number} Read 已读。
 * @property {number} Recalled 已召回。
 * @property {number} Deleted 已删除。
 * @property {number} SendBlocked 被阻止发送。
 * @property {number} ReceiveBlocked 被阻止接收。
 * @property {number} Fault 消息出现故障。
 */
export const MessageState = {

    /**
     * 未知。
     * @type {number}
     */
    Unknown: 0,

    /**
     * 未发送。
     * @type {number}
     */
    Unsent: 5,

    /**
     * 发送中。
     * @type {number}
     */
    Sending: 9,

    /**
     * 已发送。
     * @type {number}
     */
    Sent: 10,

    /**
     * 已读。
     * @type {number}
     */
    Read: 20,

    /**
     * 已召回。
     * @type {number}
     */
    Recalled: 30,

    /**
     * 已删除。
     * @type {number}
     */
    Deleted: 40,

    /**
     * 被阻止发送。
     * @type {number}
     */
    SendBlocked: 51,

    /**
     * 被阻止接收。
     * @type {number}
     */
    ReceiveBlocked: 52,

    /**
     * 消息出现故障。
     * @type {number}
     */
    Fault: 1
}
