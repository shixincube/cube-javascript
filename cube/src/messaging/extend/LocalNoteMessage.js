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
 * 本地笔记消息。
 */
export class LocalNoteMessage extends TypeableMessage {

    /**
     * @param {string|Message} param 笔记文本内容。
     */
    constructor(param) {
        super(param);

        if (typeof param === 'string') {
            this.payload = {
                "type" : "localnote",
                "note" : {
                    "text"  : param,
                    "level" : 1
                }
            };
        }
        else if (undefined === param || null == param) {
            this.payload = {
                "type" : "localnote",
                "note" : {
                    "text"  : '',
                    "level" : 1
                }
            };
        }

        this.markOnlyOwner();
    }

    /**
     * @inheritdoc
     */
    getSummary() {
        return this.getText();
    }

    /**
     * 设置笔记文本内容。
     * @param {string} text 指定笔记文本内容。
     */
    setText(text) {
        this.payload.note.text = text;
    }

    /**
     * 获取笔记文本内容。
     * @returns {string} 返回笔记文本内容。
     */
    getText() {
        return this.payload.note.text;
    }

    /**
     * 设置笔记等级。
     * @param {number} level 指定笔记等级。
     */
    setLevel(level) {
        this.payload.note.level = level;
    }

    /**
     * 获取笔记等级。
     * @returns {number} 返回笔记等级。
     */
    getLevel() {
        return this.payload.note.level;
    }
}
