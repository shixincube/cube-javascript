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

/**
 * 会议邀请信息。
 */
export class Invitation extends JSONable {

    /**
     * @param {number} id 受邀者 ID 。
     * @param {string} invitee 受邀者。
     * @param {string} displayName 受邀者这显示名。
     */
    constructor(id, invitee, displayName) {
        super();

        /**
         * 受邀者 ID 。
         * @type {number}
         */
        this.id = id;

        /**
         * 被邀请者。
         * @type {string}
         */
        this.invitee = invitee;

        /**
         * 显示名字。
         * @type {string}
         */
        this.displayName = displayName;

        /**
         * 是否已接受邀请。
         * @type {boolean}
         */
        this.accepted = false;

        /**
         * 接受邀请的时间。
         * @type {number}
         */
        this.acceptionTime = 0;
    }

    /**
     * @inheritdoc
     */
    toJSON() {
        let json = super.toJSON();
        json.id = this.id;
        json.invitee = this.invitee;
        json.displayName = this.displayName;
        json.accepted = this.accepted;
        json.acceptionTime = this.acceptionTime;
        return json;
    }

    /**
     * @private
     * @param {JSON} json 
     * @returns {Invitation}
     */
    static create(json) {
        let invitation = new Invitation(json.id, json.invitee, json.displayName);
        invitation.accepted = json.accepted;
        invitation.acceptionTime = json.acceptionTime;
        return invitation;
    }
}
