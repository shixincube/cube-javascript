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


/**
 * 联系人模块的事件名称枚举。
 */
export const ContactEvent = {

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
     * 新群被创建。
     * @type {string}
     */
    GroupCreated: 'GroupCreated',

    /**
     * 被邀请入群。
     * @type {string}
     */
    Invited: 'Invited',

    /**
     * 群组已经解散。
     * @type {string}
     */
    GroupDissolved: 'GroupDissolved',

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
     * 群所有人变更。
     * @type {string}
     */
    GroupOwnerChanged: 'GroupOwnerChanged',

    /**
     * @private
     */
    Unknown: 'Unknown'
}
