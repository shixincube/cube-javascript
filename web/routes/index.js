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
