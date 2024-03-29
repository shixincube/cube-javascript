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
 * 联系人模块的事件名称枚举。
 * @readonly
 * @enum {string}
 * @alias ContactEvent
 */
const CubeContactEvent = {

    /**
     * 当前客户端的联系人签入。
     * @type {string}
     */
    SignIn: 'SignIn',

    /**
     * 当前客户端的联系人签出。
     * @type {string}
     */
    SignOut: 'SignOut',

    /**
     * 当前客户端的联系人恢复连接。
     * @type {string}
     */
    Comeback: 'Comeback',

    /**
     * 群组已更新。
     * @type {string}
     */
    GroupUpdated: 'GroupUpdated',

    /**
     * 群组被创建。
     * @type {string}
     */
    GroupCreated: 'GroupCreated',

    /**
     * 群组已解散。
     * @type {string}
     */
    GroupDismissed: 'GroupDismissed',

    /**
     * 群成员加入。
     * @type {string}
     */
    GroupMemberAdded: 'GroupMemberAdded',

    /**
     * 群成员移除。
     * @type {string}
     */
    GroupMemberRemoved: 'GroupMemberRemoved',

    /**
     * 群组的附录进行了实时更新。
     * @type {string}
     */
    GroupAppendixUpdated: 'GroupAppendixUpdated',

    /**
     * 遇到程序故障。
     * @type {string}
     */
    Fault: 'Fault',

    /**
     * 未知事件。
     * @private
     * @type {string}
     */
    Unknown: 'Unknown'
}

export const ContactEvent = CubeContactEvent;
