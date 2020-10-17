var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    let cookie = req.cookies['CubeAppToken'];
    if (cookie && cookie.length > 4) {
        // 解析 ID
        let aid = parseInt(cookie.split(',')[0]);
        // 获取账号
        let account = req.app.get('manager').getAccount(aid);
        // 执行登录
        req.app.get('manager').signIn(account.id, account.name);

        // 获取目录信息
        let catalogues = req.app.get('manager').getMessageCatalogue(aid);
        res.render('main', {
            title: 'Cube - 时信魔方',
            bodyClass: 'hold-transition sidebar-mini layout-fixed layout-navbar-fixed layout-footer-fixed',
            account: account,
            catalogues: catalogues
        });
    }
    else {
        let manager = req.app.get('manager');
        let offlineAccounts = manager.getSignOutAccounts();
        res.render('login', {
            title: '登录 - Cube Web Application',
            bodyClass: 'hold-transition login-page',
            accounts: offlineAccounts
        });
    }
});

module.exports = router;
