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

        this.buildInAccounts = null;

        this.selfChecking(() => {
            console.log('Database self-check done');
            this.buildInData();
        });
    }

    /**
     * 自检表。
     */
    selfChecking(completedCallback) {
        this.pool.query('SHOW TABLES', (error, results, fields) => {
            if (error) {
                console.log(error.code);
                return;
            }

            let list = [];
            results.forEach((value, index) => {
                for (let key in value) {
                    list.push(value[key]);
                }
            });

            let accountDone = false;
            let tokenDone = false;

            if (list.indexOf('account') < 0) {
                let sql = [
                    "CREATE TABLE `account` (",
                        "`id` bigint(13) NOT NULL,",
                        "`account` varchar(128) NOT NULL,",
                        "`password` varchar(64) NOT NULL,",
                        "`name` varchar(128) NOT NULL,",
                        "`avatar` varchar(512) NOT NULL,",
                        "`state` int(11) NOT NULL DEFAULT '0',",
                        "`region` varchar(45) NOT NULL DEFAULT '--',",
                        "`department` varchar(45) NOT NULL DEFAULT '--',",
                        "`last` bigint(13) NOT NULL DEFAULT '0',",
                        "PRIMARY KEY (`id`),",
                        "UNIQUE KEY `account_UNIQUE` (`account`)",
                      ") ENGINE=InnoDB DEFAULT CHARSET=utf8"
                ];
                this.pool.query(sql.join(''), (error, results) => {
                    if (error) {
                        console.log(error);
                    }

                    accountDone = true;
                    if (tokenDone) {
                        completedCallback();
                    }
                });
            }
            else {
                accountDone = true;
            }

            if (list.indexOf('token') < 0) {
                let sql = [
                    "CREATE TABLE `token` (",
                        "`id` int(10) unsigned NOT NULL AUTO_INCREMENT,",
                        "`account_id` bigint(13) NOT NULL,",
                        "`token` varchar(128) NOT NULL,",
                        "`creation` bigint(13) NOT NULL,",
                        "`expire` bigint(13) NOT NULL,",
                        "PRIMARY KEY (`id`)",
                      ") ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8"
                ];
                this.pool.query(sql.join(''), (error, results) => {
                    if (error) {
                        console.log(error);
                    }

                    tokenDone = true;
                    if (accountDone) {
                        completedCallback();
                    }
                });
            }
            else {
                tokenDone = true;
            }

            if (accountDone && tokenDone) {
                completedCallback();
            }
        });
    }

    buildInData() {
        let accounts = [{
            id: 50001001,
            account: 'cube1',
            password: 'c7af98d321febe62e04d45e8806852e0',
            name: '李国诚',
            avatar: 'images/avatar01.png',
            state: 0,
            region: '北京',
            department: '产品中心',
            last: 0
        }, {
            id: 50001002,
            account: 'cube2',
            password: 'c7af98d321febe62e04d45e8806852e0',
            name: '王沛珊',
            avatar: 'images/avatar13.png',
            state: 0,
            region: '武汉',
            department: '媒介部',
            last: 0
        }, {
            id: 50001003,
            account: 'cube3',
            password: 'c7af98d321febe62e04d45e8806852e0',
            name: '郝思雁',
            avatar: 'images/avatar15.png',
            state: 0,
            region: '上海',
            department: '公关部',
            last: 0
        }, {
            id: 50001004,
            account: 'cube4',
            password: 'c7af98d321febe62e04d45e8806852e0',
            name: '高海光',
            avatar: 'images/avatar09.png',
            state: 0,
            region: '成都',
            department: '技术部',
            last: 0
        }, {
            id: 50001005,
            account: 'cube5',
            password: 'c7af98d321febe62e04d45e8806852e0',
            name: '张明宇',
            avatar: 'images/avatar12.png',
            state: 0,
            region: '广州',
            department: '设计部',
            last: 0
        }];

        (async () => {
            for (let i = 0; i < accounts.length; ++i) {
                let acc = accounts[i];
                let result = await this.queryAccount(acc.account);
                if (null == result) {
                    let params = [
                        acc.id,
                        acc.account,
                        acc.password,
                        acc.name,
                        acc.avatar,
                        acc.region,
                        acc.department
                    ];
                    this.pool.query("INSERT INTO `account` (id,account,password,name,avatar,region,department) VALUE (?,?,?,?,?,?,?)", params, (error, result) => {
                    });
                }
            }
            this.buildInAccounts = accounts;
        })();
    }

    getBuildInAccounts() {
        return this.buildInAccounts;
    }

    createAccount(account, password, nickname, avatar, handlerCallback) {
        let params = [
            this.generateSerialNumber(),
            account,
            password,
            nickname,
            avatar
        ];
        this.pool.query("INSERT INTO `account` (id,account,password,name,avatar) VALUE (?,?,?,?,?)", params, (error, result) => {
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

    queryAccount(account, handlerCallback) {
        if (undefined === handlerCallback) {
            return new Promise((resolve, reject) => {
                this.pool.query("SELECT * FROM account WHERE `account`='" + account + "'", (error, results, fields) => {
                    if (error || results.length == 0) {
                        resolve(null);
                    }
                    else {
                        resolve(results[0]);
                    }
                });
            });
        }
        else {
            this.pool.query("SELECT * FROM account WHERE `account`='" + account + "'", (error, results, fields) => {
                if (error || results.length == 0) {
                    handlerCallback(null);
                    return;
                }

                handlerCallback(results[0]);
            });
        }
    }

    queryAccountById(id) {
        return new Promise((resolve, reject) => {
            this.pool.query("SELECT * FROM account WHERE `id`=" + id, (error, results, fields) => {
                if (error || results.length == 0) {
                    resolve(null);
                }
                else {
                    resolve(results[0]);
                }
            });
        });
    }

    queryToken(token, handlerCallback) {
        this.pool.query("SELECT * FROM token WHERE `token`='" + token + "'", (error, results, fields) => {
            if (error || results.length == 0) {
                handlerCallback(null);
                return;
            }

            handlerCallback(results[0]);
        });
    }

    updateToken(id, token, maxAge, handlerCallback) {
        let time = Date.now();
        let params = [
            id,
            token,
            time,
            time + maxAge
        ];
        this.pool.query("INSERT INTO `token` (account_id,token,creation,expire) VALUE (?,?,?,?)", params, (error, result) => {
            if (error) {
                if (handlerCallback) {
                    handlerCallback(null);
                }
                return;
            }

            if (handlerCallback) {
                handlerCallback(token);
            }
        });
    }

    deleteToken(token, handlerCallback) {
        this.pool.query("DELETE FROM `token` WHERE `token`='" + token + "'", (error, result) => {
            if (error) {
                if (handlerCallback) {
                    handlerCallback(null);
                }
                return;
            }

            if (handlerCallback) {
                handlerCallback(token);
            }
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
