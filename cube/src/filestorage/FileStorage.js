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
import { ContactService } from "../contact/ContactService";
import { ContactEvent } from "../contact/ContactEvent";
import { FileAnchor } from "./FileAnchor";
import { FileLabel } from "./FileLabel";
import { FileStorageEvent } from "./FileStorageEvent";
import { FileStoragePipeListener } from "./FileStoragePipeListener";
import { ObservableState } from "../core/ObservableState";
import { OrderMap } from "../util/OrderMap";
import { Packet } from "../core/Packet";
import { FileStorageAction } from "./FileStorageAction";

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
         * 联系人服务。
         * @type {ContactService}
         */
        this.contactService = null;

        /**
         * 缓存的文件标签。键为文件名。
         * @type {OrderMap<string,FileLabel>}
         */
        this.fileLabels = new OrderMap();

        /**
         * 是否是安全连接。
         * @type {boolean}
         */
        this.secure = (window.location.protocol.toLowerCase().indexOf("https") >= 0);

        /**
         * 主机 URL 地址。
         * @type {string}
         */
        this.fileURL = 'https://cube.shixincube.com/filestorage/file/';

        /**
         * 文件分块大小。
         * @type {number}
         */
        this.block = 128 * 1024;

        /**
         * 默认管道的监听器。
         * @type {FileStoragePipeListener}
         */
        this.pipelineListener = new FileStoragePipeListener(this);

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

        // 添加数据通道的监听器
        this.pipeline.addListener(FileStorage.NAME, this.pipelineListener);

        // 监听联系人事件
        this.contactService = this.kernel.getModule(ContactService.NAME);
        this.contactService.attach((state) => {
            this._fireContactEvent(state);
        });

        return true;
    }

    /**
     * @inheritdoc
     */
    stop() {
        super.stop();

        // 移除数据管道的监听器
        this.pipeline.removeListener(FileStorage.NAME, this.pipelineListener);
    }

    /**
     * @inheritdoc
     */
    config(config) {
        if (this.secure) {
            if (config.fileSecureURL) {
                this.fileURL = config.fileSecureURL;
            }
        }
        else {
            if (config.fileURL) {
                this.fileURL = config.fileURL;
            }
        }
    }

    /**
     * 上传指定的文件。
     * @param {File} file 指定上传文件。
     * @param {function} [handleProcessing]
     * @param {function} [handleSuccess]
     * @param {function} [handleError]
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
        this._serialReadAndUpload(reader, file, fileAnchor, fileSize, (anchor) => {
            if (null == anchor) {
                // 上传失败
                fileAnchor.fileCode = null;
                fileAnchor.success = false;
                let state = new ObservableState(FileStorageEvent.UploadFailed, fileAnchor);
                this.notifyObservers(state);

                if (handleError) {
                    handleError(fileAnchor);
                }
            }
            else {
                // 上传成功
                fileAnchor.fileName = anchor.fileName;
                fileAnchor.fileSize = anchor.fileSize;
                fileAnchor.fileCode = anchor.fileCode;
                fileAnchor.success = true;
                let state = new ObservableState(FileStorageEvent.UploadCompleted, fileAnchor);
                this.notifyObservers(state);

                if (handleSuccess) {
                    handleSuccess(fileAnchor);
                }
            }
        }, (fileAnchor) => {
            // 正在上传
            if (handleProcessing) {
                handleProcessing(fileAnchor);
            }
        });
    }

    /**
     * 下载文件。
     * 
     * @param {FileLabel|string} fileOrFileName
     */
    downloadFile(fileOrFileName) {
        let fileLabel = (fileOrFileName instanceof FileLabel) ? fileOrFileName : this.fileLabels.get(fileOrFileName);
        let fileCode = fileLabel.getFileCode();
        let packet = new Packet('GET', null);
        packet.responseType = 'blob';

        let url = this.secure ? fileLabel.getFileSecureURL() : fileLabel.getFileURL();
        this.filePipeline.send(url, packet, (pipeline, source, packet) => {
            let blob = packet.data;
            let reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onload = function(e) {
                let a = document.createElement('a');
                a.style.display = 'inline';
                a.style.cssFloat = 'left';
                a.style.visibility = 'hidden';
                a.download = fileLabel.getFileName();
                a.href = e.target.result;

                document.body.appendChild(a);
                a.click();
                a.parentElement.removeChild(a);
            }
        });
    }

    getFileURL(fileName) {
        let fileLabel = this.fileLabels.get(fileName);
        let url = this.secure ? fileLabel.getFileURL() : fileLabel.getFileSecureURL();
        return url;
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
        (async ()=> {
            // 读取文件
            let filePacket = await this._readFileBlock(reader, file, fileAnchor);
            if (null == filePacket) {
                completed(null);
                return;
            }

            // 回调正在处理事件
            processing(fileAnchor);

            // 发送数据
            this._submit(filePacket, (packet) => {
                if (null == packet) {
                    cell.Logger.e(FileStorage.NAME, 'Upload failed: ' + file.name);
                    completed(null);
                    return;
                }

                let payload = packet.getPayload();

                // 检测回包状态
                if (payload.code == 0) {
                    cell.Logger.d(FileStorage.NAME, 'File cursor: ' + fileAnchor + '/' + fileSize);

                    let anchor = FileAnchor.create(payload.data);

                    let state = new ObservableState(FileStorageEvent.Uploading, anchor);
                    this.notifyObservers(state);

                    if (fileAnchor.position < fileSize) {
                        this._serialReadAndUpload(reader, file, fileAnchor, fileSize, completed, processing);
                    }
                    else {
                        completed(anchor);
                    }
                }
                else {
                    cell.Logger.w(FileStorage.NAME, 'Packet state code: ' + payload.code);
                    completed(null);
                }
            });
        })();
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

            // 组装为 Packet
            let filePacket = new AjaxFileChunkPacket(this.contactService.getSelf().getId(),
                this.getAuthToken().domain,
                file.name,
                file.size,
                blob,
                fileAnchor.position,
                blob.size);
            resolve(filePacket);
        });
    }

    /**
     * 发送文件块数据。
     * @param {AjaxFileChunkPacket} filePacket 文件数据块。
     * @param {function} handler 数据响应回调。
     */
    _submit(filePacket, handler) {
        this.filePipeline.send(this.fileURL, filePacket, (pipeline, source, packet) => {
            handler(packet);
        });
    }

    triggerPutFile(payload, context) {
        if (payload.code != 0) {
            return;
        }

        let fileLabel = (null == context) ? FileLabel.create(payload.data) : context;

        // 文件的访问 URL
        if (this.secure) {
            cell.Logger.d('FileStorage', 'File "' + fileLabel.getFileName() + '" URL : ' + fileLabel.getFileSecureURL());
        }
        else {
            cell.Logger.d('FileStorage', 'File "' + fileLabel.getFileName() + '" URL : ' + fileLabel.getFileURL());
        }

        // 缓存到本地
        this.fileLabels.put(fileLabel.getFileName(), fileLabel);

        // 写入存储

        // 通知事件
        this.notifyObservers(new ObservableState(FileStorageEvent.FileUpdated, fileLabel));
    }

    _fireContactEvent(state) {
        if (state.name == ContactEvent.SignIn) {
            let self = state.data;
            this.cid = self.getId();
        }
    }
}
