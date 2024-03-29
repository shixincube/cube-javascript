/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020-2023 Cube Team.
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
 * 联系人服务状态码。
 * @readonly
 * @enum {number}
 * @alias ContactServiceState
 */
const CubeContactServiceState = {

    /**
     * 成功。
     * @type {number}
     */
    Ok: 0,

    /**
     * 无效的参数。
     * @type {number}
     */
    InvalidParameter: 5,

    /**
     * 数据结构错误。
     * @type {number}
     */
    DataStructureError: 8,

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
     * 重复签入。
     * @type {number}
     */
    DuplicateSignIn: 13,

    /**
     * 未找到联系人。
     * @type {number}
     */
    NotFindContact: 14,

    /**
     * 未找到群组。
     * @type {number}
     */
    NotFindGroup: 15,

    /**
     * 未找到联系人分区。
     * @type {number}
     */
    NotFindContactZone: 16,

    /**
     * 令牌不一致。
     * @type {number}
     */
    InconsistentToken: 21,

    /**
     * 不被接受的非法操作。
     * @type {number}
     */
    IllegalOperation: 25,

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
     * 无网络连接。
     * @type {number}
     */
    NoNetwork: 103,

    /**
     * 未知的状态。
     * @type {number}
     */
    Unknown: 99
};

export const ContactServiceState = CubeContactServiceState;
