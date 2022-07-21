/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020-2022 Cube Team.
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

"use strict";

/**
 * Web Application Main
 */
(function (g) {

    var that = null;

    var token = null;

    var cube = null;

    var account = null;

    var cubeContacts = [];

    // var cubeGroups = [];

    var sidebarAccountPanel = null;

    var messageCatalog = null;
    var messagePanel = null;
    var messageSidebar = null;

    var contactDetails = null;
    var groupDetails = null;
    var newGroupDialog = null;

    var fileDetails = null;
    var visitTraceDialog = null;

    var fileCatalog = null;
    var filePanel = null;
    var fileSharingPanel = null;

    var messagingCtrl = null;
    var callCtrl = null;
    var fileCtrl = null;
    var confCtrl = null;
    var contactsCtrl = null;

    /**
     * 从内存里查询对应的联系人
     * @param {number} id 
     * @returns 
     */
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

    var onKeyUpFunList = [];

    function onKeyUp(event) {
        var e = event || window.event;
        for (var i = 0; i < onKeyUpFunList.length; ++i) {
            onKeyUpFunList[i](e);
        }
    }

    // 定时心跳
    function heartbeat() {
        $.post(server.url + '/account/hb/', { "token": token }, function(response, status, xhr) {
            var success = response.success;
            if (!success) {
                window.location.href = '/';
            }
        }, 'json');
    }

    /**
     * 应用程序入口。
     */
    var app = {
        /**
         * 启动程序并进行初始化。
         */
        launch: function() {
            token = g.getQueryString('t');
            if (null == token) {
                token = g.readCookie('CubeAppToken');
            }

            if (null == token) {
                alert('无法获取到登录信息，将返回首页。');
                window.location.href = '/';
                return;
            }

            // 全局赋值
            g.token = token;

            //console.log('Cube App Token: ' + token);

            var tab = g.getQueryString('tab');
            if (null != tab) {
                setTimeout(function() {
                    g.app.toggle(tab);
                }, 100);
            }

            $.ajax({
                type: 'GET',
                url: server.url + '/account/info/',
                data: { "token": token },
                dataType: 'json',
                success: function(response, status, xhr) {
                    // 头像直接使用 PNG 图片
                    if (!response.avatar.startsWith('http')) {
                        response.avatar += '.png';
                    }

                    // 修改标题
                    document.title = response.name + ' - 时信魔方';
                    // 启动
                    app.start(response);
                    heartbeat();
                },
                error: function(xhr, error) {
                    //app.stop();
                }
            });

            // 启动心跳
            setInterval(function() {
                heartbeat();
            }, 3 * 60 * 1000);

            // tips
            $('[data-toggle="tooltip"]').tooltip();

            // 事件中心
            that.eventCenter = new AppEventCenter();
        },

        /**
         * 启动。
         * @param {object} current 
         */
        start: function(current) {
            account = current;
            that.account = account;
            // console.log('Account: ' + account.id + ' - ' + account.account);

            // 从服务器获取配置
            $.get(server.url + '/cube/config/', {
                "t": token
            }, function(response, status, xhr) {
                // 启动 Cube Engine
                app.startupCube(response);

                // 准备 UI 数据
                app.prepareUI();
            }, 'json');
        },

        /**
         * 停止。
         */
        stop: function() {
            window.location.href = '/?c=logout';
        },

        /**
         * 启动 Cube Engine 。
         */
        startupCube: function(config) {
            // 实例化 Cube 引擎
            cube = window.cube();

            // 监听事件
            that.eventCenter.start(cube);

            // 注册消息插件
            cube.messaging.register(new MessageTypePlugin());

            // 设置联系人上下文提供器
            cube.contact.setContextProviderCallback(function(contact, provider) {
                app.needContactContext(contact, provider);
            });

            // 启动 Cube
            cube.start(undefined === config ? {
                address: server.address,
                domain: 'shixincube.com',
                appKey: 'shixin-cubeteam-opensource-appkey'
            } : config, function() {
                console.log('Start Cube OK');

                // 启用消息模块
                cube.messaging.start();
                // 启动存储模块
                cube.fs.start();
                // 启用音视频模块
                cube.mpComm.start();
                // 启用会议模块
                cube.cs.start();

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
                        $.post(server.url + '/account/logout/', {
                            "token": token,
                            "device": 'Web/' + navigator.userAgent
                        }, function(response, status, xhr) {
                            clearTimeout(timer);

                            // 回到登录界面，停止引擎
                            cube.stop();

                            // 修改 Cookie 数据
                            var date = new Date();
                            document.cookie = 'CubeAppToken=?; expires=' + date.toUTCString() + '; SameSite=None; Secure';
                            document.cookie = 'CubeTrace=?; expires=' + date.toUTCString() + '; SameSite=None; Secure';

                            window.location.href = '/?c=logout';
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
         * 初始化 UI 。
         */
        prepareUI: function() {
            // 全局 Key Up 事件
            $(document).keyup(onKeyUp);

            // 主面板
            that.mainPanel = new MainPanel();
            that.mainPanel.prepare();

            // 侧边账号栏
            sidebarAccountPanel = new SidebarAccountPanel($('.account-panel'));
            sidebarAccountPanel.updateAvatar(account.avatar);
            sidebarAccountPanel.updateName(account.name);
            sidebarAccountPanel.showDetail = function() {
                contactDetails.show(cube.contact.getSelf());
            };

            // 消息主面板
            var messagingEl = $('#messaging');
            // 消息目录
            messageCatalog = new MessageCatalogue(messagingEl);
            // 消息面板
            messagePanel = new MessagePanel(messagingEl.find('.messaging-content'));
            // 消息侧边栏
            messageSidebar = new MessageSidebar(messagingEl.find('.messaging-sidebar'));

            contactDetails = new ContactDetails($('#modal_contact_details'));
            groupDetails = new GroupDetails($('#modal_group_details'));
            newGroupDialog = new NewGroupDialog($('#new_group_dialog'));

            fileDetails = new FileDetails($('#modal_file_details'));
            visitTraceDialog = new VisitTraceListDialog($('#modal_visit_trace_list'));

            // 文件
            var filesEl = $('#files');
            // 文件目录
            fileCatalog = new FileCatalogue(filesEl.find('.file-catalog'),
                                                filesEl.find('.file-trans'),
                                                filesEl.find('.file-sharing'));
            // 文件面板
            filePanel = new FilePanel(filesEl.find('.files-panel'));
            // 文件分享面板
            fileSharingPanel = new FileSharingPanel(filesEl.find('.files-sharing-panel'));

            // 消息控制器
            messagingCtrl = new MessagingController(cube);
            // 通话控制器
            callCtrl = new CallController(cube);
            // 文件控制器
            fileCtrl = new FileController(cube);
            // 会议控制器
            confCtrl = new ConferenceController(cube);
            // 联系人控制器
            contactsCtrl = new ContactsController(cube);

            that.sidebarAccountPanel = sidebarAccountPanel;

            that.messageCatalog = messageCatalog;
            that.messagePanel = messagePanel;
            that.messageSidebar = messageSidebar;

            that.voiceCallPanel = new VoiceCallPanel();
            that.videoChatPanel = new VideoChatPanel();
            that.voiceGroupCallPanel = new VoiceGroupCallPanel();
            that.videoGroupChatPanel = new VideoGroupChatPanel();

            that.contactDetails = contactDetails;
            that.groupDetails = groupDetails;
            that.newGroupDialog = newGroupDialog;
            that.contactListDialog = new ContactListDialog();

            that.fileDetails = fileDetails;
            that.visitTraceDialog = visitTraceDialog;

            that.fileCatalog = fileCatalog;
            that.filePanel = filePanel;
            that.fileSharingPanel = fileSharingPanel;

            that.messagingCtrl = messagingCtrl;
            that.callCtrl = callCtrl;
            that.fileCtrl = fileCtrl;
            that.confCtrl = confCtrl;
            that.contactsCtrl = contactsCtrl;

            // 选择联系人对话框
            that.selectContactsDialog = new SelectContactsDialog(cube);

            // 搜索对话框
            that.searchDialog = new SearchDialog();
        },

        /**
         * 切换主界面。
         * @param {string} id 
         */
        toggle: function(id) {
            that.mainPanel.toggle(id);
        },

        /**
         * 加载指定配置信息。
         * @param {string} name 
         * @returns {object}
         */
        loadConfig: function(name) {
            var value = window.localStorage.getItem('CubeAppConfig');
            if (value && value.length > 3) {
                var data = JSON.parse(value);
                return undefined !== data[name] ? data[name] : null;
            }

            return null;
        },

        /**
         * 保存配置信息。
         * @param {string} name 
         * @param {object} config 
         */
        saveConfig: function(name, config) {
            var value = window.localStorage.getItem('CubeAppConfig');
            if (value && value.length > 3) {
                var data = JSON.parse(value);
                data[name] = config;
                window.localStorage.setItem('CubeAppConfig', JSON.stringify(data));
            }
            else {
                var data = {};
                data[name] = config;
                window.localStorage.setItem('CubeAppConfig', JSON.stringify(data));
            }
        },

        onKeyUp: function(callback) {
            var index = onKeyUpFunList.indexOf(callback);
            if (index >= 0) {
                return;
            }
            onKeyUpFunList.push(callback);
        },

        unKeyUp: function(callback) {
            var index = onKeyUpFunList.indexOf(callback);
            if (index >= 0) {
                onKeyUpFunList.splice(index, 1);
            }
        },

        /**
         * 获取自己的账号实例。
         * @returns {Contact} 返回自己的账号实例。
         */
        getSelf: function() {
            return cube.contact.getSelf();
        },

        /**
         * 提供联系人上下文数据。
         * @param {Contact} contact 
         * @param {ContactContextProvider} provider 
         */
        needContactContext: function(contact, provider) {
            var id = contact.id;

            $.ajax({
                type: 'GET',
                url: server.url + '/account/info/',
                data: { "id": id, "token": token },
                dataType: 'json',
                success: function(response, status, xhr) {
                    if (null == response) {
                        provider.setContext(null);
                        return;
                    }

                    // 头像使用 PNG
                    if (!response.avatar.startsWith('http')) {
                        response.avatar += '.png';
                    }

                    contact.setContext(response);
                    contact.setName(response.name);

                    // 更新到内存
                    updateContact(contact);

                    provider.setContext(response);
                },
                error: function(xhr, error) {
                    console.log(error + ' - ' + id);
                    provider.setContext(null);
                }
            });
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
                        url: server.url + '/account/info/',
                        data: { "id": id, "token": token },
                        dataType: 'json',
                        success: function(response, status, xhr) {
                            if (null == response) {
                                callback(null);
                                return;
                            }

                            // 头像使用 PNG
                            if (!response.avatar.startsWith('http')) {
                                response.avatar += '.png';
                            }

                            contact.setContext(response);
                            contact.setName(response.name);
                            // 更新到内存
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
                console.warn('Get group ' + id + ' - error : ' + error);
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
         * 当完成账号数据并加载引擎之后回调该函数表示程序就绪。
         */
        onReady: function() {
            // 准备联系人和群组数据
            that.prepare(function() {
                // 准备消息数据
                that.prepareMessages(function() {
                    // 隐藏进度提示
                    dialog.hideLoading();

                    // 消息控制器就绪
                    messagingCtrl.ready();

                    // 文件目录准备
                    fileCatalog.prepare();

                    // 会议信息加载
                    confCtrl.ready();

                    // 联系人控制器就绪
                    contactsCtrl.ready();

                    console.log('Cube WebApp Ready');
                });
            });
        },

        /**
         * 进行数据加载和界面信息更新。
         */
        prepare: function(callback) {
            var itemMap = {
                count: 0
            };

            // 处理函数
            var process = function(list) {
                // list - Array<object>
                list.forEach(function(item) {
                    if (!item.avatar.startsWith('http')) {
                        item.avatar += '.png';
                    }

                    if (item.id != account.id) {
                        itemMap[item.id.toString()] = item;

                        that.getContact(item.id, function(contact) {
                            // 将 App 的账号数据设置为 Cube 联系人的上下文
                            var account = itemMap[contact.getId().toString()];
                            contact.setContext(account);
                            contact.setName(account.name);

                            // 向联系人表格添加联系人
                            contactsCtrl.addContact(contact);

                            itemMap.count += 1;
                            console.debug('Debug #getContact: ' + contact.getId() + ' - ' + itemMap.count);
                        });
                    }
                    else {
                        // 自己
                        itemMap.count += 1;
                    }
                });

                var promise = new Promise(function(resolve, reject) {
                    var timer = setInterval(function() {
                        if (itemMap.count == list.length) {
                            clearInterval(timer);
                            resolve();
                        }
                    }, 500);
                });

                promise.then(function() {
                    // 添加自己
                    cubeContacts.push(cube.contact.getSelf());

                    // 加载群组信息
                    that.prepareGroups(function() {
                        callback();
                    });
                }).catch(function() {
                    // 隐藏进度提示
                    setTimeout(function() {
                        dialog.hideLoading();
                    }, 500);
                });
            };

            // 从 Cube 里获取指定的联系人分组
            cube.contact.getContactZone(app.contactZone, function(zone) {
                if (zone.numParticipants() == 0 && that.demo) {
                    // 将内置的账号设置为该联系人的通讯录
                    $.get(server.url + '/account/buildin/', function(response, status, xhr) {
                        // 处理
                        process(response.list);

                        // 依次添加到 Zone
                        response.list.forEach(function(value, index) {
                            if (value.id == account.id) {
                                return;
                            }

                            cube.contact.addContactToZone(app.contactZone, value.id);
                        });
                    });
                }
                else {
                    // 获取分区里所有参与人
                    zone.getParticipants(function(list) {
                        var contactIds = [];
                        for (var i = 0; i < list.length; ++i) {
                            contactIds.push(list[i].contact.id);
                        }

                        $.get(server.url + '/account/info/', {
                            "list": contactIds.toString(),
                            "token": token
                        }, function(response, status, xhr) {
                            // 处理
                            process(response);
                        });
                    });
                }
            }, function(error) {
                if (error.code == ContactServiceState.NotFindContactZone) {
                    // 创建分区

                    if (that.demo) {
                        // 将内置的账号设置为该联系人的通讯录
                        $.get(server.url + '/account/buildin/', function(response, status, xhr) {
                            // 处理
                            process(response.list);

                            let contactIdList = [];
                            // 依次添加到 Zone
                            response.list.forEach(function(value, index) {
                                if (value.id == account.id) {
                                    return;
                                }

                                contactIdList.push(value.id);
                            });

                            // 创建通讯录分区
                            cube.contact.createContactZone(app.contactZone, null, contactIdList, function(zone) {
                                console.log('Create contact zone : ' + zone.name);
                            }, function(error) {
                                console.log(error);
                            });
                        });
                    }
                    else {
                        let contactIdList = [ that.account.id ];
                        // 创建通讯录分区
                        cube.contact.createContactZone(app.contactZone, null, contactIdList, function(zone) {
                            console.log('Create contact zone : ' + zone.name);
                            process([]);
                        }, function(error) {
                            console.log(error);
                            process([]);
                        });
                    }
                }
                else {
                    console.log(error);
                    process([]);
                }
            });
        },

        /**
         * 准备群组数据。
         */
        prepareGroups: function(callback) {
            cube.contact.queryGroups(function(groups) {
                for (var i = 0; i < groups.length; ++i) {
                    var group = groups[i];
                    contactsCtrl.updateGroup(group);
                }

                callback();
            });
        },

        /**
         * 查询最近消息。
         * @param {function} callback 
         */
        prepareMessages: function(callback) {
            var time = Date.now() - g.AMonth;
            cube.messaging.queryRecentMessagers(function(result) {
                if (result.length == 0) {
                    callback();
                }
                else {
                    var count = result.length;

                    function completedCallback() {
                        --count;
                        if (count == 0) {
                            callback();
                        }
                    }

                    for (var i = 0; i < result.length; ++i) {
                        var entity = result[i];

                        if (entity instanceof Group) {
                            // 添加群组
                            messageCatalog.appendItem(entity);

                            // 消息控制器更新群组消息
                            messagingCtrl.updateGroupMessages(entity, completedCallback);
                        }
                        else {
                            that.getContact(entity.getId(), function(contact) {
                                // 向消息目录添加联系人
                                messageCatalog.appendItem(contact);

                                // 消息控制器更新联系人消息
                                messagingCtrl.updateContactMessages(contact, completedCallback);
                            });
                        }
                    }
                }
            }, time);
        }
    };

    app.queryContact = queryContact;
    app.updateContact = updateContact;

    // 默认的联系人组
    app.contactZone = 'contacts';

    // 是否使用 Demo 数据
    app.demo = false;

    that = app;
    g.app = app;

})(window);
