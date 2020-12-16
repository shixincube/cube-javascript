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
 * 矩形。
 */
export class Rect extends Graph {

    /**
     * @param {number} [size] 
     * @param {string} [color] 
     */
    constructor(size = 2, color = '#D70022') {
        super(size, color);
    }

    onOpen(viewctx, draftctx, board) {
        let data = null;
        this.onmousedown = (x, y) => {
            data = {
                cmd: ToolType.RECT,
                zoom: 1,
                color: this.color,
                size: this.size,
                x: x,
                y: y,
                width: 0,
                height: 0
            };
        };
        this.onmousemove = (x, y) => {
            if (data !== null) {
                data.width = x - data.x;
                data.height = y - data.y;

                board.clearDraft();
                Rect.draw(draftctx, data, board.ratio);
            }
        };
        this.onmouseup = () => {
            if (data !== null) {
                board.clearDraft();
                Rect.draw(viewctx, data, board.ratio);
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

        ctx.strokeRect(data.x * ratio, data.y * ratio, data.width * ratio, data.height * ratio);
    }

}