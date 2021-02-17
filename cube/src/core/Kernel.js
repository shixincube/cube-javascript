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
import { FastMap } from "../util/FastMap";
import { Pipeline } from "./Pipeline";
import { Module } from "./Module";
import { AuthToken } from "../auth/AuthToken";
import { KernelError } from "./error/KernelError";
import { AuthService } from "../auth/AuthService";

/**
 * 内核配置定义。
 * @typedef {object} KernelConfig
 * @property {string} address 管道服务器地址。
 * @property {string} domain 授权的指定域。
 * @property {string} appKey 当前应用申请到的 App Key 串。
 * @property {boolean} unconnected 启动时不进行连接。
 * @property {boolean} pipelineReady 内核是否等待通道就绪再回调。
 */

/**
 * 内核。内核管理所有的模块和通信管道。
 */
export class Kernel {

    /**
     * 内核版本号。
     * @type {string}
     */
    static VERSION = '1.0.0';

    /**
     * @private
     * @type {Kernel}
     */
    static gsInstance = null;

    constructor() {
        /**
         * 内核配置信息。
         * @type {KernelConfig}
         */
        this.config = null;

        /**
         * 内核是否正在工作。
         * @private
         * @type {boolean}
         */
        this.working = false;

        /**
         * 依赖文件 URI 路径。
         * @private
         * @type {string}
         */
        this.depsPath = 'libs/';

        /**
         * 数据管道对象映射。
         * @private
         * @type {FastMap<string,Pipeline>}
         */
        this.pipelines = new FastMap();

        /**
         * 模块对象映射。
         * @private
         * @type {FastMap<string,Module>}
         */
        this.modules = new FastMap();

        Kernel.gsInstance = this;
    }

    /**
     * 启动内核。
     * @param {KernelConfig} config 配置信息。
     * @param {function} handleSuccess 启动成功回调函数。
     * @param {function} handleFailure 启动失败回调函数。
     */
    async startup(config, handleSuccess, handleFailure) {
        if (config["log"] === undefined) {
            cell.Logger.level = cell.LogLevel.DEBUG;
        }
        else {
            cell.Logger.level = config["log"];
        }
        if (config.address === undefined) {
            config.address = '127.0.0.1';
        }

        // 标记为已工作状态
        this.working = true;

        // 配置
        this.config = config;

        // 绑定默认通道关系
        this.bundleDefault();

        // 检查授权
        let token = await this.checkAuth(config);

        if (null == token || !token.isValid()) {
            // 授权令牌无效
            handleFailure(new KernelError('Invalid token config data'));
            return;
        }

        // 配置模块
        this.configModules(config, token);

        // 加载依赖文件成功后
        let loadCompleted = async (successful) => {
            if (undefined !== config.unconnected && config.unconnected) {
                if (successful) {
                    handleSuccess();
                }
                else {
                    handleFailure(new KernelError('Load module deps failed'));
                }
            }
            else {
                let list = this.pipelines.values();
                for (let i = 0; i < list.length; ++i) {
                    let pl = list[i];
                    // 启动管道
                    pl.open();
                }
    
                if (config.pipelineReady !== undefined && config.pipelineReady) {
                    await this.waitPipelineReady(10000);
                }
    
                if (successful) {
                    handleSuccess();
                }
                else {
                    handleFailure(new KernelError('Load module deps failed'));
                }
            }
        };

        // 加载依赖
        this.loadModuleDeps((successList, failureList) => {
            loadCompleted(true)
        }, (successList, failureList) => {
            loadCompleted(false)
        });
    }

    /**
     * 关闭内核。
     */
    shutdown() {
        this.working = false;

        // 关闭管道
        let list = this.pipelines.values();
        for (let i = 0; i < list.length; ++i) {
            let pl = list[i];
            pl.close();
        }

        // 停止模块
        let mods = this.modules.values();
        for (let i = 0; i < mods.length; ++i) {
            let mod = mods[i];
            mod.stop();
        }
    }

    /**
     * 挂起内核。
     */
    suspend() {
        // Nothing
    }

    /**
     * 恢复内核。
     */
    resume() {
        // Nothing
    }

    /**
     * 安装数据通道。
     * @param {Pipeline} pipeline 指定待安装的数据通道。
     */
    installPipeline(pipeline) {
        pipeline.kernel = this;
        this.pipelines.put(pipeline.getName(), pipeline);
    }

