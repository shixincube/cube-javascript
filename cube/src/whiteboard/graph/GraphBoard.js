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

import TouchScroll from "./TouchScroll";
import { ToolType } from "./ToolType";
import { Rect } from "./Rect";

/**
 * 图形画板。
 */
export class GraphBoard {

    /**
     * 
     * @param {HTMLElement} dom 
     * @param {object} options 
     */
    constructor(dom, options) {
        this.entity = null;
        this.ratio = window.devicePixelRatio;
        this.zoom = options.zoom;
        this.ts = null;
        this.record = [];
        this.status = { w1: 0, h1: 0, w2: 0, h2: 0, scale: 1 };
        this.enableKeepCrop = options.keepCrop instanceof Crop;
        this.keepCrop = options.keepCrop;

        this.dom = this._fixDom(dom, options);
        this._initCanvas(this.ratio);
        this._initEvents(this.draftlayer);

        if (this.enableKeepCrop) {
            this.keepCrop.keep = true;
            this.keepCrop.open(this);
            this.setCursor(this.keepCrop.cursor);
        }
    }

    _fixDom(dom, options) {
        if (options.enableTouchScroll) {
            let { width, height } = options;
            let board = document.createElement('div');
            board.style.width = typeof width === 'number' ? width + 'px' : width;
            board.style.height = typeof height === 'number' ? height + 'px' : height;
            board.style.position = 'absolute';
            board.style.left = '0';
            board.style.right = '0';
            board.style.top = '0';
            board.style.bottom = '0';
            board.style.margin = 'auto';
            dom.appendChild(board);

            this.ts = TouchScroll(board);
            this.ts.enable();

            return board;
        }

        return dom;
    }

    _initCanvas(ratio) {
        let dom = this.dom, width = dom.clientWidth, height = dom.clientHeight;
        this.status = {w1: width, h1: height, w2: width, h2: height, scale: 1};

        // 画布容器
        let container = document.createElement('div');
        // 画布外层
        let wrap = document.createElement('div');
        // 视图图层
        let view = document.createElement('canvas');
        // 草稿图层
        let draft = document.createElement('canvas');

        container.style.overflow = 'hidden';
        container.style.zIndex = '1';
        container.style.position = wrap.style.position = view.style.position = draft.style.position = 'absolute';
        wrap.style.width = width + 'px';
        wrap.style.height = height + 'px';
        container.style.width = view.style.width = draft.style.width = '100%';
        container.style.height = view.style.height = draft.style.height = '100%';
        container.style.top = wrap.style.top = view.style.top = draft.style.top = '0';
        wrap.style.left = '0';
        view.width = draft.width = width * ratio;
        view.height = draft.height = height * ratio;

        this.container = container;
        this.wrap = wrap;
        this.viewlayer = view;
        this.draftlayer = draft;

        this.viewctx = view.getContext('2d');
        this.draftctx = draft.getContext('2d');

        wrap.appendChild(view);
        wrap.appendChild(draft);
        container.appendChild(wrap);
        dom.appendChild(container);
    }

    _initEvents(canvas) {
        let rect = null, bound = null, touchable = 'ontouchstart' in document;
        let handle = touchable ? (type, event, over = false) => {
            let entity = this.entity || this.keepCrop;
            if (entity !== null) {
                let e = event.touches[0] || event.changedTouches[0];
                let x = e.pageX - rect.left, y = e.pageY - rect.top;
                if (over) {
                    x = Math.max(Math.min(e.pageX - rect.left, bound.width), bound.x);
                    y = Math.max(Math.min(e.pageY - rect.top, bound.height), bound.y);
                }
                entity.triggerEvent(type, Math.floor(x), Math.floor(y), e);
            }
        } : (type, e, over = false) => {
            let entity = this.entity || this.keepCrop;
            if (entity !== null) {
                let x = e.offsetX, y = e.offsetY;
                if (over) {
                    x = Math.max(Math.min(e.pageX - rect.left, bound.width), bound.x);
                    y = Math.max(Math.min(e.pageY - rect.top, bound.height), bound.y);
                }
                entity.triggerEvent(type, Math.floor(x), Math.floor(y), e);
            }
        };

        if (this.enableKeepCrop) {
            this.onmousedown_event = (event) => {
                if (event.target === canvas) {
                    let r = canvas.getBoundingClientRect();
                    let b = this.entity === null ? this.getBoardBounds(1) : this.keepCrop.getBounds(1);
                    let e = touchable ? event.touches[0] : event;
                    b.width += b.x;
                    b.height += b.y;
                    let x = e.pageX - r.left, y = e.pageY - r.top;

                    if (this.entity === null || (x >= b.x && x <= b.width && y >= b.y && y <= b.height)) {
                        rect = r;
                        bound = b;
                        handle('onmousedown', e);
                    }
                }
            };
            this.onmousemove_event = (e) => {
                handle('onmousemove', e, null !== rect && (this.entity !== null || e.target !== canvas));
            };
        } else {
            this.onmousedown_event = (e) => {
                if (e.target === canvas) {
                    rect = canvas.getBoundingClientRect();
                    bound = this.getBounds(1);
                    bound.width += bound.x;
                    bound.height += bound.y;
                    handle('onmousedown', e);
                }
            };
            this.onmousemove_event = (e) => {
                if (e.target === canvas) {
                    handle('onmousemove', e);
                } else if (null !== rect) {
                    handle('onmousemove', e, true);
                }
            };
        }
        this.onmouseup_event = (e) => {
            if (null !== rect) {
                handle('onmouseup', e, true);
                rect = null;
                bound = null;
            }
        };

        let types = touchable ? ['touchstart', 'touchmove', 'touchend'] : ['mousedown', 'mousemove', 'mouseup'];
        window.addEventListener(types[0], this.onmousedown_event, true);
        window.addEventListener(types[1], this.onmousemove_event, true);
        window.addEventListener(types[2], this.onmouseup_event, true);
    }

