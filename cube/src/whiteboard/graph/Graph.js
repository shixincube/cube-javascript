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

import { GraphBoard } from "./GraphBoard";

/**
 * 图形基类。
 */
export class Graph {

    /**
     * @param {number} [size] 
     * @param {string} [color] 
     */
    constructor(size = 2, color = '#D70022') {
        this.size = undefined === size ? 2 : size;
        this.color = undefined === color ? '#D70022' : color;
        this.cursor = 'default';
    }

    /**
     * 打开图形。
     * @param {GraphBoard} board 
     */
    open(board) {
        this.onOpen(board.viewctx, board.draftctx, board);
    }

    /**
     * 关闭图形。
     * @param {GraphBoard} board 
     */
    close(board) {
        this.onmousedown = () => { };
        this.onmousemove = () => { };
        this.onmouseup = () => { };

        this.onClose(board);
    }

    /**
     * 恢复。
     * @param {*} board 
     */
    restore(board) {
        // Nothing
    }

    setSize(size) {
        this.size = size;
    }

    setColor(color) {
        this.color = color;
    }

    onOpen() {
        // Nothing
    }

    onClose() {
        // Nothing
    }

    onmousedown() {
        // Nothing
    }

    onmousemove() {
        // Nothing
    }

    onmouseup() {
        // Nothing
    }

    triggerEvent(type, x, y, e) {
        this[type](x, y, e);
    }
}
