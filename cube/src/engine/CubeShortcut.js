import { Self } from "../contacts/Self";
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

/**
 * Cube Engine 的快捷操作方式封装。
 */
export class CubeShortcut {

    constructor() {
        this.engine = new CubeEngine();
    }

    /**
     * 启动 Cube 并与服务器建立连接。
     * 
     * @param {KernelConfig} config 
     * @param {function} handleSuccess 
     * @param {function} handleError 
     */
    start(config, handleSuccess, handleError) {
        if (config.pipelineReady === undefined) {
            config.pipelineReady = true;
        }

        this.engine.start(config, handleSuccess, handleError);
    }

    /**
     * 关闭 Cube 并断开与服务器的连接。
     */
    stop() {
        this.engine.stop();
    }

    /**
     * 
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
     */
    signIn(id) {
        this.engine.getContactService().signIn(id);
    }

    /**
     * 将已签入的联系人签出。
     * @returns {boolean} 如果当前状态正常，允许签出返回 {@linkcode true} 。
     */
    signOut() {
        return this.engine.getContactService.signOut();
    }
}
