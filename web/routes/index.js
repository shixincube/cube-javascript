var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('main', {
        title: 'Cube - 时信魔方',
        bodyClass: 'hold-transition sidebar-mini layout-fixed layout-navbar-fixed layout-footer-fixed'
    });
});

module.exports = router;
