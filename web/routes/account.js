/**
 * This file is part of Cube.
 * https://shixincube.com
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

const express = require('express');
const router = express.Router();

/* POST /register */
router.post('/register', function(req, res, next) {
    req.app.get('manager').register(req.body.account, req.body.password, req.body.nickname, req.body.avatar,
        function(code, account) {
            res.json({ "code": code, "account" : account });
        }
    );
});


/* POST /login */
router.post('/login', function(req, res, next) {
    if (req.body.account && req.body.password) {
        req.app.get('manager').login(req.body.account, req.body.password, function(code, token) {
            if (req.body.remember) {
                // 7天内自动登录
                res.cookie('CubeAppToken', token, { maxAge: 7 * 24 * 3600 * 1000 });
            }
            res.json({ "code": code, "token" : token });
        });
    }
    else {
        let token = req.cookies['CubeAppToken'];
        if (token) {
            req.app.get('manager').loginByToken(token, function(code) {
                if (code == 7) {
                    res.cookie('CubeAppToken', token, { maxAge: 1000 });
                }

                res.json({ "code": code, "token" : token });
            });
        }
        else {
            res.sendStatus(400);
        }
    }
});


/* POST /logout */
router.post('/logout', function(req, res, next) {
    let token = req.body.token;
    req.app.get('manager').logout(token);
    res.json({ "code": 0, "token": token });
});


/* GET /get */
router.get('/get', function(req, res, next) {
    if (undefined === req.query.t) {
        res.sendStatus(400);
        return;
    }

    let account = req.app.get('manager').getOnlineAccountByToken(req.query.t);
    if (null == account) {
        res.sendStatus(404);
        return;
    }

    res.json(account);
});


/* GET /info */
router.get('/info', function(req, res, next) {
    if (req.query.id) {
        req.app.get('manager').getAccount(req.query.token, req.query.id, function(account) {
            if (null == account) {
                res.sendStatus(404);
            }
            else {
                res.json(account);
            }
        });
    }
    else if (req.query.list) {
        let array = req.query.list.split(',');
        let count = 0;
        let accounts = [];

        for (let i = 0; i < array.length; ++i) {
            let id = parseInt(array[i].trim());
            req.app.get('manager').getAccountById(id, function(account) {
                ++count;

                if (null != account) {
                    accounts.push(account);
                }

                if (count == array.length) {
                    res.json(accounts);
                }
            });
        }
    }
    else {
        res.sendStatus(400);
    }
});

/* POST /info  */
router.post('/info', function(req, res, next) {
    let newName = req.body.name;
    let newAvatar = req.body.avatar;

    let token = req.cookies['CubeAppToken'];
    if (token) {
        let account = req.app.get('manager').getOnlineAccountByToken(token);
        if (null == account) {
            res.sendStatus(400);
            return;
        }

        req.app.get('manager').modifyAccount(account.id, newName, newAvatar, function(account) {
            res.json(account);
        });
    }
    else {
        res.sendStatus(404);
    }
});


/* POST /hb */
router.post('/hb', function(req, res, next) {
    let token = req.body.token;
    if (req.app.get('manager').heartbeat(token)) {
        res.json({ "success": true });
    }
    else {
        res.json({ "success": false });
    }
});


/* GET /buildin */
router.get('/buildin', function(req, res, next) {
    let list = req.app.get('manager').getBuildInAccounts();
    res.json(list);
});

module.exports = router;
