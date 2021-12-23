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

/**
 * 日志回调处理器。
 */
export class LogHandler extends cell.LogHandler {

    constructor() {
        super();
    }

    /**
     * 当记录 Debug 等级日志时调用。
     * @param {string} time 日志时间。
     * @param {string} tag 日志标签。
     * @param {string} text 日志文本内容。
     */
    debug(time, tag, text) {
    }

    /**
     * 当记录 Info 等级日志时调用。
     * @param {string} time 日志时间。
     * @param {string} tag 日志标签。
     * @param {string} text 日志文本内容。
     */
    info(time, tag, text) {
    }

    /**
     * 当记录 Warning 等级日志时调用。
     * @param {string} time 日志时间。
     * @param {string} tag 日志标签。
     * @param {string} text 日志文本内容。
     */
    warn(time, tag, text) {
    }

    /**
     * 当记录 Error 等级日志时调用。
     * @param {string} time 日志时间。
     * @param {string} tag 日志标签。
     * @param {string} text 日志文本内容。
     */
    error(time, tag, text) {
    }
}
