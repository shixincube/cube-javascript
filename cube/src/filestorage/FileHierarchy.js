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

import { ModuleError } from "../core/error/ModuleError";
import { Packet } from "../core/Packet";
import { StateCode } from "../core/StateCode";
import { FileStorage } from "./FileStorage";
import { Directory } from "./Directory";
import { FileStorageAction } from "./FileStorageAction";
import { FileStorageState } from "./FileStorageState";
import { FileLabel } from "./FileLabel";

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
    }

    /**
     * @returns {Directory}
     */
    getRoot() {
        return this.root;
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
}
