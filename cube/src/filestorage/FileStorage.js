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
        this.block = 512 * 1024;

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
     * 使用文件选择对话框选择文件后上传。
     * 该方法仅适用于 Web 浏览器。
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
                this.uploadFile(file, handleProcessing, handleSuccess, handleFailure);
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
     * @param {function} [handleProcessing] 正在进行文件处理的回调函数。函数参数：({@linkcode fileAnchor}:{@link FileAnchor}) 。
     * @param {function} [handleSuccess] 上传文件成功的回调函数。函数参数：({@linkcode fileLabel}:{@link FileLabel}) 。
     * @param {function} [handleFailure] 上传文件失败的回调函数。函数参数：({@linkcode error}:{@link ModuleError}) 。
     * @returns {FileAnchor} 返回文件锚。
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
        fileAnchor.lastModified = file.lastModified;
        // 记录回调函数
        fileAnchor.finishCallback = handleSuccess;

        // 串行方式上传数据
        this._serialReadAndUpload(reader, file, fileAnchor, fileSize, (anchor) => {
            if (null == anchor) {
                // 上传失败
                fileAnchor.fileCode = null;
                fileAnchor.success = false;

                // 实例化错误
                let error = new ModuleError(FileStorage.NAME, FileStorageState.TransmitFailed, fileAnchor);

                if (handleFailure) {
                    handleFailure(error);
                }

                let event = new ObservableEvent(FileStorageEvent.UploadFailed, error);
                this.notifyObservers(event);
            }
            else {
                // 上传成功
                this.fileAnchors.put(fileAnchor.fileCode, fileAnchor);

                fileAnchor.fileName = anchor.fileName;
                fileAnchor.fileSize = anchor.fileSize;
                fileAnchor.fileCode = anchor.fileCode;
                fileAnchor.success = true;

                if (handleProcessing) {
                    handleProcessing(fileAnchor);
                }

                let event = new ObservableEvent(FileStorageEvent.UploadCompleted, fileAnchor);
                this.notifyObservers(event);

                // 查询文件标签
                this._queryFileLabel(fileAnchor, 0, handleFailure);
            }
        }, (fileAnchor) => {
            // 正在上传
            if (handleProcessing) {
                handleProcessing(fileAnchor);
            }
        });

        // 返回文件锚
        return fileAnchor;
    }

    /**
     * @private
     * @param {FileAnchor} fileAnchor 
     * @param {number} count 尝试次数
     * @param {function} failureCallback
     */
    _queryFileLabel(fileAnchor, count, failureCallback) {
        let callback = fileAnchor.finishCallback;
        if (callback) {
            this.getFileLabel(fileAnchor.fileCode, (fileLabel) => {
                // 将锚点上的回调函数置空
                fileAnchor.finishCallback = null;

                callback(fileLabel);

                this.fileAnchors.remove(fileAnchor.fileCode);
            }, (error) => {
                if (error.code == FileStorageState.Writing) {
                    // 正在写入数据，客户端需要等待
                    count = 0;
                }

                if (count > 5) {
                    if (failureCallback) {
                        failureCallback(error);
                    }
                    return;
                }

                setTimeout(() => {
                    let newCount = count + 1;
                    this._queryFileLabel(fileAnchor, newCount, failureCallback);
                }, 1000);
            });
        }
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
     * @param {string} fileCodeOrLabel 文件码。
     * @param {function} handler 回调函数，函数参数：({@linkcode fileCode}:string, {@linkcode fileURL}:string, {@linkcode fileSecureURL}:string) 。
     */
    getFileURL(fileCodeOrLabel, handler) {
        if (!this.started) {
            this.start();
        }

        if (fileCodeOrLabel instanceof FileLabel) {
            let url = [ fileCodeOrLabel.getFileURL(),
                '&token=', this.filePipeline.tokenCode
            ];
            let surl = [ fileCodeOrLabel.getFileSecureURL(),
                '&token=', this.filePipeline.tokenCode
            ];
            handler(fileCodeOrLabel, url.join(''), surl.join(''));
        }
        else {
            this.getFileLabel(fileCodeOrLabel, (fileLabel) => {
                let url = [ fileLabel.getFileURL(),
                    '&token=', this.filePipeline.tokenCode
                ];
                let surl = [ fileLabel.getFileSecureURL(),
                    '&token=', this.filePipeline.tokenCode
                ];
                handler(fileLabel, url.join(''), surl.join(''));
            }, (fileCode) => {
                handler(fileLabel, null, null);
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

            handleSuccess(root);
        });
    }

    /**
     * 获取指定 ID 的目录。
     * @param {number|string} id 目录 ID 。
     * @returns {Directory} 返回指定 ID 的目录。
     */
    querySelfDirectory(id) {
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
     * @param {Directory} workingDir 
     * @param {Directory} pendingDir 
     * @param {string} newDirName 
     * @param {function} handleSuccess 
     * @param {function} handleFailure 
     */
    renameDirectory(workingDir, pendingDir, newDirName, handleSuccess, handleFailure) {
        // TODO
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
            let hierarchy = this.fileHierarchyMap.get(this.contactService.getSelf().getId());
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
            let hierarchy = this.fileHierarchyMap.get(this.contactService.getSelf().getId());
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

        let packet = new Packet(FileStorageAction.CreateSharingTag, payload);
        this.pipeline.send(FileStorage.NAME, packet, (pipeline, source, responsePacket) => {
            if (null == responsePacket || responsePacket.getStateCode() != PipelineState.OK) {
                let error = new ModuleError(FileStorage.NAME, responsePacket.getStateCode(), fileLabel);
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
     * @param {string} sharingCode 
     * @param {number} beginIndex 
     * @param {number} endIndex 
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
            let packet = new Packet(FileStorageAction.ListTraces, payload);
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

                    let event = new ObservableEvent(FileStorageEvent.Uploading, anchor);
                    this.notifyObservers(event);

                    if (fileAnchor.position < fileSize) {
                        setTimeout(() => {
                            this._serialReadAndUpload(reader, file, fileAnchor, fileSize, completed, processing);
                        }, 0);
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
