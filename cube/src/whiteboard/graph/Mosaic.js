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
import { GraphBoard } from "./GraphBoard";
import { ToolType } from "./ToolType";

/**
 * 马赛克。
 */
export class Mosaic extends Graph {

    /**
     * @type {object}
     */
    static Cache = null;

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
                cmd: ToolType.MOSAIC,
                zoom: 1,
                color: this.color,
                size: this.size,
                points: [ {x, y} ]
            };
        };
        this.onmousemove = (x, y) => {
            if (data !== null) {
                data.points.push({x, y});
                let len = data.points.length;
                Mosaic.draw(board, viewctx, data, board.ratio, len === 2 ? 0 : len - 1);
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
        // Nothing
    }

    /**
     * 绘制马赛克。
     * 
     * @param {GraphBoard}} board 
     * @param {CanvasRenderingContext2D} ctx 
     * @param {object} data 
     * @param {number} ratio 
     * @param {number} start 
     */
    static draw(board, ctx, data, ratio, start = 0) {
        ratio = ratio * data.zoom;
        let points = data.points, len = points.length;

        if (null == Mosaic.Cache) {
            Mosaic.Cache = Mosaic.render(board.viewlayer.getContext('2d'), board.viewlayer.width, board.viewlayer.height);
        }

        let cache = Mosaic.Cache;
        let array = new Uint8ClampedArray(cache.data.length);

        let size = data.size * ratio * 4;
        for (let i = start; i < len; i++) {
            let point = points[i];
            let x = point.x * ratio;
            let y = point.y * ratio;

            if (i === 0) {
                Mosaic.setData(array, Math.max(Math.min(x, x - size), 0), y, size);
            }
            else {
                // 处理不连续问题
                let p = data.points[i - 1];
                let ex = p.x * ratio, ey = p.y * ratio;

                let ph = size - 1, pw = size - 1;
                let sx = x - ex, sy = y - ey;
                let slope = sx === 0 ? 0 : 1;

                let diagonal = Math.sqrt(Math.pow(sx, 2) + Math.pow(sy, 2)); // 斜边长度
                let pn = parseInt(diagonal / (pw > ph ? ph : pw)); // 计算两点之间的点的数量
                if (pn < 3) pn = pn * 3 + 1;
                // 相邻两点间的垂直距离和水平距离
                let v = Math.abs(sy) / pn * (y < ey ? -1 : 1), h = Math.abs(sx) / pn * (x < ex ? -1 : 1);

                for (let i = 0; i < pn; i++) {
                    let a = Math.round(h * i * slope + ex);
                    let b = Math.round(v * i + ey);

                    Mosaic.setData(array, Math.max(Math.min(a, a - size), 0), b, size);
                }
            }
        }

        let imageData = new ImageData(array, cache.width, cache.height);

        let canvas = document.createElement("canvas");
        canvas.width = cache.width;
        canvas.height = cache.height;
        canvas.getContext("2d").putImageData(imageData, 0, 0);

        ctx.drawImage(canvas, 0, 0);
    }

    static render(imageCtx, width, height) {
        let w = width, h = height;
        let imgData = imageCtx.getImageData(0, 0, w, h).data;
        let canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        let ctx = canvas.getContext('2d');

        let size = 14;
        let cols = w / size + 1;
        let rows = h / size + 1;
        let halfSize = size / 2;

        let row, col, x, y, pixelY, pixelX, pixelIndex, red, green, blue;

        for (row = 0; row < rows; row++) {
            y = (row - 0.5) * size;
            pixelY = Math.max(Math.min(y, h - 1), 0);

            for (col = 0; col < cols; col++) {
                x = (col - 0.5) * size;
                pixelX = Math.max(Math.min(x, w - 1), 0);
                pixelIndex = (pixelX + pixelY * w) * 4;
                red = imgData[pixelIndex];
                green = imgData[pixelIndex + 1];
                blue = imgData[pixelIndex + 2];

                ctx.fillStyle = 'rgb(' + red + ',' + green + ',' + blue + ')';

                ctx.fillRect(x - halfSize, y - halfSize, size, size)
            }
        }

        return {
            width: w,
            height: h,
            data: ctx.getImageData(0, 0, w, h).data
        };
    }

    static setData(array, x, y, size) {
        let {width, data} = Mosaic.Cache;
        let widthBytes = width * 4;
        let max = array.length;
        for (let row = 0; row < size; row++) {
            let start = y * widthBytes + x * 4 + row * widthBytes;
            let end = Math.min(start + size * 4, max - 1);
            if (start >= max) {
                break;
            }

            array.set(data.subarray(start, end), start);
        }
    }
}
