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



/* GET /all */
// router.get('/all', function(req, res, next) {
//     let mgr = req.app.get('manager');
//     let list = mgr.getAccounts();
//     res.json(list);
// });

/* GET /get */
// router.get('/get', function(req, res, next) {
//     if (undefined === req.query.t) {
//         res.sendStatus(400);
//         return;
//     }

//     let mgr = req.app.get('manager');
//     let account = mgr.getAccountByToken(req.query.t);
//     if (null == account) {
//         res.sendStatus(404);
//         return;
//     }

//     res.json(account);
// });

/* GET /info */
// router.get('/info', function(req, res, next) {
//     if (undefined !== req.query.id) {
//         let id = parseInt(req.query.id);
//         let mgr = req.app.get('manager');
//         let account = mgr.getAccount(id);
//         res.json(account);
//     }
//     else {
//         res.sendStatus(400);
//     }
// });

/* POST /login/form */
// router.post('/login/form', function(req, res, next) {
//     let cookie = req.app.get('manager').login(parseInt(req.body.id), req.body.name);
//     res.cookie('CubeAppToken', cookie, { maxAge: 60480000 });
//     res.redirect('/');
// });

/* POST /logout */
/*
router.post('/logout', function(req, res, next) {
    let mgr = req.app.get('manager');
    let id = parseInt(req.body.id);
    let token = req.body.token;

    let cookie = req.cookies['CubeAppToken'];
    if (cookie && undefined === token) {
        let aid = parseInt(cookie.split(',')[0]);

        if (id == aid) {
            console.log('账号 ' + id + ' 退出登录');
            mgr.logout(id);
    
            // 设置 Cookie
            res.cookie('CubeAppToken', '', { maxAge: 1000 });
            res.json({ "id": id });
        }
        else {
            console.warn('登录 ID 不一致');
            res.sendStatus(404);
        }
    }
    else {
        console.log('账号 ' + id + ' 退出登录');
        mgr.logout(id);

        let token = req.body.token;
        res.json({ "id": id, "token": token });
    }
});*/

/* POST /hb */
// router.post('/hb', function(req, res, next) {
//     let mgr = req.app.get('manager');

//     let id = req.body.id;
//     if (undefined !== id) {
//         let cookie = req.cookies['CubeAppToken'];
//         if (mgr.heartbeat(parseInt(id), cookie)) {
//             res.json({ "id": id, "state": "online" });
//         }
//         else {
//             res.json({ "id": id, "state": "offline" });
//         }
//     }
//     else {
//         let token = req.body.token;
//         if (mgr.heartbeat(token)) {
//             res.json({ "token": token, "state": "online" });
//         }
//         else {
//             res.json({ "token": token, "state": "offline" });
//         }
//     }
// });

module.exports = router;
