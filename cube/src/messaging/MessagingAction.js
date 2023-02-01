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
 * 消息动作。
 * @private
 */
export const MessagingAction = {
    /**
     * 向服务器发送消息。
     * @type {string}
     */
    Push: 'push',

    /**
     * 从服务器拉取消息。
     * @type {string}
     */
    Pull: 'pull',

    /**
     * 收到在线消息。
     * @type {string}
     */
    Notify: 'notify',

    /**
     * 撤回消息。
     * @type {string}
     */
    Retract: 'retract',

    /**
     * 删除消息。
     * @type {string}
     */
    Delete: 'delete',

    /**
     * 标记已读。
     * @type {string}
     */
    Read: 'read',

    /**
     * 查询消息状态。
     * @type {string}
     */
    QueryState: 'queryState',

    /**
     * 获取会话列表。
     * @type {string}
     */
    GetConversations: 'getConversations',

    /**
     * 更新会话数据。
     * @type {string}
     */
    UpdateConversation: 'updateConversation'

}
