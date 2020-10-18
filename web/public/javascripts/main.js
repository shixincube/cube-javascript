// main.js

var CubeToast = {
    Success: 'success',
    Info: 'info',
    Error: 'error',
    Warning: 'warning',
    Question: 'question'
};

function CubeApp(cube, account, catalogues) {
    this.cube = cube;
    this.account = account;
    this.catalogues = catalogues;

    this.lastCatalogItem = null;

    this.messages = {};
    this.messagePanel = null;

    var that = this;
    setTimeout(function() {
        that.initUI(that);
        that.config(cube);
    }, 10);
}

CubeApp.prototype.initUI = function(app) {
    app.toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
    });

    var that = app;
    for (var i = 0; i < that.catalogues.length; ++i) {
        var id = 'catalog_item_' + i;
        var el = $('#' + id);
        el.on('click', function(e) {
            that.onCatalogItemClick($(this), e);
        });
    }

    that.messagePanel = new MessagePanel($('#messages'));
}

CubeApp.prototype.config = function(cube) {
    // 监听网络状态
    cube.on('network', function(event) {
        if (event.name == 'failed') {
            app.launchToast(CubeToast.Error, '网络错误: ' + event.error.code);
        }
        else if (event.name == 'open') {
            app.launchToast(CubeToast.Info, '已连接到服务器');
        }
    });

    // 设置事件监听
    cube.contacts.on(ContactEvent.SignIn, function(event) {
        app.launchToast(CubeToast.Info, '已登录：' + event.data.getId());
    });
}

CubeApp.prototype.logout = function() {
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

CubeApp.prototype.getAccount = function(id, handler) {
    $.get('/account/info', {
        "id" : id
    }, function(data, textStatus, jqXHR) {
        handler(data, textStatus);
    }, 'json');
}

CubeApp.prototype.launchToast = function(toast, text) {
    this.toast.fire({
        icon: toast,
        title: text
    });
}

CubeApp.prototype.onCatalogItemClick = function(el, e) {
    if (null != this.lastCatalogItem) {
        if (this.lastCatalogItem.attr('id') == el.attr('id')) {
            return;
        }

        this.lastCatalogItem.removeClass('catalog-active');
    }

    el.addClass('catalog-active');
    this.lastCatalogItem = el;

    var accountId = parseInt(el.attr('data'));
    var that = this;

    this.getAccount(accountId, function(data, textStatus) {
        if (textStatus == 'success') {
            that.updatePanel(data);
        }
    });
}

CubeApp.prototype.updatePanel = function(data) {
    this.messagePanel.setTitle(data.name);
}

/*
CubeApp.prototype.updateMainPanel = function(data) {
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

CubeApp.prototype.onContactEvent = function(event) {
    console.log('接收到事件：' + event.name);
}*/


$(document).ready(function() {
    // 实例化 Cube 引擎
    var cube = window.cube();

    // 创建 App 实例。
    var app = new CubeApp(cube, gAccount, gCatalogues);
    window.app = app;

    // 启动 Cube
    cube.start({
        address: '127.0.0.1',
        domain: 'shixincube.com',
        appKey: 'shixin-cubeteam-opensource-appkey'
    }, function() {

        console.log('Start Cube OK');

        // 启用消息模块
        cube.messaging.start();

        // 将当前账号签入
        //cube.signIn(app.account.id);
    }, function(error) {
        console.log('Start Cube failed: ' + error);
    });
});

