var express = require('express');
var router = express.Router();

/* GET */
router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});

/* POST signin/form */
router.post('/signin/form', function(req, res, next) {
    let cookie = req.app.get('manager').signIn(parseInt(req.body.id), req.body.name);
    res.cookie('CubeAppToken', cookie, { maxAge: 604800000 });
    res.redirect('/');
});

module.exports = router;
