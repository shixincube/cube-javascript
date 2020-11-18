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

import { Kernel } from "../core/Kernel";
import { Module } from "../core/Module";
import { Pipeline } from "../core/Pipeline";
import { CellPipeline } from "../pipeline/CellPipeline";
import { AjaxPipeline } from "../pipeline/AjaxPipeline";
import { AuthService } from "../auth/AuthService";
import { ContactService } from "../contact/ContactService";
import { FileStorage } from "../filestorage/FileStorage";
import { MessagingService } from "../messaging/MessagingService";
import { MultipointComm } from "../multipointcomm/MultipointComm";
import { FaceMonitor } from "../facemonitor/FaceMonitor";

/**
 * Cube Engine 入口类。
 */
export class CubeEngine {

    /**
     */
    constructor() {
        this.kernel = new Kernel();
        this.kernel.installPipeline(new CellPipeline());
        this.kernel.installPipeline(new AjaxPipeline());
        this.kernel.installModule(new AuthService());
        this.kernel.installModule(new ContactService());
        this.kernel.installModule(new FileStorage());
        this.kernel.installModule(new MessagingService());
        this.kernel.installModule(new MultipointComm());
        //this.kernel.installModule(new FaceMonitor());
    }

    /**
     * 启动引擎。
     * @param {KernelConfig} config 
     * @param {function} handleSuccess 
     * @param {function} handleError 
     */
    start(config, handleSuccess, handleError) {
        let success = handleSuccess || function() {};
        let error = handleError || function() {};

        // 启动内核
        this.kernel.startup(config, () => {
            success();
        }, (e) => {
            error(e);
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
     * @returns {ContactService}
     */
    getContactService() {
        return this.kernel.getModule(ContactService.NAME);
    }

    /**
     * @returns {MessagingService}
     */
    getMessagingService() {
        return this.kernel.getModule(MessagingService.NAME);
    }

    /**
     * @returns {FileStorage}
     */
    getFileStorage() {
        return this.kernel.getModule(FileStorage.NAME);
    }
}
