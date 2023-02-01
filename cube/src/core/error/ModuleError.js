/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020-2023 Shixin Cube Team.
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

/**
 * 模块发生的错误。
 * @extends Error
 */
export class ModuleError extends Error {

    /**
     * @param {string} module 模块名。
     * @param {number} code 错误码。
     * @param {object} data 相关数据。
     * @param {object} [desc] 附加描述信息。
     */
    constructor(module, code, data, desc) {
        super();

        /**
         * 模块名。
         * @type {string}
         */
        this.module = module;

        /**
         * 错误码。
         * @type {number}
         */
        this.code = code;

        /**
         * 相关数据。
         * @type {object}
         */
        this.data = (undefined !== data) ? data : null;

        /**
         * 附加描述信息。
         * @type {object}
         */
        this.desc = (undefined !== desc) ? desc : null;
    }

    /**
     * @inheritdoc
     */
    toString() {
        return 'ModuleError [' + this.module + '] : ' + this.code
            + (this.desc ? ' - ' + this.desc.toString() : '');
    }
}
