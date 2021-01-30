/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020-2021 Shixin Cube Team.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Web Application Main
 */
(function (g) {
    'use strict'

    var that = null;

    var token = null;

    var cube = null;

    var account = null;

    var contactAccounts = [];

    var cubeContacts = [];

    var tabId = 'messaging';
    var tabBtnId = 'tab_messaging';

    var sidebarAccountPanel = null;

    var messageCatalog = null;
    var messagePanel = null;

    var voiceCallPanel = null;
    var videoChatPanel = null;
    var contactDetails = null;
    var newGroupDialog = null;

    var fileDetails = null;

    var filesCatalog = null;
    var filesPanel = null;

    var messagingCtrl = null;
    var callCtrl = null;
    var filesCtrl = null;

    var queryContact = function(id) {
        for (var i = 0; i < cubeContacts.length; ++i) {
            var c = cubeContacts[i];
            if (c.getId() == id) {
                return c;
            }
        }
        return null;
    }

    var app = {
        /**
         * 启动程序并进行初始化。
         */
        launch: function() {
            token = g.getQueryString('t');
            console.log('cube token: ' + token);

            var tab = g.getQueryString('tab');
            if (null != tab) {
                setTimeout(function() {
                    g.app.toggle(tab, 'tab_' + tab);
                }, 100);
            }

            function heartbeat() {
                $.post('/account/hb', { "token": token }, function(response, status, xhr) {
                    var state = response.state;
                    if (state == 'offline') {
                        window.location.href = 'index.html?ts=' + Date.now();
                    }
                }, 'json');
            }

            $.ajax({
                type: 'GET',
                url: '/account/get',
                data: { "t": token },
                success: function(response, status, xhr) {
                    app.start(response);
                    heartbeat();
                },
                error: function(xhr, error) {
                    app.stop();
                }
            });

            // 启动心跳
            setInterval(function() {
                heartbeat();
            }, 3 * 60 * 1000);

            // tips
            $('[data-toggle="tooltip"]').tooltip();
        },

        /**
         * 切换主界面。
         * @param {string} id 
         * @param {string} btnId
         */
        toggle: function(id, btnId) {
            if (tabId == id) {
                return;
            }

            $('#' + tabId).addClass('content-wrapper-hidden');
            $('#' + id).removeClass('content-wrapper-hidden');
            tabId = id;

            $('#' + tabBtnId).removeClass('active');
            $('#' + btnId).addClass('active');
            tabBtnId = btnId;
        },

        /**
         * 启动。
         * @param {*} current 
         */
        start: function(current) {
            account = current;
            that.account = account;
            console.log('account: ' + account.id + ' - ' + account.state);

            // 启动 Cube Engine
            this.startupCube();

            sidebarAccountPanel = new SidebarAccountPanel($('.account-panel'));

            // 消息主面板
            var messagingEl = $('#messaging');
            // 消息目录
            messageCatalog = new MessageCatalogue(messagingEl.find('ul[data-target="catalogue"]'));
            // 消息面板
            messagePanel = new MessagePanel(messagingEl.find('#messages'));

            voiceCallPanel = new VoiceCallPanel($('#voice_call'));
            videoChatPanel = new VideoChatPanel($('#video_chat'));
            contactDetails = new ContactDetails();
            newGroupDialog = new NewGroupDialog($('#new_group_dialog'));

            fileDetails = new FileDetails($('#modal_file_details'));

            // 文件
            var filesEl = $('#files');
            // 文件目录
            filesCatalog = new FilesCatalogue(filesEl.find('.file-catalog'), filesEl.find('.file-trans-list'));
            // 文件面板
            filesPanel = new FilesPanel(filesEl.find('.files-panel'));

            messagingCtrl = new MessagingController(cube);
            callCtrl = new CallController(cube);
            filesCtrl = new FilesController(cube);

            this.prepare();

            that.messageCatalog = messageCatalog;
            that.messagePanel = messagePanel;

            that.voiceCallPanel = voiceCallPanel;
            that.videoChatPanel = videoChatPanel;
            that.contactDetails = contactDetails;
            that.newGroupDialog = newGroupDialog;

            that.fileDetails = fileDetails;

            that.filesCatalog = filesCatalog;
            that.filesPanel = filesPanel;

            that.messagingCtrl = messagingCtrl;
            that.callCtrl = callCtrl;
            that.filesCtrl = filesCtrl;
        },

        /**
         * 停止。
         */
        stop: function() {
            window.location.href = 'index.html?ts=' + Date.now();
        },

        /**
         * 登出并返回登录界面。
         */
        logout: function() {
            dialog.showConfirm('退出登录', '是否确认退出当前账号登录？', function(confirmed) {
                if (confirmed) {
                    dialog.showLoading('账号正在登出，请稍后', 5000);

                    var timer = 0;

                    var logout = function() {
                        $.post('/account/logout', { "id": account.id, "token": token }, function(response, status, xhr) {
                            clearTimeout(timer);

                            // 回到登录界面，停止引擎
                            cube.stop();

                            window.location.href = 'index.html?ts=' + Date.now();
                        }, 'json');
                    };

                    // 将 Cube 账号签出
                    cube.contact.signOut(function(self) {
                        logout();
                    });

                    timer = setTimeout(function() {
                        logout();
                    }, 4000);
                }
            });
        },

        /**
         * 获取自己的账号实例。
         * @returns {Contact} 返回自己的账号实例。
         */
        getSelf: function() {
            return cube.contact.getSelf();
        },

        /**
         * 获取联系人。
         * @param {*} id 
         * @param {*} callback 
         */
        getContact: function(id, callback) {
            cube.contact.getContact(id, function(contact) {
                let ctx = contact.getContext();
                if (null == ctx) {
                    var localContact = queryContact(contact.getId());
                    if (null != localContact) {
                        contact = localContact;
                    }
                }

                callback(contact);
            }, function(id) {
                callback(null);
            });
        },

        /**
         * 获取群组。
         * @param {*} id 
         * @param {*} callback 
         */
        getGroup: function(id, callback) {
            cube.contact.getGroup(id, function(group) {
                callback(group);
            }, function(id) {
                callback(null);
            });
        },

        /**
         * @returns {Array} 返回我的联系人列表。
         */
        getMyContacts: function() {
            var list = [];
            for (var i = 0; i < cubeContacts.length; ++i) {
                var c = cubeContacts[i];
                if (c.getId() == account.id) {
                    continue;
                }

                list.push(c);
            }
            return list;
        },

        /**
         * 启动 Cube Engine 。
         */
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

            // 注册消息插件
            cube.messaging.register(new MessageTypePlugin());

            // 启动 Cube
            cube.start({
                address: '127.0.0.1',
                domain: 'shixincube.com',
                appKey: 'shixin-cubeteam-opensource-appkey'
            }, function() {
                console.log('Start Cube OK');

                // 启用消息模块
                cube.messaging.start();
                // 启动存储模块
                cube.fs.start();
                // 启用音视频模块
                cube.mpComm.start();

                that.onReady();
            }, function(error) {
                console.log('Start Cube FAILED: ' + error);
            });

            // 将当前账号签入，将 App 的账号信息设置为 Cube Contact 的上下文
            // 在执行 cube#start() 之后可直接签入，不需要等待 Cube 就绪
            cube.signIn(account.id, account.name, account);
        },

        onReady: function() {
            console.log('Cube WebApp Ready');

            filesCatalog.prepare();
        },

        /**
         * 进行数据加载和界面信息更新。
         */
        prepare: function() {
            sidebarAccountPanel.updateAvatar(account.avatar);
            sidebarAccountPanel.updateName(account.name);

            // 获取所有联系人
            $.get('/account/all', function(response, status, xhr) {
                var list = response;
                list.forEach(function(item) {
                    if (item.id != account.id) {
                        contactAccounts.push(item);

                        // 联系人
                        var contact = new Contact(item.id, item.name);
                        // 将 App 的账号数据设置为 Cube 联系人的上下文
                        contact.setContext(item);
                        cubeContacts.push(contact);

                        messageCatalog.appendItem(item);
                    }
                });

                // 添加自己
                cubeContacts.push(cube.contact.getSelf());

                // 消息控制器准备数据
                messagingCtrl.updateContactMessages(cubeContacts);

                // 加载群组信息
                that.prepareGroups();

                // 隐藏进度提示
                setTimeout(function() {
                    dialog.hideLoading();
                }, 500);
            });
        },

        /**
         * 准备群组数据。
         */
        prepareGroups: function() {
            cube.contact.queryGroups(function(groups) {
                for (var i = 0; i < groups.length; ++i) {
                    var group = groups[i];
                    that.addGroup(group);
                }
            });
        },

        addGroup: function(group) {

        },

        removeGroup: function(group) {

        }
    };

    app.queryContact = queryContact;

    that = app;
    g.app = app;

})(window);
