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

export default {
    Move: 'move',
    Right: 'e',
    Left: 'w',
    Top: 'n',
    Bottom: 's',
    LeftTop: 'nw',
    RightTop: 'ne',
    RightBottom: 'se',
    LeftBottom: 'sw',

    get(x, y, data) {
        let offset = 5;
        let sx = x - data.x, sy = y - data.y, width = data.width, height = data.height;
        let type = null;
        if (sx >= -offset && sx <= width + offset && sy >= -offset && sy <= height + offset) {
            type = '';
            if (sy <= 5) {
                type = this.Top;
            }
            if (sy >= height - 5) {
                type = this.Bottom;
            }
            if (sx <= 5) {
                type += this.Left;
            }
            if (sx >= width - 5) {
                type += this.Right;
            }
            if (type === '') type = this.Move;
        }
        return type;
    },

    cursor(type) {
        return type === null ? '' : (type === 'move' ? 'move' : type + '-resize');
    }
};
