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

export default function(dom) {
    let horizontal = null, vertical = null;
    let md = (e) => {
        if (dom.contains(e.target)) {
            let w = dom.clientWidth, h = dom.clientHeight;
            let p = dom.offsetParent, mw = p.clientWidth, mh = p.clientHeight;

            if (w > mw) horizontal = {min: dom.offsetLeft - e.pageX,max: mw - w};
            if (h > mh) vertical = {min: dom.offsetTop - e.pageY, max: mh - h};
        }
    };
    let mm = (e) => {
        if (horizontal !== null) {
            dom.style.left = Math.min(Math.max(horizontal.min + e.pageX, horizontal.max), 0) + 'px';
            dom.style.right = 'auto';
        }

        if (vertical !== null) {
            dom.style.top = Math.min(Math.max(vertical.min + e.pageY, vertical.max), 0) + 'px';
            dom.style.bottom = 'auto';
        }
    };
    let mu = () => {
        horizontal = null;
        vertical = null;
    };

    return {
        enabled: false,

        enable: () => {
            if (!this.enabled) {
                this.enabled = true;
                window.addEventListener('mousedown', md, true);
                window.addEventListener('mousemove', mm, true);
                window.addEventListener('mouseup', mu, true);
            }
        },

        disable: () => {
            this.enabled = false;
            window.removeEventListener('mousedown', md, true);
            window.removeEventListener('mousemove', mm, true);
            window.removeEventListener('mouseup', mu, true);
        },

        center: (w, h) => {
            let parent = dom.offsetParent, x = dom.offsetLeft, y = dom.offsetTop;
            let width = dom.clientWidth, height = dom.clientHeight;
            let maxWidth = parent.clientWidth, maxHeight = parent.clientHeight;

            if (width > maxWidth) {
                x = x - w / 2;
                if (x + width < maxWidth) x = maxWidth - width;
                dom.style.left = Math.min(x, 0) + 'px';
                dom.style.right = 'auto';
            } else {
                dom.style.left = '0';
                dom.style.right = '0';
            }

            if (height > maxHeight) {
                y = y - h / 2;
                if (y + height < maxHeight) y = maxHeight - height;
                dom.style.top = Math.min(y, 0) + 'px';
                dom.style.bottom = 'auto';
            } else {
                dom.style.top = '0';
                dom.style.bottom = '0';
            }
        }
    };
}
