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

import { Pipeline } from "./Pipeline";
import { Packet } from "./Packet";
import { PipelineError } from "./error/PipelineError";

/**
 * 数据通道监听器。
 * @interface
 */
export class PipelineListener {

    constructor() {
    }

    /**
     * 当接收到来自服务器的数据时触发该函数。
     * @param {Pipeline} pipeline 当前触发事件的数据通道。
     * @param {string} source 数据源描述。
     * @param {Packet} packet 数据包。
     */
    onReceived(pipeline, source, packet) {
    }

    /**
     * 当通道就绪时触发该函数。
     * @param {Pipeline} pipeline 当前触发事件的数据通道。
     */
    onOpened(pipeline) {
    }

    /**
     * 当通道关闭时触发该函数。
     * @param {Pipeline} pipeline 当前触发事件的数据通道。
     */
    onClosed(pipeline) {
    }

    /**
     * 当通道故障时触发该函数。
     * @param {Pipeline} pipeline 当前触发事件的数据通道。
     * @param {PipelineError} error 当前故障描述。
     */
    onFailed(pipeline, error) {
    }
}
