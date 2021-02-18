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
         * 文件层级描述。
         * @type {FileHierarchy}
         */
        this.hierarchy = hierarchy;

        /**
         * 目录的 ID 。
         * @type {number}
         */
        this.id = 0;

        /**
         * 目录所属的域。
         * @type {string}
         */
        this.domain = null;

        /**
         * 目录所属的实体 ID 。
         * @type {number}
         */
        this.ownerId = 0;

        /**
         * 父目录 ID 。
         * @type {number}
         */
        this.parentId = 0;

        /**
         * 父目录。
         * @type {Directory}
         */
        this.parent = null;

        /**
         * 目录名。
         * @type {string}
         */
        this.name = null;

        /**
         * 目录的创建时间。
         * @type {number}
         */
        this.creation = 0;

        /**
         * 目录最后一次修改时间。
         * @type {number}
         */
        this.lastModified = 0;

        /**
         * 是否是隐藏目录。
         * @type {boolean}
         */
        this.hidden = false;

        /**
         * 目录内所有各级文件大小总和。
         * @type {number}
         */
        this.size = 0;

        /**
         * 当前目录的子目录数量。
         * @type {number}
         */
        this.numDirs = 0;

        /**
         * 子目录映射。
         * @type {OrderMap<number,Directory>}
         */
        this.children = new OrderMap();

        /**
         * 当前目录下的文件数量。
         * @type {number}
         */
        this.numFiles = 0;

        /**
         * 包含的文件映射。
         * @type {OrderMap<string,FileLabel>}
         */
        this.files = new OrderMap();
    }

    /**
     * 获取目录的 ID 。
     * @returns {number} 返回目录的 ID 。
     */
    getId() {
        return this.id;
    }

    /**
     * 获取目录所属的域。
     * @returns {string} 返回目录所属的域。
     */
    getDomain() {
        return this.domain;
    }

    /**
     * 获取父目录。
     * @returns {Directory} 返回父目录。
     */
    getParent() {
        return this.parent;
    }

    /**
     * 是否是根目录。
     * @returns {boolean} 如果当前目录是根目录返回 {@linkcode true} 。
     */
    isRoot() {
        return (null == this.parent);
    }

    /**
     * 获取目录名。
     * @returns {string} 返回目录名。
     */
    getName() {
        return this.name;
    }

    /**
     * 获取目录创建时间。
     * @returns {number} 返回目录创建时间。
     */
    getCreation() {
        return this.creation;
    }

    /**
     * 获取目录最近一次修改时间。
     * @returns {number} 返回目录最近一次修改时间。
     */
    getLastModified() {
        return this.lastModified;
    }

    /**
     * 获取目录包含的所有文件大小。
     * @returns {number} 返回目录包含的所有文件大小。
     */
    getSize() {
        return this.size;
    }

    /**
     * 当前目录是否是隐藏目录。
     * @returns {boolean} 如果是隐藏目录返回 {@linkcode true} 。
     */
    isHidden() {
        return this.hidden;
    }

    /**
     * 合计包含的同级目录数量。
     * @returns {number} 返回包含的同级目录数量。
     */
    totalDirs() {
        return this.numDirs;
    }

    /**
     * 合计包含的同级文件数量。
     * @returns {number} 返回包含的同级文件数量。
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
     * 获取指定 ID 的子目录。
     * @param {number|string} id 目录 ID 。
     * @returns {Directory} 返回指定 ID 的子目录。
     */
    getDirectory(id) {
        return this.children.get(parseInt(id));
    }

    /**
     * 获取指定名称的子目录。
     * @param {string} name 目录名称。
     * @returns {Directory} 返回指定名称的子目录。
     */
    getDirectoryByName(name) {
        let list = this.children.values();
        for (let i = 0; i < list.length; ++i) {
            let dir = list[i];
            if (dir.name == name) {
                return dir;
            }
        }
        return null;
    }

    /**
     * 上传文件到该目录。
     * @param {File} file 指定文件。
     * @param {function} handleProcessing 正在上传文件回调。
     * @param {function} handleSuccess 成功回调。参数：({@linkcode directory}:{@link Directory}, {@linkcode fileLabel}:{@link FileLabel}) 。
     * @param {function} handleFailure 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    uploadFile(file, handleProcessing, handleSuccess, handleFailure) {
        this.hierarchy.uploadFileTo(file, this, handleProcessing, handleSuccess, handleFailure);
    }

    /**
     * 罗列指定索引范围内的所有文件。
     * @param {number} beginIndex 起始索引。
     * @param {number} endIndex 结束索引。
     * @param {function} handleSuccess 成功回调。参数：({@linkcode dir}:{@link Directory}, {@linkcode list}:{@linkcode Array}, {@linkcode begin}:{@linkcode number}, {@linkcode end}:{@linkcode number}) 。
     * @param {function} [handleFailure] 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
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
     * 获取指定文件码的文件。
     * @param {string} fileCode 指定文件码。
     * @returns {FileLabel} 返回指定文件码的文件。
     */
    getFile(fileCode) {
        return this.files.get(fileCode);
    }

    /**
     * 获取指定文件名的文件。
     * @param {string} name 指定文件名。
     * @returns {FileLabel} 返回指定文件名的文件。
     */
    getFileByName(name) {
        let list = this.files.values();
        for (let i = 0; i < list.length; ++i) {
            let file = list[i];
            if (file.fileName == name) {
                return file;
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
     * @param {Array|Directory|number|string} dirs 待删除目录或目录列表。
     * @param {boolean} recursive 是否递归删除所有子文件和子目录。
     * @param {function} handleSuccess 成功回调。参数：({@linkcode workingDir}:{@link Directory}, {@linkcode deletedList}:{@linkcode Array<Directory>}) 。
     * @param {function} [handleFailure] 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    deleteDirectory(dirs, recursive, handleSuccess, handleFailure) {
        this.hierarchy.deleteDirectory(this, dirs, recursive, handleSuccess, handleFailure);
    }

    /**
     * 删除文件。
     * @param {Array} files 指定待删除的文件码列表。
     * @param {function} handleSuccess 成功回调。参数：({@linkcode workingDir}:{@link Directory}, {@linkcode deletedList}:{@linkcode Array<FileLabel>}) 。
     * @param {function} [handleFailure] 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    deleteFile(files, handleSuccess, handleFailure) {
        this.hierarchy.deleteFile(this, files, handleSuccess, handleFailure);
    }

    /**
     * 搜索文件。
     * @param {SearchFilter} filter 
     * @param {function} handleSuccess 成功回调。参数：({@linkcode filter}:{@link SearchFilter}, {@linkcode list}:{@linkcode Array<SearchItem>}) 。
     * @param {function} [handleFailure] 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    searchFile(filter, handleSuccess, handleFailure) {
        this.hierarchy.searchFile(filter, handleSuccess, handleFailure);
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

        if (this.hierarchy) {
            this.hierarchy.dirMap.put(child.id, child);
        }
    }

    /**
     * @private
     * @param {Directory|number} child 
     */
    removeChild(child) {
        let id = (child instanceof Directory) ? child.id : child;
        if (null != this.children.remove(id)) {
            child.parent = null;
        }
    }

    /**
     * @private
     * @param {FileLabel} fileLabel 
     */
    addFile(fileLabel) {
        if (this.files.containsKey(fileLabel.getFileCode())) {
            return;
        }

        this.files.put(fileLabel.getFileCode(), fileLabel);
    }

    /**
     * @private
     * @param {FileLabel} fileLabel 
     */
    removeFile(fileLabel) {
        this.files.remove(fileLabel.getFileCode());
    }

    /**
     * 创建 JSON 格式指定的 {@link Directory} 对象实例。
     * @private
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

        if (undefined !== json.parentId) {
            dir.parentId = json.parentId;
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
