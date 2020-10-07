// main.js

function CubeWebApp(account) {
    this.account = account;

    this.lastCatCell = null;

    this.initUI();
}

CubeWebApp.prototype.initUI = function() {
    var that = this;
    for (var i = 0; i < 4; ++i) {
        var id = 'ca_cell_' + i;
        $('#' + id).on('click', function(e) {
            that.onCatalogueCellClick($(this), e);
        });
    }
}

CubeWebApp.prototype.signin = function() {
    window.cube().signIn(this.account.id);
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
        }, function(data, textStatus, jqXHR) {
            clearTimeout(timer);
            window.location.href = '/';
        }, 'json');
    }
}

CubeWebApp.prototype.requestAccount = function(id, handler) {
    $.get('/account/info', {
        "id" : id
    }, function(data, textStatus, jqXHR) {
        handler(data, textStatus);
    }, 'json');
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

CubeWebApp.prototype.updateMainPanel = function(data) {
    var elMain = $('#main');
    if (elMain.hasClass('main')) {
        elMain.removeClass('main');
        elMain.addClass('main-active');
    } else if (!elMain.hasClass('main-active')) {
        elMain.addClass('main-active');
    }

    var elPanel = elMain.find('div.main-panel');
    elPanel.css('visibility', 'visible');

    elTitle = elMain.find('div.header-title');
    elTitle.text(data.name);
}

CubeWebApp.prototype.onCatalogueCellClick = function(el, e) {
    if (null != this.lastCatCell) {
        if (this.lastCatCell.attr('id') == el.attr('id')) {
            return;
        }

        this.lastCatCell.removeClass('cell-actvie');
    }

    el.addClass('cell-actvie');
    this.lastCatCell = el;

    var accountId = parseInt(el.attr('data'));
    var that = this;
    this.requestAccount(accountId, function(data, textStatus) {
        if (textStatus == 'success') {
            that.updateMainPanel(data);
        }
    });
}



$(document).ready(function() {
    // 初始化 App
    var app = new CubeWebApp(gAccount);
    window.app = app;

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
        console.log('Start Cube OK');
        // 将当前账号签入
        app.signin();
    }, function(error) {
        console.log('Start Cube failed: ' + error);
    });
});
