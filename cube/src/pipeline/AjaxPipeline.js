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

import { Pipeline } from "../core/Pipeline";
import { FastMap } from "../util/FastMap";
import { AjaxFileChunkPacket } from "./AjaxFileChunkPacket";
import { Packet } from "../core/Packet";
import { StateCode } from "../core/StateCode";

/**
 * AJAX 请求操作封装。
 * @private
 */
class AjaxRequest {

    /**
     * 构造函数。
     * @param {XMLHttpRequest} xhr 
     * @param {string} url 
     */
    constructor(xhr, url) {
        this.xhr = xhr;
        this.url = url;
        this.method = "GET";
        this.headers = null;
        this.params = null;
        this.data = null;
        this.dataType = 'json';
        this.responseType = 'json';
    }

    setMethod(value) {
        this.method = value;
        return this;
    }

    setHeader(name, value) {
        if (null == this.headers)
            this.headers = new FastMap();

        this.headers.put(name, value);
        return this;
    }

    setParams(value) {
        this.params = value;
        return this;
    }

    setResponseType(value) {
        this.responseType = value;
    }

    /**
     * 
     * @param {object} value 
     * @param {string} [dataType] 数据类型。
     */
    setData(value, dataType) {
        this.data = value;
        if (undefined !== dataType) {
            this.dataType = dataType;
        }
        return this;
    }

    send(responseCallback) {
        // 设置应答类型
        this.xhr.responseType = this.responseType;

        // 解析参数
        let params = null;
        if (null != this.params) {            
            if (typeof this.params === "object") {
                for (let item in this.params) {
                    if (params == null) {
                        params = item + '=' + encodeURIComponent(this.params[item]);
                    }
                    else {
                        params += '&' + item + '=' + encodeURIComponent(this.params[item]);
                    }
                }
            }
            else {
                params = this.params;
            }

            // 判断 URL 里是否已经包含了查询串
            if (this.url.indexOf('?') > 0) {
                params = '&' + params;
            }
            else {
                params = '?' + params;
            }
        }

        if (undefined !== responseCallback) {
            let _xhr = this.xhr;
            _xhr.onreadystatechange = function () {
                if (_xhr.readyState === XMLHttpRequest.DONE) {
                    responseCallback.call(null, _xhr.status, _xhr.response);
                }
            };
        }

        // 启动 AJAX 请求
        let url = (null == params) ? this.url : this.url + params;
        this.xhr.open(this.method, url, true);

        // 处理请求头数据
        if (null != this.headers) {
            let keySet = this.headers.keySet();
            for (let i = 0; i < keySet.length; ++i) {
                let key = keySet[i];
                let value = this.headers.get(key);
                // 设置请求头
                this.xhr.setRequestHeader(key, value);
            }
        }

        if (null != this.data) {
            if (this.data instanceof FormData) {
                this.xhr.setRequestHeader("Content-Type", "multipart/form-data");
            }
            else {
                this.xhr.setRequestHeader("Content-Type", "application/json");
            }
            //this.xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
        }

        // 发送请求
        if (null != this.data) {
            this.xhr.send(this.data);
        }
        else {
            this.xhr.send();
        }
    }

    /**
     * 获取应答的头数据。
     * 
     * @param {string} header 
     * @returns {string}
     */
    getResponseHeader(header) {
        return this.xhr.getResponseHeader(header);
    }
}


/**
 * 基于 AJAX 通信方式的数据管道。
 */
export class AjaxPipeline extends Pipeline {

    static NAME = 'Ajax';

    /**
     * 构造函数。
     */
    constructor() {
        super('Ajax');
    }

    open() {
        super.open();
    }

    close() {
        super.close();
    }

    isReady() {
        return true;
    }

    /**
     * @inheritdoc
     */
    send(destination, packet, handleResponse) {
        let tokenCode = this.tokenCode.toString();
        let request = this.newRequest(destination);

        if (packet instanceof AjaxFileChunkPacket) {
            request.setMethod('POST')
                .setParams({ token: tokenCode, sn: packet.sn })
                .setData(packet.data);

            request.send((status, response) => {
                if (status == 200) {
                    let responsePacket = Packet.create(response);
                    responsePacket.state = {
                        code: StateCode.OK,
                        desc: 'Ok'
                    };

                    if (undefined !== handleResponse) {
                        handleResponse(this, destination, responsePacket);
                    }

                    super.triggerListeners(destination, responsePacket);
                }
                else {
                    if (undefined !== handleResponse) {
                        handleResponse(this, destination, null);
                    }

                    super.triggerListeners(destination, null);
                }
            });
        }
        else if (packet instanceof Packet) {
            if (packet.name.toUpperCase() == 'GET') {
                var params = { token: tokenCode, sn: packet.sn };
                if (packet.data) {
                    for (let n in packet.data) {
                        params[n] = packet.data[n];
                    }
                }
                request.setMethod(packet.name)
                    .setParams(params);
            }
            else {
                request.setMethod(packet.name)
                    .setParams({ token: tokenCode, sn: packet.sn })
                    .setData(packet.data);
            }

            // 设置应答类型
            request.setResponseType(packet.responseType);

            request.send((status, response) => {
                if (status == 200) {
                    let contentType = request.getResponseHeader('Content-Type');
                    let responsePacket = null;
                    if (contentType.indexOf('octet-stream') >= 0) {
                        responsePacket = new Packet(packet.name, response, packet.sn);
                    }
                    else {
                        responsePacket = Packet.create(response);
                    }
                    responsePacket.state = {
                        code: StateCode.OK,
                        desc: 'Ok'
                    };

                    if (undefined !== handleResponse) {
                        handleResponse(this, destination, responsePacket);
                    }

                    super.triggerListeners(destination, responsePacket);
                }
                else {
                    if (undefined !== handleResponse) {
                        handleResponse(this, destination, null);
                    }

                    super.triggerListeners(destination, null);
                }
            });
        }
    }

    /**
     * 创建新的请求。
     * @param {string} url 
     * @returns {AjaxRequest}
     */
    newRequest(url) {
        let xhr = null;
        if (window.XMLHttpRequest) {
            // code for IE7+, Firefox, Chrome, Opera, Safari
            xhr = new XMLHttpRequest();
        }
        else {
            // code for IE6, IE5
            xhr = new ActiveXObject("Microsoft.XMLHTTP");
        }

        let request = new AjaxRequest(xhr, url);
        return request;
    }
}
