var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    let cookie = req.cookies['CubeAppToken'];
    if (cookie) {
        let aid = parseInt(cookie.split(',')[0]);
        let account = req.app.get('manager').getAccount(aid);
        let catalogues = req.app.get('manager').getMessageCatalogue(aid);
        res.render('index', {
            title: 'Cube - 时信魔方',
            account: account,
            catalogues: catalogues
        });
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
