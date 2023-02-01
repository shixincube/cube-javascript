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
 * 联系人模块相关的指令动作。
 * @private
 */
export const ContactAction = {

    /**
     * 指定当前客户端对应的联系人信息并签入。
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
     * 修改联系人信息。
     * @type {string}
     */
    ModifyContact: 'modifyContact',

    /**
     * 获取联系人分区。
     * @type {string}
     */
    GetContactZone: 'getContactZone',

    /**
     * 创建联系人分区。
     * @type {string}
     */
    CreateContactZone: 'createContactZone',

    /**
     * 删除联系人分区。
     * @type {string}
     */
    DeleteContactZone: 'deleteContactZone',

    /**
     * 指定分区是否包含指定参与人。
     * @type {string}
     */
    ContainsParticipantInZone: 'containsParticipantInZone',

    /**
     * 添加参与人到分区。
     * @type {string}
     */
    AddParticipantToZone: 'addParticipantToZone',
 
    /**
     * 从分区移除参与人。
     * @type {string}
     */
    RemoveParticipantFromZone: 'removeParticipantFromZone',

    /**
     * 修改分区参与人信息。
     * @type {string}
     */
    ModifyZoneParticipant: 'modifyZoneParticipant',

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
    DismissGroup: 'dismissGroup',

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
    UpdateAppendix: 'updateAppendix',

    /**
     * 群组的附录已更新。
     * @type {string}
     */
    GroupAppendixUpdated: 'groupAppendixUpdated',

    /**
     * 联系人的阻止列表操作。
     * @type {string}
     */
    BlockList: 'blockList',

    /**
     * 置顶操作。
     * @type {string}
     */
    TopList: 'topList',

    /**
     * 搜索联系人或群组。
     * @type {string}
     */
    Search: 'search'
}
