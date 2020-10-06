// main.js

function CubeWebApp(account) {
    this.account = account;
}

CubeWebApp.prototype.signout = function() {
    if (confirm('是否确认退出当前账号登录？')) {
        window.cube().stop();

        var id = this.account.id;

        var timer = setTimeout(function() {
            window.location.href = '/';
        }, 2000);

        $.post('/account/signout', {
                "id": id
            }, function(data, textStatus, textStatus) {
                clearTimeout(timer);
                window.location.href = '/';
            }, 'json');
    }
}

CubeWebApp.prototype.showState = function(state, text) {
    $('#extrasAlert').removeClass('alert-info');
    $('#extrasAlert').removeClass('alert-danger');
    if (state == 'warn' || state == 'warning') {
        $('#extrasAlert').addClass('alert-danger');
    }
    else {
        $('#extrasAlert').addClass('alert-info');
    }
    $('#extrasAlert').text(text);
}



$(document).ready(function() {
    // 初始化 App
    window.app = new CubeWebApp(gAccount);
    var app = window.app;

    var cube = window.cube();

    // 监听网络状态
    cube.on('network', function(event) {
        if (event.name == 'failed') {
            app.showState('warning', '网络错误: ' + event.error.code);
        }
        else if (event.name == 'open') {
            app.showState('info', '已连接到服务器');
        }
    });

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
