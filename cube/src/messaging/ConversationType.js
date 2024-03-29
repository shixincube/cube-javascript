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
 * 会话类型。
 * @readonly
 * @enum {number}
 * @alias ConversationType
 */
const CubeConversationType = {

    /**
     * 与联系人的会话。
     * @type {number}
     */
    Contact: 1,

    /**
     * 与群组的会话。
     * @type {number}
     */
    Group: 2,

    /**
     * 与组织的会话。
     * @type {number}
     */
    Organization: 3,

    /**
     * 系统类型会话。
     * @type {number}
     */
    System: 4,

    /**
     * 通知类型会话。
     * @type {number}
     */
    Notifier: 5,

    /**
     * 助手类型会话。
     * @type {number}
     */
    Assistant: 6,

    /**
     * 其他会话类型。
     * @type {number}
     */
    Other: 9,

    /**
     * 转字符串形式的描述。
     */
    toString: function(state) {
        switch (state) {
            case 1:
                return 'Contact';
            case 2:
                return 'Group';
            case 3:
                return 'Organization';
            case 4:
                return 'System';
            case 5:
                return 'Notifier';
            case 6:
                return 'Assistant';
            default:
                return 'Other';
        }
    }
};

export const ConversationType = CubeConversationType;
