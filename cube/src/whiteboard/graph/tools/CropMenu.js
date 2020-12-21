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

import { Tool } from "./Tool";

/**
 * 剪裁菜单。
 */
export class CropMenu extends Tool {
    
    constructor(callback) {
        super('CropMenu', 56, 26, 0, 8);

        this.callback = callback;
    }

    onInit(dom) {
        this.setStyle({
            background: '#ffffff',
            textAlign: 'center',
            lineHeight: '20px',
            cursor: 'default',
            userSelect: 'none',
            boxShadow: '0 0 7px 0 rgba(0, 0, 0, 0.5)',
            borderRadius: '2px'
        });

        let cancel = document.createElement('div');
        cancel.style.width = '20px';
        cancel.style.height = '20px';
        cancel.style.margin = '3px 3px 3px 5px';
        cancel.style.float = 'left';
        cancel.innerText = '✗';
        let confirm = document.createElement('div');
        confirm.style.width = '20px';
        confirm.style.height = '20px';
        confirm.style.margin = '3px 5px 3px 3px';
        confirm.style.float = 'left';
        confirm.innerText = '✓';

        confirm.onclick = () => {this.callback(true)};
        cancel.onclick = () => {this.callback(false)};

        dom.appendChild(cancel);
        dom.appendChild(confirm);
    }

    update(rect) {
        let {board, width, height} = this, bd = board.dom;

        let b = this.board.getBoardBounds(1, false);
        let x = rect.x + rect.width - width - b.x;
        let y = rect.y + rect.height - b.y;
        // 获取白板底部边缘
        let bottom = bd.offsetParent.clientHeight - bd.offsetTop;
        // 超出向上显示
        if (y + height > bottom) {
            y -= (height + 14);
            x -= 6;
        }

        this.setPosition(Math.max(x, 0), y);
    }

    show(rect) {
        this.update(rect);
        super.show();
    }
}
