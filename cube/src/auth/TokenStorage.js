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

import cell from "@lib/cell-lib";
import { Base64 } from "../util/Base64";
import { AuthToken } from "./AuthToken";

/**
 * 令牌存储器。
 */
export class TokenStorage {

    constructor() {
    }

    /**
     * 加载未使用的候选令牌。
     * @returns {AuthToken} 返回令牌。如果没有找到对应的令牌返回 {@linkcode null} 值。
     */
    loadCandidate() {
        return this.load('token');
    }

    /**
     * 将令牌保存为候选令牌。
     * @param {AuthToken} token 指定令牌实例。
     */
    saveCandidate(token) {
        this.save('token', token);
    }

    /**
     * 将候选令牌转为指定 ID 的令牌。
     * @param {number} id 指定联系人 ID 。
     * @returns {boolean} 如果操作成功返回 {@linkcode true} ，否则返回 {@linkcode false} 。
     */
    raise(id) {
        let token = this.loadCandidate();
        if (null == token) {
            return false;
        }

        this.save(id, token);
        this.remove('token');
        return true;
    }

    /**
     * 从本地存储里加载令牌。
     * @param {number|string} id 令牌对应的联系人 ID 。
     * @returns {AuthToken} 返回令牌。如果没有找到对应的令牌返回 {@linkcode null} 值。
     */
    load(id) {
        let tokenString = window.localStorage.getItem('_cube_' + id + '_');
        if (tokenString) {
            // 解析数据
            let code = Base64.decode(tokenString);
            let plaintext = cell.Utils.simpleDecrypt(code, ['S', 'X', 'c', 'u', 'b', 'e', '3', '0']);
            let jsonString = cell.Utils.fromCharCode(plaintext);
            return AuthToken.create(JSON.parse(jsonString));
        }

        return null;
    }

    /**
     * 将令牌保存到本地存储。
     * @param {number|string} id 令牌对应的联系人 ID 。
     * @param {AuthToken} token 待保存的令牌实例。
     */
    save(id, token) {
        let jsonString = JSON.stringify(token.toJSON());
        let code = cell.Utils.simpleEncrypt(jsonString, ['S', 'X', 'c', 'u', 'b', 'e', '3', '0']);
        let tokenString = Base64.encode(code);
        window.localStorage.setItem('_cube_' + id + '_', tokenString);
    }

    /**
     * 删除指定令牌。
     * @param {number|string} id 联系人 ID 。
     */
    remove(id) {
        window.localStorage.removeItem('_cube_' + id + '_');
    }

    /**
     * 删除所有令牌。
     */
    removeAll() {
        window.localStorage.clear();
    }
}
