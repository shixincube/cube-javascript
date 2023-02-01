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

import { JSONable } from "../util/JSONable";
import { PrimaryDescription } from "./PrimaryDescription";

/**
 * 授权访问的令牌。
 * @extends JSONable
 */
export class AuthToken extends JSONable {

    /**
     * @param {string} code 令牌编码。
     * @param {string} domain 令牌对应的域。
     * @param {string} appKey 令牌指定的 App Key 信息。
     * @param {number} cid 令牌绑定的 Contact ID 。
     * @param {number} issues 发布时间。
     * @param {number} expiry 过期时间。
     * @param {PrimaryDescription} description 主描述。
     */
    constructor(code, domain, appKey, cid, issues, expiry, description) {
        super();

        /**
         * 令牌编码。
         * @type {string}
         */
        this.code = code;

        /**
         * 令牌对应的域。
         * @type {string}
         */
        this.domain = domain;

        /**
         * 令牌指定的 App Key 信息。
         * @type {string}
         */
        this.appKey = appKey;

        /**
         * 令牌绑定的 Contact ID 。如果未绑定值为 {@linkcode 0} 。
         * @type {number}
         */
        this.cid = cid;

        /**
         * 发布时间。
         * @type {number}
         */
        this.issues = issues;

        /**
         * 过期时间。
         * @type {number}
         */
        this.expiry = expiry;

        /**
         * 主描述信息。
         * @type {PrimaryDescription}
         */
        this.description = description;
    }

    /**
     * 令牌是否有效。
     * @returns {boolean} 如果令牌有效返回 {@linkcode true} ，否则返回 {@linkcode false} 。
     */
    isValid() {
        return (Date.now() < this.expiry);
    }

    /**
     * 获取主描述对象。
     * @returns {PrimaryDescription} 返回主描述对象。
     */
    getDescription() {
        return this.description;
    }

    /**
     * @inheritdoc
     */
    toJSON() {
        let json = super.toJSON();
        json.code = this.code;
        json.domain = this.domain;
        json.appKey = this.appKey;
        json.cid = this.cid;
        json.issues = this.issues;
        json.expiry = this.expiry;
        json.description = this.description.toJSON();
        return json;
    }

    /**
     * 从 JSON 数据结构创建 {@link AuthToken} 实例。
     * @param {JSON} json 指定 {@link AuthToken} 格式的 JSON 对象。
     * @returns {AuthToken} 返回 {@link AuthToken} 实例。
     */
    static create(json) {
        let code = json["code"];
        let domain = json["domain"];
        let appKey = json["appKey"];
        let cid = json["cid"];
        let issues = json["issues"];
        let expiry = json["expiry"];
        let description = PrimaryDescription.create(json["description"]);
        let authToken = new AuthToken(code, domain, appKey, cid, issues, expiry, description);
        return authToken;
    }
}
