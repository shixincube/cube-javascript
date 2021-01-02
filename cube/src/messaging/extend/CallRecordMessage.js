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

    /**
     * @param {*} param 
     */
    constructor(param) {
        super(param);

        if (undefined === this.payload.type) {
            this.payload.type = "call-record";
        }

        if (param instanceof CallRecord) {
            this.setConstraint(param.callerMediaConstraint.videoEnabled,
                param.callerMediaConstraint.audioEnabled);
            this.setCaller(param.getCaller());
            this.setCallee(param.getCallee());
            this.setDuration(param.getDuration());
            this.setAnswerTime(param.answerTime);
        }
    }

    /**
     * 设置媒体约束。
     * @param {boolean} videoEnabled
     * @param {boolean} audioEnabled
     */
    setConstraint(videoEnabled, audioEnabled) {
        this.payload.constraint = {
            "video": videoEnabled,
            "audio": audioEnabled
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
     * 指定的联系人是否是主叫。
     * @param {number|Contact} idOrContact 联系人 ID 或联系人实例。
     * @returns {boolean} 如果是主叫返回 {@linkcode true} 。
     */
    isCaller(idOrContact) {
        if (typeof idOrContact === 'number') {
            return this.payload.caller.id == idOrContact;
        }
        else {
            return this.payload.caller.id == idOrContact.id;
        }
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

    /**
     * 设置应答时间戳。
     * @param {number} time 
     */
    setAnswerTime(time) {
        this.payload.answerTime = time;
    }

    /**
     * @returns {number} 返回应答时间戳。
     */
    getAnswerTime() {
        return this.payload.answerTime;
    }
}