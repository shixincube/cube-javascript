/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020 Shixin Cube Team.
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

import { Self } from "../contact/Self";
import { ModuleError } from "../core/error/ModuleError";
import { CommField } from "./CommField";
import { MediaConstraint } from "./MediaConstraint";

/**
 * 通话记录。
 */
export class CallRecord {

    /**
     * @param {Self} self 创建该记录的联系人。
     */
    constructor(self) {
        /**
         * @type {Self}
         */
        this.self = self;

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
         * @type {CommField}
         */
        this.field = null;

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

    getCaller() {
        return this.field.caller;
    }

    getCallee() {
        return this.field.callee;
    }

    getPeer() {
        if (this.self.getId() == this.field.caller.getId()) {
            return this.field.callee;
        }
        else {
            return this.field.caller;
        }
    }
}