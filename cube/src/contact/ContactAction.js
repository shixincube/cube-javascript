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
 * 联系人模块相关的指令动作。
 */
export const ContactAction = {

    /**
     * 指定当前客户端对应的联系人信息。
     * @type {string}
     */
    SignIn: 'signIn',

    /**
     * 指定当前客户端的联系人签出。
     * @type {string}
     */
    SignOut: 'signOut',

    /**
     * 恢复终端当前连接。
     * @type {string}
     */
    Comeback: 'comeback',

    /**
     * 当前联系人的所有端都脱机。
     * @type {string}
     */
    Leave: 'leave',

    /**
     * 获取指定联系人的信息。
     * @type {string}
     */
    GetContact: 'getContact',

    /**
     * 获取指定列表里的联系人信息。
     * @type {string}
     */
    GetContactList: 'getContactList',

    /**
     * 获取联系人分区。
     * @type {string}
     */
     GetContactZone: 'getContactZone',

     /**
      * 添加联系人到分区。
      * @type {string}
      */
     AddContactToZone: 'addContactToZone',
 
     /**
      * 从分区移除联系人。
      * @type {string}
      */
     RemoveContactFromZone: 'removeContactFromZone',

    /**
     * 获取指定群组的信息。
     * @type {string}
     */
    GetGroup: 'getGroup',

    /**
     * 列出所有本人相关的群组。
     * @type {string}
     */
    ListGroups: 'listGroups',

    /**
     * 创建群组。
     * @type {string}
     */
    CreateGroup: 'createGroup',

    /**
     * 解散群组。
     * @type {string}
     */
    DissolveGroup: 'dissolveGroup',

    /**
     * 向群组添加成员。
     * @type {string}
     */
    AddGroupMember: 'addGroupMember',

    /**
     * 从群组移除成员。
     * @type {string}
     */
    RemoveGroupMember: 'removeGroupMember',

    /**
     * 修改群组信息。
     * @type {string}
     */
    ModifyGroup: 'modifyGroup',

    /**
     * 修改群组内成员的信息。
     * @type {string}
     */
    ModifyGroupMember: 'modifyGroupMember',

    /**
     * 获取指定的附录。
     * @type {string}
     */
    GetAppendix: 'getAppendix',

    /**
     * 更新附录。
     * @type {string}
     */
    UpdateAppendix: 'updateAppendix'
}
