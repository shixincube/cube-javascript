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
import { Module } from "../core/Module";
import { AuthAction } from "./AuthAction";
import { AuthToken } from "./AuthToken";
import { AuthPipelineListener } from "./AuthPipelineListener";
import { Packet } from "../core/Packet";
import { StateCode } from "../core/StateCode";
import { ObservableEvent } from "../core/ObservableEvent";
import { AuthEvent } from "./AuthEvent";
import { TokenStorage } from "./TokenStorage";

/**
 * 授权服务。
 * 管理引擎的授权信息。
 * @extends Module
 */
export class AuthService extends Module {

    /**
     * 模块名。
     * @type {string}
     */
    static NAME = 'Auth';

    /**
     * 域。
     * @type {string}
     */
    static DOMAIN = '';

    /**
     * 终端持有的有效令牌码。
     * @type {string}
     */
    static TOKEN = '';

    /**
     * 构造函数。
     */
    constructor() {
        super('Auth');

        /**
         * 对应的域。
         * @private
         * @type {string}
         */
        this.domain = null;

        /**
         * 对应的 App Key 。
         * @private
         * @type {string}
         */
        this.appKey = null;

        /**
         * 授权令牌。
         * @private
         * @type {AuthToken}
         */
        this.token = null;

        /**
         * 数据通道监听器。
         * @private
         * @type {AuthPipelineListener}
         */
        this.pipelineListener = new AuthPipelineListener(this);

        /**
         * 校验定时器。
         * @private
         * @type {number}
         */
        this.checkTimer = 0;
    }

    /**
     * @inheritdoc
     */
    start() {
        if (!super.start()) {
            return false;
        }

        this.pipeline.addListener(AuthService.NAME, this.pipelineListener);
        return true;
    }

    /**
     * @inheritdoc
     */
    stop() {
        super.stop();

        if (null == this.pipeline) {
            return;
        }

        if (this.checkTimer > 0) {
            clearTimeout(this.checkTimer);
            this.checkTimer = 0;
        }

        this.pipeline.removeListener(AuthService.NAME, this.pipelineListener);
    }

    /**
     * 获取令牌实例。
     * @returns {AuthToken} 返回令牌实例。
     */
    getToken() {
        return this.token;
    }

    /**
     * 分配令牌。
     * @param {number} id 指定待分配令牌的 ID 。
     * @param {function} handler 分配处理回调函数。参数：({@linkcode token}:{@link AuthToken}) 。
     */
    allocToken(id, handler) {
        let storage = new TokenStorage();

        let activeToken = storage.load(id);
        if (null != activeToken && activeToken.isValid()) {
            this.token = activeToken;
            this.token.cid = id;
            handler(this.token);
            return;
        }

        activeToken = storage.loadToken();
        if (null != activeToken && activeToken.isValid()) {
            this.token = activeToken;
            this.token.cid = id;
            storage.save(id, this.token);
            handler(this.token);
            return;
        }

        (async ()=> {
            let newToken = await this.applyToken(this.domain, this.appKey);
            if (null != newToken) {
                storage.save(id, newToken);
                storage.saveToken(newToken);
                this.token = newToken;
                this.token.cid = id;
                handler(this.token);
            }
            else {
                handler(null);
            }
        })();

        /*if (null != this.token) {
            // 将候选令牌转为该 ID 令牌
            if (!storage.raise(id)) {
                this.token.cid = id;
                storage.save(id, this.token);
            }

            // 申请新的候选令牌
            (async ()=> {
                let newToken = await this.applyToken(this.token.domain, this.token.appKey);
                if (null != newToken) {
                    storage.saveCandidate(newToken);
                }
            })();

            handler(this.token);
        }
        else {
            (async ()=> {
                let newToken = await this.applyToken(this.domain, this.appKey);
                if (null != newToken) {
                    storage.save(id, newToken);
                    this.token = newToken;
                    this.token.cid = id;
                    handler(this.token);
                }
                else {
                    handler(null);
                }
            })();
        }*/
    }

