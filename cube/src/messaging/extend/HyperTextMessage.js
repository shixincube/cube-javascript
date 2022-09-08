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

import { Message } from "../Message";
import { TypeableMessage } from "./TypeableMessage";

/**
 * 格式化的内容。
 * @typedef {object} FormattedContent
 * @property {string} format 内容的格式：{@linkcode text}，{@linkcode at}，{@linkcode emoji} 。
 * @property {object|string} content 内容。
 */

/**
 * 超文本消息。
 */
export class HyperTextMessage extends TypeableMessage {

    /**
     * @param {string|Message} param 文本消息的文本参数。
     */
    constructor(param) {
        super(param);

        if (typeof param === 'string') {
            this.payload = { "type" : "hypertext", "content" : param };
        }
        else if (undefined === param || null == param) {
            this.payload = { "type" : "hypertext" };
        }

        /**
         * 格式化的内容。
         * @private
         */
        this.formattedContents = [];

        /**
         * 平滑文本内容。
         * @private
         */
        this.plaintext = this.payload.content;

        // 解析
        this.parse(this.payload.content);

        this.summary = this.plaintext;
    }

    /**
     * 获取无格式的平滑文本。
     * @returns {string} 返回无格式的平滑文本。
     */
    getPlaintext() {
        return this.plaintext;
    }

    /**
     * 获取已格式化内容。
     * @returns {Array<FormattedContent>} 返回已格式化内容。
     * @see {@link FormattedContent}
     */
    getFormattedContents() {
        return this.formattedContents;
    }

    /**
     * 设置内容。
     * @param {string} content 指定文本内容。
     */
    setContent(content) {
        this.payload.content = content;
    }

    /**
     * 获取内容。
     * @returns {string} 返回内容。
     */
    getContent() {
        return this.payload.content;
    }

    /**
     * 分析内容。
     * @private
     * @param {*} input
     */
    parse(input) {
        // AT Format: [@ name # id ]
        // Emoji Format: [E desc # code ]
        
        let content = [];

        let phaseEmoji = false;
        let phaseAt = false;
        let string = [];

        for (let i = 0; i < input.length; ++i) {
            let c = input.charAt(i);
            if (c == '\\') {
                // 转义
                c = input.charAt(++i);
                if (!phaseEmoji && !phaseAt) {
                    content.push(c);
                }
                else {
                    string.push(c);
                }
            }
            else if (c == '[') {
                let next = input.charAt(i + 1);
                if (next == 'E') {
                    // 记录之前缓存里的文本数据
                    this.formattedContents.push({
                        "format": "text",
                        "content": content.join('')
                    });
                    content.splice(0, content.length);

                    phaseEmoji = true;
                    ++i;
                }
                else if (next == '@') {
                    // 记录之前缓存里的文本数据
                    this.formattedContents.push({
                        "format": "text",
                        "content": content.join('')
                    });
                    content.splice(0, content.length);

                    phaseAt = true;
                    ++i;
                }
            }
            else if (c == ']') {
                if (phaseEmoji) {
                    phaseEmoji = false;
                    let emojiResult = this.parseEmoji(string);
                    string.splice(0, string.length);

                    this.formattedContents.push({
                        "format": "emoji",
                        "content": emojiResult
                    });
                }
                else if (phaseAt) {
                    phaseAt = false;
                    let atResult = this.parseAt(string);
                    string.splice(0, string.length);

                    this.formattedContents.push({
                        "format": "at",
                        "content": atResult
                    });
                }
            }
            else {
                if (!phaseEmoji && !phaseAt) {
                    content.push(c);
                }
                else {
                    string.push(c);
                }
            }
        }

        if (content.length > 0) {
            // 记录文本数据
            this.formattedContents.push({
                "format": "text",
                "content": content.join('')
            });
        }

        // 生成平滑文本
        content.splice(0, content.length);
        for (let i = 0; i < this.formattedContents.length; ++i) {
            let format = this.formattedContents[i];
            if (format.format == 'text') {
                content.push(format.content);
            }
            else if (format.format == 'emoji') {
                content.push('[');
                content.push(format.content.desc);
                content.push(']');
            }
            else if (format.format == 'at') {
                content.push(' @');
                content.push(format.content.name);
                content.push(' ');
            }
        }

        this.plaintext = content.join('');
    }

    /**
     * 分析 Emoji 格式。
     * @param {Array} array 
     * @returns {object}
     */
    parseEmoji(array) {
        // Format: desc#code
        let string = array.join('');
        let index = string.lastIndexOf('#');
        let result = {
            "desc": string.substring(0, index),
            "code": string.substring(index + 1)
        };
        return result;
    }

    /**
     * 分析 AT 格式。
     * @private
     * @param {Array} array 
     * @returns {object}
     */
    parseAt(array) {
        // Format: name#id
        let string = array.join('');
        let index = string.lastIndexOf('#');
        let result = {
            "name": string.substring(0, index),
            "id": parseInt(string.substring(index + 1))
        };
        return result;
    }
}
