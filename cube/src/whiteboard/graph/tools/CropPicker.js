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
 * 剪裁选择器。
 */
export class CropPicker extends Tool {

    /**
     * 
     * @param {string} color 
     */
    constructor(color) {
        super('CropPicker', 120, 136, 10, 20);
        this.ctx = null;
        this.label = null;
        this.timer = null;
        this.max = null;

        let ps = (index) => parseInt(color.slice(index, index + 2), 16);
        this.color = 'rgba(' + [ps(1), ps(3), ps(5), 0.8].join(',') + ')';
    }

    onInit(dom) {
        let {width, height, offsetX, offsetY} = this, vh = this.height - 36, ratio = this.board.ratio, rw = width * ratio, rh = vh * ratio;
        this.setStyle({
            pointerEvents: 'none',
            border: '1px solid #777777'
        });
        let canvas = document.createElement('canvas');
        canvas.style.height = vh + 'px';
        canvas.style.display = 'block';
        canvas.width = rw;
        canvas.height = rh;
        let label = document.createElement('div');
        label.style.height = '30px';
        label.style.padding = '3px';
        label.style.font = '12px sans-serif';
        label.style.lineHeight = '15px';
        label.style.background = 'rgba(0, 0, 0, 0.5)';
        label.style.color = '#ffffff';
        label.innerHTML = 'RGB: (0,0,0)<br>POS: (0, 0)';

        dom.appendChild(canvas);
        dom.appendChild(label);

        this.ctx = canvas.getContext('2d');
        this.label = label;
        // 获取限制区域
        let bounds = this.board.getBoardBounds(1);
        this.max = {x: bounds.width - width - offsetX, y: bounds.height - height - offsetY, dx: width + offsetX * 2, dy: height + offsetY + 10};

        // 处理大小面板信息
        let h = Math.floor(21 * ratio), offset = h + Math.floor(6 * ratio), x = 0, y = 0, w = Math.floor(86 * ratio), size = Math.floor(12 * ratio), ox = Math.floor(w / 2), oy = Math.floor(h / 2);
        this.updateSize = (ctx, rect) => {
            ctx.clearRect(x, y, w, h);
            x = rect.x;
            y = rect.y - offset;
            if (y < 0) {
                x = x + 3;
                y = rect.y + 3;
            }
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(x, y, w, h);

            let text = rect.width + ' x ' + rect.height;
            ctx.font = size + "px Arial";
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, x + ox, y + oy);
        };
    }

    setInfo(colors, x, y) {
        this.label.innerHTML = 'RGB: (' + colors[0] + ',' + colors[1] + ','+ colors[2] + ')<br>POS: (' + x + ', ' + y + ')';
    }

    update(x, y) {
        let board = this.board, ratio = board.ratio, max = this.max, dx = x, dy = y;
        if (x > max.x) dx = x - max.dx;
        if (y > max.y) dy = y - max.dy;
        this.setPosition(dx, dy);
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            let ctx = this.ctx;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(board.viewlayer, (x - 14.5) * ratio, (y - 12) * ratio, 30 * ratio, 25 * ratio, 0, 0, 120 * ratio, 100 * ratio);

            ctx.moveTo(60 * ratio, 0);
            ctx.lineTo(60 * ratio, 100 * ratio);
            ctx.moveTo(0, 50 * ratio);
            ctx.lineTo(120 * ratio, 50 * ratio);
            ctx.lineWidth = 4;
            ctx.strokeStyle = this.color;
            ctx.stroke();

            let imgData = ctx.getImageData(60, 50, 1, 1).data;
            this.setInfo(imgData, x, y);
        });
    }

    show(x, y) {
        this.update(x, y);
        super.show();
    }
}
