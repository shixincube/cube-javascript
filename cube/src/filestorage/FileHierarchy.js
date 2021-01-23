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

import cell from "@lib/cell-lib";
import { ModuleError } from "../core/error/ModuleError";
import { Packet } from "../core/Packet";
import { StateCode } from "../core/StateCode";
import { FileStorage } from "./FileStorage";
import { Directory } from "./Directory";
import { FileStorageAction } from "./FileStorageAction";
import { FileStorageState } from "./FileStorageState";
import { FileLabel } from "./FileLabel";
import { FastMap } from "../util/FastMap";

/**
 * 文件层级结构描述。
 */
export class FileHierarchy {

    /**
     * @param {FileStorage} storage
     */
    constructor(storage) {
        /**
         * @type {FileStorage}
         */
        this.storage = storage;

        /**
         * @type {Directory}
         */
        this.root = null;

        /**
         * @type {FastMap}
         */
        this.dirMap = new FastMap();
    }

    /**
     * @returns {Directory}
     */
    getRoot() {
        return this.root;
    }

    /**
     * 获取指定 ID 或名称的目录。
     * @param {number|string} idOrName 目录 ID 或者目录名。
     * @returns {Directory} 返回指定 ID 或名称的目录。
     */
    getDirectory(idOrName) {
        if (typeof idOrName === 'number') {
            return this.dirMap.get(idOrName);
        }
        else if (typeof idOrName === 'string') {
            let list = this.dirMap.values();
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
     * 罗列指定目录下的子目录。
     * @param {Directory} directory 
     * @param {function} handleSuccess 
     * @param {function} handleFailure 
     */
    listDirs(directory, handleSuccess, handleFailure) {
        let request = new Packet(FileStorageAction.ListDirs, {
            root: this.root.id,
            id: directory.id
        });
        this.storage.pipeline.send(FileStorage.NAME, request, (pipeline, source, packet) => {
            if (null == packet || packet.getStateCode() != StateCode.OK) {
                let error = new ModuleError(FileStorage.NAME, FileStorageState.Failure, directory);
                handleFailure(error);
                return;
            }

            if (packet.getPayload().code != FileStorageState.Ok) {
                let error = new ModuleError(FileStorage.NAME, packet.getPayload().code, directory);
                handleFailure(error);
                return;
            }

            let list = packet.getPayload().data.list;
            list.forEach((jdir) => {
                let dir = Directory.create(jdir, this);
                directory.addChild(dir);
            });
            directory.numDirs = list.length;

            handleSuccess(directory);
        });
    }

    /**
     * @private
     * @param {Directory} directory 
     * @param {number} beginIndex 
     * @param {number} endIndex 
     * @param {function} handleSuccess 
     * @param {function} handleFailure 
     */
    listFiles(directory, beginIndex, endIndex, handleSuccess, handleFailure) {
        let request = new Packet(FileStorageAction.ListFiles, {
            root: this.root.id,
            id: directory.id,
            begin: beginIndex,
            end: endIndex
        });
        
        this.storage.pipeline.send(FileStorage.NAME, request, (pipeline, source, packet) => {
            if (null == packet || packet.getStateCode() != StateCode.OK) {
                let error = new ModuleError(FileStorage.NAME, FileStorageState.Failure, directory);
                handleFailure(error);
                return;
            }

            if (packet.getPayload().code != FileStorageState.Ok) {
                let error = new ModuleError(FileStorage.NAME, packet.getPayload().code, directory);
                handleFailure(error);
                return;
            }

            let current = [];
            let data = packet.getPayload().data;
            let list = data.list;
            list.forEach((jfile) => {
                let file = FileLabel.create(jfile);
                directory.addFile(file);
                current.push(file);
            });
            handleSuccess(directory, current, data.begin, data.end);
        });
    }

    /**
     * 新建目录。
     * @param {Directory} workingDir 当前工作目录。
     * @param {string} newDirName 新目录名。
     * @param {function} handleSuccess 成功回调。参数：({@linkcode newDirectory}:{@link Directory}) 。
     * @param {function} handleFailure 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    newDirectory(workingDir, newDirName, handleSuccess, handleFailure) {
        // 校验根
        let root = this._recurseRoot(workingDir);
        if (root.getId() != this.root.getId()) {
            let error = new ModuleError(FileStorage.NAME, FileStorageState.NotFound, workingDir);
            cell.Logger.w('FileHierarchy', '#newDirectory() - ' + error);
            if (handleFailure) {
                handleFailure(error);
            }
            return;
        }

        let request = new Packet(FileStorageAction.NewDir, {
            root: root.getId(),
            workingId: workingDir.getId(),
            dirName: newDirName
        });
        this.storage.pipeline.send(FileStorage.NAME, request, (pipeline, source, packet) => {
            if (null == packet || packet.getStateCode() != StateCode.OK) {
                let error = new ModuleError(FileStorage.NAME, FileStorageState.Failure, workingDir);
                cell.Logger.w('FileHierarchy', '#newDirectory() - ' + error);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            if (packet.getPayload().code != FileStorageState.Ok) {
                let error = new ModuleError(FileStorage.NAME, packet.getPayload().code, workingDir);
                cell.Logger.w('FileHierarchy', '#newDirectory() - ' + error);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            // 解析数据
            let data = packet.getPayload().data;
            let dir = Directory.create(data, this);
            workingDir.addChild(dir);
            // 更新目录数量
            workingDir.numDirs += 1;
            handleSuccess(dir);
        });
    }

    /**
     * 删除目录。
     * @param {Directory} workingDir 当前工作目录。
     * @param {Directory|number} pendingDir 待删除目录或者目录 ID 。
     * @param {boolean} recursive 是否递归删除所有子文件和子目录。
     * @param {function} handleSuccess 成功回调。参数：({@linkcode deletedDir}:{@link Directory}) 。
     * @param {function} [handleFailure] 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    deleteDirectory(workingDir, pendingDir, recursive, handleSuccess, handleFailure) {
        // 校验根
        let root = this._recurseRoot(workingDir);
        if (root.getId() != this.root.getId()) {
            let error = new ModuleError(FileStorage.NAME, FileStorageState.NotFound, pendingDir);
            cell.Logger.w('FileHierarchy', '#deleteDirectory() - ' + error);
            if (handleFailure) {
                handleFailure(error);
            }
            return;
        }

        let deletedDir = workingDir.getDirectory((typeof pendingDir === 'number') ? pendingDir : pendingDir.getId());
        if (null == deletedDir) {
            let error = new ModuleError(FileStorage.NAME, FileStorageState.NotFound, pendingDir);
            cell.Logger.w('FileHierarchy', '#deleteDirectory() - ' + error);
            if (handleFailure) {
                handleFailure(error);
            }
            return;
        }

        let request = new Packet(FileStorageAction.DeleteDir, {
            root: root.getId(),
            workingId: workingDir.getId(),
            dirId: deletedDir.getId(),
            recursive: recursive
        });
        this.storage.pipeline.send(FileStorage.NAME, request, (pipeline, source, packet) => {
            if (null == packet || packet.getStateCode() != StateCode.OK) {
                let error = new ModuleError(FileStorage.NAME, FileStorageState.Failure, pendingDir);
                cell.Logger.w('FileHierarchy', '#deleteDirectory() - ' + error);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            if (packet.getPayload().code != FileStorageState.Ok) {
                let error = new ModuleError(FileStorage.NAME, packet.getPayload().code, pendingDir);
                cell.Logger.w('FileHierarchy', '#deleteDirectory() - ' + error);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            // 解析数据
            // let data = packet.getPayload().data;

            handleSuccess(deletedDir);

            // 更新目录数量
            workingDir.numDirs -= 1;
            workingDir.removeChild(deletedDir);
        });
    }

    /**
     * 递归到根目录。
     * @private
     * @param {Directory} dir 
     * @returns {Directory}
     */
    _recurseRoot(dir) {
        if (null == dir.parent) {
            return dir;
        }

        return this._recurseRoot(dir.parent);
    }
}
