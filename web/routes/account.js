var express = require('express');
var router = express.Router();

/* GET */
router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});

/* POST signin/form */
router.post('/signin/form', function(req, res, next) {
    console.log(req.body.id);
});

module.exports = router;
