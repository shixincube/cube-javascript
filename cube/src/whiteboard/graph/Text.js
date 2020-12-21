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

import { Graph } from "./Graph";
import { ToolType } from "./ToolType";

/**
 * 文本工具。
 */
export class Text extends Graph {

    /**
     * @param {number} [size] 
     * @param {string} [color] 
     */
    constructor(size, color) {
        super(size, color);

        this.size = 14;
        this.fontFamily = 'Microsoft YaHei';
        this.cursor = 'text';
        this.dom = null;
    }

    onOpen(viewctx, draftctx, board) {
        let data = null;

        this.onmouseup = (x, y) => {
            if (this.dom === null) {
                let bounds = board.getBounds(1, true);
                let ex = bounds.x + bounds.width, ey = bounds.y + bounds.height;
                data = {
                    cmd: ToolType.TEXT,
                    zoom: 1,
                    text: '',
                    x: x,
                    y: Math.min(y, ey - (this.size + 7) - 1),
                    color: this.color,
                    size: this.size,
                    family: this.fontFamily,
                    offset: 7
                };
                let minWidth = 120, maxWidth = ex - x - 1;
                let minHeight = data.size + 7, maxHeight = ey - y - 1;

                let dom = document.createElement('div');
                dom.setAttribute('contenteditable', 'plaintext-only');
                dom.style.position = 'absolute';
                dom.style.outline = '1px dashed #666666';

                dom.style.boxShadow = '0 0 15px rgba(0, 0, 0, 0.4)';
                dom.style.zIndex = '1001';
                dom.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
                dom.style.fontFamily = data.family + ', "黑体", Arial, Helvetica, sans-serif';
                dom.style.fontSize = data.size + 'px';
                dom.style.color = data.color;
                dom.style.lineHeight = minHeight + 'px';
                dom.style.minHeight = minHeight + 'px';
                dom.style.maxHeight = maxHeight + 'px';

                dom.style.wordBreak = 'break-all';
                dom.style.overflow = 'hidden';

                dom.style.left = x + 'px';
                dom.style.top = data.y + 'px';

                if (minWidth < maxWidth) {
                    dom.style.minWidth = minWidth + 'px';
                    dom.style.maxWidth = maxWidth + 'px';
                } else {
                    dom.style.width = maxWidth + 'px';
                }

                // 超出矫正
                let check = () => dom.scrollHeight - dom.clientHeight > 7;
                let del = () => {
                    if (check()) {
                        let range = document.getSelection().getRangeAt(0), index = range.endOffset;
                        if (index > 0) {
                            let el = range.endContainer, content = el.textContent, maxLen = content.length;
                            let len = index + 1;
                            let words = content.substr(0, len), cursor = 10, ends = content.substring(len - 1, maxLen);
                            el.textContent = words.substr(0, Math.min(cursor, len)) + ends;

                            while (!check() && cursor < len) {
                                cursor = Math.min(cursor + 10, len);
                                el.textContent = words.substr(0, cursor) + ends;
                            }
                            while (check() && cursor > 0) {
                                cursor = Math.max(cursor - 1, 0);
                                el.textContent = words.substr(0, cursor) + ends;
                            }
                            range.setStart(el, cursor);
                            range.setEnd(el, cursor);
                        } else {
                            document.execCommand('delete');
                        }
                    }
                };
                dom.onscroll = () => {
                    if (dom.scrollTop !== 0) dom.scrollTop = 0;
                };
                dom.oninput = del;

                board.wrap.appendChild(dom);
                dom.focus();

                this.dom = dom;
            }
            else {
                data.text = Text.extractInput(this.dom);
                Text.draw(viewctx, data, board.ratio);

                this.restore();
                board.change(data);
                data = null;
            }
        };
    }

    onClose(board) {
        this.restore();
    }

    restore() {
        if (this.dom !== null) {
            this.dom.onscroll = null;
            this.dom.oninput = null;
            this.dom.parentElement.removeChild(this.dom);
            this.dom = null;
        }
    }

    setFontFamily(fontFamily) {
        this.fontFamily = fontFamily;
    }

    static extractInput(dom) {
        let form = document.createElement('form');
        form.style.visibility = 'hidden';
        let input = document.createElement('textarea');
        input.name = 'data';
        input.wrap = 'hard';
        input.style.cssText = dom.style.cssText;
        input.style.padding = '0';
        input.style.margin = '0';
        input.style.border = 'none';
        input.style.width = (dom.clientWidth + 1) + 'px';
        input.style.top = '-100px';
        input.value = dom.innerText;
        form.appendChild(input);

        document.body.appendChild(form);
        let fd = new FormData(form);
        let data = fd.get('data');
        document.body.removeChild(form);
        return data;
    }

    static draw(ctx, data, ratio) {
        ratio = ratio * data.zoom;
        let size = data.size * ratio, offset = data.offset * ratio;

        ctx.fillStyle = data.color;
        ctx.font = size + 'px ' + data.family + ', "黑体", Arial, Helvetica, sans-serif';

        // 矫正字体偏移
        let getNumber = (number) => {
            if (number === 21) {
                return 9;
            } else if ((number >= 18 && number <= 25)) {
                return 8;
            } else if (number === 28 || number === 32 || number === 46 || number === 47 || number === 51 || number === 55 ) {
                return 10;
            }

            return 9;
        };

        let texts = data.text.split('\n');
        let num = offset / 2 - size / getNumber(size);
        for (let i = 0; i < texts.length; i++) {
            ctx.fillText(texts[i], data.x * ratio, data.y * ratio + size + num + (i * (size + offset)));
        }
    }
}
