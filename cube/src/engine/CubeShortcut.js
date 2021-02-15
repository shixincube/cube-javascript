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

import { CubeEngine } from "./CubeEngine";
import { ContactService } from "../contact/ContactService";
import { FileStorage } from "../filestorage/FileStorage";
import { MessagingService } from "../messaging/MessagingService";
import { FileProcessor } from "../fileprocessor/FileProcessor";
import { MultipointComm } from "../multipointcomm/MultipointComm";

/**
 * Cube Engine 的快捷操作方式封装。
 */
export class CubeShortcut {

    constructor() {
        /**
         * 引擎实例。
         * @type {CubeEngine}
         */
        this.engine = new CubeEngine();

        /**
         * 联系人模块。
         * @type {ContactService}
         * @public
         */
        this.contact = this.engine.getContactService();

        /**
         * 文件存储模块。
         * @type {FileStorage}
         * @public
         */
        this.fileStorage = this.engine.getFileStorage();

        /**
         * 文件存储模块。
         * @type {FileStorage}
         * @public
         */
        this.fs = this.fileStorage;

        /**
         * 消息模块。
         * @type {MessagingService}
         * @public
         */
        this.messaging = this.engine.getMessagingService();

        /**
         * 文件处理模块。
         * @type {FileProcessor}
         * @public
         */
        this.fileProcessor = this.engine.getFileProcessor();

        /**
         * 文件处理模块。
         * @type {FileProcessor}
         * @public
         */
        this.fp = this.fileProcessor;

        /**
         * 多方通讯模块。
         * @type {MultipointComm}
         */
        this.mpComm = this.engine.getMultipointComm();
    }

    /**
     * 启动 Cube 并与服务器建立连接。
     * @param {KernelConfig} config 配置信息。
     * @param {function} handleSuccess 启动成功回调。
     * @param {function} handleFailure 启动失败回调。
     */
    start(config, handleSuccess, handleFailure) {
        if (config.pipelineReady === undefined) {
            config.pipelineReady = true;
        }

        this.engine.start(config, handleSuccess, handleFailure);
    }

    /**
     * 关闭 Cube 并断开与服务器的连接。
     */
    stop() {
        this.engine.stop();
    }

    /**
     * 获取指定名称的模块。
     * @param {string} moduleName 模块名。
     */
    getModule(moduleName) {
        return this.engine.getModule(moduleName);
    }

    /**
     * 设置事件监听器。
     * @param {string} event 事件名。
     * 支持的事件：
     * ['network']{@linkcode PipelineListener},
     * ['pipeline']{@linkcode PipelineListener}
     * @param {CubeNetworkCallback} listener 监听函数。
     */
    on(event, listener) {
        if (event == 'network' || event == 'pipeline') {
            this.engine.getMainPipeline().addStateListener(listener);
        }
    }

    /**
     * 将当前终端指定的联系人签入。
     * @param {number} id 联系人 ID 。
     * @param {string} [name] 联系人名称。
     * @param {object} [context] 联系人关联的上下文。
     */
    signIn(id, name, context) {
        this.engine.getContactService().signIn(id, name, context);
    }

    /**
     * 将已签入的联系人签出。
     * @returns {boolean} 如果当前状态正常，允许签出返回 {@linkcode true} 。
     */
    signOut() {
        return this.engine.getContactService.signOut();
    }

    /**
     * 启动文件选择器。
     * @param {function} handle 文件选择回调函数。
     * @param {string} [accept] input 标签的 accept 属性值。
     */
    launchFileSelector(handle, accept) {
        this.engine.launchFileSelector(handle, accept);
    }

    /**
     * 添加日志监听器。
     * @param {LogHandler} handler 日志监听器。
     */
    addLogHandler(handler) {
        this.engine.addLogHandler(handler);
    }

    /**
     * 移除日志监听器。
     * @param {LogHandler} handler 日志监听器。
     */
    removeLogHandler(handler) {
        this.engine.removeLogHandler(handler);
    }
}
