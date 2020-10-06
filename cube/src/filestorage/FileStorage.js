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

import cell from "@lib/cell-lib";
import { Module } from "../core/Module";
import { AjaxPipeline } from "../pipeline/AjaxPipeline";
import { AjaxFileChunkPacket } from "../pipeline/AjaxFileChunkPacket";
import { ContactService } from "../contacts/ContactService";
import { ContactEvent } from "../contacts/ContactEvent";
import { StateCode } from "../core/StateCode";
import { FileAnchor } from "./FileAnchor";
import { FileStorageEvent } from "./FileStorageEvent";
import { ObservableState } from "../core/ObservableState";

/**
 * 上传文件回调函数。
 * @callback UploadCallback
 * @param {FileAnchor} anchor 文件定位点。
 */

/**
 * 云端文件存储模块。
 */
export class FileStorage extends Module {

    /**
     * 模块名。
     * @type {string}
     */
    static NAME = 'FileStorage';

    /**
     * 构造函数。
     */
    constructor() {
        super('FileStorage');

        // 依赖联系人模块
        this.require(ContactService.NAME);

        /**
         * 自己的账号 ID 。
         * @type {number}
         */
        this.cid = 0;

        /**
         * 主机 URL 地址。
         */
        this.uploadURL = 'https://api.shixincube.com/v1/upload';

        /**
         * 文件分块大小。
         * @type {number}
         */
        this.block = 512 * 1024;

        /**
         * 文件数据通道。
         * @type {AjaxPipeline}
         */
        this.filePipeline = null;
    }

    /**
     * @inheritdoc
     */
    start() {
        if (!super.start()) {
            return false;
        }

        this.filePipeline = this.kernel.getPipeline(AjaxPipeline.NAME);

        // 监听联系人事件
        let cs = this.kernel.getModule(ContactService.NAME);
        cs.attach((state) => {
            this._fireContactEvent(state);
        });

        let self = cs.getSelf();
        if (null != self) {
            this.cid = self.getId();
        }

        return true;
    }

    /**
     * @inheritdoc
     */
    stop() {
        super.stop();
    }

    /**
     * 上传指定的文件。
     * @param {File} file 指定上传文件。
     * @param {function} handleProcessing
     * @param {function} handleSuccess
     * @param {function} handleError
     */
    uploadFile(file, handleProcessing, handleSuccess, handleError) {
        let fileSize = file.size;
        let fileAnchor = new FileAnchor();
        let reader = new FileReader();

        reader.onload = (e) => {
            fileAnchor.position += e.total;
            cell.Logger.d(FileStorage.NAME, 'Read: ' + fileAnchor + '/' + fileSize);

            if (fileAnchor.position < fileSize) {
                return;
            }

            cell.Logger.d(FileStorage.NAME, 'Read completed: ' + file.name);
        };

        fileAnchor.fileName = file.name;
        fileAnchor.fileSize = file.size;

        // 串行上传数据
        this._serialReadAndUpload(reader, file, fileAnchor, fileSize, (data) => {
            if (null == data) {
                // 上传失败
                fileAnchor.fileCode = null;
                fileAnchor.url = null;
                fileAnchor.success = false;
                let state = new ObservableState(FileStorageEvent.UploadCompleted, fileAnchor);
                this.nodifyObservers(state);

                handleError(fileAnchor);
            }
            else {
                // 上传成功
                fileAnchor.fileName = data.fileName;
                fileAnchor.fileSize = data.fileSize;
                fileAnchor.fileCode = data.code;
                fileAnchor.url = data.url;
                fileAnchor.success = true;
                let state = new ObservableState(FileStorageEvent.UploadCompleted, fileAnchor);
                this.nodifyObservers(state);

                handleSuccess(fileAnchor);
            }
        }, (fileAnchor) => {
            // 正在上传
            handleProcessing(fileAnchor);
        });
    }

    /**
     * 以串行方式读取并上传文件数据。
     * @private
     * @param {FileReader} reader 
     * @param {File} file 
     * @param {FileAnchor} fileAnchor 
     * @param {number} fileSize 
     * @param {function} completed 
     * @param {function} processing
     */
    _serialReadAndUpload(reader, file, fileAnchor, fileSize, completed, processing) {
        // 读取文件
        this._readFileBlock(reader, file, fileAnchor).then((filePacket) => {

            // 回调正在处理事件
            processing(fileAnchor);

            this._submit(filePacket, (packet) => {
                if (null == packet) {
                    cell.Logger.e(FileStorage.NAME, 'Upload failed: ' + file.name);
                    return;
                }

                // 检测回包状态
                let stateCode = packet.getStateCode();
                if (stateCode == StateCode.OK) {
                    cell.Logger.d(FileStorage.NAME, 'File cursor: ' + fileAnchor + '/' + fileSize);

                    packet.data.cursor = fileAnchor.position;
                    let state = new ObservableState(FileStorageEvent.Uploading, packet.data);
                    this.nodifyObservers(state);

                    if (fileAnchor.position < fileSize) {
                        this._serialReadAndUpload(reader, file, fileAnchor, fileSize, completed, processing);
                    }
                    else {
                        completed(packet.data);
                    }
                }
                else {
                    cell.Logger.w(FileStorage.NAME, 'Packet state code: ' + stateCode);
                    completed(null);
                }
            });
        }).catch(() => {
            completed(null);
        });
    }

    /**
     * 
     * @param {FileReader} reader 
     * @param {File} file 
     * @param {FileAnchor} fileAnchor
     */
    _readFileBlock(reader, file, fileAnchor) {
        return new Promise((resolve, reject) => {
            let blob = null;
            let end = fileAnchor.position + this.block + 1;
    
            if (file.slice) {
                blob = file.slice(fileAnchor.position, end);
            }
            else if (file.webkitSlice) {
                blob = file.webkitSlice(fileAnchor.position, end);
            }
            else if (file.mozSlice) {
                blob = file.mozSlice(fileAnchor.position, end);
            }

            // 读取文件数据
            reader.readAsBinaryString(blob);

            // 发送数据
            let filePacket = new AjaxFileChunkPacket(this.cid, file.name, file.size, blob, fileAnchor.position, blob.size);
            resolve(filePacket);
        });
    }

    /**
     * 发送文件块数据。
     * @param {AjaxFileChunkPacket} filePacket 文件数据块。
     * @param {function} handler 数据响应回调。
     */
    _submit(filePacket, handler) {
        this.filePipeline.send(this.uploadURL, filePacket, (pipeline, endpoint, packet) => {
            handler(packet);
        });
    }

    _fireContactEvent(state) {
        if (state.name == ContactEvent.SignIn) {
            let self = state.data;
            this.cid = self.getId();
        }
    }
}
