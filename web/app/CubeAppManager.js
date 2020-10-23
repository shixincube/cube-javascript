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

/**
 * 模拟应用程序管理的类。
 */
class CubeAppManager {
    
    constructor() {
        this.accountRepo = new AccountRepository();

        setInterval(() => {
            this._tick();
        }, 30000);
    }

    getAccount(id) {
        return this.accountRepo.queryAccount(id);
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

    getMessageCatalogue(id) {
        let result = [];
        // 用户
        let accounts = this.accountRepo.accounts;
        for (let i = 0; i < accounts.length; ++i) {
            let account = accounts[i];
            if (account.id == id) {
                // 过滤自己
                continue;
            }

            let ca = {
                id: account.id,
                thumb: account.avatar,
                label: account.name,
                sublabel: ' '
            };
            result.push(ca);
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

    login(id, name) {
        let account = this.accountRepo.queryAccount(id);
        if (null == account) {
            return null;
        }

        account.last = Date.now();
        account.state = 'online';
        if (name) {
            account.name = name;
        }

        let cookie = account.id + ',' + account.name;
        return cookie;
    }

    logout(id) {
        let account = this.accountRepo.queryAccount(id);
        if (null == account) {
            return;
        }

        account.last = Date.now();
        account.state = 'offline';
    }

    keepAlive(id) {
        let account = this.accountRepo.queryAccount(id);
        if (null == account) {
            return null;
        }

        if (account.state == 'offline') {
            return null;
        }

        account.last = Date.now();
        let cookie = account.id + ',' + account.name;
        return cookie;
    }

    _tick() {
        let now = Date.now();
        let list = this.accountRepo.accounts;
        for (let i = 0; i < list.length; ++i) {
            let account = list[i];
            if (account.state == 'online' && now - account.last > 900000) {
                account.state = 'offline';
            }
        }
    }
}

module.exports = new CubeAppManager();