    /**
     * 校验当前的令牌是否有效。
     * 该方法先从本地获取本地令牌进行校验，如果本地令牌失效或者未找到本地令牌，则尝试从授权服务器获取有效的令牌。
     * @param {string} domain 令牌对应的域。
     * @param {string} appKey 令牌指定的 App Key 串。
     * @param {string} [address] 授权服务器地址。
     * @returns {AuthToken} 返回令牌实例。如果无法获取到授权令牌返回 {@linkcode null} 值。
     */
    async check(domain, appKey, address) {
        AuthService.DOMAIN = domain;
        this.domain = domain;
        this.appKey = appKey;

        let storage = new TokenStorage();

        // 尝试读取本地的 Token
        this.token = storage.loadToken();

        // 判断令牌是否到有效期
        if (null != this.token && this.token.isValid()) {
            AuthService.TOKEN = this.token.code;

            // if (this.checkTimer > 0) {
            //     clearTimeout(this.checkTimer);
            // }
            // this.checkTimer = setTimeout(() => {
            //     clearTimeout(this.checkTimer);
            //     this.checkTimer = 0;
            //     this.checkToken();
            // }, 1000);

            return this.token;
        }

        // 设置通道信息
        if (undefined !== address) {
            this.pipeline.setRemoteAddress(address);
        }

        // 开启通道
        this.pipeline.open();

        // 从授权服务器申请
        this.token = await this.applyToken(domain, appKey);

        if (null != this.token) {
            AuthService.TOKEN = this.token.code;

            // 保存令牌
            storage.saveToken(this.token);
        }

        return this.token;
    }

    /**
     * 申请令牌。
     * @param {string} domain 指定有效的域。
     * @param {string} appKey 指定对应的 App Key 值。
     * @returns {Promise} 返回有效的 {@link AuthToken} 令牌，如果发生错误返回 {@linkcode null} 值。
     */
    applyToken(domain, appKey) {
        return new Promise((resolve, reject) => {
            let count = 0;
            let timer = setInterval(()=> {
                ++count;
                if (count > 50) {
                    clearInterval(timer);
                    resolve(null);
                    return;
                }

                if (!this.pipeline.isReady()) {
                    return;
                }

                clearInterval(timer);

                let packet = new Packet(AuthAction.ApplyToken, {
                    domain: domain,
                    appKey: appKey
                });

                this.pipeline.send(AuthService.NAME, packet, (pipeline, source, responsePacket) => {
                    if (null == responsePacket) {
                        // 超时
                        resolve(null);
                        return;
                    }

                    let state = responsePacket.getStateCode();
                    if (state == StateCode.OK) {
                        if (responsePacket.data.code == 0) {
                            let token = AuthToken.create(responsePacket.data.data);
                            resolve(token);
                        }
                        else {
                            cell.Logger.w('AuthService', 'Apply auth token failed: ' + responsePacket.data.code);
                            resolve(null);
                        }
                    }
                    else {
                        cell.Logger.w('AuthService', 'Pipeline error: ' + state);
                        resolve(null);
                    }
                });
            }, 100);
        });
    }

    /**
     * 从服务器查询令牌进行检测。
     */
    checkToken() {
        if (null == this.token) {
            return;
        }

        let code = this.token.code;
        let packet = new Packet(AuthAction.GetToken, {
            code: code
        });
        this.pipeline.send(AuthService.NAME, packet, (pipeline, source, packet) => {
            if (null == packet) {
                return;
            }

            let state = packet.getStateCode();
            if (state == StateCode.OK && packet.data.code == 0) {
                // 令牌有效
                cell.Logger.d('AuthService', 'Token "' + code + '" is valid');
            }
            else {
                // 错误的 Code
                let event = new ObservableEvent(AuthEvent.InvalidToken, this.token);
                this.notifyObservers(event);

                let storage = new TokenStorage();
                storage.removeToken();
                storage.remove(this.token.cid);

                this.token = null;

                // 校验无效，进入自动申请
                // this._autoApply();
            }
        });
    }

    /**
     * 清除所有令牌。
     */
    cleanToken() {
        let storage = new TokenStorage();
        storage.removeAll();
        storage = null;
    }

    /**
     * @private
     *
    _autoApply() {
        cell.Logger.d('AuthService', 'Auto apply token @ ' + this.domain);

        let promise = this.applyToken(this.domain, this.appKey);
        promise.then((value) => {
            if (null == value) {
                this.checkTimer = setTimeout((e) => {
                    clearTimeout(this.checkTimer);
                    this.checkTimer = 0;
                    this._autoApply();
                }, 5000);
                return;
            }

            this.token = value;

            if (null != this.token && window.localStorage) {
                let storage = new TokenStorage();
                storage.saveCandidate(value);
            }
        }).catch(() => {
            // Nothing
        });
    }*/
}
