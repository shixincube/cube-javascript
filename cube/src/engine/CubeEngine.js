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
import { Kernel } from "../core/Kernel";
import { Module } from "../core/Module";
import { Pipeline } from "../core/Pipeline";
import { LogHandler } from "../core/LogHandler";
import { CellPipeline } from "../pipeline/CellPipeline";
import { AjaxPipeline } from "../pipeline/AjaxPipeline";
import { AuthService } from "../auth/AuthService";
import { ContactService } from "../contact/ContactService";
import { FileStorage } from "../filestorage/FileStorage";
import { MessagingService } from "../messaging/MessagingService";
import { FileProcessor } from "../fileprocessor/FileProcessor";
import { MultipointComm } from "../multipointcomm/MultipointComm";
import { WhiteboardService } from "../whiteboard/WhiteboardService";
import { FaceMonitor } from "../facemonitor/FaceMonitor";

/**
 * Cube Engine 入口类。
 */
export class CubeEngine {

    constructor() {
        this.kernel = new Kernel();
        this.kernel.installPipeline(new CellPipeline());
        this.kernel.installPipeline(new AjaxPipeline());
        this.kernel.installModule(new AuthService());
        this.kernel.installModule(new ContactService());
        this.kernel.installModule(new FileStorage());
        this.kernel.installModule(new MessagingService());
        this.kernel.installModule(new FileProcessor());
        this.kernel.installModule(new MultipointComm());
        this.kernel.installModule(new WhiteboardService());
        this.kernel.installModule(new FaceMonitor());

        this.selectFileHandle = null;
    }

    /**
     * 启动引擎。
     * @param {KernelConfig} config 配置信息。
     * @param {function} handleSuccess 启动成功回调。
     * @param {function} handleFailure 启动失败回调。
     */
    start(config, handleSuccess, handleFailure) {
        let success = handleSuccess || function() {};
        let failure = handleFailure || function() {};

        // 启动内核
        this.kernel.startup(config, () => {
            success(this);
        }, (e) => {
            failure(e);
        });
    }

    /**
     * 关闭引擎。
     */
    stop() {
        this.kernel.shutdown();
    }

    /**
     * 挂起引擎工作。
     */
    suspend() {
        this.kernel.suspend();
    }

    /**
     * 恢复引擎工作。
     */
    resume() {
        this.kernel.resume();
    }

    /**
     * 获取主通道实例。
     * @returns {Pipeline} 返回主通道实例。
     */
    getMainPipeline() {
        return this.kernel.getPipeline(CellPipeline.NAME);
    }

    /**
     * 获取指定名称的模块。
     * @param {string} moduleName 指定模块名称。
     * @returns {Module} 返回指定名称的模块。
     */
    getModule(moduleName) {
        return this.kernel.getModule(moduleName);
    }

    /**
     * @returns {ContactService} 返回联系人模块。
     */
    getContactService() {
        return this.kernel.getModule(ContactService.NAME);
    }

    /**
     * @returns {FileStorage} 返回文件存储模块。
     */
    getFileStorage() {
        return this.kernel.getModule(FileStorage.NAME);
    }

    /**
     * @returns {MessagingService} 返回消息模块。
     */
    getMessagingService() {
        return this.kernel.getModule(MessagingService.NAME);
    }

    /**
     * @returns {FileProcessor} 返回文件处理模块。
     */
    getFileProcessor() {
        return this.kernel.getModule(FileProcessor.NAME);
    }

    /**
     * @returns {MultipointComm} 返回多方通讯模块。
     */
    getMultipointComm() {
        return this.kernel.getModule(MultipointComm.NAME);
    }

    /**
     * 启动文件选择器。
     * @param {function} handle 文件选择回调函数。
     * @param {string} [accept] input 标签的 accept 属性值。
     */
    launchFileSelector(handle, accept) {
        if (undefined === accept) {
            accept = "*.*";
        }

        let el = document.querySelector('div#_cube_file_selector');
        if (null == el) {
            el = document.createElement('div');
            el.setAttribute('id', '_cube_file_selector');
            el.style.position = 'absolute';
            el.style.float = 'left';
            el.style.top = '0';
            el.style.zIndex = -99;
            el.style.visibility = 'hidden';

            let html = ['<label for="_cube_file_input"></label>',
                '<input type="file" id="_cube_file_input" name="_cube_file_input" accept="', accept, '"></input>'];
            el.innerHTML = html.join('');
            document.body.appendChild(el);

            let inputEl = document.getElementById('_cube_file_input');
            inputEl.onchange = (event) => {
                this._onFileInputChanged(event);
            };
        }

        this.selectFileHandle = handle;

        let inputEl = document.getElementById('_cube_file_input');
        inputEl.setAttribute("accept", accept);
        inputEl.click();
    }

    /**
     * 添加日志监听器。
     * @param {LogHandler} handler 日志监听器。
     */
    addLogHandler(handler) {
        cell.Logger.addHandler(handler);
    }

    /**
     * 移除日志监听器。
     * @param {LogHandler} handler 日志监听器。
     */
    removeLogHandler(handler) {
        cell.Logger.removeHandler(handler);
    }

    /**
     * @private
     * @param {Event} event 
     */
    _onFileInputChanged(event) {
        this.selectFileHandle(event);
    }
}
