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

import cell from "@lib/cell-lib";

/**
 * 日志操作。
 */
export const Logger = {

    /**
     * Debug 等级。
     */
    DEBUG: 1,

    /**
     * Info 等级。
     */
    INFO: 2,

    /**
     * Warning 等级。
     */
    WARNING: 3,

    /**
     * Error 等级。
     */
    ERROR: 4,

    level: (level) => {
        if (undefined !== level) {
            cell.Logger.level = level;
        }

        return cell.Logger.level;
    },

    d: (tag, log) => {
        cell.Logger.d(tag, log);
    },

    i: (tag, log) => {
        cell.Logger.i(tag, log);
    },

    w: (tag, log) => {
        cell.Logger.w(tag, log);
    },

    e: (tag, log) => {
        cell.Logger.e(tag, log);
    }
}
