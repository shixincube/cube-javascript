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

/**
 * 多方通讯事件枚举。
 * @readonly
 * @enum {string}
 * @alias MultipointCommEvent
 */
const CubeMultipointCommEvent = {

    /**
     * 有新的通话邀请。
     * 事件数据：{@linkcode CallRecord} - 通话记录实例。
     * @type {string}
     */
    NewCall: 'NewCall',

    /**
     * 正在处理通话请求。
     * 事件数据：{@linkcode CallRecord} - 发起或应答通话的记录。
     * @type {string}
     */
    InProgress: 'InProgress',

    /**
     * 对方振铃。
     * 事件数据：{@linkcode CallRecord} - 通话记录实例。
     * @type {string}
     */
    Ringing: 'Ringing',

    /**
     * 已经建立连接。
     * 事件数据：{@linkcode CallRecord} - 通话记录实例。
     * @type {string}
     */
    Connected: 'Connected',

    /**
     * 对方忙。
     * 事件数据：{@linkcode CallRecord} - 通话记录实例。
     * @type {string}
     */
    Busy: 'Busy',

    /**
     * 结束当前通话。
     * 事件数据：{@linkcode CallRecord} - 通话记录实例。
     * @type {string}
     */
    Bye: 'Bye',

    /**
     * 发起邀请加入通话。
     * 事件数据：{@linkcode CommField} - 发出邀请的通讯场域的实例。
     * 事件附加数据：{@linkcode Array} - 被邀请人的 ID 清单。
     * @type {string}
     */
    Invite: 'Invite',

    /**
     * 被邀请加入通话。
     * 事件数据：{@linkcode CommField} - 发出邀请的通讯场域的实例。
     * @type {string}
     */
    Invited: 'Invited',

    /**
     * 新参与者加入。
     * 事件数据：{@linkcode CommFieldEndpoint} - 已加入终端的实例。
     * @type {string}
     */
    Arrived: 'Arrived',

    /**
     * 参与者已离开。
     * 事件数据：{@linkcode CommFieldEndpoint} - 已离开终端的实例。
     * @type {string}
     */
    Left: 'Left',

    /**
     * 已经接收参与者数据。
     * 事件数据：{@linkcode CommFieldEndpoint} - 终端的实例。
     * @type {string}
     */
    Followed: 'Followed',

    /**
     * 已经停止接收参与者数据。
     * 事件数据：{@linkcode CommFieldEndpoint} - 终端的实例。
     * @type {string}
     */
    Unfollowed: 'Unfollowed',

    /**
     * 呼叫或应答超时。
     * 事件数据：{@linkcode CallRecord} - 通话记录实例。
     * @type {string}
     */
    Timeout: 'Timeout',

    /**
     * 媒体流建立连接。
     * 事件数据：{@linkcode CallRecord} - 通话记录实例。
     * @type {string}
     */
    MediaConnected: 'MediaConnected',

    /**
     * 媒体流断开连接。
     * 事件数据：{@linkcode CallRecord} - 通话记录实例。
     * @type {string}
     */
    MediaDisconnected: 'MediaDisconnected',

    /**
     * 麦克风音量事件。
     * 事件数据：<code>{ "endpoint": endpoint, "volume": volume: "timestamp": timestamp }</code> 。
     * @type {string}
     */
    MicrophoneVolume: 'MicrophoneVolume',

    /**
     * @private
     * @type {string}
     */
    AudioMuted: 'AudioMuted',

    /**
     * @private
     * @type {string}
     */
    VideoMuted: 'VideoMuted',

    /**
     * 发生错误。
     * 事件数据：{@linkcode ModuleError} 。
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
