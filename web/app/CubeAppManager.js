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

const AccountRepository = require('./AccountRepository');
const stringRandom = require('string-random');

/**
 * 模拟应用程序管理的类。
 */
class CubeAppManager {

    constructor() {
        this.accountRepo = new AccountRepository();

        setInterval(() => {
            this.onTick();
        }, 60000);
    }

    /**
     * 返回所有账号
     */
    getAccounts() {
        return this.accountRepo.accounts;
    }

    /**
     * 返回指定 ID 的账号
     * @param {*} id 
     */
    getAccount(id) {
        return this.accountRepo.queryAccount(id);
    }

    getAccountByToken(token) {
        for (let i = 0, len = this.accountRepo.accounts.length; i < len; ++i) {
            let account = this.accountRepo.accounts[i];
            if (account.token && account.token == token) {
                return account;
            }
        }
        return null;
    }

    getContacts(id) {
        let result = [];
        // 用户
        let accounts = this.accountRepo.accounts;
        for (let i = 0; i < accounts.length; ++i) {
            let account = accounts[i];
            if (account.id == id) {
                // 过滤自己
                continue;
            }

            result.push(account);
        }

        return result;
    }

    getOfflineAccounts() {
        let result = [];
        let list = this.accountRepo.accounts;
        for (let i = 0; i < list.length; ++i) {
            let acc = list[i];
            if (acc.state == 'offline') {
                result.push(acc);
            }
        }

        return result;
    }

    login(id, name, useCookie) {
        let account = this.accountRepo.queryAccount(id);
        if (null == account) {
            return null;
        }

        account.last = Date.now();
        account.state = 'online';
        if (name) {
            account.name = name;
        }

        if (useCookie) {
            let cookie = id + ',' + stringRandom(16, {numbers: false});
            account.token = cookie;
            return cookie;
        }
        else {
            let token = stringRandom(32, {numbers: false});
            account.token = token;
            return token;
        }
    }

    logout(id) {
        let account = this.accountRepo.queryAccount(id);
        if (null == account) {
            return;
        }

        account.last = Date.now();
        account.state = 'offline';
        account.token = null;
    }

    heartbeat(token, cookie) {
        if (undefined !== cookie) {
            let account = this.accountRepo.queryAccount(token);
            if (null == account) {
                return false;
            }

            if (account.state == 'offline') {
                return false;
            }

            account.last = Date.now();
            return true;
        }
        else {
            let account = this.getAccountByToken(token);
            if (null == account) {
                return false;
            }

            if (account.state == 'offline') {
                return false;
            }

            account.last = Date.now();
            return true;
        }
    }

    onTick() {
        let now = Date.now();
        let list = this.accountRepo.accounts;
        for (let i = 0; i < list.length; ++i) {
            let account = list[i];
            if (account.state == 'online') {
                if (now - account.last > 300000) {
                    // 如果 5 分钟没有心跳，则设置为离线
                    account.state = 'offline';
                }
            }
        }
    }
}

module.exports = new CubeAppManager();
