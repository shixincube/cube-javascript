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

    this.messageCatalogue = null;

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

    app.messageCatalogue = new MessageCatalogue(app);
    app.messageCatalogue.setClickListener(function(contact) {
        app.onCatalogClick(contact);
    });

    app.messagePanel = new MessagePanel($('#messages'));
    app.messagePanel.setOwner(app.account);
    app.messagePanel.setSendListener(function(to, content) {
        app.onSendClick(to, content);
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

    // 监听消息已发送事件
    cube.messaging.on(MessagingEvent.Sent, function(event) {
        console.log('触发 "Sent" 事件，消息 ID : ' + event.data.getId());
    });
}

/**
 * 当前账号退出登录。
 */
CubeApp.prototype.logout = function() {
    var that = this;
    ui.showConfirm('退出登录', '是否确认退出当前账号登录？', function(confirmed) {
        if (confirmed) {
            var timer = 0;
            var id = that.account.id;

            // 将 Cube 账号签出
            that.cube.contacts.signOut(function(self) {
                $.post('/account/logout', {
                    "id": id
                }, function(data, textStatus, jqXHR) {
                    clearTimeout(timer);

                    // 本示例程序将回到登录界面，因此停止引擎
                    that.cube.stop();

                    window.location.href = '/';
                }, 'json');
            });

            timer = setTimeout(function() {
                window.location.href = '/';
            }, 5000);
        }
    });
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

CubeApp.prototype.onCatalogClick = function(contact) {
    this.messagePanel.changeTarget(contact);
}

CubeApp.prototype.onSendClick = function(to, content) {
    // 调用消息模块的 sendToContact 发送消息
    var message = this.cube.messaging.sendToContact(to.id, { "content": content });
    if (null == message) {
        this.launchToast(CubeToast.Warning, '发送消息失败');
        return;
    }

    this.messageCatalogue.updateSubLabel(to.id, content, message.getTimestamp());
}

CubeApp.prototype.onContactsEvent = function(event) {
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
