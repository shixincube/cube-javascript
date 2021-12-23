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

import cell from "@lib/cell-lib";
import { Module } from "../core/Module";
import { ModuleError } from "../core/error/ModuleError";
import { Contact } from "../contact/Contact";
import { SignalPipelineListener } from "./SignalPipelineListener";
import { Signal } from "./Signal";

/**
 * 信号通道服务。
 * @extends Module
 */
export class SignalService extends Module {

    /**
     * 服务名称。
     */
    static NAME = 'Signal';

    constructor() {
        super('Signal');

        /**
         * @type {SignalPipelineListener}
         */
        this.pipelineListener = null;
    }

    /**
     * @inheritdoc
     */
    start() {
        if (!super.start()) {
            return false;
        }

        this.pipelineListener = new SignalPipelineListener(this);
        this.pipeline.addListener(SignalService.NAME, this.pipelineListener);

        return true;
    }

    /**
     * @inheritdoc
     */
    stop() {
        super.stop();

        if (null != this.pipelineListener) {
            this.pipeline.removeListener(SignalService.NAME, this.pipelineListener);
        }
        
    }

    /**
     * 
     * @param {Contact} contact 
     * @param {JSON} payload 
     */
    emit(contact, data) {
        let signal = new Signal(data);
    }
}
