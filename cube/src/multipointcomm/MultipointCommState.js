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

export const MultipointCommState = {

    /**
     * 成功。
     * @type {number}
     */
    Ok: 0,

    /**
     * 遇到故障。
     * @type {number}
     */
    Failure: 9,

    /**
     * 无效域信息。
     * @type {number}
     */
    InvalidDomain: 11,

    /**
     * 没有域信息。
     * @type {number}
     */
    NoDomain: 12,

    /**
     * 没有设备信息。
     * @type {number}
     */
    NoDevice: 15,

    /**
     * 没有找到联系人。
     * @type {number}
     */
    NoContact: 16,

    /**
     * 没有找到通讯场域。
     * @type {number}
     */
    NoCommField: 17,

    /**
     * 数据结构错误。
     * @type {number}
     */
    DataStructureError: 20,

    /**
     * 正在建立通话。
     * @type {number}
     */
    Calling: 27,

    /**
     * 主叫忙。
     * @type {number}
     */
    CallerBusy: 28,

    /**
     * 被叫忙。
     * @type {number}
     */
    CalleeBusy: 29,

    /**
     * 通话已接通。
     * @type {number}
     */
    CallConnected: 30,

    /**
     * 通话结束。
     * @type {number}
     */
    CallBye: 33,

    /**
     * 终端未初始化。
     * @type {number}
     */
    Uninitialized: 101,

    /**
     * 重复创建连接。
     * @type {number}
     */
    ConnRepeated: 103,

    /**
     * 拒绝访问媒体设备。
     * @type {number}
     */
    MediaPermissionDenied: 110,

    /**
     * 信令错误。
     * @type {number}
     */
    SignalingError: 111,

    /**
     * 创建 RTC offer 错误。
     * @type {number}
     */
    CreateOfferFailed: 121,

    /**
     * 创建 RTC answer 错误。
     * @type {number}
     */
    CreateAnswerFailed: 122,

    /**
     * 设置本地 SDP 错误。
     * @type {number}
     */
    LocalDescriptionFault: 125,

    /**
     * 设置远端 SDP 错误。
     * @type {number}
     */
    RemoteDescriptionFault: 126,

    /**
     * 服务器故障。
     * @type {number}
     */
    ServerFault: 200
}
