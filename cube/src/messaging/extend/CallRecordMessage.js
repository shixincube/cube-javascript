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

import { Contact } from "../../contact/Contact";
import { CallRecord } from "../../multipointcomm/CallRecord";
import { TypeableMessage } from "./TypeableMessage";

/**
 * 通话记录消息。
 */
export class CallRecordMessage extends TypeableMessage {

    constructor(param) {
        super(param);

        this.payload = { "type" : "call-record" };

        if (param instanceof CallRecord) {
            this.setConstraint(param.callerMediaConstraint.videoEnabled,
                param.callerMediaConstraint.audioEnabled);
            this.setCaller(param.getCaller());
            this.setCallee(param.getCallee());
            this.setDuration(param.getDuration());
        }
    }

    /**
     * 设置媒体约束。
     * @param {boolean} videoEnabled
     * @param {boolean} audioEnabled
     */
    setConstraint(videoEnabled, audioEnabled) {
        this.payload.constraint = {
            vidoe: videoEnabled,
            audio: audioEnabled
        };
    }

    /**
     * 获取媒体约束。
     * @returns {JSON} 返回媒体约束。
     */
    getConstraint() {
        return this.payload.constraint;
    }

    /**
     * 设置主叫联系人。
     * @param {Contact} caller 
     */
    setCaller(caller) {
        this.payload.caller = caller.toJSON();
    }

    /**
     * 返回主叫联系人。
     */
    getCaller() {
        return Contact.create(this.payload.caller);
    }

    /**
     * 设置被叫联系人。
     * @param {Contact} callee
     */
    setCallee(callee) {
        this.payload.callee = callee.toJSON();
    }

    /**
     * 返回被叫联系人。
     */
    getCallee() {
        return this.payload.callee;
    }

    /**
     * 设置通话时长。
     * @param {number} duration 
     */
    setDuration(duration) {
        this.payload.duration = duration;
    }

    /**
     * 返回通话时长。
     * @returns {number}
     */
    getDuration() {
        return this.payload.duration;
    }
}
