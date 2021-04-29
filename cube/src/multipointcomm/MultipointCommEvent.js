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
 * 多方通讯事件。
 */
export const MultipointCommEvent = {

    /**
     * 有新的呼叫。
     * @type {string}
     */
    NewCall: 'NewCall',

    /**
     * 正在处理呼叫。
     * @type {string}
     */
    InProgress: 'InProgress',

    /**
     * 对方振铃。
     * @type {string}
     */
    Ringing: 'Ringing',

    /**
     * 已经建立连接。
     * @type {string}
     */
    Connected: 'Connected',

    /**
     * 对方忙。
     * @type {string}
     */
    Busy: 'Busy',

    /**
     * 结束当前呼叫。
     * @type {string}
     */
    Bye: 'Bye',

    /**
     * 被邀请加入通话。
     * @type {string}
     */
    Invited: 'Invited',

    /**
     * 呼叫超时。
     * @type {string}
     */
    Timeout: 'Timeout',

    /**
     * 媒体建立连接。
     */
    MediaConnected: 'MediaConnected',

    /**
     * 媒体断开连接。
     */
    MediaDisconnected: 'MediaDisconnected',

    /**
     * 呼叫发生错误。
     * @type {string}
     */
    CallFailed: 'CallFailed'
}
