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

import { FastMap } from "../util/FastMap";
import { Kernel } from "./Kernel";
import { PipelineListener } from "./PipelineListener";
import { Packet } from "./Packet";
import { PipelineError } from "./error/PipelineError";

/**
 * 收到指定的数据包的应答回调。
 * @callback ResponseCallback
 * @param {Pipeline} pipeline 接收到数据的通道。
 * @param {string} source 服务端访问描述。
 * @param {Packet} packet 来自服务器的返回数据包。
 */

/**
 * 网络事件定义。
 * @typedef {object} CubeNetworkEvent
 * @property {string} name 事件名。 
 * @property {Pipeline} pipeline 发生事件的数据管道。
 * @property {PipelineError} error 故障事件的错误描述。
 */

/**
 * 事件回调函数。
 * @callback CubeNetworkCallback
 * @param {CubeNetworkEvent} event 网络事件。
 */


/**
 * 网络事件名枚举。
 * @readonly
 * @enum {string}
 */
const CubeNetworkEventName = {
    /**
     * 与服务器建立连接。
     * @type {string}
     */
    connected: 'connected',

    /**
     * 与服务器断开连接。
     * @type {string}
     */
    disconnected: 'disconnected',

    /**
     * 连接时发生故障，建立连接失败。
     * @type {string}
     */
    failed: 'failed'
};


/**
 * 数据通道服务接口。
 */
export class Pipeline {

    /**
     * @param {string} name 
     */
    constructor(name) {
        /**
         * 名称。
         * @type {string}
         */
        this.name = name;

        /**
         * 内核对象。
         * @type {Kernel}
         */
        this.kernel = null;

        /**
         * 监听器。
         * @type {FastMap<string,PipelineListener|function>}
         */
        this.listenerMap = new FastMap();

        /**
         * 状态监听器。
         * @type {Array<PipelineListener>}
         */
        this.stateListenerList = [];

        /**
         * 服务器地址。
         * @type {string}
         */
        this.address = null;
    
        /**
         * 服务器端口。
         * @type {number}
         */
        this.port = 7070;
        if (window.location.protocol.toLowerCase().indexOf("https") >= 0) {
            this.port = 7077;
        }

        /**
         * 是否执行过开启操作。
         * @protected
         * @type {boolean}
         */
        this.opened = false;

        /**
         * 有效的令牌编码。
         * @type {string}
         */
        this.tokenCode = null;
    }

    /**
     * 获取通道名称。
     * @returns {string} 返回通道名称。
     */
    getName() {
        return this.name;
    }

    /**
     * 设置服务的地址和端口。
     * @param {string} address 服务器访问地址。
     * @param {number} [port] 服务器访问端口。
     */
    setRemoteAddress(address, port) {
        if (undefined !== port) {
            if (this.port == port && this.address == address) {
                return;
            }
        }
        else {
            if (this.address == address) {
                return;
            }
        }

        let reset = this.opened;

        if (reset) {
            this.close();
        }

        this.address = address;

        if (undefined !== port) {
            this.port = port;
        }

        if (reset) {
            this.open();
        }
    }

    /**
     * 设置令牌代码。
     * @param {string} tokenCode
     */
    setTokenCode(tokenCode) {
        this.tokenCode = tokenCode;
    }

    /**
     * 启动数据通道。
     */
    open() {
        this.opened = true;
    }

    /**
     * 关闭数据通道。
     */
    close() {
        this.opened = false;
    }

    /**
     * 数据通道是否就绪。
     * @returns {boolean} 如果就绪返回 {@linkcode true} 。
     */
    isReady() {
        // Nothing
        return true;
    }

    /**
     * 添加状态监听器。
     * @param {PipelineListener} listener 指定通道监听器。
     */
    addStateListener(listener) {
        let index = this.stateListenerList.indexOf(listener);
        if (index >= 0) {
            return;
        }

        this.stateListenerList.push(listener);
    }

