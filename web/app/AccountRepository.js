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

const mysql = require('mysql');
const config = require('../config');

/**
 * 模拟账号数据库。
 */
class AccountRepository {

    constructor() {
        config.db.connectionLimit = 10;
        this.pool = mysql.createPool(config.db);

        /*this.accounts = [{
            id: 50001001,
            name: '李国诚',
            avatar: '/images/avatar01.png',
            state: 'offline',
            region: '北京',
            department: '产品中心',
            last: 0
        }, {
            id: 50001002,
            name: '王沛珊',
            avatar: '/images/avatar13.png',
            state: 'offline',
            region: '武汉',
            department: '媒介部',
            last: 0
        }, {
            id: 50001003,
            name: '郝思雁',
            avatar: '/images/avatar15.png',
            state: 'offline',
            region: '上海',
            department: '公关部',
            last: 0
        }, {
            id: 50001004,
            name: '高海光',
            avatar: '/images/avatar09.png',
            state: 'offline',
            region: '成都',
            department: '技术部',
            last: 0
        }, {
            id: 50001005,
            name: '张明宇',
            avatar: '/images/avatar12.png',
            state: 'offline',
            region: '广州',
            department: '设计部',
            last: 0
        }];*/
    }

    queryAccount(account, handlerCallback) {
        this.pool.query("SELECT * FROM account WHERE `account`='" + account + "'", function(error, results, fields) {
            if (error || results.length == 0) {
                handlerCallback(null);
                return;
            }

            handlerCallback(results[0]);
        });
    }

    createAccount(account, password, nickname, avatar, handlerCallback) {
        var params = [
            this.generateSerialNumber(),
            account,
            password,
            nickname,
            avatar
        ];
        this.pool.query('INSERT INTO `account` (id,account,password,name,avatar) VALUE (?,?,?,?,?)', params, function(error, result) {
            if (error) {
                handlerCallback(null);
                return;
            }

            handlerCallback({
                id: params[0],
                account: params[1],
                password: params[2],
                name: params[3],
                avatar: params[4],
                state: 0,
                region: '--',
                department: '--',
                last: 0
            });
        });
    }

    generateSerialNumber() {
        let sn = Date.now();
        sn += this.randomNumber();
        return Math.abs(sn);
    }

    randomNumber(min, max) {
        if (min === undefined) {
            min = -32768;
        }
        if (max === undefined) {
            max = 32767;
        }

        return Math.floor(Math.random() * (max - min)) + min;
    }
}

module.exports = AccountRepository;
