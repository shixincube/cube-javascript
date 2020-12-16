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
 * 箭头图形。
 */
export class Arrow extends Graph {

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
                cmd: ToolType.ARROW,
                zoom: 1,
                color: this.color,
                size: this.size,
                x1: x,
                y1: y,
                x2: x,
                y2: y
            };
        };
        this.onmousemove = (x, y) => {
            if (data !== null) {
                data.x2 = x;
                data.y2 = y;

                board.clearDraft();
                Arrow.draw(draftctx, data, board.ratio);
            }
        };
        this.onmouseup = () => {
            if (data !== null) {
                board.clearDraft();
                Arrow.draw(viewctx, data, board.ratio);
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

        let x1 = data.x1 * ratio, y1 = data.y1 * ratio, x2 = data.x2 * ratio, y2 = data.y2 * ratio;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        let angle = Math.atan2(y2 - y1, x2 - x1);
        let x = x2 - 15 * Math.cos(angle);
        let y = y2 - 15 * Math.sin(angle);

        Arrow.paintArrow({x: x, y: y}, {x: x2, y: y2}, ctx);
    }

    static paintArrow(start, end, ctx) {
        // 箭头大小和锐钝
        let size = 1, sharp = 0.5;

        // 旋转坐标
        let rotate = function (p, theta) {
            let cos = Math.cos(theta), sin = Math.sin(theta);
            return { x: p.x * cos + p.y * sin, y: p.y * cos - p.x * sin };
        };

        // 计算头部坐标
        let calc = function (sp, ep) {
            let theta = Math.atan((ep.x - sp.x) / (ep.y - sp.y));
            let cep = rotate(ep, -theta), csp = rotate(sp, -theta);
            let l = cep.y - csp.y, l1 = l * sharp, l2 = cep.y - l * size;
            return {
                h1: rotate({x: cep.x + l1, y: l2}, theta),
                h2: rotate({x: cep.x - l1, y: l2}, theta)
            };
        };

        // 画箭头主线
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        // 画箭头头部
        let h = calc(start, end, ctx);
        ctx.moveTo(h.h1.x, h.h1.y);
        ctx.lineTo(end.x, end.y);
        ctx.lineTo(h.h2.x, h.h2.y);
        ctx.stroke();
    }
}