    /**
     * 卸载数据通道。
     * @param {Pipeline} pipeline 指定待卸载的数据通道。
     */
    uninstallPipeline(pipeline) {
        this.pipelines.remove(pipeline.getName());
    }

    /**
     * 获取指定名称的数据通道。
     * @param {string} name 指定数据通道名称。
     * @returns {Pipeline} 返回指定名称的数据通道。
     */
    getPipeline(name) {
        return this.pipelines.get(name);
    }

    /**
     * 安装模块。
     * @param {Module} module 指定待安装的模块。
     */
    installModule(module) {
        module.kernel = this;
        this.modules.put(module.getName(), module);
    }

    /**
     * 卸载模块。
     * @param {Module} module 指定待卸载的模块。
     */
    uninstallModule(module) {
        this.modules.remove(module.getName());
    }

    /**
     * 获取指定名称的模块。
     * @param {string} name 指定模块名称。
     * @returns {Module} 返回指定名称的模块。
     */
    getModule(name) {
        return this.modules.get(name);
    }

    /**
     * 获取访问令牌。
     * @returns {AuthToken} 返回当前存储的访问令牌，如果没有获得令牌返回 {@linkcode null} 值。
     */
    getAuthToken() {
        return this.getModule(AuthService.NAME).getToken();
    }

    /**
     * 激活指定 ID 的令牌。
     * @param {number} id 指定联系人 ID 。
     * @returns {AuthToken} 返回令牌实例。
     */
    activeToken(id) {
        return new Promise((resolve, reject) => {
            this.getModule(AuthService.NAME).allocToken(id, (token) => {
                if (null == token) {
                    resolve(null);
                    return;
                }

                let pipelines = this.pipelines.values();
                for (let i = 0; i < pipelines.length; ++i) {
                    let pipeline = pipelines[i];
                    pipeline.setTokenCode(token.code);
                }

                resolve(token);
            });
        });
    }

    /**
     * 等待通道就绪或者达到指定超时时长。
     * @protected
     * @param {number} timeout 指定超时时长，单位：毫秒。
     */
    waitPipelineReady(timeout) {
        return new Promise((resolve, reject) => {
            let timer = 0;

            let timeoutTimer = setTimeout((e) => {
                clearInterval(timer);
                clearTimeout(timeoutTimer);
                resolve();
            }, timeout);

            let pipeline = this.pipelines.get('Cell');
            timer = setInterval((e) => {
                if (pipeline.isReady()) {
                    clearInterval(timer);
                    clearTimeout(timeoutTimer);
                    resolve();
                }
            }, 100);
        });
    }

    /**
     * 检查授权信息。
     * @protected
     * @param {KernelConfig} config 配置信息。
     * @returns {AuthToken} 返回有效的授权令牌对象。如果未能获取令牌返回 {@linkcode null} 值。
     */
    checkAuth(config) {
        return new Promise((resolve, reject) => {
            let authService = this.getModule(AuthService.NAME);

            if (null == authService) {
                // 没有安装授权模块
                cell.Logger.w('Kernel', 'Can NOT find auth module');
                resolve(null);
                return;
            }

            if (config.domain === undefined || config.appKey === undefined) {
                // 没有配置授权信息
                cell.Logger.w('Kernel', 'Auth config error');
                resolve(null);
                return;
            }

            let token = authService.check(config.domain, config.appKey, config.address);
            if (null == token) {
                cell.Logger.w('Kernel', 'Auth token is invalid');
                resolve(null);
                return;
            }

            resolve(token);
        });
    }

    /**
     * 为指定模块绑定数据通道。
     * @private
     * @param {Module|String} module 
     * @param {Pipeline|String} pipeline 
     */
    bundle(module, pipeline) {
        // TODO
        if (typeof module === 'string') {

        }
    }

    /**
     * 为所有模块绑定默认的数据通道。
     * @private
     */
    bundleDefault() {
        let pipeline = this.pipelines.get('Cell');
        let modules = this.modules.values();
        for (let i = 0; i < modules.length; ++i) {
            let mod = modules[i];
            if (null == mod.pipeline) {
                mod.pipeline = pipeline;
            }
        }
    }

