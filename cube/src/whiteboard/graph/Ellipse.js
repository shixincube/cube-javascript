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
 * 椭圆形。
 */
export class Ellipse extends Graph {

    /**
     * @param {number} [size] 
     * @param {string} [color] 
     */
    constructor(size, color) {
        super(size, color);
        this.cursor = 'crosshair';
    }

    onOpen(viewctx, draftctx, board) {
        let data = null;
        this.onmousedown = (x, y) => {
            data = {
                cmd: ToolType.ELLIPSE,
                zoom: 1,
                color: this.color,
                size: this.size,
                x: x,
                y: y,
                width: 0,
                height: 0
            };
        };
        this.onmousemove = (x, y, e) => {
            if (data !== null) {
                let width = x - data.x, height = y - data.y;
                if (e.shiftKey) {
                    data.width = data.height = Math.max(width, height);
                } else {
                    data.width = width;
                    data.height = height;
                }

                board.clearDraft();
                Ellipse.draw(draftctx, data, board.ratio);
            }
        };
        this.onmouseup = () => {
            if (data !== null) {
                board.clearDraft();
                Ellipse.draw(viewctx, data, board.ratio);
                board.change(data);

                data = null;
            }
        };
    }

    onClose(board) {
        // Nothing
    }

    static draw(ctx, data, ratio) {
        ratio = ratio * data.zoom;
        ctx.strokeStyle = data.color;
        ctx.lineWidth = data.size * ratio;

        let x = data.x * ratio, y = data.y * ratio, width = data.width * ratio, height = data.height * ratio;
        let a = width / 2, b = height / 2;
        if (a < 0) {
            x = x + data.width;
            a = Math.abs(a);
        }
        if (b < 0) {
            y = y + data.height;
            b = Math.abs(b);
        }

        let r = (a > b) ? a : b;
        let ratioX = a / r;
        let ratioY = b / r;

        ctx.save();
        ctx.scale(ratioX, ratioY);
        ctx.beginPath();
        ctx.arc((x + a) / ratioX, (y + b) / ratioY, r, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.restore();
        ctx.stroke();
    }
}
