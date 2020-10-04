// main.js

$(document).ready(function() {
    var cube = window.cube();

    // 启动 Cube
    cube.start({
        address: '127.0.0.1',
        domain: 'shixincube.com',
        appKey: 'shixin-cubeteam-opensource-appkey'
    }, function() {
        console.log('Start cube OK');
    }, function(error) {
        console.log('Start cube failed: ' + error);
    });
});
