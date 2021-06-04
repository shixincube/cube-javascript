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
 * 多方通讯事件枚举。
 * @readonly
 * @enum {string}
 * @alias MultipointCommEvent
 */
const CubeMultipointCommEvent = {

    /**
     * 有新的通话邀请。
     * @type {string}
     */
    NewCall: 'NewCall',

    /**
     * 正在处理通话请求。
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
     * 新参与者加入。
     * @type {string}
     */
    Arrived: 'Arrived',

    /**
     * 参与者已离开。
     * @type {string}
     */
    Left: 'Left',

    /**
     * 已经接收参与者数据。
     * @type {string}
     */
    Followed: 'Followed',

    /**
     * 已经停止接收参与者数据。
     * @type {string}
     */
    Unfollowed: 'Unfollowed',

    /**
     * 呼叫或应答超时。
     * @type {string}
     */
    Timeout: 'Timeout',

    /**
     * 媒体流建立连接。
     * @type {string}
     */
    MediaConnected: 'MediaConnected',

    /**
     * 媒体流断开连接。
     * @type {string}
     */
    MediaDisconnected: 'MediaDisconnected',

    /**
     * 麦克风音量事件。
     * @type {string}
     */
    MicrophoneVolume: 'MicrophoneVolume',

    /**
     * 发生错误。
     * @type {string}
     */
    Failed: 'Failed',

    /**
     * 呼叫发生错误。
     * @type {string}
     * @deprecated
     */
    CallFailed: 'Failed'
}

export const MultipointCommEvent = CubeMultipointCommEvent;
