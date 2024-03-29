/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020-2023 Shixin Cube Team.
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
 * 会议服务状态。
 */
export const ConferenceServiceState = {
    /**
     * 成功。
     * @type {number}
     */
    Ok: 0,

    /**
     * 无效参数。
     * @type {number}
     */
    InvalidParameter: 5,

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
     * 未签入联系人。
     * @type {number}
     */
    NoSignIn: 12,
 
    /**
     * 搜索条件错误。
     * @type {number}
     */
    SearchConditionError: 25,

    /**
     * 服务器错误。
     * @type {number}
     */
     ServerError: 101,

     /**
      * 不被允许的操作。
      * @type {number}
      */
     NotAllowed: 102,
 
     /**
      * 未知的状态。
      * @type {number}
      */
     Unknown: 99
}
