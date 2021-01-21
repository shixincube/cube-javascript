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
import { StateCode } from "../core/StateCode";
import { Module } from "../core/Module";
import { ModuleError } from "../core/error/ModuleError";
import { AjaxPipeline } from "../pipeline/AjaxPipeline";
import { AjaxFileChunkPacket } from "../pipeline/AjaxFileChunkPacket";
import { AuthService } from "../auth/AuthService";
import { ContactService } from "../contact/ContactService";
import { Contact } from "../contact/Contact";
import { Group } from "../contact/Group";
import { ContactEvent } from "../contact/ContactEvent";
import { ObservableEvent } from "../core/ObservableEvent";
import { OrderMap } from "../util/OrderMap";
import { Packet } from "../core/Packet";
import { FileAnchor } from "./FileAnchor";
import { FileLabel } from "./FileLabel";
import { FileStorageEvent } from "./FileStorageEvent";
import { FileStoragePipeListener } from "./FileStoragePipeListener";
import { FileStorageAction } from "./FileStorageAction";
import { FileStructStorage } from "./FileStructStorage";
import { FileStorageState } from "./FileStorageState";
import { Directory } from "./Directory";
import { FileHierarchy } from "./FileHierarchy";

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
         * 缓存的文件标签。键为文件码。
         * @type {OrderMap<string,FileLabel>}
         */
        this.fileLabels = new OrderMap();

        /**
         * 文件层级表。键为层级对应的联系人ID或群组ID。
         * @type {OrderMap<number,FileHierarchy>}
         */
        this.fileHierarchyMap = new OrderMap();

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

        /**
         * 结构存储库。
         * @type {FileStructStorage}
         */
        this.storage = new FileStructStorage();
    }

    /**
     * @inheritdoc
     * @see Module#start
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
        this.contactService.attach((event) => {
            this._fireContactEvent(event);
        });

        // 开启存储库
        this.storage.open(AuthService.DOMAIN);

        return true;
    }

    /**
     * @inheritdoc
     * @see Module#stop
     */
    stop() {
        super.stop();

        if (null == this.pipeline) {
            return;
        }

        // 移除数据管道的监听器
        this.pipeline.removeListener(FileStorage.NAME, this.pipelineListener);

        // 关闭存储库
        this.storage.close();
    }

    /**
     * @inheritdoc
     * @see Module#config
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
     * @param {function} [handleProcessing] 正在进行文件处理的回调函数。函数参数：({@linkcode fileAnchor}:{@link FileAnchor}) 。
     * @param {function} [handleSuccess] 上传文件成功的回调函数。函数参数：({@linkcode fileAnchor}:{@link FileAnchor}) 。
     * @param {function} [handleFailure] 上传文件失败的回调函数。函数参数：({@linkcode error}:{@link ModuleError}) 。
     */
    uploadFile(file, handleProcessing, handleSuccess, handleFailure) {
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

        // 串行方式上传数据
        this._serialReadAndUpload(reader, file, fileAnchor, fileSize, (anchor) => {
            if (null == anchor) {
                // 上传失败
                fileAnchor.fileCode = null;
                fileAnchor.success = false;

                // 实例化错误
                let error = new ModuleError(FileStorage.NAME, FileStorageState.UploadFailed, fileAnchor);

                if (handleFailure) {
                    handleFailure(error);
                }

                let state = new ObservableEvent(FileStorageEvent.UploadFailed, error);
                this.notifyObservers(state);
            }
            else {
                // 上传成功
                fileAnchor.fileName = anchor.fileName;
                fileAnchor.fileSize = anchor.fileSize;
                fileAnchor.fileCode = anchor.fileCode;
                fileAnchor.success = true;

                let state = new ObservableEvent(FileStorageEvent.UploadCompleted, fileAnchor);
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
     * @param {FileLabel|string} fileOrFileCode 文件标签或文件码。
     */
    downloadFile(fileOrFileCode) {
        let handle = (fileLabel) => {
            let packet = new Packet('GET', null);
            packet.responseType = 'blob';

            // 事件通知
            this.notifyObservers(new ObservableEvent(FileStorageEvent.Downloading, fileLabel));

            let url = this.secure ? fileLabel.getFileSecureURL() : fileLabel.getFileURL();
            url += '&type=ignore';
            this.filePipeline.send(url, packet, (pipeline, source, packet) => {
                let blob = packet.data;
                let reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onload = (e) => {
                    // 事件通知
                    this.notifyObservers(new ObservableEvent(FileStorageEvent.DownloadCompleted, fileLabel));

                    let a = document.createElement('a');
                    a.style.display = 'inline';
                    a.style.position = 'absolute';
                    a.style.cssFloat = 'left';
                    a.style.visibility = 'hidden';
                    a.download = fileLabel.getFileName();
                    a.href = e.target.result;

                    document.body.appendChild(a);
                    a.click();
                    a.parentElement.removeChild(a);
                }
            });
        };

        if (fileOrFileCode instanceof FileLabel) {
            handle(fileOrFileCode);
        }
        else {
            this.getFileLabel(fileOrFileCode, (fileLabel) => {
                handle(fileLabel);
            }, (fileCode) => {
                let error = new ModuleError(FileStorage.NAME, FileStorageState.GetFileLabelFailed, fileCode);
                this.notifyObservers(new ObservableEvent(FileStorageEvent.DownloadFailed, error));
            });
        }
    }

    /**
     * 获取文件的访问 URL 。
     * @param {string} fileCode 文件码。
     * @param {function} handler 回调函数，函数参数：({@linkcode fileCode}:string, {@linkcode fileURL}:string, {@linkcode fileSecureURL}:string) 。
     */
    getFileURL(fileCode, handler) {
        if (!this.started) {
            this.start();
        }

        this.getFileLabel(fileCode, (fileLabel) => {
            let url = [ fileLabel.getFileURL(),
                '&token=', this.filePipeline.tokenCode,
                '&type=', fileLabel.fileType
            ];
            let surl = [ fileLabel.getFileSecureURL(),
                '&token=', this.filePipeline.tokenCode,
                '&type=', fileLabel.fileType
            ];
            handler(fileCode, url.join(''), surl.join(''));
        }, (fileCode) => {
            handler(fileCode, null, null);
        });
    }

    /**
     * 获取文件标签。
     * @param {string} fileCode 指定文件码。
     * @param {function} handleSuccess 获取到数据回调该方法，参数：({@linkcode fileLabel}:{@link FileLabel})。
     * @param {function} [handleFailure] 未能找到数据回调该方法，参数：({@linkcode fileCode}:{@linkcode string})。
     */
    getFileLabel(fileCode, handleSuccess, handleFailure) {
        if (!this.started) {
            this.start();
        }

        // 从缓存里获取
        let fileLabel = this.fileLabels.get(fileCode);
        if (null != fileLabel) {
            handleSuccess(fileLabel);
            return;
        }

        let request = () => {
            let packet = new Packet(FileStorageAction.GetFile, { "fileCode" : fileCode });
            this.pipeline.send(FileStorage.NAME, packet, (pipeline, source, responsePacket) => {
                if (null == responsePacket || responsePacket.getStateCode() != StateCode.OK) {
                    if (handleFailure) {
                        handleFailure(fileCode);
                    }
                    return;
                }

                if (responsePacket.getPayload().code != 0) {
                    if (handleFailure) {
                        handleFailure(fileCode);
                    }
                    return;
                }

                // 创建文件标签
                let fileLabel = FileLabel.create(responsePacket.getPayload().data);

                // 将文件标签写入缓存
                this.storage.writeFileLabel(fileLabel);

                // 暂存在内存里
                this.fileLabels.put(fileCode, fileLabel);

                handleSuccess(fileLabel);
            });
        };

        // 从存储里获取
        this.storage.readFileLabel(fileCode, (fileCode, fileLabel) => {
            if (null != fileLabel) {
                this.fileLabels.put(fileCode, fileLabel);
                handleSuccess(fileLabel);
            }
            else {
                request();
            }
        });
    }

    /**
     * 
     * @param {*} handleSuccess 
     * @param {*} handleFailure 
     */
    getSelfRoot(handleSuccess, handleFailure) {
        this.getRoot(this.contactService.getSelf().getId(), handleSuccess, handleFailure);
    }

    /**
     * 
     * @param {number|Contact|Group} idOrObject 
     * @param {*} handleSuccess 
     * @param {*} handleFailure 
     */
    getRoot(idOrObject, handleSuccess, handleFailure) {
        if (!this.start) {
            return;
        }

        let id = 0;
        if (typeof id === 'number') {
            id = idOrObject;
        }
        else if (idOrObject instanceof Group) {
            id = idOrObject.getId();
        }
        else if (idOrObject instanceof Contact) {
            id = idOrObject.getId();
        }
        else {
            let error = new ModuleError(FileStorage.NAME, FileStorageState.Forbidden, idOrObject);
            handleFailure(error);
            return;
        }

        let hierarchy = this.fileHierarchyMap.get(id);
        if (null != hierarchy) {
            handleSuccess(hierarchy.getRoot());
            return;
        }

        let requestPacket = new Packet(FileStorageAction.GetRoot, {
            id: id
        });

        this.pipeline.send(FileStorage.NAME, requestPacket, (pipeline, source, packet) => {
            if (null == packet || packet.getStateCode() != StateCode.OK) {
                let error = new ModuleError(FileStorage.NAME, FileStorageState.Failure, id);
                handleFailure(error);
                return;
            }

            if (packet.getPayload().code != FileStorageState.Ok) {
                let error = new ModuleError(FileStorage.NAME, packet.getPayload().code, id);
                handleFailure(error);
                return;
            }

            let hierarchy = new FileHierarchy(this);
            let root = Directory.create(packet.getPayload().data, hierarchy);
            hierarchy.root = root;
            this.fileHierarchyMap.put(root.ownerId, hierarchy);

            handleSuccess(root);
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

                    let state = new ObservableEvent(FileStorageEvent.Uploading, anchor);
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
     * @private
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
     * @private
     * @param {AjaxFileChunkPacket} filePacket 文件数据块。
     * @param {function} handler 数据响应回调。
     */
    _submit(filePacket, handler) {
        this.filePipeline.send(this.fileURL, filePacket, (pipeline, source, packet) => {
            handler(packet);
        });
    }

    /**
     * 处理文件标签更新。
     * @private
     * @param {object} payload 
     * @param {object} context 
     */
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
        this.fileLabels.put(fileLabel.getFileCode(), fileLabel);

        // 写入存储
        this.storage.writeFileLabel(fileLabel);

        // 通知事件
        this.notifyObservers(new ObservableEvent(FileStorageEvent.FileUpdated, fileLabel));
    }

    /**
     * @private
     * @param {ObservableEvent} event 
     */
    _fireContactEvent(event) {
        if (event.name == ContactEvent.SignIn) {
            let self = event.data;
            this.cid = self.getId();
        }
    }
}
