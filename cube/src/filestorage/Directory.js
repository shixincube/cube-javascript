/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020-2021 Shixin Cube Team.
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

import { OrderMap } from "../util/OrderMap";

/**
 * 文件目录。
 */
export class Directory {

    /**
     * @param {Directory} parent 父目录。
     */
    constructor(parent = null) {

        this.id = 0;

        this.domain = null;

        this.ownerId = 0;

        this.parentId = 0;
        this.parent = parent;

        this.name = null;

        this.creation = 0;

        this.lastModified = 0;

        this.hidden = false;

        this.size = 0;

        /**
         * @type {OrderMap<number,Directory>}
         */
        this.children = new OrderMap();

        this.numFiles = 0;
        this.files = new OrderMap();
    }

    /**
     * @returns {number}
     */
    getId() {
        return this.id;
    }

    /**
     * @returns {Directory}
     */
    getParent() {
        return this.parent;
    }

    /**
     * @returns {string}
     */
    getName() {
        return this.name;
    }

    /**
     * @returns {number}
     */
    getCreation() {
        return this.creation;
    }

    /**
     * @returns {number}
     */
    getLastModified() {
        return this.lastModified;
    }

    /**
     * @returns {number}
     */
    getSize() {
        return this.size;
    }

    /**
     * @returns {boolean}
     */
    isHidden() {
        return this.hidden;
    }

    /**
     * @returns {Array<Directory>}
     */
    getSubdirectories() {
        return this.children.values();
    }

    /**
     * @private
     * @param {Directory} child 
     */
    addChild(child) {
        if (this.children.containsKey(child.id)) {
            return;
        }

        child.parent = this;
        this.children.put(child.id, child);
    }

    /**
     * @private
     * @param {*} child 
     */
    removeChild(child) {
        if (null != this.children.remove(child.id)) {
            child.parent = null;
        }
    }

    /**
     * @private
     * @param {*} fileLabel 
     */
    addFile(fileLabel) {

    }

    /**
     * @private
     * @param {*} fileLabel 
     */
    removeFile(fileLabel) {
        
    }

    /**
     * 创建 JSON 格式指定的 {@link Directory} 对象实例。
     * @param {Directory} json 
     */
    static create(json) {
        let dir = new Directory();
        dir.ownerId = json.owner;
        dir.id = json.id;
        dir.domain = json.domain;
        dir.name = json.name;
        dir.creation = json.creation;
        dir.lastModified = json.lastModified;
        dir.size = json.size;
        dir.hidden = json.hidden;
        dir.numFiles = json.numFiles;

        if (undefined !== json.parent) {
            dir.parentId = json.parent;
        }

        if (undefined !== json.dirs) {
            for (let i = 0; i < json.dirs.length; ++i) {
                let subdir = Directory.create(json.dirs[i]);
                dir.addChild(subdir);
            }
        }

        return dir;
    }
}
