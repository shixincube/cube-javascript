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

import { OrderMap } from "../util/OrderMap";
import { Hook } from "./Hook";
import { Plugin } from "./Plugin";

/**
 * 哑元钩子。
 */
class DummyHook extends Hook {
    constructor() {
        super('CubeDummyHook');
    }

    apply(data) {
        return data;
    }
}

/**
 * 插件系统。
 */
export class PluginSystem {

    /**
     */
    constructor() {
        /**
         * 事件钩子。
         * @type {OrderMap<string,Plugin>}
         */
        this.hooks = new OrderMap();

        /**
         * 插件。
         * @type {OrderMap<string,Array<Plugin>>}
         */
        this.plugins = new OrderMap();
    }

    /**
     * 添加事件钩子。
     * @param {Hook} hook 指定钩子实例。
     */
    addHook(hook) {
        hook.system = this;
        this.hooks.put(hook.getName(), hook);
    }

    /**
     * 移除事件钩子。
     * @param {Hook} hook 指定钩子实例。
     */
    removeHook(hook) {
        this.hooks.remove(hook.getName());
        hook.system = null;
    }

    /**
     * 获取指定事件名的钩子。
     * @returns {Hook} 返回指定事件名的钩子。
     */
    getHook(name) {
        let hook = this.hooks.get(name);
        if (null == hook) {
            return new DummyHook();
        }

        return hook;
    }

    /**
     * 注册插件。
     * @param {string} name 钩子事件名。
     * @param {Plugin} plugin 插件实例。
     */
    register(name, plugin) {
        let list = this.plugins.get(name);
        if (null == list) {
            list = new Array();
            this.plugins.put(name, list);
        }

        list.push(plugin);
    }

    /**
     * 注销插件。
     * @param {string} name 钩子事件名。
     * @param {Plugin} plugin 插件实例。
     */
    deregister(name, plugin) {
        let list = this.plugins.get(name);
        if (null == list) {
            return;
        }

        let index = list.indexOf(plugin);
        if (index >= 0) {
            list.splice(index, 1);
        }
    }

    /**
     * 同步方式进行数据处理。
     * @param {string} name 事件名。
     * @param {*} data 事件数据。
     * @returns {*} 返回事件处理数据。
     */
    syncApply(name, data) {
        let list = this.plugins.get(name);
        if (null == list) {
            // 没有找到插件直接返回数据
            return data;
        }

        let result = data;
        for (let i = 0; i < list.length; ++i) {
            let plugin = list[i];
            result = plugin.onEvent(name, result);
        }
        return result;
    }
}
