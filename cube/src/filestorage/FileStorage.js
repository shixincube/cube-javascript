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
import { Kernel } from "../core/Kernel";
import { PipelineState } from "../core/PipelineState";
import { Module } from "../core/Module";
import { ModuleError } from "../core/error/ModuleError";
import { AjaxPipeline } from "../pipeline/AjaxPipeline";
import { AjaxFileChunkPacket } from "../pipeline/AjaxFileChunkPacket";
import { AuthService } from "../auth/AuthService";
import { ContactService } from "../contact/ContactService";
import { Contact } from "../contact/Contact";
import { Group } from "../contact/Group";
import { Device } from "../contact/Device";
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
import { SearchItem } from "./SearchItem";
import { SharingTag } from "./SharingTag";
import { VisitTrace } from "./VisitTrace";
import { SharingReport } from "./SharingReport";
import { StringUtil } from "../util/StringUtil";
import { TrashFile } from "./TrashFile";
import { TrashDirectory } from "./TrashDirectory";
import { Measurer } from "./Measurer";


/**
 * 配置描述消息。
 * @typedef {object} FileServicePerformance
 * @property {number} spaceSize 当前联系人已使用的存储空间大小，单位：字节。
 * @property {number} maxSpaceSize 最大允许使用的存储空间大小，单位：字节。
 * @property {number} uploadThreshold 上传数据速率阀值，单位：字节/秒。
 * @property {number} downloadThreshold 下载数据速率阀值，单位：字节/秒。
 */

/**
 * 上传文件回调函数。
 * @callback UploadCallback
 * @param {FileAnchor} anchor 文件定位点。
 */

/**
 * 文件恢复结果描述。
 * @typedef {object} RestoreResult
 * @property {Array<Trash>} successList 成功恢复的数据列表。
 * @property {Array<Trash>} failureList 未能成功恢复的数据列表。
 */

/**
 * 文件分享标签配置。
 * @typedef (object) SharingTagConfig
 * @property {number} duration 指定有效时长，单位：毫秒。设置 {@linkcode 0} 表示永久有效。
 * @property {string} password 指定提取文件时的密码。设置 {@linkcode null} 值表示无需提取码。
 * @property {boolean} preview 指定是否为文档生成预览。
 * @property {string} watermark 指定水印内容。
 * @property {boolean} download 指定是否允许下载原始文件。
 * @property {boolean} traceDownload 指定是否跟踪下载操作。
 */

/**
 * 传输链节点。
 * @typedef (object) ChainNode
 * @property {string} event 事件名。
 * @property {number} total 事件数量。
 * @property {VisitTrace} visitTrace 访问痕迹。
 * @property {Array<ChainNode>} children 子节点。
 */

/**
 * 传输链。
 * @typedef (object) TransmissionChain
 * @property {string} traceCode 追踪串。
 * @property {Array<ChainNode>} nodes 节点列表。
 */

/**
 * 云端文件存储模块。
 * @extends Module
 */
export class FileStorage extends Module {

    /**
     * 模块名。
     * @type {string}
     */
    static NAME = 'FileStorage';

    static HTTP_PORT = 7010;
    static HTTPS_PORT = 7017;

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
         * 文件锚点。
         * @type {OrderMap<string,FileAnchor>}
         */
        this.fileAnchors = new OrderMap();

        /**
         * 文件层级表。键为层级对应的联系人ID或群组ID。
         * @type {OrderMap<number,FileHierarchy>}
         */
        this.fileHierarchyMap = new OrderMap();

        /**
         * 当前联系人的根目录。
         * @type {Directory}
         */
        this.rootDirectory = null;

        /**
         * 是否是安全连接。
         * @type {boolean}
         */
        this.secure = window.location.protocol.toLowerCase().startsWith("https");

        /**
         * 主机 URL 地址。
         * @type {string}
         */
        this.fileURL = 'https://cube.shixincube.com/filestorage/file/';

        /**
         * 文件分块大小。
         * @type {number}
         */
        this.block = 100 * 1024;

        /**
         * 上传数据度量器。
         * @type {Measurer}
         */
        this.measurer = new Measurer();

        /**
         * 是否正在上传数据。
         * @type {boolean}
         */
        this.uploading = false;

        /**
         * 上传队列。
         * @type {Array}
         */
        this.uploadQueue = [];

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

        /**
         * @private
         * @type {boolean}
         */
        this.serviceReady = false;

        /**
         * 已使用的文件存储空间大小。
         * @type {number}
         */
        this.fileSpaceSize = 0;

        /**
         * 偏好配置。
         * @type {FileServicePerformance}
         */
        this.performance = {
            /**
             * 最大存储空间。
             * @type {number}
             */
            maxSpaceSize: 0,

            /**
             * 上传速率门限。{@linkcode 0} 表示不限制。
             * @type {number}
             */
            uploadThreshold: 0,

            /**
             * 下载速率门限。{@linkcode 0} 表示不限制。
             * @type {number}
             */
            downloadThreshold: 0,

            /**
             * 最大分享数量。{@linkcode 0} 表示不限制。
             * @type {number}
             */
            maxSharingNum: 0,

            /**
             * 分享文件是否可使用水印。
             * @type {boolean}
             */
            sharingWatermarkEnabled: true,

            /**
             * 分享文件是否可以生成预览图。
             * @type {boolean}
             */
            sharingPreviewEnabled: true
        };
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

        if (this.contactService.isReady()) {
            this.serviceReady = true;
            // 通知就绪事件
            setTimeout(() => {
                this.notifyObservers(new ObservableEvent(FileStorageEvent.Ready));
            }, 0);
        }