    /**
     * 移除状态监听器。
     * @param {PipelineListener} listener 指定通道监听器。
     */
    removeStateListener(listener) {
        let index = this.stateListenerList.indexOf(listener);
        if (index >= 0) {
            this.stateListenerList.splice(index, 1);
        }
    }

    /**
     * 触发状态事件。
     * @private
     * @param {string} state 状态描述有：{@linkcode connected} ， {@linkcode disconnected} 和 {@linkcode failed} 。
     * @param {PipelineError} error 
     */
    triggerState(state, error) {
        // 所有监听器
        let list = [];
        let vlist = this.listenerMap.values();
        for (let i = 0; i < vlist.length; ++i) {
            let v = vlist[i];
            for (let j = 0; j < v.length; ++j) {
                list.push(v[j]);
            }
        }
        list = list.concat(this.stateListenerList);

        if (state === 'connected') {
            for (let i = 0; i < list.length; ++i) {
                let listener = list[i];
                if (typeof listener === 'function') {
                    listener({ "name": state, "pipeline": this });
                }
                else {
                    if (listener.onOpened) {
                        listener.onOpened(this);
                    }
                }
            }
        }
        else if (state === 'failed') {
            for (let i = 0; i < list.length; ++i) {
                let listener = list[i];
                if (typeof listener === 'function') {
                    listener({ "name": state, "pipeline": this, "error": error });
                }
                else {
                    if (listener.onFailed) {
                        listener.onFailed(this, error);
                    }
                }
            }
        }
        else if (state === 'disconnected') {
            for (let i = 0; i < list.length; ++i) {
                let listener = list[i];
                if (typeof listener === 'function') {
                    listener({ "name": state, "pipeline": this });
                }
                else {
                    if (listener && listener.onClosed) {
                        listener.onClosed(this);
                    }
                }
            }
        }
    }

    /**
     * 发送数据。
     * @param {string} destination 指定通道的发送目标或接收端识别串。
     * @param {Packet} packet 指定待发送的数据包。
     * @param {ResponseCallback} [handleResponse] 本次数据发送对应的应答回调。
     */
    send(destination, packet, handleResponse) {
        // Nothing
    }

    /**
     * 添加监听器。
     * @param {string} destination 指定监听的目标或识别串。
     * @param {PipelineListener} listener 指定通道监听器。
     */
    addListener(destination, listener) {
        let listeners = this.listenerMap.get(destination);
        if (null == listeners) {
            this.listenerMap.put(destination, [ listener ]);
        }
        else {
            let index = listeners.indexOf(listener);
            if (index < 0) {
                listeners.push(listener);
            }
        }
    }

    /**
     * 移除监听器。
     * @param {string} destination 指定监听的目标或识别串。
     * @param {PipelineListener} listener 指定通道监听器。
     */
    removeListener(destination, listener) {
        let listeners = this.listenerMap.get(destination);
        if (null == listeners) {
            return;
        }

        let index = listeners.indexOf(listener);
        if (index >= 0) {
            listeners.splice(index, 1);
        }
    }

    /**
     * 获取目标的监听器列表。
     * @protected
     * @param {string} destination 
     * @returns {Array<PipelineListener>} 返回目标的监听器列表。
     */
    getListeners(destination) {
        return this.listenerMap.get(destination);
    }

    /**
     * 触发来自服务器的数据回调。
     * @protected
     * @param {string} source 通道的描述串。
     * @param {Packet} packet 服务器的数据包。
     */
    triggerListeners(source, packet) {
        let listeners = this.listenerMap.get(source);
        if (null == listeners) {
            return;
        }

        for (let i = 0; i < listeners.length; ++i) {
            let listener = listeners[i];
            if (typeof listener === 'function') {
                listener(this, source, packet);
            }
            else {
                listener.onReceived(this, source, packet);
            }
        }
    }

    /**
     * 触发对应请求的应答。
     * @protected
     * @param {string} source 来自通道的描述串。
     * @param {Packet} packet 来自服务器的数据包。
     * @param {ResponseCallback} callback 回调函数。
     */
    touchCallback(source, packet, callback) {
        callback(this, source, packet);
    }
}
