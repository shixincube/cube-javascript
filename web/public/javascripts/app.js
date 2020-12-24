// app.js

(function (g) {
    'use strict'

    var app = {
        launch: function() {
            var token = g.getQueryString('t');
            console.log('cube token: ' + token);
        }
    };

    g.app = app;

})(window);