    /**
     * 对内核进行配置。
     * @private
     * @param {KernelConfig} config 内核配置信息。
     * @param {AuthToken} token 令牌。
     * @returns {boolean} 配置成功返回 {@linkcode true} ，否则返回 {@linkcode false} 。
     */
    configModules(config, token) {
        if (null == token) {
            return false;
        }

        let pipelines = this.pipelines.values();
        for (let i = 0; i < pipelines.length; ++i) {
            let pipeline = pipelines[i];
            pipeline.setRemoteAddress(token.getDescription().getAddress());
            pipeline.setTokenCode(token.code);
        }

        // 校验依赖关系
        let modules = this.modules.values();
        for (let i = 0; i < modules.length; ++i) {
            let mod = modules[i];
            for (let j = 0; j < mod.dependencies.length; ++j) {
                let depName = mod.dependencies[j];
                if (!this.modules.containsKey(depName)) {
                    // 没有安装依赖模块
                    cell.Logger.e('Kernel', 'Module "' + depName + '" is not installed, which module "' + mod.name + '" depends.');
                }
            }

            // 查找模块配置
            if (token.description.primaryContent.hasOwnProperty(mod.name)) {
                let cfg = token.description.primaryContent[mod.name];
                mod.config(cfg);
            }
        }

        return true;
    }

    /**
     * 加载模块依赖。
     * @private
     * @param {function} handleSuccess 
     * @param {function} handleFailure
     */
    loadModuleDeps(handleSuccess, handleFailure) {
        // 加载模块的依赖
        let libs = [];
        let mods = this.modules.values();
        for (let i = 0; i < mods.length; ++i) {
            let mod = mods[i];
            for (let n = 0; n < mod.deps.length; ++n) {
                let file = mod.deps[n];
                if (libs.indexOf(file) >= 0) {
                    continue;
                }
                libs.push(file);
            }
        }

        let successList = [];
        let failureList = [];

        if (libs.length == 0) {
            handleSuccess(successList, failureList);
            return;
        }

        // 加载函数
        let load = () => {
            let lib = null;
            if (libs.length > 0) {
                lib = libs.splice(0, 1);
            }
            else {
                return;
            }

            this.loadDepsJS(lib).then((fileOrUrl)=> {
                successList.push(fileOrUrl);
                load();
            }).catch((fileOrUrl) => {
                failureList.push(fileOrUrl);
                cell.Logger.i('Kernel', 'Startup error: can not load file: ' + fileOrUrl);
                load();
            });
        }

        let promise = new Promise((resolve, reject) => {
            // 异步加载文件
            load();

            let count = 0;
            let timer = setInterval((e) => {
                ++count;
                if (count >= 50) {
                    clearInterval(timer);
                    reject();
                    return;
                }

                if (libs.length == 0) {
                    clearInterval(timer);
                    if (failureList.length > 0) {
                        reject();
                    }
                    else {
                        resolve();
                    }
                }
            }, 100);
        });
        promise.then((result) => {
            cell.Logger.d('Kernel', 'Module deps files loaded: ' + successList.length);
            handleSuccess.call(null, successList, failureList);
        }).catch((error) => {
            handleFailure.call(null, successList, failureList);
        });
    }

    /**
     * 加载依赖的 JS 文件。
     * @private
     * @param {string} fileOrUrl 文件名或者 URL 。
     */
    loadDepsJS(fileOrUrl) {
        const depsPath = this.depsPath;
        let promise = new Promise((resolve, reject) => {
            let script = document.createElement('script');
            script.type = 'text/javascript';

            if (script.readyState) {
                script.onreadystatechange = function() {
                    if (script.readyState == 'loaded' || script.readyState == 'complete') {
                        script.onreadystatechange = null;
                        resolve(fileOrUrl);
                    }
                }
            }
            else {
                script.onload = function(e) {
                    resolve(fileOrUrl);
                }
                script.onerror = function(e) {
                    reject(fileOrUrl);
                }
            }

            if (fileOrUrl.startsWith('http://') || fileOrUrl.startsWith('https://')) {
                script.src = fileOrUrl;
            }
            else {
                script.src = depsPath + fileOrUrl;
            }
            document.getElementsByTagName('body')[0].appendChild(script);
        });
        return promise;
    }
}
