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
 * 会话状态。
 * @readonly
 * @enum {number}
 * @alias ConversationState
 */
const CubeConversationState = {

    /**
     * 正常状态。
     * @type {number}
     */
    Normal: 1,

    /**
     * 重要的或置顶的状态。
     * @type {number}
     */
    Important: 2,

    /**
     * 已删除状态。
     * @type {number}
     */
    Deleted: 3,

    /**
     * 已销毁状态。
     * @type {number}
     */
    Destroyed: 4,

    /**
     * 解释状态码。
     * @param {number} state 状态。
     * @returns {string} 返回状态码描述。
     */
    toString: function(state) {
        switch (state) {
            case 1:
                return 'Normal';
            case 2:
                return 'Important';
            case 3:
                return 'Deleted';
            case 4:
                return 'Destroyed';
            default:
                return '?';
        }
    }
};

export const ConversationState = CubeConversationState;
