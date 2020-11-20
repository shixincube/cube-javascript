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
     * 正在建立通话。
     */
    Calling: 7,

    /**
     * 主叫忙。
     */
    CallerBusy: 8,

    /**
     * 被叫忙。
     */
    CalleeBusy: 9,

    /**
     * 终端未初始化。
     */
    Uninitialized: 101,

    /**
     * 重复创建连接。
     */
    ConnRepeated: 103,

    /**
     * 拒绝访问媒体设备。
     */
    MediaPermissionDenied: 110,

    /**
     * 
     */
    SignalingError: 111,

    /**
     * 
     */
    CreateOfferFailed: 121,

    /**
     * 
     */
    CreateAnswerFailed: 122,

    /**
     * 
     */
    LocalDescriptionFault: 125,

    /**
     * 
     */
    RemoteDescriptionFault: 126,

    /**
     * 服务器故障。
     */
    ServerFault: 200
}
