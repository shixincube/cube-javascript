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
 * 多方通讯动作。
 */
export const MultipointCommAction = {

    /**
     * 信令 Offer 。
     * @type {string}
     */
    Offer: 'offer',

    /**
     * 信令 Answer 。
     * @type {string}
     */
    Answer: 'answer',

    /**
     * 信令 Bye 。
     * @type {string}
     */
    Bye: 'bye',

    /**
     * 信令 Follow 。
     * @type {string}
     */
    Follow: 'follow',

    /**
     * 信令 Revoke 。
     * @type {string}
     */
    Revoke: 'revoke',

    /**
     * 信令忙 Busy 。
     * @type {string}
     */
    Busy: 'busy',

    /**
     * ICE 候选字收发。
     * @type {string}
     */
    Candidate: 'candidate',

    /**
     * 新的终端参与到场域。
     * @type {string}
     */
    Arrived: 'arrived',

    /**
     * 终端已离开场域。
     * @type {string}
     */
    Left: 'left',

    /**
     * 创建通讯场域。
     * @type {string}
     */
    CreateField: 'createField',

    /**
     * @type {string}
     */
    GetField: 'getField',

    /**
     * @type {string}
     */
    ExistingEndpoints: 'existingEndpoints',
    
    /**
     * 申请主叫对方。
     * @type {string}
     */
    ApplyCall: 'applyCall',

    /**
     * 申请加入场域。
     * @type {string}
     */
    ApplyJoin: 'applyJoin',

    /**
     * 申请终止呼叫。
     * @type {string}
     */
    ApplyTerminate: 'applyTerminate'
}
