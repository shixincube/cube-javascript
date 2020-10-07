var express = require('express');
var router = express.Router();

/* GET */
router.get('/info', function(req, res, next) {
    if (undefined === req.query.id) {
        res.sendStatus(400);
        return;
    }

    let id = parseInt(req.query.id);
    let mgr = req.app.get('manager');
    let account = mgr.getAccount(id);
    res.json(account);
});

/* POST /signin/form */
router.post('/signin/form', function(req, res, next) {
    let cookie = req.app.get('manager').signIn(parseInt(req.body.id), req.body.name);
    res.cookie('CubeAppToken', cookie, { maxAge: 604800000 });
    res.redirect('/');
});

/* POST /signout */
router.post('/signout', function(req, res, next) {
    let mgr = req.app.get('manager');
    let id = parseInt(req.body.id);
    if (id == mgr.currentAccount.id) {
        console.log('账号 ' + id + ' 退出登录');
        mgr.signOut();
        res.cookie('CubeAppToken', '', { maxAge: 1000 });
        res.json({ "id": id });
    }
    else {
        console.warn('登录 ID 不一致');
        res.sendStatus(404);
    }
});

module.exports = router;
