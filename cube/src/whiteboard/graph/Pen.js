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
 * 画笔工具。
 */
export class Pen extends Graph {

    /**
     * @param {number} [size] 
     * @param {string} [color] 
     */
    constructor(size, color) {
        super(size, color);
    }

    onOpen(viewctx, draftctx, board) {
        let data = null;
        this.onmousedown = (x, y) => {
            data = {
                cmd: ToolType.PEN,
                zoom: 1,
                color: this.color,
                size: this.size,
                points: [{x, y}]
            };
        };
        this.onmousemove = (x, y) => {
            if (data !== null) {
                data.points.push({x, y});
                Pen.draw(viewctx, data, board.ratio, data.points.length - 2);
            }
        };
        this.onmouseup = () => {
            if (data !== null) {
                board.change(data);

                data = null;
            }
        };
    }

    onClose(board) {
    }

    /**
     * 绘制画笔轨迹。
     * @param {*} ctx 
     * @param {*} data 
     * @param {*} ratio 
     * @param {*} start 
     */
    static draw(ctx, data, ratio, start = 0) {
        ratio = ratio * data.zoom;
        let points = data.points, p = points[start], len = points.length;

        ctx.strokeStyle = data.color;
        ctx.lineWidth = data.size * ratio;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(p.x * ratio, p.y * ratio);
        for (let i = start + 1; i < len; i++) {
            let point = points[i];
            ctx.lineTo(point.x * ratio, point.y * ratio);
        }
        ctx.stroke();
    }
}
