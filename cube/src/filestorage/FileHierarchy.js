/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020-2022 Cube Team.
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
import { FastMap } from "../util/FastMap";
import { ModuleError } from "../core/error/ModuleError";
import { Packet } from "../core/Packet";
import { PipelineState } from "../core/PipelineState";
import { FileStorage } from "./FileStorage";
import { Directory } from "./Directory";
import { FileStorageAction } from "./FileStorageAction";
import { FileStorageState } from "./FileStorageState";
import { FileLabel } from "./FileLabel";
import { TrashDirectory } from "./TrashDirectory";
import { TrashFile } from "./TrashFile";
import { SearchItem } from "./SearchItem";

/**
 * 搜索过滤器定义。
 * @typedef {object} SearchFilter
 * @property {number} begin 检索的起始索引。
 * @property {number} end 检索的结束索引。
 * @property {Array} [types] 包含检索的文件类型。
 * @property {Array} [nameKeywords] 包含检索的名称关键词。
 * @property {boolean} [inverseOrder] 是否安排时间倒序返回结果。
 */

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
         * @type {FastMap<number, Directory>}
         */
        this.dirMap = new FastMap();

        /**
         * @type {FastMap<number, TrashFile|TrashDirectory>}
         */
        this.trashMap = new FastMap();

        /**
         * 搜索结果。
         * @type {Array}
         */
        this.searchResults = [];
    }

    /**
     * @returns {Directory}
     */
    getRoot() {
        return this.root;
    }

    /**
     * 上传文件到指定目录。
     * 
     * @param {File} file 
     * @param {Directory} directory 
     * @param {function} handleStart
     * @param {function} handleProcessing
     * @param {function} handleSuccess 
     * @param {function} handleFailure 
     */
    uploadFile(file, directory, handleStart, handleProcessing, handleSuccess, handleFailure) {
        let successHandler = (fileLabel) => {
            // 将已上传文件插入到目录
            let request = new Packet(FileStorageAction.InsertFile, {
                root: this.root.getId(),
                dirId: directory.getId(),
                fileCode: fileLabel.fileCode
            });

            this.storage.pipeline.send(FileStorage.NAME, request, (pipeline, source, packet) => {
                if (null == packet || packet.getStateCode() != PipelineState.OK) {
                    let error = new ModuleError(FileStorage.NAME, FileStorageState.Failure, fileLabel);
                    cell.Logger.w('FileHierarchy', '#uploadFile() - InsertFile - ' + error);
                    if (handleFailure) {
                        handleFailure(error);
                    }
                    return;
                }

                if (packet.getPayload().code != FileStorageState.Ok) {
                    let error = new ModuleError(FileStorage.NAME, packet.getPayload().code, fileLabel);
                    cell.Logger.w('FileHierarchy', '#uploadFile() - InsertFile - ' + error);
                    if (handleFailure) {
                        handleFailure(error);
                    }
                    return;
                }

                // let dirJson = packet.getPayload().data.directory;
                let fileJson = packet.getPayload().data.file;
                let newFileLabel = FileLabel.create(fileJson);
                directory.addFile(newFileLabel);
                directory.numFiles += 1;

                // 本地数据赋值
                newFileLabel.sn = fileLabel.sn;
                newFileLabel.averageSpeed = fileLabel.averageSpeed;

                handleSuccess(directory, newFileLabel);
            });
        };

        if (null == file) {
            this.storage.uploadFileWithSelector(handleStart, handleProcessing, successHandler, (error) => {
                cell.Logger.w('FileHierarchy', '#uploadFile() - ' + error);
                handleFailure(error);
            });
        }
        else {
            this.storage.uploadFile(file, handleStart, handleProcessing, successHandler, (error) => {
                cell.Logger.w('FileHierarchy', '#uploadFile() - ' + error);
                handleFailure(error);
            });
        }
    }

    /**
     * 获取指定 ID 的目录。
     * @param {number|string} id 目录 ID 。
     * @returns {Directory} 返回指定 ID 的目录。
     */
    getDirectory(id) {
        let dirId = parseInt(id);
        return this.dirMap.get(dirId);
    }

    /**
     * 获取指定名称的目录。
     * @param {number|string} name 目录名。
     * @returns {Directory} 返回指定名称的目录。
     */
    getDirectoryByName(name) {
        let list = this.dirMap.values();
        for (let i = 0; i < list.length; ++i) {
            let dir = list[i];
            if (dir.name == name) {
                return dir;
            }
        }
        return null;
    }

    /**
     * 罗列指定目录下的子目录。
     * @private
     * @param {Directory} directory 
     * @param {function} handleSuccess 
     * @param {function} handleFailure 
     */
    listDirectories(directory, handleSuccess, handleFailure) {
        this.listDirs(directory, handleSuccess, handleFailure);
    }

    /**
     * 罗列指定目录下的子目录。
     * @private
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
            if (null == packet || packet.getStateCode() != PipelineState.OK) {
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
            list.forEach((value) => {
                let dir = Directory.create(value, this);
                directory.addChild(dir);
            });
            directory.numDirs = list.length;
            handleSuccess(directory);

            // 缓存
            this.dirMap.put(directory.getId(), directory);
        });
    }

    /**
     * 罗列指定目录下的文件。
     * @private
     * @param {Directory} directory 
     * @param {number} beginIndex 
     * @param {number} endIndex 
     * @param {function} handleSuccess 成功回调。参数：({@linkcode directory}, {@linkcode fileList}, {@linkcode beginIndex}, {@linkcode endIndex}) 。
     * @param {function} handleFailure 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    listFiles(directory, beginIndex, endIndex, handleSuccess, handleFailure) {
        let request = new Packet(FileStorageAction.ListFiles, {
            root: this.root.id,
            id: directory.id,
            begin: beginIndex,
            end: endIndex
        });

        this.storage.pipeline.send(FileStorage.NAME, request, (pipeline, source, packet) => {
            if (null == packet || packet.getStateCode() != PipelineState.OK) {
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
            list.forEach((value) => {
                let file = FileLabel.create(value);
                directory.addFile(file);
                current.push(file);
            });
            handleSuccess(directory, current, data.begin, data.end);

            // 缓存
            this.dirMap.put(directory.getId(), directory);
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
            if (null == packet || packet.getStateCode() != PipelineState.OK) {
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

            // 缓存
            this.dirMap.put(workingDir.getId(), workingDir);
        });
    }

    /**
     * 删除目录。
     * @param {Directory} workingDir 当前工作目录。
     * @param {Directory|Array|number|string} pendingDir 待删除目录或者目录 ID 。
     * @param {boolean} recursive 是否递归删除所有子文件和子目录。
     * @param {function} handleSuccess 成功回调。参数：({@linkcode workingDir}:{@link Directory}, {@linkcode deletedList}:{@linkcode Array<Directory>}) 。
     * @param {function} [handleFailure] 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    deleteDirectory(workingDir, pendingDir, recursive, handleSuccess, handleFailure) {
        if (typeof recursive === 'function') {
            cell.Logger.e('FileHierarchy', '#deleteDirectory() - parameter "recursive" type is error');
            return;
        }

        // 校验根
        let root = this._recurseRoot(workingDir);
        if (root.getId() != this.root.getId()) {
            let error = new ModuleError(FileStorage.NAME, FileStorageState.NotFound, workingDir);
            cell.Logger.w('FileHierarchy', '#deleteDirectory() - ' + error);
            if (handleFailure) {
                handleFailure(error);
            }
            return;
        }

        // 删除列表
        let deleteDirList = [];
        let deleteDirIdList = [];
        if (pendingDir instanceof Array) {
            if (pendingDir.length == 0) {
                return;
            }

            pendingDir.forEach((el) => {
                if (typeof el === 'number' || typeof el === 'string') {
                    let deletedDir = workingDir.getDirectory(el);
                    if (null != deletedDir) {
                        deleteDirList.push(deletedDir);
                        deleteDirIdList.push(deletedDir.getId());
                    }
                }
                else if (el instanceof Directory) {
                    let deletedDir = workingDir.getDirectory(el.getId());
                    if (null != deletedDir) {
                        deleteDirList.push(deletedDir);
                        deleteDirIdList.push(deletedDir.getId());
                    }
                }
            });
        }
        else if (typeof pendingDir === 'number' || typeof pendingDir === 'string') {
            let deletedDir = workingDir.getDirectory(pendingDir);
            if (null != deletedDir) {
                deleteDirList.push(deletedDir);
                deleteDirIdList.push(deletedDir.getId());
            }
        }
        else if (pendingDir instanceof Directory) {
            let deletedDir = workingDir.getDirectory(pendingDir.getId());
            if (null != deletedDir) {
                deleteDirList.push(deletedDir);
                deleteDirIdList.push(deletedDir.getId());
            }
        }
        else {
            let error = new ModuleError(FileStorage.NAME, FileStorageState.Forbidden, pendingDir);
            cell.Logger.w('FileHierarchy', '#deleteDirectory() - ' + error);
            if (handleFailure) {
                handleFailure(error);
            }
            return;
        }

        if (deleteDirList.length == 0) {
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
            dirList: deleteDirIdList,
            recursive: recursive
        });
        this.storage.pipeline.send(FileStorage.NAME, request, (pipeline, source, packet) => {
            if (null == packet || packet.getStateCode() != PipelineState.OK) {
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
            let data = packet.getPayload().data;
            let deletedList = data.deletedList;
            let dirJson = data.workingDir;

            // 更新目录
            let findDir = (dir) => {
                for (let i = 0; i < deletedList.length; ++i) {
                    let dirJson = deletedList[i];
                    if (dirJson.id == dir.id) {
                        return true;
                    }
                }
                return false;
            }

            let resultList = [];
            for (let i = 0; i < deleteDirList.length; ++i) {
                let dir = deleteDirList[i];
                if (findDir(dir)) {
                    workingDir.removeChild(dir);
                    resultList.push(dir);
                }
            }
            // 更新数量
            workingDir.numDirs -= resultList.length;
            workingDir.lastModified = dirJson.lastModified;

            // 计算大小
            let delta = workingDir.size - dirJson.size;
            this.storage.fileSpaceSize -= delta;

            workingDir.size = dirJson.size;

            handleSuccess(workingDir, resultList);

            // 缓存
            this.dirMap.put(workingDir.getId(), workingDir);
        });
    }

    /**
     * 重命名目录。
     * @param {Directory} workingDir 
     * @param {string} newName 
     * @param {function} handleSuccess 
     * @param {function} handleFailure 
     */
    renameDirectory(workingDir, newName, handleSuccess, handleFailure) {
        // 校验根
        let root = this._recurseRoot(workingDir);
        if (root.getId() != this.root.getId()) {
            let error = new ModuleError(FileStorage.NAME, FileStorageState.NotFound, workingDir);
            cell.Logger.w('FileHierarchy', '#renameDirectory() - ' + error);
            if (handleFailure) {
                handleFailure(error);
            }
            return;
        }

        let request = new Packet(FileStorageAction.RenameDir, {
            root: root.getId(),
            workingId: workingDir.getId(),
            dirName: newName
        });
        this.storage.pipeline.send(FileStorage.NAME, request, (pipeline, source, packet) => {
            if (null == packet || packet.getStateCode() != PipelineState.OK) {
                let error = new ModuleError(FileStorage.NAME, FileStorageState.Failure, workingDir);
                cell.Logger.w('FileHierarchy', '#renameDirectory() - ' + error);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            if (packet.getPayload().code != FileStorageState.Ok) {
                let error = new ModuleError(FileStorage.NAME, packet.getPayload().code, workingDir);
                cell.Logger.w('FileHierarchy', '#renameDirectory() - ' + error);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            // 解析数据
            let data = packet.getPayload().data;
            // 创建数据实例
            let dir = Directory.create(data, this);
            // 缓存
            this.dirMap.put(workingDir.getId(), dir);

            // 回调
            handleSuccess(dir);
        });
    }

    /**
     * 删除文件。
     * @param {Directory} workingDir 指定当前工作目录。
     * @param {Array} fileCodes 指定待删除的文件码列表。
     * @param {function} handleSuccess 成功回调。参数：({@linkcode workingDir}:{@link Directory}, {@linkcode deletedList}:{@linkcode Array<FileLabel>}) 。
     * @param {function} [handleFailure] 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    deleteFiles(workingDir, fileCodes, handleSuccess, handleFailure) {
        // 校验根
        let root = this._recurseRoot(workingDir);
        if (root.getId() != this.root.getId()) {
            let error = new ModuleError(FileStorage.NAME, FileStorageState.NotFound, workingDir);
            cell.Logger.w('FileHierarchy', '#deleteFiles() - ' + error);
            if (handleFailure) {
                handleFailure(error);
            }
            return;
        }

        let fileCodeList = (fileCodes instanceof Array) ? fileCodes : [ fileCodes ];
        if (fileCodeList.length == 0) {
            return;
        }

        let request = new Packet(FileStorageAction.DeleteFile, {
            root: root.getId(),
            workingId: workingDir.getId(),
            fileList: fileCodeList
        });
        this.storage.pipeline.send(FileStorage.NAME, request, (pipeline, source, packet) => {
            if (null == packet || packet.getStateCode() != PipelineState.OK) {
                let error = new ModuleError(FileStorage.NAME, FileStorageState.Failure, fileCodes);
                cell.Logger.w('FileHierarchy', '#deleteFiles() - ' + error);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            if (packet.getPayload().code != FileStorageState.Ok) {
                let error = new ModuleError(FileStorage.NAME, packet.getPayload().code, fileCodes);
                cell.Logger.w('FileHierarchy', '#deleteFiles() - ' + error);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            // 解析数据
            let data = packet.getPayload().data;
            let deletedList = data.deletedList;
            let dirJson = data.workingDir;

            let deletedFile = [];
            deletedList.forEach((json) => {
                let fileLabel = FileLabel.create(json);
                workingDir.removeFile(fileLabel);
                deletedFile.push(fileLabel);

                // 计算空间大小
                this.storage.fileSpaceSize -= fileLabel.fileSize;
            });
            // 更新数量
            workingDir.numFiles -= deletedList.length;
            workingDir.size = dirJson.size;
            workingDir.lastModified = dirJson.lastModified;

            handleSuccess(workingDir, deletedFile);

            // 缓存
            this.dirMap.put(workingDir.getId(), workingDir);
        });
    }

    /**
     * 获取已加载的回收站数据。
     * @param {number|string} id 废弃数据的 ID 。
     * @returns {TrashFile|TrashDirectory} 返回废弃数据实例。
     */
    getTrash(id) {
        return this.trashMap.get(parseInt(id));
    }

    /**
     * 获取已加载的废弃文件实例。
     * @param {string} fileCode 指定文件码。
     * @returns {TrashFile} 返回废弃数据实例。
     */
    getTrashFile(fileCode) {
        let array = this.trashMap.values();
        for (let i = 0; i < array.length; ++i) {
            let value = array[i];
            if (value.fileCode == fileCode) {
                return value;
            }
        }

        return null;
    }

    /**
     * 检索回收站内的废弃数据。
     * @param {number} beginIndex 
     * @param {number} endIndex 
     * @param {function} handleSuccess 
     * @param {function} handleFailure 
     */
    listTrash(beginIndex, endIndex, handleSuccess, handleFailure) {
        let request = new Packet(FileStorageAction.ListTrash, {
            root: this.root.id,
            begin: beginIndex,
            end: endIndex
        });

        this.storage.pipeline.send(FileStorage.NAME, request, (pipeline, source, packet) => {
            if (null == packet || packet.getStateCode() != PipelineState.OK) {
                let error = new ModuleError(FileStorage.NAME, FileStorageState.Failure, this.root);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            if (packet.getPayload().code != FileStorageState.Ok) {
                let error = new ModuleError(FileStorage.NAME, packet.getPayload().code, this.root);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            let result = [];
            let data = packet.getPayload().data;
            let begin = data.begin;
            let end = data.end;
            let list = data.list;
            list.forEach((json) => {
                if (undefined !== json.directory) {
                    let trash = new TrashDirectory(json);
                    result.push(trash);

                    this.trashMap.put(trash.getId(), trash);
                }
                else if (undefined !== json.file) {
                    let trash = new TrashFile(json);
                    result.push(trash);

                    this.trashMap.put(trash.getId(), trash);
                }
            });
            handleSuccess(this.root, result, begin, end);
        });
    }

    /**
     * 抹除回收站里的指定废弃数据。
     * @param {Array<number>} list 
     * @param {function} handleSuccess 成功回调。参数：({@linkcode root}:{@link Directory}, {@linkcode list}:{@linkcode Array<TrashFile|TrashDirectory>}) 。
     * @param {function} handleFailure 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    eraseTrash(list, handleSuccess, handleFailure) {
        let trashIdList = [];
        list.forEach((item) => {
            trashIdList.push(parseInt(item));
        });

        let request = new Packet(FileStorageAction.EraseTrash, {
            root: this.root.id,
            list: trashIdList
        });
        this.storage.pipeline.send(FileStorage.NAME, request, (pipeline, source, packet) => {
            if (null == packet || packet.getStateCode() != PipelineState.OK) {
                let error = new ModuleError(FileStorage.NAME, FileStorageState.Failure, trashIdList);
                cell.Logger.w('FileHierarchy', '#eraseTrash() - ' + error);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            if (packet.getPayload().code != FileStorageState.Ok) {
                let error = new ModuleError(FileStorage.NAME, packet.getPayload().code, trashIdList);
                cell.Logger.w('FileHierarchy', '#eraseTrash() - ' + error);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            let eraseItem = [];
            // 删除缓存
            trashIdList.forEach((tid) => {
                let item = this.trashMap.remove(tid);
                if (null != item) {
                    eraseItem.push(item);
                }
            });

            handleSuccess(this.root, eraseItem);
        });
    }

    /**
     * 清空回收站。
     * @param {function} handleSuccess 成功回调。参数：({@linkcode root}:{@link Directory}) 。
     * @param {function} handleFailure 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    emptyTrash(handleSuccess, handleFailure) {
        let request = new Packet(FileStorageAction.EmptyTrash, {
            root: this.root.id
        });

        this.storage.pipeline.send(FileStorage.NAME, request, (pipeline, source, packet) => {
            if (null == packet || packet.getStateCode() != PipelineState.OK) {
                let error = new ModuleError(FileStorage.NAME, FileStorageState.Failure, this.root);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            if (packet.getPayload().code != FileStorageState.Ok) {
                let error = new ModuleError(FileStorage.NAME, packet.getPayload().code, this.root);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            handleSuccess(this.root);
        });
    }

    /**
     * 从回收站恢复指定数据。
     * @param {Array} list 废弃数据的 ID 列表。
     * @param {function} handleSuccess 成功回调。参数：({@linkcode root}:{@link Directory}, {@linkcode result}:{@link RestoreResult}) 。
     * @param {function} handleFailure 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    restoreTrash(list, handleSuccess, handleFailure) {
        let trashIdList = [];
        list.forEach((item) => {
            trashIdList.push(parseInt(item));
        });

        let request = new Packet(FileStorageAction.RestoreTrash, {
            root: this.root.id,
            list: trashIdList
        });
        this.storage.pipeline.send(FileStorage.NAME, request, (pipeline, source, packet) => {
            if (null == packet || packet.getStateCode() != PipelineState.OK) {
                let error = new ModuleError(FileStorage.NAME, FileStorageState.Failure, trashIdList);
                cell.Logger.w('FileHierarchy', '#restoreTrash() - ' + error);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            if (packet.getPayload().code != FileStorageState.Ok) {
                let error = new ModuleError(FileStorage.NAME, packet.getPayload().code, trashIdList);
                cell.Logger.w('FileHierarchy', '#restoreTrash() - ' + error);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            var result = packet.getPayload().data;
            // 处理成功列表
            result.successList.forEach((value) => {
                if (value.parentId == this.root.id) {
                    // 当前结果影响 Root 目录
                    if (value.file) {
                        let fileLabel = FileLabel.create(value.file);
                        this.root.addFile(fileLabel);
                    }
                    else if (value.directory) {
                        let newDir = Directory.create(value.directory, this);
                        this.root.addChild(newDir);
                    }
                }
            });

            handleSuccess(this.root, result);
        });
    }

    /**
     * 搜索文件。
     * @param {SearchFilter} filter 指定搜索过滤条件。
     * @param {function} handleSuccess 成功回调。参数：({@linkcode filter}:{@link SearchFilter}, {@linkcode list}:{@linkcode Array<SearchItem>}) 。
     * @param {function} handleFailure 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    searchFile(filter, handleSuccess, handleFailure) {
        let request = new Packet(FileStorageAction.SearchFile, {
            "root": this.root.id,
            "filter": filter
        });

        this.storage.pipeline.send(FileStorage.NAME, request, (pipeline, source, packet) => {
            if (null == packet || packet.getStateCode() != PipelineState.OK) {
                let error = new ModuleError(FileStorage.NAME, FileStorageState.Failure, this.root);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            if (packet.getPayload().code != FileStorageState.Ok) {
                let error = new ModuleError(FileStorage.NAME, packet.getPayload().code, this.root);
                if (handleFailure) {
                    handleFailure(error);
                }
                return;
            }

            let data = packet.getPayload().data;
            let filter = data.filter;
            let result = data.result;

            let list = [];
            result.forEach((item) => {
                let dir = this._toDirectory(item.directory);
                let file = null;
                if (item.file) {
                    file = FileLabel.create(item.file);
                }
                let searchItem = new SearchItem(dir, file);
                list.push(searchItem);

                this._putSearchItem(searchItem);
            });

            handleSuccess(filter, list);
        });
    }

    /**
     * 
     * @param {*} dirId 
     * @param {*} fileCode 
     * @returns {SearchItem}
     */
    getSearchItem(dirId, fileCode) {
        for (let i = 0; i < this.searchResults.length; ++i) {
            let item = this.searchResults[i];
            if (item.directory.id == dirId && item.file.fileCode == fileCode) {
                return item;
            }
        }
        return null;
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

    /**
     * @private
     * @param {JSON} json 
     * @returns {Directory}
     */
    _toDirectory(json) {
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

        if (json.parent) {
            dir.parent = this._toDirectory(json.parent);
            dir.parentId = dir.parent.id;
        }

        return dir;
    }

    /**
     * @private
     * @param {*} item 
     */
    _putSearchItem(item) {
        for (let i = 0; i < this.searchResults.length; ++i) {
            let si = this.searchResults[i];
            if (item.equals(si)) {
                return;
            }
        }

        this.searchResults.push(item);
    }
}
