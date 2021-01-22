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
import { FileHierarchy } from "./FileHierarchy";
import { FileLabel } from "./FileLabel";

/**
 * 文件目录。
 */
export class Directory {

    /**
     * @param {FileHierarchy} hierarchy 层级描述对象。
     */
    constructor(hierarchy) {
        /**
         * @type {FileHierarchy}
         */
        this.hierarchy = hierarchy;

        /**
         * @type {number}
         */
        this.id = 0;

        /**
         * @type {string}
         */
        this.domain = null;

        /**
         * @type {number}
         */
        this.ownerId = 0;

        /**
         * @type {number}
         */
        this.parentId = 0;

        /**
         * @type {Directory}
         */
        this.parent = null;

        /**
         * @type {string}
         */
        this.name = null;

        /**
         * @type {number}
         */
        this.creation = 0;

        /**
         * @type {number}
         */
        this.lastModified = 0;

        /**
         * @type {boolean}
         */
        this.hidden = false;

        /**
         * @type {number}
         */
        this.size = 0;

        /**
         * @type {number}
         */
        this.numDirs = 0;

        /**
         * @type {OrderMap<number,Directory>}
         */
        this.children = new OrderMap();

        /**
         * @type {number}
         */
        this.numFiles = 0;

        /**
         * @type {OrderMap<number,FileLabel>}
         */
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
     * @returns {boolean}
     */
    isRoot() {
        return (null == this.parent);
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
     * 合计文件夹数量。
     * @returns {number}
     */
    totalDirs() {
        return this.numDirs;
    }

    /**
     * 合计文件数量。
     * @returns {number}
     */
    totalFiles() {
        return this.numFiles;
    }

    /**
     * 罗列当前目录的所有子目录。
     * @param {function} handleSuccess 成功回调。参数：({@linkcode dir}:{@link Directory}, {@linkcode list}:{@link Array})
     * @param {function} [handleFailure] 失败回调。参数：({@linkcode error}:{@link ModuleError})
     */
    listDirectories(handleSuccess, handleFailure) {
        if (this.numDirs == this.children.size()) {
            handleSuccess(this, this.children.values());
            return;
        }

        if (null == this.hierarchy || undefined === this.hierarchy) {
            handleSuccess(this, []);
            return;
        }

        this.hierarchy.listDirs(this, (dir) => {
            handleSuccess(this, this.children.values());
        }, (error) => {
            console.debug(error.toString());

            if (handleFailure) {
                handleFailure(error);
            }
        });
    }

    /**
     * 获取指定ID或者名称的子目录。
     * @param {number|string} idOrName 
     * @returns {Directory} 返回指定ID或者名称的子目录。
     */
    getDirectory(idOrName) {
        if (typeof idOrName === 'number') {
            return this.children.get(idOrName);
        }
        else if (typeof idOrName === 'string') {
            let list = this.children.values();
            for (let i = 0; i < list.length; ++i) {
                let dir = list[i];
                if (dir.name == idOrName) {
                    return dir;
                }
            }
        }

        return null;
    }

    /**
     * 罗列指定索引范围内的所有文件。
     * @param {number} beginIndex 
     * @param {number} endIndex 
     * @param {function} handleSuccess 成功回调。参数：({@linkcode dir}:{@link Directory}, {@linkcode list}:{@linkcode Array}, {@linkcode begin}:{@linkcode number}, {@linkcode end}:{@linkcode number})
     * @param {function} [handleFailure] 失败回调。参数：({@linkcode error}:{@link ModuleError})
     */
    listFiles(beginIndex, endIndex, handleSuccess, handleFailure) {
        if (this.numFiles == this.files.size()) {
            let begin = beginIndex;
            let end = endIndex;

            if (end + 1 > this.numFiles) {
                end = this.numFiles;
            }

            if (begin >= end) {
                handleSuccess(this, []);
                return;
            }

            let list = this.files.values().slice(begin, end);
            handleSuccess(this, list, beginIndex, endIndex);
            return;
        }

        if (null == this.hierarchy || undefined === this.hierarchy) {
            handleSuccess(this, [], beginIndex, endIndex);
            return;
        }

        this.hierarchy.listFiles(this, beginIndex, endIndex, (dir, files, begin, end) => {
            handleSuccess(dir, files, begin, end);
        }, (error) => {
            if (handleFailure) {
                handleFailure(error);
            }
        });
    }

    /**
     * 获取指定 ID 或者文件名的文件。
     * @param {number|string} idOrName 
     * @returns {FileLabel} 返回指定 ID 或者文件名的文件。
     */
    getFile(idOrName) {
        if (typeof idOrName === 'number') {
            return this.files.get(idOrName);
        }
        else if (typeof idOrName === 'string') {
            let list = this.files.values();
            for (let i = 0; i < list.length; ++i) {
                let file = list[i];
                if (file.fileName == idOrName) {
                    return file;
                }
            }
        }

        return null;
    }

    /**
     * 新建目录。
     * @param {string} dirName 新目录名称。
     * @param {function} handleSuccess 成功回调。参数：({@linkcode newDir}:{@link Directory}) 。
     * @param {function} [handleFailure] 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    newDirectory(dirName, handleSuccess, handleFailure) {
        this.hierarchy.newDirectory(this, dirName, handleSuccess, handleFailure);
    }

    /**
     * 删除子目录。
     * @param {Directory|number} dir 待删除目录或者目录 ID 。
     * @param {boolean} recursive 是否递归删除所有子文件和子目录。
     * @param {function} handleSuccess 成功回调。参数：({@linkcode deletedDir}:{@link Directory}) 。
     * @param {function} handleFailure 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    deleteDirectory(dir, recursive, handleSuccess, handleFailure) {
        this.hierarchy.deleteDirectory(this, dir, recursive, handleSuccess, handleFailure);
    }

    /**
     * @private
     * @param {Directory} child 
     */
    addChild(child) {
        if (this.children.containsKey(child.id)) {
            this.removeChild(child);
        }

        child.parent = this;
        this.children.put(child.id, child);
    }

    /**
     * @private
     * @param {Directory} child 
     */
    removeChild(child) {
        if (null != this.children.remove(child.id)) {
            child.parent = null;
        }
    }

    /**
     * @private
     * @param {FileLabel} fileLabel 
     */
    addFile(fileLabel) {
        if (this.files.containsKey(fileLabel.getId())) {
            return;
        }

        this.files.put(fileLabel.getId(), fileLabel);
    }

    /**
     * @private
     * @param {FileLabel} fileLabel 
     */
    removeFile(fileLabel) {
        this.files.remove(fileLabel.getId());
    }

    /**
     * 创建 JSON 格式指定的 {@link Directory} 对象实例。
     * @param {JSON} json 
     * @param {FileHierarchy} hierarchy
     * @returns {Directory} 
     */
    static create(json, hierarchy) {
        let dir = new Directory(hierarchy);
        dir.ownerId = json.owner;
        dir.id = json.id;
        dir.domain = json.domain;
        dir.name = json.name;
        dir.creation = json.creation;
        dir.lastModified = json.lastModified;
        dir.size = json.size;
        dir.hidden = json.hidden;
        dir.numDirs = json.numDirs;
        dir.numFiles = json.numFiles;

        if (undefined !== json.parent) {
            dir.parentId = json.parent;
        }

        if (undefined !== json.dirs) {
            for (let i = 0; i < json.dirs.length; ++i) {
                let subdir = Directory.create(json.dirs[i], hierarchy);
                dir.addChild(subdir);
            }
        }

        return dir;
    }
}
