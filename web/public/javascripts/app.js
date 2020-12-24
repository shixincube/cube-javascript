// app.js

(function (g) {
    'use strict'

    var account = null;

    var contactAccounts = [];

    var sidebarAccountPanel = null;

    var messageCatalog = null;

    var app = {
        launch: function() {
            var token = g.getQueryString('t');
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
            console.log('account: ' + account.id);

            sidebarAccountPanel = new SidebarAccountPanel($('.account-panel'));

            var messagingEl = $('#messaging');
            messageCatalog = new MessageCatalogue(messagingEl.find('ul[data-target="catalogue"]'));

            this._refreshView();
        },

        stop: function() {
            window.location.href = 'cube.html?ts=' + Date.now();
        },

        logout: function() {

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