    _removeEvents() {
        let types = 'ontouchstart' in document ? ['touchstart', 'touchmove', 'touchend'] : ['mousedown', 'mousemove', 'mouseup'];
        window.removeEventListener(types[0], this.onmousedown_event, true);
        window.removeEventListener(types[1], this.onmousemove_event, true);
        window.removeEventListener(types[2], this.onmouseup_event, true);
    }

    setCursor(cursor) {
        this.draftlayer.style.cursor = cursor;
    }

    dispose() {
        this.deselect();
        this._removeEvents();
        if (this.ts !== null) {
            this.dom.parentElement.removeChild(this.dom);
        } else {
            this.dom.removeChild(this.container);
        }
        if (this.keepCrop !== null) {
            this.keepCrop.close(this);
            this.keepCrop = null;
        }
        this.record = [];
    }

    select(entity) {
        this.deselect();
        if (this.ts !== null) this.ts.disable();
        this.entity = entity;
        this.entity.open(this);
        this.setCursor(entity.cursor);
    }

    deselect() {
        if (this.entity !== null) {
            if (this.ts !== null) this.ts.enable();
            this.entity.close(this);
            this.entity = null;
            this.setCursor('');
        }
    }

    setZoom(zoom) {
        this.zoom = zoom;
    }

    _updateZoom(zoom) {
        this.status.scale += zoom;
        this.zoom = this.zoom + zoom;

        let {scale, w1, w2, h1, h2} = this.status;
        let dom = this.dom, wrap = this.wrap, view = this.viewlayer, draft = this.draftlayer, ratio = this.ratio;
        let width = dom.clientWidth, height = dom.clientHeight;
        w1 = w1 * scale;
        h1 = h1 * scale;

        dom.style.width = w2 * scale + 'px';
        dom.style.height = h2 * scale + 'px';
        wrap.style.width = w1 + 'px';
        wrap.style.height = h1 + 'px';

        view.width = draft.width = w1 * ratio;
        view.height = draft.height = h1 * ratio;

        this.load(this.record, 1, false);
        if (this.entity !== null) this.entity.restore(this);
        if (this.ts !== null) this.ts.center(dom.clientWidth - width, dom.clientHeight - height);
    }

    zoomIn(zoom) {
        this._updateZoom(zoom);
    }

    zoomOut(zoom) {
        this._updateZoom(-zoom);
    }

    setImage(img, save = true, callback) {
        let draw = (e) => {
            if (e) img.removeEventListener('load', draw, true);
            this.viewctx.drawImage(img, 0, 0, this.viewlayer.width, this.viewlayer.height);
        };

        // 清除所有数据
        this._clear();

        if (img instanceof ImageData) {
            this.viewctx.putImageData(img, 0, 0);
        } else if (img.complete) {
            draw();
        } else if (typeof img === 'string') {
            let image = new Image();
            image.onload = () => {
                image.onload = null;
                let width = this.viewlayer.width, height = this.viewlayer.height, x = 0, y = 0;
                let w = image.width, h = image.height;
                let widthRatio = width / w, heightRatio = height / h;

                if (widthRatio > heightRatio) {
                    width = Math.floor(w * heightRatio);
                    x = Math.floor((this.viewlayer.width - width) / 2);
                } else {
                    height = Math.floor(h * widthRatio);
                    y = Math.floor((this.viewlayer.height - height) / 2);
                }

                this.viewctx.drawImage(image, 0, 0, w, h, x, y, width, height);

                if (save)
                    this.onchange({cmd: ToolType.IMAGE, value: img});

                if (typeof callback === 'function')
                    callback();
            };
            image.onerror = () => {
                if (typeof callback === 'function')
                    callback(new Error('Load failed'));
            };
            image.src = img;
        } else {
            img.addEventListener('load', draw, true);
        }
        if (save) {
            this.record.push({cmd: ToolType.IMAGE, value: img});
        }
    }

    undo(sync = true) {
        this._clear();
        this.record.pop();
        // 还原被裁剪前的大小
        this.setBounds(0, 0, this.wrap.clientWidth, this.wrap.clientHeight);
        if (this.record.length > 0) {
            this.load(this.record, 1, false);
        }
        if (sync) {
            this.onchange({cmd: ToolType.UNDO});
        }
    }

