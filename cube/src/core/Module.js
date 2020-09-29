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

import { Subject } from "./Subject";
import { Kernel } from "./Kernel";
import { Pipeline } from "./Pipeline";
import { PluginSystem } from "./PluginSystem";

/**
 * 内核模块类。
 */
export class Module extends Subject {

    /**
     * 构造函数。
     * @param {string} name 指定模块名称。
     */
    constructor(name) {
        super();

        /**
         * 模块名称。
         * @protected
         * @type {string}
         */
        this.name = name;

        /**
         * 内核对象。
         * @protected
         * @type {Kernel}
         */
        this.kernel = null;

        /**
         * 模块使用的默认数据管道。
         * @protected
         * @type {Pipeline}
         */
        this.pipeline = null;

        /**
         * 是否已启动。
         * @protected
         * @type {boolean}
         */
        this.started = false;

        /**
         * 模块的外部依赖。
         * @protected
         * @type {Array<string>}
         */
        this.dependencies = [];

        /**
         * 依赖库列表。
         * @protected
         * @type {Array<string>}
         */
        this.deps = [];

        /**
         * 消息插件系统。
         * @protected
         * @type {PluginSystem}
         */
        this.pluginSystem = new PluginSystem();
    }

    /**
     * 获取模块名称。
     * @returns {string} 返回模块名称。
     */
    getName() {
        return this.name;
    }

    /**
     * 声明该模块依赖的其他模块。
     * @param {string} moduleName 
     */
    require(moduleName) {
        let index = this.dependencies.indexOf(moduleName);
        if (index >= 0) {
            return;
        }

        this.dependencies.push(moduleName);
    }

    /**
     * 请求外部依赖库文件。
     * @param {string} lib 库文件名。
     */
    requireFile(lib) {
        let index = this.deps.indexOf(lib);
        if (index >= 0) {
            return;
        }

        this.deps.push(lib);
    }

    /**
     * 是否已启动过该模块。
     * @returns {boolean} 如果已启动返回 {@linkcode true} ，否则返回 {@linkcode false} 。
     */
    hasStarted() {
        return this.started;
    }

    /**
     * 启动模块。
     * @returns {boolean} 返回 {@linkcode false} 表示模块不再需要执行启动流程。
     */
    start() {
        // 如果内核未工作，模块启动失败
        if (!this.kernel.working) {
            return false;
        }

        // 已经启动模块，不重复执行启动流程
        if (this.started) {
            return false;
        }

        // 尝试启动依赖的模块
        for (let i = 0; i < this.dependencies.length; ++i) {
            let mod = this.kernel.getModule(this.dependencies[i]);
            if (null != mod) {
                mod.start();
            }
        }

        this.started = true;
        return true;
    }

    /**
     * 停止模块。
     */
    stop() {
        this.started = false;
    }

    /**
     * 挂起模块。
     */
    suspend() {
        // Nothing
    }

    /**
     * 恢复模块。
     */
    resume() {
        // Nothing
    }

    /**
     * 获取插件系统对象实例。
     * @returns {PluginSystem} 返回插件系统对象实例。
     */
    getPluginSystem() {
        return this.pluginSystem;
    }
}
