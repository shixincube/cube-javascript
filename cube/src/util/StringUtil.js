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
 * 字符串适用函数库。
 */
export const StringUtil = {

    fastHash: (string) => {
        let hash = 0;
        for (let i = 0, len = string.length; i < len; ++i) {
            let c = string.charCodeAt(i);
            hash += c * 3 + hash * 3;
        }
        return Math.abs(hash);
    },

    /**
     * 删除 URL 参数。
     * @param {string} url URL 串。
     * @param {string} param 参数名。
     */
    removeURLParameter: (url, param) => {
        let index = url.indexOf(param + '=');
        let head = url.substring(0, index - 1);
        let tail = url.substring(index, url.length);
        let append = [];
        let tmp = tail.split('&');
        for (let i = 0; i < tmp.length; ++i) {
            let pair = tmp[i].split('=');
            if (pair.length == 2) {
                if (pair[0] != 'type') {
                    append.push('&');
                    append.push(tmp[i]);
                }
            }
            else {
                append.push(pair);
            }
        }
        return head + append.join('');
    }
}
