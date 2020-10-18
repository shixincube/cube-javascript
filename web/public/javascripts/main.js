// main.js

var CubeToast = {
    Success: 'success',
    Info: 'info',
    Error: 'error',
    Warning: 'warning',
    Question: 'question'
};

function CubeApp(cube, account, contacts, catalogues) {
    this.cube = cube;           // Cube 实例
    this.account = account;     // 当前账号
    this.contacts = contacts;       // 联系人列表
    this.catalogues = catalogues;   // 界面目录数据

    this.lastCatalogItem = null;

    this.messages = {};         // 保存账号对应的目录里各联系的消息
    this.messagePanel = null;   // 消息面板

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
    that.messagePanel.setOwner(app.account);
    that.messagePanel.setSendListener(function(to, content) {
        that.onSendClick(to, content);
    });
}

/**
 * 对 App 进行配置，监听 Cube 的事件。
 * @param {CubeEngine} cube 
 */
CubeApp.prototype.config = function(cube) {
    // 监听网络状态
    cube.on('network', function(event) {
        if (event.name == 'failed') {
            app.launchToast(CubeToast.Error, '网络错误：' + event.error.code);
        }
        else if (event.name == 'open') {
            app.launchToast(CubeToast.Info, '已连接到服务器');
        }
    });

    // 设置事件监听
    cube.contacts.on(ContactEvent.SignIn, function(event) {
        app.launchToast(CubeToast.Info, '已签入ID ：' + event.data.getId());
    });
}

/**
 * 当前账号退出登录。
 */
CubeApp.prototype.logout = function() {
    if (confirm('是否确认退出当前账号登录？')) {
        window.cube().stop();

        var id = this.account.id;

        var timer = setTimeout(function() {
            window.location.href = '/';
        }, 2000);

        $.post('/account/logout', {
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

/**
 * 显示一个 Toast 提示。
 * @param {CubeToast} toast 
 * @param {string} text 
 */
CubeApp.prototype.launchToast = function(toast, text) {
    this.toast.fire({
        icon: toast,
        title: text
    });
}

CubeApp.prototype.updatePanel = function(data) {
    this.messagePanel.changeTarget(data);
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

CubeApp.prototype.onSendClick = function(to, content) {
    var message = this.cube.messaging.sendToContact(to.id, { "content": content });
    if (null == message) {
        this.launchToast(CubeToast.Warning, '发送消息失败');
        return;
    }

    
}

CubeApp.prototype.onContactEvent = function(event) {
    console.log('接收到事件：' + event.name);
}


$(document).ready(function() {
    // 实例化 Cube 引擎
    var cube = window.cube();

    // 创建 App 实例。
    var app = new CubeApp(cube, gAccount, gContacts, gCatalogues);
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
        cube.signIn(app.account.id);
    }, function(error) {
        console.log('Start Cube failed: ' + error);
    });
});
