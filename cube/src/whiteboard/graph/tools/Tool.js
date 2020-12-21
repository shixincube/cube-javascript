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

/**
 * 工具。
 */
export class Tool {

    /**
     * @param {string} name 
     * @param {number} width 
     * @param {number} height 
     * @param {number} [offsetX] 
     * @param {number} [offsetY] 
     */
    constructor(name, width, height, offsetX = 0, offsetY = 0) {
        this.id = 'GraphBoard-' + name;
        this.width = width;
        this.height = height;
        this.board = null;
        this.dom = null;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
    }

    init(board, wrap) {
        this.board = board;
        let dom = document.createElement('div');
        dom.id = this.id;
        dom.style.position = 'absolute';
        dom.style.zIndex = '999999';
        dom.style.display = 'none';

        this.dom = dom;
        this.onInit(dom);
        wrap.appendChild(dom);
    }

    onCreate() {
        let calc = typeof this.width !== 'number';

        if (calc) {
            let dom = this.dom;
            dom.style.visibility = 'hidden';
            dom.style.display = 'block';
            this.width = dom.clientWidth;
            this.height = dom.clientHeight;

            dom.style.display = 'none';
            dom.style.visibility = '';
        }
    }

    onInit() { }

    setStyle(items) {
        let dom = this.dom;
        for (let key in items) {
            if (items.hasOwnProperty(key)) {
                dom.style[key] = items[key];
            }
        }
    }

    setPosition(x, y) {
        this.dom.style.left = (x + this.offsetX) + 'px';
        this.dom.style.top = (y + this.offsetY) + 'px';
    }

    show() {
        this.dom.style.display = 'block';
    }

    hide() {
        this.dom.style.display = 'none';
    }
}