    load(list, offset = 1, save = true) {
        let record = [], imageData = null;
        // 过滤 img 前数据
        for (let data of list) {
            if (data.cmd === ToolType.IMAGE) {
                record = [];
                imageData = data;
            } else if (data.cmd === ToolType.CLEAR) {
                record = [];
                this.record = [];
                this._clear();
            } else if (data.cmd === ToolType.UNDO) {
                record.pop();
            } else {
                record.push(data);
            }
        }

        let render = () => {
            for (let data of record) {
                let ratio = this.ratio;
                let zoom = data.zoom;
                data.zoom = this.status.scale / (zoom / offset);
                switch (data.cmd) {
                    case ToolType.PEN:
                        Pen.draw(this.viewctx, data, ratio);
                        if (save) this.record.push(data);
                        break;
                    case ToolType.RECT:
                        Rect.draw(this.viewctx, data, ratio);
                        if (save) this.record.push(data);
                        break;
                    case ToolType.TEXT:
                        Text.draw(this.viewctx, data, ratio);
                        if (save) this.record.push(data);
                        break;
                    case ToolType.ELLIPSE:
                        Ellipse.draw(this.viewctx, data, ratio);
                        if (save) this.record.push(data);
                        break;
                    case ToolType.ARROW:
                        Arrow.draw(this.viewctx, data, ratio);
                        if (save) this.record.push(data);
                        break;
                    case ToolType.MOSAIC:
                        Mosaic.draw(this.viewctx, data, ratio);
                        if (save) this.record.push(data);
                        break;
                    case ToolType.CROP:
                        Crop.draw(this.viewctx, data, ratio, this);
                        if (save) this.record.push(data);
                        break;
                    case ToolType.IMAGE:
                        this.setImage(data.value, false);
                        if (save) this.record.push(data);
                        break;
                    default:
                        break;
                }

                data.zoom = zoom;
            }
        };

        if (imageData) {
            let zoom = imageData.zoom;
            imageData.zoom = this.status.scale / (zoom / offset);
            this.setImage(imageData.value, false, () => {
                render();
            });
            if (save) this.record.push(imageData);

            imageData.zoom = zoom;
        } else {
            render();
        }


    }

    change(data) {
        data.zoom = this.zoom;
        this.record.push(data);
        this.onchange(data);
    }

    onchange() { }

    setBounds(x, y, width, height) {
        let dom = this.dom, w = dom.clientWidth, h = dom.clientHeight;
        if (w !== width || h !== height) {
            dom.style.width = width + 'px';
            dom.style.height = height + 'px';
            this.status.w2 = width;
            this.status.h2 = height;

            this.wrap.style.left = x + 'px';
            this.wrap.style.top = y + 'px';

            if (this.ts !== null) this.ts.center(w - width, h - height);
        }
    }

    getBounds(ratio = this.ratio, check = true) {
        // 如果保持截屏则直接返回截屏区域
        return this.enableKeepCrop ? this.keepCrop.getBounds(ratio, this.entity !== null ? this.entity.size : 0) : this.getBoardBounds(ratio, check);
    }

    getBoardBounds(ratio = this.ratio, check = true) {
        let dom = this.dom, x = this.wrap.offsetLeft, y =  this.wrap.offsetTop;
        let width = dom.clientWidth, height = dom.clientHeight;
        if (check && this.ts !== null) {
            let sx = this.dom.offsetLeft, sy = this.dom.offsetTop;
            let parent = this.dom.offsetParent;
            if (sx <= 0) {
                x = x - sx;
                width = parent.clientWidth;
            }
            if (sy <= 0) {
                y = y - sy;
                height = parent.clientHeight;
            }
        }
        return {
            x: Math.floor(Math.abs(x) * ratio),
            y: Math.floor(Math.abs(y) * ratio),
            width: Math.floor(width * ratio),
            height: Math.floor(height * ratio)
        };
    }

    restore() {
        this.draftctx.restore();
        this.viewctx.restore();
    }

    _clear() {
        let {width, height} = this.viewlayer;
        this.draftctx.clearRect(0, 0, width, height);
        this.viewctx.clearRect(0, 0, width, height);
        if (this.entity instanceof Crop) this.deselect();
    }

    clear() {
        this.record = [];
        this._clear();
        this.onchange({ cmd: ToolType.CLEAR });
    }

    clearDraft() {
        let { width, height } = this.viewlayer;
        if (this.enableKeepCrop) {
            let p = this.keepCrop.getBounds(this.ratio);
            this.draftctx.clearRect(p.x, p.y, p.width, p.height);
        } else {
            this.draftctx.clearRect(0, 0, width, height);
        }
    }

    save(header = true, quality = 0.8) {
        let bound = this.getBounds();
        let canvas = document.createElement('canvas');
        canvas.width = bound.width;
        canvas.height = bound.height;

        canvas.getContext('2d').drawImage(this.viewlayer, -bound.x, -bound.y, this.viewlayer.width, this.viewlayer.height);
        let data = canvas.toDataURL('image/jpeg', quality);
        return header ? data : data.replace(/^data:image\/\w+;base64,/, "");
    }
}
