var express = require('express');
var router = express.Router();

/* GET */
router.get('/', function(req, res, next) {
    res.send('respond with a resource');
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
        res.sendStatus(200);
    }
    else {
        console.warn('登录 ID 不一致');
        res.sendStatus(404);
    }
});

module.exports = router;