        return true;
    }

    /**
     * @inheritdoc
     * @see Module#stop
     */
    stop() {
        super.stop();

        if (null != this.pipeline) {
            // 移除数据管道的监听器
            this.pipeline.removeListener(FileStorage.NAME, this.pipelineListener);
        }

        // 关闭存储库
        this.storage.close();

        this.rootDirectory = null;
    }

    /**
     * @inheritdoc
     */
    isReady() {
        return this.serviceReady;
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

        if (this.fileURL.indexOf(Kernel.CONFIG.address) < 0) {
            let substr = this.fileURL.substring(this.secure ? 8 : 7);
            let index = substr.indexOf(':');
            let host = substr.substring(0, index);
            this.fileURL = this.fileURL.replace(host, Kernel.CONFIG.address);
        }

        let substr = this.fileURL.substring(this.secure ? 8 : 7);
        let index = substr.indexOf(':');
        let end = substr.indexOf('/');
        if (this.secure) {
            FileStorage.HTTPS_PORT = parseInt(substr.substring(index + 1, end));
        }
        else {
            FileStorage.HTTP_PORT = parseInt(substr.substring(index + 1, end));
        }
    }

    /**
     * 获取已使用的文件空间大小。
     * @returns {number} 返回已使用的文件空间大小。
     */
    getFileSpaceSize() {
        return this.fileSpaceSize;
    }

    /**
     * 获取最大允许使用的文件空间大小。
     * @returns {number} 返回最大允许使用的文件空间大小。
     */
    getMaxFileSpaceSize() {
        return this.performance.maxSpaceSize;
    }

    /**
     * 启动文件选择器。
     * @param {function} handle 文件选择回调函数。参数：({@linkcode file}:{@link File}) 。
     * @param {string} [accept] input 标签的 accept 属性值。
     */
    launchFileSelector(handle, accept) {
        if (undefined === accept) {
            accept = '*.*';
        }

        let el = document.querySelector('div#_cube_file_selector');
        let inputEl = null;
        if (null == el) {
            el = document.createElement('div');
            el.setAttribute('id', '_cube_file_selector');
            el.style.position = 'absolute';
            el.style.float = 'left';
            el.style.left = '0';
            el.style.top = '0';
            el.style.zIndex = -999;
            el.style.visibility = 'hidden';

            let html = ['<label for="_cube_file_input"></label>',
                '<input type="file" id="_cube_file_input" name="_cube_file_input" accept="', accept, '"></input>'];
            el.innerHTML = html.join('');
            document.body.appendChild(el);
        }

        inputEl = document.getElementById('_cube_file_input');
        inputEl.setAttribute('accept', accept);
        inputEl.onchange = (event) => {
            let file = event.target.files[0];
            handle(file);
        };
        inputEl.click();
    }

    /**
     * 精确查找文件。
     * @param {File} file 指定文件。
     * @param {funciton} handleSuccess 
     * @param {funciton} handleFailure 
     */
    findFile(file, handleSuccess, handleFailure) {
        let payload = {
            "fileName" : file.name,
            "lastModified" : file.lastModified,
            "fileSize" : file.size
        };

        let packet = new Packet(FileStorageAction.FindFile, payload);
        this.pipeline.send(FileStorage.NAME, packet, (pipeline, source, responsePacket) => {
            if (null == responsePacket || responsePacket.getStateCode() != PipelineState.OK) {
                let error = new ModuleError(FileStorage.NAME, responsePacket.getStateCode(), file);
                handleFailure(error);
                return;
            }

            let code = responsePacket.extractServiceStateCode();
            if (code != FileStorageState.Ok) {
                let error = new ModuleError(FileStorage.NAME, code, file);
                handleFailure(error);
                return;
            }

            let data = responsePacket.extractServiceData();
            let fileLabel = FileLabel.create(data);
            handleSuccess(fileLabel);
        });
    }

    /**
     * 是否正在上传文件。
     * @returns {boolean} 如果有文件正在上传返回 {@linkcode true} 。
     */
    isUploading() {
        return this.uploading;
    }

    /**
     * 获取待上传的文件。
     * @returns {Array<FileAnchor>} 返回待上传的文件列表。
     */
    getPendingUploadQueue() {
        let result = [];
        this.uploadQueue.forEach((value) => {
            result.push(value.fileAnchor);
        });
        return result;
    }

    /**
     * 使用文件选择对话框选择文件后上传。
     * 该方法仅适用于 Web 浏览器。
     * @param {function} handleStart
     * @param {function} handleProcessing 
     * @param {function} handleSuccess 
     * @param {function} handleFailure 
     */
    uploadFileWithSelector(handleProcessing, handleSuccess, handleFailure) {
        if (undefined === window || undefined === document) {
            let error = new ModuleError(FileStorage.NAME, FileStorageState.Reject, null);
            handleFailure(error);
            return;
        }

        let selector = null;
        let div = document.querySelector('div#cube_fs_selector');
        if (null == div) {
            // 插入 DOM
            let domContent = [
                    '<label for="cube_fs_selector_file"></label>',
                    '<input id="cube_fs_selector_file" type="file" name="cube-select-file" accept="*.*" />'
            ];
            div = document.createElement('div');
            div.id = 'cube_fs_selector';
            div.style.position = 'absolute';
            div.style.float = 'left';
            div.style.left = '0';
            div.style.top = '0';
            div.style.visibility = 'hidden';
            div.style.zIndex = '-999';
            div.innerHTML = domContent.join('');
            document.body.appendChild(div);

            selector = div.querySelector('input#cube_fs_selector_file');
            selector.addEventListener('change', (e) => {
                let file = e.target.files[0];
                // 进行文件上传
                this.uploadFile(file, handleStart, handleProcessing, handleSuccess, handleFailure);
            });
        }
        else {
            selector = div.querySelector('input#cube_fs_selector_file');
        }

        selector.click();
    }

    /**
     * 上传指定的文件。
     * @param {File} file 指定上传文件。
     * @param {funciton} handleStart 开始上传时的回调函数。函数参数：({@linkcode fileAnchor}:{@link FileAnchor}) 。
     * @param {function} handleProcessing 正在进行文件处理的回调函数。函数参数：({@linkcode fileAnchor}:{@link FileAnchor}) 。
     * @param {function} handleSuccess 上传文件成功的回调函数。函数参数：({@linkcode fileLabel}:{@link FileLabel}) 。
     * @param {function} handleFailure 上传文件失败的回调函数。函数参数：({@linkcode error}:{@link ModuleError}) 。
     * @returns {FileAnchor} 返回文件的操作锚实例。
     */
    uploadFile(file, handleStart, handleProcessing, handleSuccess, handleFailure) {
        let fileSize = file.size;
        // 检查空间
        if (this.fileSpaceSize > 0 && this.getMaxFileSpaceSize() > 0) {
            if (fileSize > this.getMaxFileSpaceSize() - this.fileSpaceSize) {
                if (handleFailure) {
                    // 无可用空间
                    let error = new ModuleError(FileStorage.NAME, FileStorageState.OverSize, file);
                    handleFailure(error);
                }
                return null;
            }
        }

        let fileAnchor = new FileAnchor(cell.Utils.generateSerialNumber());
        fileAnchor.fileName = file.name;
        fileAnchor.fileSize = file.size;
        fileAnchor.lastModified = file.lastModified;
        fileAnchor.pending = true;

        let record = {
            file: file,
            fileAnchor: fileAnchor,
            handleStart: handleStart,
            handleProcessing: handleProcessing,
            handleSuccess: handleSuccess,
            handleFailure: handleFailure
        };
        // 插入队列
        this.uploadQueue.push(record);

        if (!this.uploading) {
            // 进行传输
            let task = this.uploadQueue.shift();
            this._uploadFile(task.file, task.fileAnchor, task.handleStart, task.handleProcessing,
                task.handleSuccess, task.handleFailure);
        }

        return fileAnchor;
    }

    /**
     * @private
     * @param {File} file 上传文件的句柄。
     * @param {FileAnchor} fileAnchor 文件操作锚。
     * @param {funciton} handleStart 开始上传时的回调函数。函数参数：({@linkcode fileAnchor}:{@link FileAnchor}) 。
     * @param {function} handleProcessing 正在进行文件处理的回调函数。函数参数：({@linkcode fileAnchor}:{@link FileAnchor}) 。
     * @param {function} handleSuccess 上传文件成功的回调函数。函数参数：({@linkcode fileLabel}:{@link FileLabel}) 。
     * @param {function} handleFailure 上传文件失败的回调函数。函数参数：({@linkcode error}:{@link ModuleError}) 。
     */
    _uploadFile(file, fileAnchor, handleStart, handleProcessing, handleSuccess, handleFailure) {
        if (this.uploading) {
            // 正在上传
            handleFailure(new ModuleError(FileStorage.NAME, FileStorageState.SystemBusy, file));
            return;
        }

        this.uploading = true;

        // 记录回调函数
        fileAnchor.finishCallback = handleSuccess;
        fileAnchor.timestamp = Date.now();
        fileAnchor.pending = false;

        let reader = new FileReader();

        this.measurer.reset(fileAnchor.timestamp);

        // 文件大小
        let fileSize = file.size;

        reader.onload = (e) => {
            fileAnchor.position += e.total;
            cell.Logger.d(FileStorage.NAME, 'Read: ' + fileAnchor + '/' + fileSize);

            if (fileAnchor.position < fileSize) {
                return;
            }

            cell.Logger.d(FileStorage.NAME, 'Read completed: ' + file.name);
        };

        // 开始
        handleStart(fileAnchor);

        // 串行方式上传数据
        this._serialReadAndUpload(reader, file, fileAnchor, fileSize, (anchor) => {
            if (typeof anchor === 'number') {
                // 状态码
                let stateCode = anchor;

                // 上传失败
                fileAnchor.fileCode = null;
                // 标记失败
                fileAnchor._markFailure();

                if (this.uploadQueue.length > 0) {
                    setTimeout(() => {
                        let record = this.uploadQueue.shift();
                        this.uploading = false;
                        this._uploadFile(record.file, record.fileAnchor, record.handleStart, record.handleProcessing,
                            record.handleSuccess, record.handleFailure);
                    }, 10);
                }
                else {
                    this.uploading = false;
                }

                // 实例化错误
                let error = new ModuleError(FileStorage.NAME, stateCode, fileAnchor);
                handleFailure(error);

                let event = new ObservableEvent(FileStorageEvent.UploadFailed, error);
                this.notifyObservers(event);
            }
            else {
                // 上传成功
                this.fileAnchors.put(fileAnchor.fileCode, fileAnchor);

                fileAnchor.fileName = anchor.fileName;
                fileAnchor.fileSize = anchor.fileSize;
                fileAnchor.fileCode = anchor.fileCode;
                // 标记成功
                fileAnchor._markSuccess();

                handleProcessing(fileAnchor);

                let event = new ObservableEvent(FileStorageEvent.UploadCompleted, fileAnchor);
                this.notifyObservers(event);

                // 查询文件标签
                this._queryFileLabel(fileAnchor, 0, handleFailure);
            }
        }, (fileAnchor) => {
            // 正在上传
            handleProcessing(fileAnchor);
        });
    }

    /**
     * @private
     * @param {FileAnchor} fileAnchor 
     * @param {number} count 尝试次数
     * @param {function} failureCallback
     */
    _queryFileLabel(fileAnchor, count, failureCallback) {
        this.getFileLabel(fileAnchor.fileCode, (fileLabel) => {
            let callback = fileAnchor.finishCallback;

            // 更新空间大小
            this.fileSpaceSize += fileAnchor.fileSize;

            // 将锚点上的回调函数置空
            fileAnchor.finishCallback = null;

            // 同步 SN
            fileLabel.sn = fileAnchor.sn;
            // 速率
            fileLabel.averageSpeed = this.measurer.averageRate();

            callback(fileLabel);

            this.fileAnchors.remove(fileAnchor.fileCode);

            if (this.uploadQueue.length > 0) {
                setTimeout(() => {
                    let record = this.uploadQueue.shift();
                    // 重置状态
                    this.uploading = false;
                    this._uploadFile(record.file, record.fileAnchor, record.handleStart, record.handleProcessing,
                        record.handleSuccess, record.handleFailure);
                }, 10);
            }
            else {
                // 重置状态
                this.uploading = false;
            }
        }, (error) => {
            if (error.code == FileStorageState.Writing) {
                // 正在写入数据，客户端需要等待
                count = 0;
            }

            if (count > 5) {
                if (this.uploadQueue.length > 0) {
                    setTimeout(() => {
                        let record = this.uploadQueue.shift();
                        // 重置状态
                        this.uploading = false;
                        this._uploadFile(record.file, record.fileAnchor, record.handleStart, record.handleProcessing,
                            record.handleSuccess, record.handleFailure);
                    }, 100);
                }
                else {
                    // 重置状态
                    this.uploading = false;
                }

                failureCallback(error);
                return;
            }

            setTimeout(() => {
                let newCount = count + 1;
                this._queryFileLabel(fileAnchor, newCount, failureCallback);
            }, 1000);
        });
    }

    /**
     * 使用超链接方式下载文件。
     * @param {string|FileLabel} fileOrFileCode 指定文件标签或者文件码。
     * @param {function} handleStart 下载开始时回调。参数：({@linkcode fileLabel}:{@link FileLabel}, {@linkcode fileAnchor}:{@link FileAnchor})。
     * @param {funciton} handleProcessing 下载数据正在接收时回调。参数：({@linkcode fileLabel}:{@link FileLabel}, {@linkcode fileAnchor}:{@link FileAnchor})。
     * @param {funciton} handleSuccess 下载成功时回调。参数：({@linkcode fileLabel}:{@link FileLabel}, {@linkcode fileAnchor}:{@link FileAnchor})。
     * @param {funciton} handleFailure 下载失败时回调。参数：({@linkcode error}:{@link ModuleError})。
     */
    downloadFileWithHyperlink(fileOrFileCode, handleStart, handleProcessing, handleSuccess, handleFailure) {
        let handle = (fileLabel) => {
            let anchor = new FileAnchor(fileLabel.sn);
            anchor.fileCode = fileLabel.fileCode;
            anchor.fileName = fileLabel.fileName;
            anchor.fileSize = fileLabel.fileSize;
            anchor.lastModified = fileLabel.lastModified;

            handleStart(fileLabel, anchor);

            // 创建标签
            let a = document.createElement('a');
            a.style.display = 'inline';
            a.style.position = 'absolute';
            a.style.cssFloat = 'left';
            a.style.visibility = 'hidden';
            a.style.zIndex = '-1';
            a.download = fileLabel.getFileName();

            this.getFileURL(fileLabel, (fileLabel, httpURL, httpsURL) => {
                let url = this.secure ? httpsURL : httpURL;
                url = StringUtil.removeURLParameter(url, 'type');
                url += '&type=ignore';
                a.href = url;
            });

            document.body.appendChild(a);
            a.click();

            handleProcessing(fileLabel, anchor);

            setTimeout(() => {
                anchor._markSuccess();

                handleSuccess(fileLabel, anchor);

                a.parentElement.removeChild(a);
            }, 1000);
        };

        if (fileOrFileCode instanceof FileLabel) {
            handle(fileOrFileCode);
        }
        else {
            this.getFileLabel(fileOrFileCode, (fileLabel) => {
                handle(fileLabel);
            }, (e) => {
                let error = new ModuleError(FileStorage.NAME, FileStorageState.GetFileLabelFailed, e);
                this.notifyObservers(new ObservableEvent(FileStorageEvent.DownloadFailed, error));
                handleFailure(error);
            });
        }
    }

    /**
     * 下载文件。
     * @param {FileLabel|string} fileOrFileCode 文件标签或文件码。
     * @param {function} [handleStart] 下载开始时回调。参数：({@linkcode fileLabel}:{@link FileLabel}, {@linkcode fileAnchor}:{@link FileAnchor})。
     * @param {funciton} [handleProcessing] 下载数据正在接收时回调。参数：({@linkcode fileLabel}:{@link FileLabel}, {@linkcode fileAnchor}:{@link FileAnchor})。
     * @param {funciton} [handleSuccess] 下载成功时回调。参数：({@linkcode fileLabel}:{@link FileLabel}, {@linkcode fileAnchor}:{@link FileAnchor})。
     * @param {funciton} [handleFailure] 下载失败时回调。参数：({@linkcode error}:{@link ModuleError})。
     */
    downloadFile(fileOrFileCode, handleStart, handleProcessing, handleSuccess, handleFailure) {
        let handle = (fileLabel) => {
            let anchor = new FileAnchor(fileLabel.sn);
            anchor.fileCode = fileLabel.fileCode;
            anchor.fileName = fileLabel.fileName;
            anchor.fileSize = fileLabel.fileSize;
            anchor.lastModified = fileLabel.lastModified;

            var fileURL = null;
            this.getFileURL(fileLabel, (fileLabel, httpURL, httpsURL) => {
                let url = this.secure ? httpsURL : httpURL;
                url = StringUtil.removeURLParameter(url, 'type');
                url += '&type=ignore';
                fileURL = url;
            });

            if (handleStart) {
                handleStart(fileLabel, anchor);
            }

            let packet = new Packet('GET', null);
            packet.responseType = 'blob';

            // 事件通知
            this.notifyObservers(new ObservableEvent(FileStorageEvent.Downloading, fileLabel));

            this.filePipeline.send(fileURL, packet, (pipeline, source, packet) => {
                if (null == packet) {
                    // 标记
                    anchor._markFailure();

                    let error = new ModuleError(FileStorage.NAME, FileStorageState.DownloadFailed, anchor);
                    cell.Logger.e('FileStorage', '#downloadFile - Read data from pipeline failed - ' + fileLabel.fileName);
                    if (handleFailure) {
                        handleFailure(error);
                    }
                    return;
                }

                let blob = packet.data;
                let reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onload = (e) => {
                    // 标记
                    anchor._markSuccess();

                    // 计算速率
                    fileLabel.averageSpeed = anchor.fileSize / ((anchor.endTime - anchor.timestamp) / 1000.0);

                    if (handleSuccess) {
                        handleSuccess(fileLabel, anchor);
                    }

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
            }, (loaded, total) => {
                // 更新进度
                anchor.position = loaded;

                if (handleProcessing) {
                    handleProcessing(fileLabel, anchor);
                }
            });
        };

        if (fileOrFileCode instanceof FileLabel) {
            handle(fileOrFileCode);
        }
        else {
            this.getFileLabel(fileOrFileCode, (fileLabel) => {
                handle(fileLabel);
            }, (e) => {
                let error = new ModuleError(FileStorage.NAME, FileStorageState.GetFileLabelFailed, e);
                this.notifyObservers(new ObservableEvent(FileStorageEvent.DownloadFailed, error));
                if (handleFailure) {
                    handleFailure(error);
                }
            });
        }
    }

    /**
     * 获取文件的访问 URL 。
     * @param {string} fileCodeOrLabel 文件码。
     * @param {function} handler 回调函数，函数参数：({@linkcode fileLabel}:{@link FileLabel}, {@linkcode fileURL}:string, {@linkcode fileSecureURL}:string) 。
     */
    getFileURL(fileCodeOrLabel, handler) {
        if (!this.started) {
            this.start();
        }

        // 设备信息
        let devString = Device.DEFAULT.getName().toLowerCase();

        if (fileCodeOrLabel instanceof FileLabel) {
            let url = [ fileCodeOrLabel.getFileURL(),
                '&token=', this.filePipeline.tokenCode, '&device=', devString
            ];
            let surl = [ fileCodeOrLabel.getFileSecureURL(),
                '&token=', this.filePipeline.tokenCode, '&device=', devString
            ];
            handler(fileCodeOrLabel, url.join(''), surl.join(''));
        }
        else {
            this.getFileLabel(fileCodeOrLabel, (fileLabel) => {
                let url = [ fileLabel.getFileURL(),
                    '&token=', this.filePipeline.tokenCode, '&device=', devString
                ];
                let surl = [ fileLabel.getFileSecureURL(),
                    '&token=', this.filePipeline.tokenCode, '&device=', devString
                ];
                handler(fileLabel, url.join(''), surl.join(''));
            }, (error) => {
                handler(null, null, null);
            });
        }
    }

    /**
     * 获取文件标签。
     * @param {string} fileCode 指定文件码。
     * @param {function} handleSuccess 获取到数据回调该方法，参数：({@linkcode fileLabel}:{@link FileLabel})。
     * @param {function} [handleFailure] 未能找到数据回调该方法，参数：({@linkcode error}:{@link ModuleError})。
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
                if (null == responsePacket || responsePacket.getStateCode() != PipelineState.OK) {
                    let error = new ModuleError(FileStorage.NAME, FileStorageState.NotFound, fileCode);
                    if (handleFailure) {
                        handleFailure(error);
                    }
                    return;
                }

                if (responsePacket.getPayload().code != 0) {
                    let error = new ModuleError(FileStorage.NAME, responsePacket.getPayload().code, fileCode);
                    if (handleFailure) {
                        handleFailure(error);
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
     * 获取当前登录联系人的个人文件根目录。
     * @param {function} handleSuccess 成功回调。参数：({@linkcode root}:{@link Directory})。
     * @param {function} handleFailure 失败回调。参数：({@linkcode error}:{@link ModuleError})。
     */
    getSelfRoot(handleSuccess, handleFailure) {
        if (this.serviceReady) {
            this.getRoot(this.contactService.getSelf().getId(), handleSuccess, handleFailure);
        }
        else {
            const task = (count, handleSuccess, handleFailure) => {
                if (this.serviceReady) {
                    this.getRoot(this.contactService.getSelf().getId(), handleSuccess, handleFailure);
                    return;
                }

                if (count >= 10) {
                    // 重试 10 次
                    let error = new ModuleError(FileStorage.NAME, FileStorageState.NotReady, null);
                    handleFailure(error);
                    return;
                }

                let timer = setTimeout(() => {
                    clearTimeout(timer);

                    task(++count, handleSuccess, handleFailure);
                }, 500);
            };

            let timer = setTimeout(() => {
                clearTimeout(timer);

                task(1, handleSuccess, handleFailure);
            }, 500);
        }
    }

    /**
     * @private
     * @param {number|Contact|Group} idOrObject 
     * @param {function} handleSuccess 成功回调。参数：({@linkcode root}:{@link Directory})。
     * @param {function} handleFailure 失败回调。参数：({@linkcode error}:{@link ModuleError})。
     */
    getRoot(idOrObject, handleSuccess, handleFailure) {
        if (!this.started || !this.serviceReady) {
            let error = new ModuleError(FileStorage.NAME, FileStorageState.NotReady, idOrObject);
            handleFailure(error);
            return;
        }

        let id = 0;
        if (typeof idOrObject === 'number') {
            id = idOrObject;
        }
        else if (idOrObject instanceof Group) {
            id = idOrObject.getId();
        }
        else if (idOrObject instanceof Contact) {
            id = idOrObject.getId();
        }
        else if (typeof idOrObject === 'string') {
            id = parseInt(idOrObject);
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
            if (null == packet || packet.getStateCode() != PipelineState.OK) {
                let error = new ModuleError(FileStorage.NAME, FileStorageState.Failure, id);
                handleFailure(error);
                return;
            }

            if (packet.getPayload().code != FileStorageState.Ok) {
                let error = new ModuleError(FileStorage.NAME, packet.getPayload().code, id);
                cell.Logger.w('FileStorage', '#getRoot() - ' + error.toString());
                handleFailure(error);
                return;
            }

            let hierarchy = new FileHierarchy(this);
            let root = Directory.create(packet.getPayload().data, hierarchy);
            hierarchy.root = root;
            this.fileHierarchyMap.put(root.getId(), hierarchy);

            if (this.contactService.getSelf().getId() == id) {
                this.rootDirectory = root;
            }

            handleSuccess(root);
        });
    }

    /**
     * 获取指定 ID 的目录。
     * @param {number|string} id 目录 ID 。
     * @returns {Directory} 返回指定 ID 的目录。
     */
    queryDirectory(id) {
        let hierarchy = this.fileHierarchyMap.get(this.contactService.getSelf().getId());
        if (null == hierarchy) {
            return null;
        }

        return hierarchy.getDirectory(id);
    }

    /**
     * 新建目录。
     * @param {Directory} workingDir 当前工作目录。
     * @param {string} newDirName 新目录名。
     * @param {function} handleSuccess 成功回调。参数：({@linkcode newDirectory}:{@link Directory}) 。
     * @param {function} handleFailure 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    newDirectory(workingDir, newDirName, handleSuccess, handleFailure) {
        let root = this._recurseRoot(workingDir);
        this.getRoot(root.getId(), (root) => {
            let hierarchy = this.fileHierarchyMap.get(root.getId());
            hierarchy.newDirectory(workingDir, newDirName, handleSuccess, handleFailure);
        }, (error) => {
            if (handleFailure) {
                handleFailure(error);
            }
        });
    }

    /**
     * 删除目录。
     * @param {Directory} workingDir 当前工作目录。
     * @param {Directory|Array} pendingDir 待删除目录或者目录 ID 。
     * @param {boolean} recursive 是否递归删除所有子文件和子目录。
     * @param {function} handleSuccess 成功回调。参数：({@linkcode workingDir}:{@link Directory}, {@linkcode deletedList}:{@linkcode Array<Directory>}) 。
     * @param {function} handleFailure 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    deleteDirectory(workingDir, pendingDir, recursive, handleSuccess, handleFailure) {
        let root = this._recurseRoot(workingDir);
        this.getRoot(root.getId(), (root) => {
            let hierarchy = this.fileHierarchyMap.get(root.getId());
            hierarchy.deleteDirectory(workingDir, pendingDir, recursive, handleSuccess, handleFailure);
        }, (error) => {
            if (handleFailure) {
                handleFailure(error);
            }
        });
    }

    /**
     * 重命名目录。
     * @param {Directory} workingDir 工作目录。
     * @param {string} newDirName 新的目录名。
     * @param {function} handleSuccess 成功回调。参数：({@linkcode workingDir}:{@link Directory}) 。
     * @param {function} handleFailure 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    renameDirectory(workingDir, newDirName, handleSuccess, handleFailure) {
        let root = this._recurseRoot(workingDir);
        this.getRoot(root.getId(), (root) => {
            let hierarchy = this.fileHierarchyMap.get(root.getId());
            hierarchy.renameDirectory(workingDir, newDirName, handleSuccess, handleFailure);
        }, (error) => {
            if (handleFailure) {
                handleFailure(error);
            }
        });
    }

    /**
     * 移动文件到指定目录。
     * @param {string} fileCode 指定文件码。
     * @param {Directory} srcDirectory 指定源目录。
     * @param {Directory} destDirectory 指定目标目录。
     * @param {function} handleSuccess 成功回调。参数：({@linkcode fileLabel}:{@link FileLabel}, {@linkcode srcDirectory}:{@link Directory}, {@linkcode destDirectory}:{@link Directory}) 。
     * @param {function} handleFailure 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    moveFile(fileCode, srcDirectory, destDirectory, handleSuccess, handleFailure) {
        if (null == this.rootDirectory) {
            this.getSelfRoot((root) => {
                this.rootDirectory = root;
                this.moveFile(fileCode, srcDirectory, destDirectory, handleSuccess, handleFailure);
            }, (error) => {
                handleFailure(error);
            });

            return;
        }

        this.getFileLabel(fileCode, (fileLabel) => {
            // 调用 MoveFile
            let requestPacket = new Packet(FileStorageAction.MoveFile, {
                root: this.rootDirectory.id,
                srcDirId: srcDirectory.id,
                destDirId: destDirectory.id,
                fileCode: fileCode
            });
            this.pipeline.send(FileStorage.NAME, requestPacket, (pipeline, source, packet) => {
                if (null == packet || packet.getStateCode() != PipelineState.OK) {
                    let error = new ModuleError(FileStorage.NAME, FileStorageState.Failure, fileLabel);
                    handleFailure(error);
                    return;
                }

                if (packet.getPayload().code != FileStorageState.Ok) {
                    let error = new ModuleError(FileStorage.NAME, packet.getPayload().code, fileLabel);
                    handleFailure(error);
                    return;
                }

                let data = packet.extractServiceData();
                // 更新基础数据
                srcDirectory.update(data.srcDirectory);
                destDirectory.update(data.destDirectory);

                // 从源删除
                srcDirectory.removeFile(fileLabel);
                // 添加到目标
                destDirectory.addFile(fileLabel);

                handleSuccess(fileLabel, srcDirectory, destDirectory);
            });
        }, (error) => {
            handleFailure(error);
        });
    }

    /**
     * 重命名文件。
     * @param {Directory} directory 文件所在的目录。
     * @param {FileLabel|string} fileLabelOrFileCode 待重命名的文件或文件的文件码。
     * @param {string} newFileName 指定新的文件名。
     * @param {function} handleSuccess 成功回调。参数：({@linkcode directory}:{@link Directory}, {@linkcode fileLabel}:{@link FileLabel}) 。
     * @param {function} handleFailure 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    renameFile(directory, fileLabelOrFileCode, newFileName, handleSuccess, handleFailure) {
        if (null == this.rootDirectory) {
            let error = new ModuleError(FileStorage.NAME, FileStorageState.NotReady, fileLabelOrFileCode);
            handleFailure(error);
            return;
        }

        let fileCode = (typeof fileLabelOrFileCode === 'string') ? fileLabelOrFileCode : fileLabelOrFileCode.getFileCode();

        let requestPacket = new Packet(FileStorageAction.RenameFile, {
            root: this.rootDirectory.id,
            dirId: directory.id,
            fileCode: fileCode,
            fileName: newFileName
        });
        this.pipeline.send(FileStorage.NAME, requestPacket, (pipeline, source, packet) => {
            if (null == packet || packet.getStateCode() != PipelineState.OK) {
                let error = new ModuleError(FileStorage.NAME, FileStorageState.Failure, fileLabelOrFileCode);
                handleFailure(error);
                return;
            }

            if (packet.getPayload().code != FileStorageState.Ok) {
                let error = new ModuleError(FileStorage.NAME, packet.getPayload().code, fileLabelOrFileCode);
                handleFailure(error);
                return;
            }

            // 更新目录里的文件
            let data = packet.extractServiceData();
            let newFileLabel = FileLabel.create(data);
            directory.updateFile(newFileLabel);

            // 回调
            handleSuccess(directory, newFileLabel);
        });
    }

    /**
     * 删除指定目录下的文件。
     * @param {Directory} workingDir 指定当前工作目录。
     * @param {Array} fileCodes 指定待删除的文件码列表。
     * @param {function} handleSuccess 成功回调。参数：({@linkcode workingDir}:{@link Directory}, {@linkcode deletedList}:{@linkcode Array<FileLabel>}) 。
     * @param {function} [handleFailure] 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    deleteFiles(workingDir, fileCodes, handleSuccess, handleFailure) {
        let root = this._recurseRoot(workingDir);
        this.getRoot(root.getId(), (root) => {
            let hierarchy = this.fileHierarchyMap.get(root.getId());
            hierarchy.deleteFiles(workingDir, fileCodes, handleSuccess, handleFailure);
        }, (error) => {
            if (handleFailure) {
                handleFailure(error);
            }
        });
    }

    /**
     * 查询已加载的废弃数据。
     * @param {number} id 指定废弃数据的 ID 。
     * @returns {TrashFile|TrashDirectory} 返回回收站里的废弃数据实例。
     */
    queryTrash(id) {
        let hierarchy = this.fileHierarchyMap.get(this.contactService.getSelf().getId());
        if (null == hierarchy) {
            return null;
        }

        return hierarchy.getTrash(id);
    }

    /**
     * 查询已加载的废弃文件数据。
     * @param {string} fileCode 指定文件码。
     * @returns {TrashFile} 返回指定的废弃文件实例。
     */
    queryTrashFile(fileCode) {
        let hierarchy = this.fileHierarchyMap.get(this.contactService.getSelf().getId());
        if (null == hierarchy) {
            return null;
        }

        return hierarchy.getTrashFile(fileCode);
    }

    /**
     * 罗列当前登录联系人文件回收站里的废弃数据。
     * @param {number} begin 开始索引。
     * @param {number} end 结束索引。
     * @param {function} handleSuccess 成功回调。参数：({@linkcode root}:{@link Directory}, {@linkcode list}:{@linkcode Array}, {@linkcode begin}:{@linkcode number}, {@linkcode end}:{@linkcode number}) 。
     * @param {function} [handleFailure] 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    listTrash(begin, end, handleSuccess, handleFailure) {
        this.getSelfRoot((root) => {
            let hierarchy = this.fileHierarchyMap.get(this.contactService.getSelf().getId());
            hierarchy.listTrash(begin, end, handleSuccess, handleFailure);
        }, (error) => {
            if (handleFailure) {
                handleFailure(error);
            }
        });
    }

    /**
     * 抹除回收站里的指定废弃数据。
     * @param {Array<number>} trashIdList 指定待抹除数据的 ID 列表。
     * @param {function} handleSuccess 成功回调。参数：({@linkcode root}:{@link Directory}) 。
     * @param {function} [handleFailure] 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    eraseTrash(trashIdList, handleSuccess, handleFailure) {
        this.getSelfRoot((root) => {
            let hierarchy = root.hierarchy;
            hierarchy.eraseTrash(trashIdList, handleSuccess, handleFailure);
        }, (error) => {
            if (handleFailure) {
                handleFailure(error);
            }
        });
    }

    /**
     * 清空回收站里所有文件和文件夹。
     * @param {function} handleSuccess 成功回调。参数：({@linkcode root}:{@link Directory}) 。
     * @param {function} [handleFailure] 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    emptyTrash(handleSuccess, handleFailure) {
        this.getSelfRoot((root) => {
            let hierarchy = root.hierarchy;
            hierarchy.emptyTrash(handleSuccess, handleFailure);
        }, (error) => {
            if (handleFailure) {
                handleFailure(error);
            }
        });
    }

    /**
     * 从回收站恢复指定数据。
     * @param {Array} trashIdList 废弃数据的 ID 列表。
     * @param {function} handleSuccess 成功回调。参数：({@linkcode root}:{@link Directory}, {@linkcode result}:{@link RestoreResult}) 。
     * @param {function} handleFailure 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    restoreTrash(trashIdList, handleSuccess, handleFailure) {
        this.getSelfRoot((root) => {
            let hierarchy = this.fileHierarchyMap.get(this.contactService.getSelf().getId());
            hierarchy.restoreTrash(trashIdList, handleSuccess, handleFailure);
        }, (error) => {
            if (handleFailure) {
                handleFailure(error);
            }
        });
    }

    /**
     * 搜索文件。
     * @param {SearchFilter} filter 指定搜索过滤条件。
     * @param {function} handleSuccess 成功回调。参数：({@linkcode filter}:{@link SearchFilter}, {@linkcode list}:{@linkcode Array<SearchItem>}) 。
     * @param {function} [handleFailure] 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    searchFile(filter, handleSuccess, handleFailure) {
        this.getSelfRoot((root) => {
            let hierarchy = this.fileHierarchyMap.get(this.contactService.getSelf().getId());
            hierarchy.searchFile(filter, handleSuccess, handleFailure);
        }, (error) => {
            if (handleFailure) {
                handleFailure(error);
            }
        });
    }

    /**
     * 查询之前有效的搜索结果。
     * @param {number|string} directoryId 目录 ID 。
     * @param {string} fileCode 文件码。
     * @returns {SearchItem} 返回搜索结果项。
     */
    querySearch(directoryId, fileCode) {
        let hierarchy = this.fileHierarchyMap.get(this.contactService.getSelf().getId());
        if (null == hierarchy) {
            return null;
        }

        return hierarchy.getSearchItem(parseInt(directoryId), fileCode);
    }

    /**
     * 获取指定分享码的分享标签。
     * @param {string} sharingCode 指定分享码。
     * @param {function} handleSuccess 成功回调。参数：({@linkcode sharingTag}:{@link SharingTag}) 。
     * @param {function} handleFailure 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    getSharingTag(sharingCode, handleSuccess, handleFailure) {
        if (!this.hasStarted()) {
            let error = new ModuleError(FileStorage.NAME, FileStorageState.NotReady, sharingCode);
            handleFailure(error);
            return;
        }

        if (!this.pipeline.isReady()) {
            let error = new ModuleError(FileStorage.NAME, FileStorageState.PipelineNotReady, sharingCode);
            handleFailure(error);
            return;
        }

        let payload = {
            "code": sharingCode,
            "refresh": true
        };
        let packet = new Packet(FileStorageAction.GetSharingTag, payload);
        this.pipeline.send(FileStorage.NAME, packet, (pipeline, source, responsePacket) => {
            if (null == responsePacket || responsePacket.getStateCode() != PipelineState.OK) {
                let error = new ModuleError(FileStorage.NAME, responsePacket.getStateCode(), sharingCode);
                handleFailure(error);
                return;
            }

            let stateCode = responsePacket.extractServiceStateCode();
            if (stateCode != FileStorageState.Ok) {
                let error = new ModuleError(FileStorage.NAME, stateCode, sharingCode);
                handleFailure(error);
                return;
            }

            let data = responsePacket.extractServiceData();
            let sharingTag = SharingTag.create(data);
            handleSuccess(sharingTag);
        });
    }

    /**
     * 创建文件的分享标签。
     * @param {FileLabel} fileLabel 指定文件标签。
     * @param {SharingTagConfig} config 指定分享操作配置。
     * @param {function} handleSuccess 成功回调。参数：({@linkcode sharingTag}:{@link SharingTag}) 。
     * @param {function} handleFailure 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    createSharingTag(fileLabel, config, handleSuccess, handleFailure) {
        if (!this.hasStarted()) {
            let error = new ModuleError(FileStorage.NAME, FileStorageState.NotReady, fileLabel);
            handleFailure(error);
            return;
        }

        if (!this.pipeline.isReady()) {
            let error = new ModuleError(FileStorage.NAME, FileStorageState.PipelineNotReady, fileLabel);
            handleFailure(error);
            return;
        }

        let payload = {
            "fileCode": fileLabel.getFileCode(),
            "duration": config.duration,
            "preview": (undefined !== config.preview) ? config.preview : false,
            "download": (undefined !== config.download) ? config.download : true,
            "traceDownload": (undefined !== config.traceDownload) ? config.traceDownload : true
        };
        if (undefined !== config.password && null != config.password) {
            payload["password"] = config.password;
        }
        if (undefined !== config.watermark && null != config.watermark) {
            payload["watermark"] = config.watermark;
        }

        if (!this.performance.sharingPreviewEnabled) {
            // 不允许预览
            payload.preview = false;
        }
        if (!this.performance.sharingWatermarkEnabled) {
            // 不允许水印
            payload.watermark = false;
        }

        let packet = new Packet(FileStorageAction.CreateSharingTag, payload);
        if (fileLabel.fileSize > 1024 * 1024) {
            packet.responseTimeout = 5 * 60 * 1000;
        }

        this.pipeline.send(FileStorage.NAME, packet, (pipeline, source, responsePacket) => {
            if (null == responsePacket || responsePacket.getStateCode() != PipelineState.OK) {
                let sc = (null == responsePacket) ? FileStorageState.Timeout : responsePacket.getStateCode();
                let error = new ModuleError(FileStorage.NAME, sc, fileLabel);
                handleFailure(error);
                return;
            }

            let stateCode = responsePacket.extractServiceStateCode();
            if (stateCode != FileStorageState.Ok) {
                let error = new ModuleError(FileStorage.NAME, stateCode, fileLabel);
                handleFailure(error);
                return;
            }

            let data = responsePacket.extractServiceData();
            let sharingTag = SharingTag.create(data);
            handleSuccess(sharingTag);
        });
    }

    /**
     * 取消分享。
     * @param {string|SharingTag} sharingCode 指定分享码或者分享标签实例。
     * @param {function} handleSuccess 成功回调。参数：({@linkcode sharingTag}:{@link SharingTag}) 。
     * @param {function} handleFailure 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    cancelSharingTag(sharingCode, handleSuccess, handleFailure) {
        if (!this.hasStarted()) {
            let error = new ModuleError(FileStorage.NAME, FileStorageState.NotReady, sharingCode);
            handleFailure(error);
            return;
        }

        if (!this.pipeline.isReady()) {
            let error = new ModuleError(FileStorage.NAME, FileStorageState.PipelineNotReady, sharingCode);
            handleFailure(error);
            return;
        }

        let payload = {
            "sharingCode": (typeof sharingCode === 'string') ? sharingCode : sharingCode.code
        };
        let packet = new Packet(FileStorageAction.CancelSharingTag, payload);
        this.pipeline.send(FileStorage.NAME, packet, (pipeline, source, responsePacket) => {
            if (null == responsePacket || responsePacket.getStateCode() != PipelineState.OK) {
                let error = new ModuleError(FileStorage.NAME, responsePacket.getStateCode(), sharingCode);
                handleFailure(error);
                return;
            }

            let stateCode = responsePacket.extractServiceStateCode();
            if (stateCode != FileStorageState.Ok) {
                let error = new ModuleError(FileStorage.NAME, stateCode, sharingCode);
                handleFailure(error);
                return;
            }

            let data = responsePacket.extractServiceData();
            let sharingTag = SharingTag.create(data);
            handleSuccess(sharingTag);
        });
    }

    /**
     * 删除文件分享。
     * @param {string|SharingTag} sharingCode 指定分享码或者分享标签实例。
     * @param {function} handleSuccess 成功回调。参数：({@linkcode sharingTag}:{@link SharingTag}) 。
     * @param {function} handleFailure 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    deleteSharingTag(sharingCode, handleSuccess, handleFailure) {
        if (!this.hasStarted()) {
            let error = new ModuleError(FileStorage.NAME, FileStorageState.NotReady, sharingCode);
            handleFailure(error);
            return;
        }

        if (!this.pipeline.isReady()) {
            let error = new ModuleError(FileStorage.NAME, FileStorageState.PipelineNotReady, sharingCode);
            handleFailure(error);
            return;
        }

        let payload = {
            "sharingCode": (typeof sharingCode === 'string') ? sharingCode : sharingCode.code
        };
        let packet = new Packet(FileStorageAction.DeleteSharingTag, payload);
        this.pipeline.send(FileStorage.NAME, packet, (pipeline, source, responsePacket) => {
            if (null == responsePacket || responsePacket.getStateCode() != PipelineState.OK) {
                let error = new ModuleError(FileStorage.NAME, responsePacket.getStateCode(), sharingCode);
                handleFailure(error);
                return;
            }

            let stateCode = responsePacket.extractServiceStateCode();
            if (stateCode != FileStorageState.Ok) {
                let error = new ModuleError(FileStorage.NAME, stateCode, sharingCode);
                handleFailure(error);
                return;
            }

            let data = responsePacket.extractServiceData();
            let sharingTag = SharingTag.create(data);
            handleSuccess(sharingTag);
        });
    }

    /**
     * 批量获取分享标签。
     * @param {number} beginIndex 指定数据起始索引。
     * @param {number} endIndex 指定数据结束索引。
     * @param {boolean} valid 指定获取有效标签还是过期标签。
     * @param {funciton} handleSuccess 成功回调。参数：({@linkcode list}:{@link Array<SharingTag>}, {@linkcode total}:{@linkcode number}) 。
     * @param {funciton} handleFailure 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    listSharingTags(beginIndex, endIndex, valid, handleSuccess, handleFailure) {
        if (endIndex < beginIndex) {
            let error = new ModuleError(FileStorage.NAME, FileStorageState.Reject);
            handleFailure(error);
            return;
        }

        if (!this.hasStarted()) {
            let error = new ModuleError(FileStorage.NAME, FileStorageState.NotReady);
            handleFailure(error);
            return;
        }

        if (!this.pipeline.isReady()) {
            let error = new ModuleError(FileStorage.NAME, FileStorageState.PipelineNotReady);
            handleFailure(error);
            return;
        }

        const step = 10;
        let indexes = [];
        let delta = endIndex - beginIndex;
        if (delta > 9) {
            let num = Math.floor((delta + 1) / step);
            let mod = (delta + 1) % step;
            let index = beginIndex;
            for (let i = 0; i < num; ++i) {
                index += step - 1;
                indexes.push(index);
                index += 1;
            }

            if (mod != 0) {
                index += mod - 1;
                indexes.push(index);
            }
        }
        else {
            indexes.push(endIndex);
        }

        let resultCount = indexes.length;
        let resultList = [];

        let begin = beginIndex;
        let end = 0;
        indexes.forEach((index) => {
            end = index;

            let payload = {
                "begin": begin,
                "end": end,
                "order": "desc",
                "valid": valid
            };
            let packet = new Packet(FileStorageAction.ListSharingTags, payload);
            this.pipeline.send(FileStorage.NAME, packet, (pipeline, source, responsePacket) => {
                // 更新计数
                --resultCount;

                if (null == responsePacket || responsePacket.getStateCode() != PipelineState.OK) {
                    let error = new ModuleError(FileStorage.NAME, responsePacket.getStateCode());
                    handleFailure(error);
                    return;
                }
    
                let stateCode = responsePacket.extractServiceStateCode();
                if (stateCode != FileStorageState.Ok) {
                    let error = new ModuleError(FileStorage.NAME, stateCode);
                    handleFailure(error);
                    return;
                }
    
                let data = responsePacket.extractServiceData();
                data.list.forEach((json) => {
                    resultList.push(SharingTag.create(json))
                });

                if (0 == resultCount) {
                    resultList.sort((a, b) => {
                        return b.timestamp - a.timestamp;
                    });
                    handleSuccess(resultList, data.total, beginIndex, endIndex, valid);
                }
            });

            // 更新索引
            begin = index + 1;
        });
    }

    /**
     * 列表分享访问痕迹。
     * @param {string} sharingCode 指定分享码。
     * @param {number} beginIndex 起始位置索引。
     * @param {number} endIndex 结束位置索引。
     * @param {funciton} handleSuccess 成功回调。参数：({@linkcode list}:{@link Array<VisitTrace>}, {@linkcode total}:{@linkcode number}) 。
     * @param {funciton} handleFailure 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    listVisitTraces(sharingCode, beginIndex, endIndex, handleSuccess, handleFailure) {
        if (!this.hasStarted()) {
            let error = new ModuleError(FileStorage.NAME, FileStorageState.NotReady, sharingCode);
            handleFailure(error);
            return;
        }

        if (!this.pipeline.isReady()) {
            let error = new ModuleError(FileStorage.NAME, FileStorageState.PipelineNotReady, sharingCode);
            handleFailure(error);
            return;
        }

        const step = 10;
        let indexes = [];
        let delta = endIndex - beginIndex;
        if (delta > 9) {
            let num = Math.floor((delta + 1) / step);
            let mod = (delta + 1) % step;
            let index = beginIndex;
            for (let i = 0; i < num; ++i) {
                index += step - 1;
                indexes.push(index);
                index += 1;
            }

            if (mod != 0) {
                index += mod - 1;
                indexes.push(index);
            }
        }
        else {
            indexes.push(endIndex);
        }

        let resultCount = indexes.length;
        let resultList = [];

        let begin = beginIndex;
        let end = 0;
        let total = 0;
        indexes.forEach((index) => {
            end = index;

            let payload = {
                "sharingCode": sharingCode,
                "begin": begin,
                "end": end
            };
            let packet = new Packet(FileStorageAction.ListSharingTraces, payload);
            this.pipeline.send(FileStorage.NAME, packet, (pipeline, source, responsePacket) => {
                // 更新计数
                --resultCount;

                if (null == responsePacket || responsePacket.getStateCode() != PipelineState.OK) {
                    let error = new ModuleError(FileStorage.NAME, responsePacket.getStateCode());
                    handleFailure(error);
                    return;
                }

                let stateCode = responsePacket.extractServiceStateCode();
                if (stateCode != FileStorageState.Ok) {
                    let error = new ModuleError(FileStorage.NAME, stateCode);
                    handleFailure(error);
                    return;
                }

                let data = responsePacket.extractServiceData();
                data.list.forEach((json) => {
                    resultList.push(VisitTrace.create(json))
                });

                if (0 == total) {
                    total = data.total;
                }

                if (0 == resultCount) {
                    resultList.sort((a, b) => {
                        return b.time - a.time;
                    });
                    handleSuccess(resultList, total, sharingCode, beginIndex, endIndex);
                }
            });

            // 更新索引
            begin = index + 1;
        });
    }

    /**
     * 获取分享码的传播链。
     * @param {string} sharingCode 分享码。
     * @param {number} traceDepth 追踪深度。
     * @param {funciton} handleSuccess 成功回调。参数：({@linkcode chain}:{@link TransmissionChain}) 。
     * @param {funciton} handleFailure 失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     */
    getTraceChain(sharingCode, traceDepth, handleSuccess, handleFailure) {
        let payload = {
            "sharingCode": sharingCode,
            "trace": traceDepth
        };
        let packet = new Packet(FileStorageAction.ListSharingTraces, payload);
        this.pipeline.send(FileStorage.NAME, packet, (pipeline, source, responsePacket) => {
            if (null == responsePacket || responsePacket.getStateCode() != PipelineState.OK) {
                let error = new ModuleError(FileStorage.NAME, responsePacket.getStateCode(), sharingCode);
                handleFailure(error);
                return;
            }

            let stateCode = responsePacket.extractServiceStateCode();
            if (stateCode != FileStorageState.Ok) {
                let error = new ModuleError(FileStorage.NAME, stateCode, sharingCode);
                handleFailure(error);
                return;
            }

            let data = responsePacket.extractServiceData();
            handleSuccess(data);
        });
    }

    /**
     * 获取指定名称的分享报告。
     * @param {string|Array} reportNames 指定报告名，参看 {@link SharingReport} 。
     * @param {funciton} handleSuccess 操作成功回调。参数：({@linkcode report}:{@link SharingReport}) 。
     * @param {funciton} handleFailure 操作失败回调。参数：({@linkcode error}:{@link ModuleError}) 。
     * @param {object} [option] 报告配置选项。
     */
    getSharingReport(reportNames, handleSuccess, handleFailure, option) {
        if (!this.isReady()) {
            let error = new ModuleError(FileStorage.NAME, FileStorageState.NotReady, reportNames);
            handleFailure(error);
            return;
        }

        let payload = (typeof reportNames === 'string') ? {
            name: reportNames
        } : {
            names: reportNames
        };
        if (option) {
            payload.option = option;
        }
        let packet = new Packet(FileStorageAction.GetSharingReport, payload);
        this.pipeline.send(FileStorage.NAME, packet, (pipeline, source, responsePacket) => {
            if (null == responsePacket || responsePacket.getStateCode() != PipelineState.OK) {
                let error = new ModuleError(FileStorage.NAME, responsePacket.getStateCode(), reportNames);
                handleFailure(error);
                return;
            }

            let stateCode = responsePacket.extractServiceStateCode();
            if (stateCode != FileStorageState.Ok) {
                let error = new ModuleError(FileStorage.NAME, stateCode, reportNames);
                handleFailure(error);
                return;
            }

            let report = new SharingReport(responsePacket.extractServiceData());
            SharingReport.fillData(this, report, () => {
                handleSuccess(report);
            });
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
                completed(FileStorageState.ReadFileFailed);
                return;
            }

            // 回调正在处理事件
            processing(fileAnchor);

            // 发送数据
            this._submit(filePacket, (packet) => {
                if (null == packet) {
                    cell.Logger.e(FileStorage.NAME, 'Upload failed: ' + file.name);
                    completed(FileStorageState.TransmitFailed);
                    return;
                }

                let payload = packet.getPayload();

                // 检测回包状态
                if (payload.code == FileStorageState.Ok) {
                    cell.Logger.d(FileStorage.NAME, 'File cursor: ' + fileAnchor + '/' + fileSize);

                    let anchor = FileAnchor.create(payload.data, fileAnchor.sn);

                    let event = new ObservableEvent(FileStorageEvent.Uploading, anchor);
                    this.notifyObservers(event);

                    if (fileAnchor.position < fileSize) {
                        this.measurer.tick(filePacket.size).then(() => {
                            this._serialReadAndUpload(reader, file, fileAnchor, fileSize, completed, processing);
                        });
                    }
                    else {
                        this.measurer.finish(filePacket.size);
                        completed(anchor);
                    }
                }
                else {
                    cell.Logger.w(FileStorage.NAME, 'Packet state code: ' + payload.code);
                    completed(payload.code);
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
                file.lastModified,
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
        if (payload.code != FileStorageState.Ok) {
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

        // 回调上传成功
        let fileAnchor = this.fileAnchors.remove(fileLabel.getFileCode());
        if (null != fileAnchor) {
            if (fileAnchor.finishCallback) {
                fileAnchor.finishCallback(fileLabel);
                fileAnchor.finishCallback = null;
            }
        }

        // 通知事件
        this.notifyObservers(new ObservableEvent(FileStorageEvent.FileUpdated, fileLabel));
    }

    /**
     * 处理 Performance 数据。
     * @private
     * @param {object} payload 
     */
    triggerPerformance(payload) {
        if (payload.code != FileStorageState.Ok) {
            return;
        }

        this.fileSpaceSize = payload.data.spaceSize;
        this.performance.maxSpaceSize = payload.data.maxSpaceSize;
        this.performance.uploadThreshold = payload.data.uploadThreshold;
        this.performance.downloadThreshold = payload.data.downloadThreshold;
        this.performance.maxSharingNum = payload.data.maxSharingNum;
        this.performance.sharingWatermarkEnabled = payload.data.sharingWatermarkEnabled;
        this.performance.sharingPreviewEnabled = payload.data.sharingPreviewEnabled;
    }

    /**
     * @private
     * @param {ObservableEvent} event 
     */
    _fireContactEvent(event) {
        if (event.name == ContactEvent.SignIn) {
            this.serviceReady = true;

            // 通知就绪事件
            setTimeout(() => {
                this.notifyObservers(new ObservableEvent(FileStorageEvent.Ready));
            }, 0);
        }
        else if (event.name == ContactEvent.SignOut) {
            this.fileHierarchyMap.clear();
            this.serviceReady = false;
        }
    }
}
