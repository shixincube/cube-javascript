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

import { Module } from "../core/Module";
import { OrderMap } from "../util/OrderMap";
import { Field } from "./Field";
import { Packet } from "../core/Packet";
import { MultipointCommAction } from "./MultipointCommAction";

/**
 * 多方通信服务。
 */
export class MultipointComm extends Module {

    static NAME = 'MultipointComm';

    /**
     * 构造函数。
     */
    constructor() {
        super(MultipointComm.NAME);

        /**
         * 管理的通信场域。
         * @type {OrderMap<number,Field>}
         */
        this.fields = new OrderMap();
    }

    /**
     * @inheritdoc
     */
    start() {
        if (!super.start()) {
            return false;
        }

        return true;
    }

    /**
     * @inheritdoc
     */
    stop() {
        super.stop();
    }

    /**
     * 获取指定 ID 的通信场域。
     * @param {number} id 
     * @param {function} handleSuccess
     * @param {function} [handleError]
     * @returns {boolean} 返回操作是否被正确执行。
     */
    getField(id, handleSuccess, handleError) {
        let field = this.fields.get(id);
        if (null != field) {
            handleSuccess(field);
            return;
        }

        this._requestGetField(id).then((field) => {

        }).catch((e) => {

        });
    }

    /**
     * 删除指定的通信场域。
     * @param {number} id 
     */
    removeField(id) {

    }

    _requestGetField(id) {
        return new Promise((resolve, reject) => {
            let requestPacket = new Packet(MultipointCommAction.GetField, { "id": fieldId });
            this.pipeline.send(MultipointComm.NAME, requestPacket, (pipeline, source, packet) => {
                
            });
        });
    }
}
