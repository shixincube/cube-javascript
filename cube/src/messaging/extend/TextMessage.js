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

import { Message } from "../Message";
import { TypeableMessage } from "./TypeableMessage";

/**
 * 文本消息。
 */
export class TextMessage extends TypeableMessage {

    /**
     * @param {string|Message} param 文本消息的文本参数。
     */
    constructor(param) {
        super(param);

        if (typeof param === 'string') {
            this.payload = { "type" : "text", "content" : param };
        }
        else if (undefined === param || null == param) {
            this.payload = { "type" : "text" };
        }
    }

    /**
     * @inheritdoc
     */
    getSummary() {
        return this.getText();
    }

    /**
     * 设置文本内容。
     * @param {string} text 指定文本内容。
     */
    setText(text) {
        this.payload.content = text;
    }

    /**
     * 获取文本内容。
     * @returns {string} 返回文本内容。
     */
    getText() {
        return this.payload.content;
    }
}
