// app.js

(function (g) {
    'use strict'

    var token = null;

    var cube = null;

    var account = null;

    var contactAccounts = [];

    var sidebarAccountPanel = null;

    var messageCatalog = null;

    var app = {
        /**
         * 进行程序初始化。
         */
        launch: function() {
            token = g.getQueryString('t');
            console.log('cube token: ' + token);

            $.ajax({
                type: 'GET',
                url: '/account/get',
                data: { "t": token },
                success: function(response, status, xhr) {
                    app.start(response);
                },
                error: function(xhr, error) {
                    app.stop();
                }
            });
        },

        start: function(current) {
            account = current;
            console.log('account: ' + account.id + ' - ' + account.state);

            this.startupCube();

            sidebarAccountPanel = new SidebarAccountPanel($('.account-panel'));

            var messagingEl = $('#messaging');
            messageCatalog = new MessageCatalogue(messagingEl.find('ul[data-target="catalogue"]'));

            this._refreshView();
        },

        stop: function() {
            window.location.href = 'cube.html?ts=' + Date.now();
        },

        logout: function() {
            $.post('/account/logout', { "id": account.id, "token": token}, function(response, status, xhr) {
                window.location.href = 'cube.html?ts=' + Date.now();
            });
        },

        getContact: function(id, callback) {

        },

        startupCube: function() {
            // 实例化 Cube 引擎
            cube = window.cube();

            // 监听网络状态
            cube.on('network', function(event) {
                if (event.name == 'failed') {
                    dialog.launchToast(Toast.Error, '网络错误：' + event.error.code);
                }
                else if (event.name == 'open') {
                    dialog.launchToast(Toast.Info, '已连接到服务器');
                }
            });

            // 启动 Cube
            cube.start({
                address: '127.0.0.1',
                domain: 'shixincube.com',
                appKey: 'shixin-cubeteam-opensource-appkey'
            }, function() {
                console.log('Start Cube OK');

                // 启用消息模块
                cube.messaging.start();
            }, function(error) {
                console.log('Start Cube FAILED: ' + error);
            });

            // 将当前账号签入，将 App 的账号信息设置为 Cube Contact 的上下文
            // 在执行 cube#start() 之后可直接签入，不需要等待 Cube 就绪
            cube.signIn(account.id, account.name, account);
        },

        _refreshView: function() {
            sidebarAccountPanel.updateAvatar(account.avatar);
            sidebarAccountPanel.updateName(account.name);

            // 获取所有联系人
            $.get('/account/all', function(response, status, xhr) {
                var list = response;
                list.forEach(function(item) {
                    if (item.id != account.id) {
                        contactAccounts.push(item);

                        messageCatalog.appendItem(item);
                    }
                });

                // 隐藏进度提示
                dialog.hideLoading();
            });
        }
    };

    g.app = app;

})(window);
