/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020-2023 Cube Team.
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

import { Directory } from "./Directory";
import { FileLabel } from "./FileLabel";

/**
 * 废弃的目录。
 */
export class TrashDirectory {

    /**
     * @param {JSON} json 
     */
    constructor(json) {

        /**
         * @private
         */
        this.dir = this.unpackDirectory(json.directory);

        /**
         * 废弃目录的时间戳。
         * @type {number}
         */
        this.trashTimestamp = (undefined !== json.timestamp) ? json.timestamp : 0;

        /**
         * @type {number}
         */
        this.trashId = json.id;
    }

    /**
     * 获取废弃目录的 ID 。
     * @returns {number} 返回废弃目录的 ID 。
     */
    getId() {
        return this.trashId;
    }

    /**
     * @returns {string}
     */
    getDomain() {
        return this.dir.domain;
    }

    /**
     * 获取废弃目录的原父目录。
     * @returns {Directory} 返回废弃目录的原父目录。
     */
    getParent() {
        return this.dir.parent;
    }

    /**
     * 废弃目录是否是根目录。
     * @returns {boolean} 如果是根目录返回 {@linkcode true} 。
     */
    isRoot() {
        return (null == this.dir.parent);
    }

    /**
     * 获取目录名。
     * @returns {string} 返回目录名。
     */
    getName() {
        return this.dir.name;
    }

    /**
     * 获取目录的创建时间。
     * @returns {number} 返回目录的创建时间。
     */
    getCreation() {
        return this.dir.creation;
    }

    /**
     * 获取目录最后一次修改时间。
     * @returns {number} 返回目录最后一次修改时间。
     */
    getLastModified() {
        return this.dir.lastModified;
    }

    /**
     * 获取目录包含的所有文件大小。
     * @returns {number} 返回目录包含的所有文件大小。
     */
    getSize() {
        return this.dir.size;
    }

    /**
     * 当前目录是否是隐藏目录。
     * @returns {boolean} 如果是隐藏目录返回 {@linkcode true} 。
     */
    isHidden() {
        return this.dir.hidden;
    }

    /**
     * 合计包含的同级目录数量。
     * @returns {number} 返回包含的同级目录数量。
     */
    totalDirs() {
        return this.dir.numDirs;
    }

    /**
     * 合计包含的同级文件数量。
     * @returns {number} 返回包含的同级文件数量。
     */
    totalFiles() {
        return this.dir.numFiles;
    }

    /**
     * 是否是文件。
     * @returns {boolean} 返回 {@linkcode false} 。
     */
    isFile() {
        return false;
    }

    /**
     * 是否是目录。
     * @returns {boolean} 返回 {@linkcode true} 。
     */
    isDirectory() {
        return true;
    }

    /**
     * 获取废弃的时间戳。
     * @returns {number} 返回废弃的时间戳。
     */
    getTrashTimestamp() {
        return this.trashTimestamp;
    }

    /**
     * 解包。
     * @private
     * @param {JSON} json 
     */
    unpackDirectory(json) {
        let dir = this.toDirectory(json);

        // 父目录
        if (json.parent) {
            let parent = this.toDirectory(json.parent);
            dir.parent = parent;
        }

        // 子目录
        if (json.dirs) {
            json.dirs.forEach((item) => {
                let subdir = this.unpackDirectory(item);
                dir.addChild(subdir);
            });
        }

        // 包含的文件
        if (json.files) {
            json.files.forEach((item) => {
                let file = FileLabel.create(item);
                dir.addFile(file);
            });
        }

        return dir;
    }

    /**
     * @private
     * @param {JSON} json 
     */
    toDirectory(json) {
        let dir = new Directory(null);
        dir.id = json.id;
        dir.domain = json.domain;
        dir.name = json.name;
        dir.creation = json.creation;
        dir.lastModified = json.lastModified;
        dir.size = json.size;
        dir.hidden = json.hidden;
        dir.numDirs = json.numDirs;
        dir.numFiles = json.numFiles;
        return dir;
    }
}
