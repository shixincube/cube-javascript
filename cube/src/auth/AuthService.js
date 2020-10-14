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
import { Module } from "../core/Module";
import { AuthAction } from "./AuthAction";
import { AuthToken } from "./AuthToken";
import { AuthPipelineListener } from "./AuthPipelineListener";
import { Packet } from "../core/Packet";
import { StateCode } from "../core/StateCode";
import { ObservableState } from "../core/ObservableState";
import { AuthEvent } from "./AuthEvent";
import { TokenStorage } from "./TokenStorage";

/**
 * 授权服务。
 * 管理引擎的授权信息。
 */
export class AuthService extends Module {

    /**
     * 模块名。
     * @type {string}
     */
    static NAME = 'Auth';

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
         * @type {AuthPipelineListener}
         */
        this.pipelineListener = new AuthPipelineListener(this);

        /**
         * 校验定时器。
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
     * @returns {AuthToken} 返回令牌实例。
     */
    allocToken(id) {
        if (null == this.token) {
            return null;
        }

        let storage = new TokenStorage();
        let activeToken = storage.load(id);
        if (null != activeToken) {
            this.token = activeToken;
            this.token.cid = id;
            return this.token;
        }

        // 将候选令牌转为该 ID 令牌
        if (!storage.raise(id)) {
            this.token.cid = id;
            storage.save(id, this.token);
        }

        // 申请新的候选令牌
        let promise = this.applyToken(this.token.domain, this.token.appKey);
        promise.then((newToken) => {
            storage.saveCandidate(newToken);
        }).catch(() => {
        });

        return this.token;
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
        this.domain = domain;
        this.appKey = appKey;

        let storage = new TokenStorage();

        // 尝试读取本地的 Token
        if (window.localStorage) {
            this.token = storage.loadCandidate();
        }

        // 判断令牌是否到有效期
        if (null != this.token && this.token.isValid()) {
            if (this.checkTimer > 0) {
                clearTimeout(this.checkTimer);
            }
            this.checkTimer = setTimeout(() => {
                clearTimeout(this.checkTimer);
                this.checkTimer = 0;
                this.checkToken();
            }, 5000);

            return this.token;
        }

        // 设置通道信息
        if (undefined !== address) {
            this.pipeline.setRemoteAddress(address, 7070);
        }

        // 开启通道
        this.pipeline.open();

        // 从授权服务器申请
        this.token = await this.applyToken(domain, appKey);

        if (null != this.token && window.localStorage) {
            storage.saveCandidate(this.token);
        }

        return this.token;
    }

    /**
     * 申请令牌。
     * @param {string} domain 指定有效的域。
     * @param {string} appKey 指定对应的 App Key 值。
     * @returns {AuthToken} 返回有效的 {@linkcode AuthToken} 令牌，如果发生错误返回 {@linkcode null} 值。
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
                let state = new ObservableState(AuthEvent.InvalidToken, this.token);
                this.nodifyObservers(state);

                if (window.localStorage) {
                    window.localStorage.removeItem('_cube_token_');
                }

                this.token = null;

                // 校验无效，进入自动申请
                this._autoApply();
            }
        });
    }

    /**
     * @private
     */
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
                // 写入本地
                let jsonString = JSON.stringify(this.token.toJSON());
                let code = cell.Utils.simpleEncrypt(jsonString, ['S', 'X', 'c', 'u', 'b', 'e', '3', '0']);
                let tokenString = Base64.encode(code);
                window.localStorage.setItem('_cube_token_', tokenString);
            }
        }).catch((value) => {
            // Nothing
        });
    }
}
