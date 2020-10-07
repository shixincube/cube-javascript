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

/**
 * 模拟账号数据库。
 */
class AccountDB {
    
    constructor() {
        this.accounts = [{
            id: 50001001,
            name: '李诚石',
            avatar: '/images/avatar01.png',
            state: 'offline'
        }, {
            id: 50001002,
            name: '王沛珊',
            avatar: '/images/avatar02.png',
            state: 'offline'
        }, {
            id: 50001003,
            name: '郝思雁',
            avatar: '/images/avatar03.png',
            state: 'offline'
        }, {
            id: 50001004,
            name: '高良吉',
            avatar: '/images/avatar04.png',
            state: 'offline'
        }, {
            id: 50001005,
            name: '张明宇',
            avatar: '/images/avatar05.png',
            state: 'offline'
        }];
    }

    queryAccount(id) {
        for (let i = 0; i < this.accounts.length; ++i) {
            let account = this.accounts[i];
            if (account.id === id) {
                return account;
            }
        }

        return null;
    }
}

module.exports = AccountDB;
