/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020-2022 Cube Team.
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

import { Contact } from "../contact/Contact";
import { Self } from "../contact/Self";
import { ModuleError } from "../core/error/ModuleError";
import { CommField } from "./CommField";
import { CommFieldEndpoint } from "./CommFieldEndpoint";
import { MediaConstraint } from "./MediaConstraint";

/**
 * 通话记录。
 */
export class CallRecord {

    /**
     * @param {Self} self 当前签入的联系人。
     * @param {CommField} field 通信场域。
     */
    constructor(self, field) {
        /**
         * @type {Self}
         */
        this.self = self;

        /**
         * @type {CommField}
         */
        this.field = (undefined !== field) ? field : null;

        /**
         * 开始时间。
         * @type {number}
         */
        this.startTime = Date.now();

        /**
         * 应答时间。
         * @type {number}
         */
        this.answerTime = 0;

        /**
         * 结束时间。
         * @type {number}
         */
        this.endTime = 0;

        /**
         * @type {MediaConstraint}
         */
        this.callerMediaConstraint = null;

        /**
         * @type {MediaConstraint}
         */
        this.calleeMediaConstraint = null;

        /**
         * @type {ModuleError}
         */
        this.lastError = null;
    }

    /**
     * 当前记录的通话是否正在进行中。
     * @returns {boolean}
     */
    isActive() {
        return (null != this.field && this.field.numRTCDevices() > 0);
    }

    /**
     * 获取当前通话的主叫。
     * @returns {Contact} 返回当前通话的主叫。
     */
    getCaller() {
        return this.field.caller;
    }

    /**
     * 获取当前通话的被叫。
     * @returns {Contact} 返回当前通话的被叫。
     */
    getCallee() {
        return this.field.callee;
    }

    /**
     * 当前账号是否是主叫。
     * @returns {boolean}
     */
    isCaller() {
        if (null == this.field.caller) {
            return false;
        }

        return (this.self.getId() == this.field.caller.getId());
    }

    /**
     * 是否是视频主叫。
     * @returns {boolean}
     */
    isVideoCaller() {
        return this.callerMediaConstraint.videoEnabled;
    }

    /**
     * 获取对端联系人。
     * @returns {Contact}
     */
    getPeer() {
        if (this.self.getId() == this.field.caller.getId()) {
            return this.field.callee;
        }
        else {
            return this.field.caller;
        }
    }

    /**
     * 返回通话时长。
     * @returns {number}
     */
    getDuration() {
        if (this.answerTime == 0 || this.endTime == 0) {
            return 0;
        }

        return this.endTime - this.answerTime;
    }
}
