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

import { Contact } from "../contacts/Contact";
import { OrderMap } from "../util/OrderMap";
import { Entity } from "../core/Entity";
import { LocalRTCEndpoint } from "./LocalRTCEndpoint";
import { MediaConstraint } from "./MediaConstraint";

/**
 * 多方通信场域。
 */
export class Field extends Entity {

    /**
     * 构造函数。
     */
    constructor(id) {
        super(7 * 24 * 60 * 60 * 1000);

        /**
         * 场域 ID 。
         */
        this.id = id;

        /**
         * 通信场创建人。
         * @type {Contact}
         */
        this.founder = null;

        /**
         * 
         */
        this.endpoints = new OrderMap();

        /**
         * 通信管道。
         */
        this.pipeline = null;

        /**
         * 媒体约束。
         */
        this.mediaConstraint = null;

        /**
         * 本地端点。
         */
        this.localPoint = null;
    }

    /**
     * @returns {Contact} 返回创建人。
     */
    getFounder() {
        return this.founder;
    }

    getEndpoint() {
        return null;
    }

    /**
     * 
     * @param {MediaConstraint} mediaConstraint 
     */
    join(mediaConstraint) {
        this.mediaConstraint = mediaConstraint;

        if (null == this.localPoint) {
            this.localPoint = new LocalRTCEndpoint(this.pipeline);
        }
        
        this.localPoint.open(mediaConstraint);
    }

    quit() {

    }

    invite(contact) {

    }
}
