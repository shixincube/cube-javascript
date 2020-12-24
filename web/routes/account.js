var express = require('express');
var router = express.Router();

/* GET /all */
router.get('/all', function(req, res, next) {
    let mgr = req.app.get('manager');
    let list = mgr.getAccounts();
    res.json(list);
});

/* GET /get */
router.get('/get', function(req, res, next) {
    if (undefined === req.query.t) {
        res.sendStatus(400);
        return;
    }

    let mgr = req.app.get('manager');
    let account = mgr.getAccountByToken(req.query.t);
    if (null == account) {
        res.sendStatus(404);
        return;
    }

    res.json(account);
});

/* GET /info */
router.get('/info', function(req, res, next) {
    if (undefined !== req.query.id) {
        let id = parseInt(req.query.id);
        let mgr = req.app.get('manager');
        let account = mgr.getAccount(id);
        res.json(account);
    }
    else {
        res.sendStatus(400);
    }
});

/* POST /login */
router.post('/login', function(req, res, next) {
    let token = req.app.get('manager').login(parseInt(req.body.id), req.body.name);
    res.json({ "token" : token });
});

/* POST /login/form */
router.post('/login/form', function(req, res, next) {
    let cookie = req.app.get('manager').login(parseInt(req.body.id), req.body.name);
    res.cookie('CubeAppToken', cookie, { maxAge: 60480000 });
    res.redirect('/');
});

/* POST /logout */
router.post('/logout', function(req, res, next) {
    let mgr = req.app.get('manager');
    let id = parseInt(req.body.id);

    let cookie = req.cookies['CubeAppToken'];
    if (cookie) {
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
});

/* POST /hb */
router.post('/hb', function(req, res, next) {
    let mgr = req.app.get('manager');
    let id = parseInt(req.body.id);

    let online = mgr.heartbeat(id);

    res.json({ "id": id, "state": online });
});

module.exports = router;
