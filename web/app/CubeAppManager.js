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

const AccountDB = require('./AccountDB');

/**
 * 模拟应用程序管理的类。
 */
class CubeAppManager {
    
    constructor() {
        this.accountDB = new AccountDB();
    }

    getAccount(id) {
        return this.accountDB.queryAccount(id);
    }

    getMessageCatalogue(id) {
        let result = [];
        // 用户
        let accounts = this.accountDB.accounts;
        for (let i = 0; i < accounts.length; ++i) {
            let account = accounts[i];
            if (account.id == id) {
                // 过滤自己
                continue;
            }

            let ca = {
                id: account.id,
                thumb: account.face,
                label: account.name,
                sublabel: ''
            };
            result.push(ca);
        }



        return result;
    }

    getSignOutAccounts() {
        let result = [];
        let list = this.accountDB.accounts;
        for (let i = 0; i < list.length; ++i) {
            let acc = list[i];
            if (acc.state == 'offline') {
                result.push(acc);
            }
        }

        return result;
    }

    signIn(id, name) {
        let account = this.accountDB.queryAccount(id);
        if (null == account) {
            return null;
        }

        account.state = 'online';
        if (name) {
            account.name = name;
        }

        let cookie = account.id + ',' + account.name;
        return cookie;
    }

    signOut(id) {
        let account = this.accountDB.queryAccount(id);
        account.state = 'offline';
    }
}

module.exports = new CubeAppManager();
