var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    let cookie = req.cookies['AppToken'];
    if (cookie) {
        res.render('index', { title: 'Cube - 时信魔方' });
    }
    else {
        let manager = req.app.get('manager');
        let offlineAccounts = manager.getSignOutAccounts();
        res.render('signin', {
            title: '登录 - Cube Web Application',
            accounts: offlineAccounts
        });
    }
});

module.exports = router;
