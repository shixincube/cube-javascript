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
 * 状态码。
 * @private
 */
export const StateCode = {

    /**
     * 成功。
     */
    OK: 1000,

    /**
     * 数据请求错误。
     */
    BadRequest: 1400,

    /**
     * 未知的请求命令。
     */
    NotFound: 1404,

    /**
     * 没有找到授权码。
     */
    NoAuthToken: 1501,

    /**
     * 请求服务超时。
     */
    ServiceTimeout: 2001,

    /**
     * 负载格式错误。
     */
    PayloadFormat: 2002,

    /**
     * 参数错误。
     */
    InvalidParameter: 2003,

    /**
     * 网关错误。
     */
    GatewayError: 2101,

    /**
     * 提取服务器返回的链路状态码。
     * 
     * @param {ActionDialect} action 指定动作方言实例。
     * @returns 如果有状态信息返回状态信息的 JSON 格式，否则返回 {@linkcode null} 值。
     */
    extractState: function(action) {
        if (action.containsParam('state')) {
            return action.getParamAsJson('state');
        }
        else {
            return null;
        }
    }
}
