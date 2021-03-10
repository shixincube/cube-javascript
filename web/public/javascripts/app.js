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
    'use strict';

    var that = null;

    var token = null;

    var cube = null;

    var account = null;

    var cubeContacts = [];

    var cubeGroups = [];

    var tabId = 'messaging';
    var tabBtnId = 'tab_messaging';

    var sidebarAccountPanel = null;

    var messageCatalog = null;
    var messagePanel = null;
    var messageSidebar = null;

    var voiceCallPanel = null;
    var videoChatPanel = null;
    var contactDetails = null;
    var groupDetails = null;
    var newGroupDialog = null;
    var contactListDialog = null;

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

    var updateContact = function(contact) {
        for (var i = 0; i < cubeContacts.length; ++i) {
            var c = cubeContacts[i];
            if (c.getId() == contact.getId()) {
                cubeContacts.splice(i, 1);
                break;
            }
        }
        cubeContacts.push(contact);
    }

    var queryGroup = function(id) {
        for (var i = 0; i < cubeGroups.length; ++i) {
            var g = cubeGroups[i];
            if (g.getId() == id) {
                return g;
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
            if (null == token) {
                token = g.readCookie('CubeAppToken');
            }
            console.log('cube token: ' + token);

            var tab = g.getQueryString('tab');
            if (null != tab) {
                setTimeout(function() {
                    g.app.toggle(tab, 'tab_' + tab);
                }, 100);
            }

            function heartbeat() {
                $.post('/account/hb', { "token": token }, function(response, status, xhr) {
                    var success = response.success;
                    if (!success) {
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

            if (id == 'messaging') {
                $('.main-title').text('消息');
            }
            else if (id == 'files') {
                $('.main-title').text('文件');
            }
            else if (id == 'conference') {
                $('.main-title').text('会议');
            }
            else if (id == 'contacts') {
                $('.main-title').text('联系人');
            }
        },

        /**
         * 启动。
         * @param {object} current 
         */
        start: function(current) {
            account = current;
            that.account = account;
            console.log('Account: ' + account.id + ' - ' + account.account);

            // 启动 Cube Engine
            this.startupCube();

            // 侧边账号栏
            sidebarAccountPanel = new SidebarAccountPanel($('.account-panel'));
            sidebarAccountPanel.updateAvatar(account.avatar);
            sidebarAccountPanel.updateName(account.name);

            // 消息主面板
            var messagingEl = $('#messaging');
            // 消息目录
            messageCatalog = new MessageCatalogue(messagingEl.find('ul[data-target="catalogue"]'));
            // 消息面板
            messagePanel = new MessagePanel(messagingEl.find('.messaging-content'));
            // 消息侧边栏
            messageSidebar = new MessageSidebar(messagingEl.find('.messaging-sidebar'));

            voiceCallPanel = new VoiceCallPanel($('#voice_call'));
            videoChatPanel = new VideoChatPanel($('#video_chat'));
            contactDetails = new ContactDetails($('#modal_contact_details'));
            groupDetails = new GroupDetails($('#modal_group_details'));
            newGroupDialog = new NewGroupDialog($('#new_group_dialog'));
            contactListDialog = new ContactListDialog($('#contact_list_dialog'));

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

            that.messageCatalog = messageCatalog;
            that.messagePanel = messagePanel;
            that.messageSidebar = messageSidebar;

            that.voiceCallPanel = voiceCallPanel;
            that.videoChatPanel = videoChatPanel;
            that.contactDetails = contactDetails;
            that.groupDetails = groupDetails;
            that.newGroupDialog = newGroupDialog;
            that.contactListDialog = contactListDialog;

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

                var timer = setInterval(function() {
                    if (cube.isReady()) {
                        clearInterval(timer);
                        that.onReady();
                    }
                }, 100);
            }, function(error) {
                console.log('Start Cube FAILED: ' + error);
            });

            // 将当前账号签入，将 App 的账号信息设置为 Cube Contact 的上下文
            // 在执行 cube#start() 之后可直接签入，不需要等待 Cube 就绪
            cube.signIn(account.id, account.name, account);
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
         * @param {number} id 
         * @param {function} callback 
         */
        getContact: function(id, callback) {
            cube.contact.getContact(parseInt(id), function(contact) {
                var localContact = queryContact(contact.getId());
                if (null != localContact) {
                    contact.setContext(localContact.getContext());
                    callback(contact);
                }
                else {
                    $.ajax({
                        type: 'GET',
                        url: '/account/info',
                        data: { "id": id },
                        success: function(response, status, xhr) {
                            if (null == response) {
                                callback(null);
                                return;
                            }

                            contact.setContext(response);
                            contact.setName(response.name);
                            updateContact(contact);
                            callback(contact);
                        },
                        error: function(xhr, error) {
                            console.log(error + ' - ' + id);
                            callback(null);
                        }
                    });
                }
            }, function(error) {
                console.log('CubeApp #getContact ' + error + ' - ' + id);
                callback(null);
            });
        },

        /**
         * 获取群组。
         * @param {number} id 
         * @param {function} callback 
         */
        getGroup: function(id, callback) {
            cube.contact.getGroup(id, function(group) {
                callback(group);
            }, function(error) {
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

        onReady: function() {
            that.prepare();

            filesCatalog.prepare();

            console.log('Cube WebApp Ready');
        },

        /**
         * 进行数据加载和界面信息更新。
         */
        prepare: function() {
            var itemMap = {
                count: 0
            };

            // 从 Cube 里获取指定的联系人分组
            cube.contact.getContactZone('friend', function() {
                
            });

            // TODO 不再获取全部联系人
            /*
            // 获取所有联系人
            $.get('/account/all', function(response, status, xhr) {
                var list = response;
                list.forEach(function(item) {
                    if (item.id != account.id) {
                        itemMap[item.id] = item;

                        that.getContact(item.id, function(contact) {
                            // 将 App 的账号数据设置为 Cube 联系人的上下文
                            var account = itemMap[contact.getId()];
                            contact.setContext(account);
                            contact.setName(account.name);
                            messageCatalog.appendItem(contact);
                            itemMap.count += 1;
                        });
                    }
                });

                var promise = new Promise(function(resolve, reject) {
                    var timer = setInterval(function() {
                        if (itemMap.count + 1 == list.length) {
                            clearInterval(timer);
                            resolve();
                        }
                    }, 500);
                });

                promise.then(function() {
                    // 处理完成时的事件
                    var count = cubeContacts.length;
                    var completedCallback = function() {
                        --count;
                        if (count == 0) {
                            // 目录排序
                            setTimeout(function() {
                                messageCatalog.refreshOrder();
                            }, 500);
                        }
                    }

                    // 消息控制器更新联系人消息
                    for (var i = 0; i < cubeContacts.length; ++i) {
                        messagingCtrl.updateContactMessages(cubeContacts[i], completedCallback);
                    }

                    // 添加自己
                    cubeContacts.push(cube.contact.getSelf());

                    // 加载群组信息
                    that.prepareGroups();

                    // 隐藏进度提示
                    dialog.hideLoading();
                }).catch(function() {
                    // 隐藏进度提示
                    setTimeout(function() {
                        dialog.hideLoading();
                    }, 500);
                });
            });*/
        },

        /**
         * 准备群组数据。
         */
        prepareGroups: function() {
            cube.contact.queryGroups(function(groups) {
                var count = groups.length;
                var completedCallback = function() {
                    --count;
                    if (count == 0) {
                        // 目录排序
                        messageCatalog.refreshOrder();
                    }
                }

                for (var i = 0; i < groups.length; ++i) {
                    var group = groups[i];
                    cubeGroups.push(group);

                    // 添加群组
                    messageCatalog.appendItem(group);

                    // 消息控制器更新群组消息
                    messagingCtrl.updateGroupMessages(group, completedCallback);
                }
            });
        }
    };

    app.queryContact = queryContact;
    app.queryGroup = queryGroup;

    that = app;
    g.app = app;

})(window);
