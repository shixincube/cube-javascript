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

const AccountRepository = require('./AccountRepository');
const stringRandom = require('string-random');
const config = require('../config');

/**
 * 模拟应用程序管理的类。
 */
class CubeAppManager {

    constructor() {
        this.accRepo = new AccountRepository();

        // Key : account {string}
        this.onlineAccounts = {};

        setInterval(() => {
            this.onTick();
        }, 60000);
    }

    addOnlineAccount(data, token) {
        data.last = Date.now();
        data.token = token;
        this.onlineAccounts[data.account] = data;
    }

    removeOnlineAccount(token) {
        for (let account in this.onlineAccounts) {
            let data = this.onlineAccounts[account];
            if (data.token == token) {
                delete this.onlineAccounts[account];
                break;
            }
        }
    }

    getOnlineAccount(account) {
        return this.onlineAccounts[account];
    }

    getOnlineAccountByToken(token) {
        for (let account in this.onlineAccounts) {
            let data = this.onlineAccounts[account];
            if (data.token == token) {
                return data;
            }
        }
        return null;
    }

    getAccount(token, accountId, callback) {
        let accountData = this.getOnlineAccountByToken(token);
        if (null == accountData) {
            callback(null);
            return;
        }

        (async () => {
            let data = await this.accRepo.queryAccountById(accountId);
            if (null != data) {
                delete data["password"];
            }
            callback(data);
        })();
    }

    getAccountById(id, callback) {
        (async () => {
            let data = await this.accRepo.queryAccountById(id);
            if (null != data) {
                delete data["password"];
            }
            callback(data);
        })();
    }

    getCubeConfig(token) {
        let accountData = this.getOnlineAccountByToken(token);
        if (null == accountData) {
            return null;
        }

        return config.cube;
    }

    /**
     * 账号登录。
     * @param {string} account 
     * @param {string} password 
     * @param {function} callback 
     */
    login(account, password, callback) {
        this.accRepo.queryAccount(account, (data) => {
            if (null == data) {
                callback(9, '');
                return;
            }

            // 比较密码
            if (password != data.password) {
                callback(8, '');
                return;
            }

            // 生成 Token
            let token = stringRandom(32, {numbers: false});
            // 更新令牌
            this.accRepo.updateToken(data.id, token, 7 * 24 * 3600 * 1000);

            // 删除账号信息
            delete data["password"];

            this.addOnlineAccount(data, token);

            callback(0, token);
        });
    }

    loginByToken(token, callback) {
        this.accRepo.queryToken(token, (data) => {
            if (null == data) {
                // 状态码 7 - 找不到令牌
                callback(7, token);
                return;
            }

            if (data.expire <= Date.now()) {
                // Token 无效
                callback(9, token);
            }
            else {
                (async () => {
                    let account = await this.accRepo.queryAccountById(data.account_id);
                    if (null == account) {
                        callback(5, token);
                        return;
                    }

                    // 删除账号信息
                    delete data["password"];

                    this.addOnlineAccount(account, token);
                    callback(0, token);
                })();
            }
        });
    }

    /**
     * 账号登出。
     * @param {string} token 
     */
    logout(token) {
        this.accRepo.deleteToken(token, () => {
            this.removeOnlineAccount(token);
        });
    }

    /**
     * 账号注册。
     * @param {string} account 
     * @param {string} password 
     * @param {string} nickname 
     * @param {string} avatar 
     * @param {function} callback 
     */
    register(account, password, nickname, avatar, callback) {
        this.accRepo.createAccount(account, password, nickname, avatar, (data) => {
            if (null == data) {
                callback(9, {});
                return;
            }

            // 删除账号信息
            delete data["password"];

            callback(0, data);
        });
    }

    /**
     * 对指定的 Token 进行心跳保持。
     * @param {string} token 
     * @returns 
     */
    heartbeat(token) {
        let data = this.getOnlineAccountByToken(token);
        if (null == data) {
            return false;
        }

        data.last = Date.now();

        return true;
    }

    onTick() {
        let now = Date.now();
        let offlines = [];

        for (let account in this.onlineAccounts) {
            let data = this.onlineAccounts[account];
            // 如果 5 分钟没有心跳，则设置为离线
            if (now - data.last > 300000) {
                offlines.push(account);
            }
        }

        offlines.forEach((value) => {
            console.log('Account "' + value + '" offline');
            delete this.onlineAccounts[value];
        });

        // 数据库连接 Keep-Alive
        this.accRepo.keepAlive();
    }

    getBuildInAccounts() {
        let array = this.accRepo.getBuildInAccounts();
        array.forEach((value) => {
            if (value.password) {
                delete value["password"];
            }
        });
        return array;
    }
}

module.exports = new CubeAppManager();
