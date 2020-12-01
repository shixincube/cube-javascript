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

/**
 * 消息事件。
 */
export const MessagingEvent = {
    
    /**
     * 收到新消息。
     * @type {string}
     */
    Notify: 'Notify',

    /**
     * 消息已经发出。
     * @type {string}
     */
    Sent: 'Sent',

    /**
     * 消息正在发送。
     * @type {string}
     */
    Sending: 'Sending',

    /**
     * 消息被撤回。
     * @type {string}
     */
    Recall: 'Recall',

    /**
     * 消息被删除。
     */
    Delete: 'Delete',

    /**
     * 消息已读。
     */
    Read: 'Read',

    /**
     * 消息处理故障。
     * @type {string}
     */
    Fault: 'Fault',

    /**
     * 未知时间。仅用于调试。
     * @type {string}
     * @private
     */
    Unknown: 'Unknown'
}
