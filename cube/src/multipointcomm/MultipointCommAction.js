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
     */
    Offer: 'offer',

    /**
     * 信令 Answer 。
     */
    Answer: 'answer',

    /**
     * 信令 Bye 。
     */
    Bye: 'bye',

    /**
     * 信令 Follow 。
     */
    Follow: 'follow',

    /**
     * 信令 Revoke 。
     */
    Revoke: 'revoke',

    /**
     * 信令忙 Busy 。
     */
    Busy: 'busy',

    /**
     * ICE 候选字收发。
     */
    Candidate: 'candidate',
    
    /**
     * 申请主叫对方。
     */
    ApplyCall: 'applyCall',

    /**
     * 申请加入场域。
     */
    ApplyJoin: 'applyJoin',

    /**
     * 申请终止呼叫。
     */
    ApplyTerminate: 'applyTerminate'
}
