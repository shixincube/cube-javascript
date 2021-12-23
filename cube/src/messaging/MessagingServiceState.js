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
 * 消息服务状态描述。
 * @readonly
 * @enum
 * @property {number} Ok 成功。
 * @property {number} InvalidParameter 无效参数。
 * @property {number} Failure 遇到故障。
 * @property {number} InvalidDomain 无效域信息。
 * @property {number} DataStructureError 数据结构错误。
 * @property {number} NoDomain 没有域信息。
 * @property {number} NoDevice 没有设备信息。
 * @property {number} NoContact 没有找到联系人。
 * @property {number} NoGroup 没有找到群组。
 * @property {number} AttachmentError 附件错误。
 * @property {number} GroupError 群组错误。
 * @property {number} BeBlocked 被对方阻止。
 * @property {number} Forbidden 禁止操作。
 * @property {number} IllegalOperation 不能被执行的操作。
 * @property {number} DataTimeout 数据超时。
 * @property {number} ServerFault 服务器故障。
 * @property {number} StorageNoData 存储里没有读取到数据。
 * @property {number} Unknown 未知的状态。
 */
export const MessagingServiceState = {

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
     * 数据结构错误。
     * @type {number}
     */
    DataStructureError: 12,

    /**
     * 没有域信息。
     * @type {number}
     */
    NoDomain: 13,

    /**
     * 没有设备信息。
     * @type {number}
     */
    NoDevice: 14,

    /**
     * 没有找到联系人。
     * @type {number}
     */
    NoContact: 15,

    /**
     * 没有找到群组。
     * @type {number}
     */
    NoGroup: 16,

    /**
     * 附件错误。
     * @type {number}
     */
    AttachmentError: 17,

    /**
     * 群组错误。
     * @type {number}
     */
    GroupError: 18,

    /**
     * 被对方阻止。
     * @type {number}
     */
    BeBlocked: 30,

    /**
     * 禁止操作。
     * @type {number}
     */
    Forbidden: 101,

    /**
     * 不能被执行的操作。
     * @type {number}
     */
    IllegalOperation: 103,

    /**
     * 数据超时。
     * @type {number}
     */
    DataTimeout: 104,

    /**
     * 服务器故障。
     * @type {number}
     */
    ServerFault: 105,

    /**
     * 存储里没有读取到数据。
     * @type {number}
     */
    StorageNoData: 106,

    /**
     * 未知的状态。
     * @type {number}
     */
    Unknown: 99
}
