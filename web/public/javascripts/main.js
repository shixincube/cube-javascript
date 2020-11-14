// main.js

/**
 * 应用程序类。
 * @param {CubeEngine} cube 
 * @param {object} account 
 * @param {Array} contacts 
 */
function CubeApp(cube, account, contacts) {
    this.cube = cube;           // Cube 实例
    this.account = account;     // App 的当前账号
    this.contacts = contacts;       // App 的联系人列表

    this.cubeContact = null;        // 对应的 Cube 的用户实例
    this.cubeContactList = [];      // 对应的 Cube 的联系人清单
    this.cubeGroupList = [];        // 对应的 Cube 的群组清单

    this.messageCatalogue = null;   // 消息目录
    this.messagePanel = null;       // 消息面板

    var that = this;
    setTimeout(function() {
        that.config(cube);
    }, 10);

    // 初始化 UI
    this.initUI();

    this.startHeartbeat();
}

/**
 * 初始化 UI 。
 */
CubeApp.prototype.initUI = function() {
    var app = this;
    app.toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
    });

    app.messageCatalogue = new MessageCatalogue(app);
    app.messageCatalogue.setClickListener(function(data) {
        app.onCatalogClick(data);
    });

    app.messagePanel = new MessagePanel(app);
    app.messagePanel.setCreateGroupListener(function(groupName, memberIdList) {
        return app.fireCreateGroup(groupName, memberIdList);
    });
    app.messagePanel.setQuitGroupListener(function(groupId) {
        return app.fireQuitGroup(groupId);
    });
    app.messagePanel.setDissolveGroupListener(function(groupId) {
        return app.fireDissolveGroup(groupId);
    });
}

/**
 * 对 App 进行配置，监听 Cube 的事件。
 * @param {CubeEngine} cube 
 */
CubeApp.prototype.config = function(cube) {
    var app = this;
    // 监听网络状态
    cube.on('network', function(event) {
        if (event.name == 'failed') {
            app.launchToast(CubeToast.Error, '网络错误：' + event.error.code);
        }
        else if (event.name == 'open') {
            app.launchToast(CubeToast.Info, '已连接到服务器');
        }
    });

    // 监听签入事件
    cube.contact.on(ContactEvent.SignIn, function(event) {
        app.launchToast(CubeToast.Info, '已签入ID ：' + event.data.getId());
        app.cubeContact = event.data;
    });

    // 监听创建群组事件
    cube.contact.on(ContactEvent.GroupCreated, function(event) {
        app.addGroup(event.data);
    });
    // 监听解散群组事件
    cube.contact.on(ContactEvent.GroupDissolved, function(event) {
        app.removeGroup(event.data);
    });
    // 监听群组更新事件
    cube.contact.on(ContactEvent.GroupUpdated, function(event) {
        app.updateGroup(event.data);
    });

    // 监听消息已发送事件
    cube.messaging.on(MessagingEvent.Sent, function(event) {
        var message = event.data;

        console.log('触发 "MessagingEvent.Sent" 事件，消息 ID : ' + message.getId());

        if (message.hasAttachment()) {
            cube.fileStorage.getFileURL(message.getAttachment().getFileCode(), function(code, url) {
                console.log('消息附件的文件 URL : ' + url);
            });
        }
    });

    // 监听接收消息事件
    cube.messaging.on(MessagingEvent.Notify, function(event) {
        var message = event.data;

        console.log('触发 "MessagingEvent.Notify" 事件，消息 ID : ' + message.getId());

        // 触发 UI 事件
        app.onNewMessage(message);
    });
}

/**
 * 进行相关的数据初始化。
 */
CubeApp.prototype.prepareData = function() {
    var that = this;
    var time = Date.now() - window.AWeek;

    // 使用 Cube 的联系人
    this.cubeContact = new Contact(this.account.id, this.account.name);
    // 将 App 的账号数据设置为 Cube 联系人的上下文，这样 Cube 将携带这些数据以便进行相关的数据操作和显示操作
    this.cubeContact.setContext(this.account);

    // 使用通知器来进行多任务的异步响应，以下有两个异步任务：
    // 任务一，创建 cubeContactList 列表
    // 任务二，读取群组信息
    var announcer = new Announcer(2, 10000);

    // 添加事件结束回调
    announcer.addAudience(function(total, map) {
        var handler = function(id, list) {
            for (var i = 0; i < list.length; ++i) {
                var message = list[i];
                var sender = that.getContact(message.getFrom());
                var target = null;
                if (message.isFromGroup()) {
                    target = that.getGroup(message.getSource());
                }
                else {
                    if (that.cube.messaging.isSender(message)) {
                        target = that.getContact(message.getTo());
                    }
                    else {
                        target = that.getContact(message.getFrom());
                    }
                }

                // 添加消息的消息面板
                that.messagePanel.appendMessage(message.getId(), sender,
                    message, message.getRemoteTimestamp(), target);
            }

            if (list.length > 0) {
                var last = list[list.length - 1];
                that.messageCatalogue.updateItem(id, last, last.getRemoteTimestamp());
            }
        }

        // 逐一查询每个联系人的消息
        for (var i = 0; i < that.cubeContactList.length; ++i) {
            var contact = that.cubeContactList[i];
            that.cube.messaging.queryMessageWithContact(contact, time, function(id, time, list) {
                handler(id, list);
            });
        }

        // 逐一查询每个群组的消息
        for (var i = 0; i < that.cubeGroupList.length; ++i) {
            var group = that.cubeGroupList[i];
            that.cube.messaging.queryMessageWithGroup(group, time, function(id, time, list) {
                handler(id, list);
            });
        }
    });

    // 查询所有群组，设置匹配条件，只显示群状态正常的群
    this.cube.contact.queryGroups(function(groupList) {
        for (var i = 0; i < groupList.length; ++i) {
            var group = groupList[i];
            that.addGroup(group);
        }

        // 宣布完成
        announcer.announce('groupList', groupList);
    }, [ GroupState.Normal ]);

    // 建立联系人列表，并查询每个联系人的消息记录
    for (var i = 0; i < this.contacts.length; ++i) {
        var contact = this.contacts[i];

        var cubeContact = new Contact(contact.id, contact.name);
        // 将 App 的账号数据设置为 Cube 联系人的上下文
        cubeContact.setContext(contact);
        this.cubeContactList.push(cubeContact);

        this.messageCatalogue.appendItem(contact);
    }

    // 宣布完成
    announcer.announce('contactList', this.cubeContactList);
}

/**
 * 启动心跳定时器。
 */
CubeApp.prototype.startHeartbeat = function() {
    var id = this.account.id;
    setInterval(function() {
        $.post('/account/hb', {
            "id" : id
        }, function(data, textStatus, jqXHR) {
            if (!data.state) {
                window.location.href = '/?t=' + Date.now();
            }
        }, 'json');
    }, 3 * 60 * 1000);
}

/**
 * 返回指定 ID 的联系人。
 * @param {number} id 
 * @returns {Contact}} 返回指定 ID 的联系人。
 */
CubeApp.prototype.getContact = function(id) {
    if (id == this.cubeContact.getId()) {
        return this.cubeContact;
    }

    for (var i = 0; i < this.cubeContactList.length; ++i) {
        var contact = this.cubeContactList[i];
        if (contact.getId() == id) {
            return contact;
        }
    }

    return null;
}

/**
 * 返回指定 ID 的群组对象实例。
 * @param {number} id 
 * @returns {Group} 返回指定 ID 的群组对象。
 */
CubeApp.prototype.getGroup = function(id) {
    for (var i = 0; i < this.cubeGroupList.length; ++i) {
        var group = this.cubeGroupList[i];
        if (group.getId() == id) {
            return group;
        }
    }
    return null;
}

/**
 * 添加新群组。
 * @param {Group} group 
 */
CubeApp.prototype.addGroup = function(group) {
    if (null != this.getGroup(group.getId())) {
        return;
    }

    this.cubeGroupList.push(group);
    this.messageCatalogue.appendItem(group);
    this.messagePanel.addGroup(group);
}

/**
 * 移除群组。
 * @param {Group} group 
 */
CubeApp.prototype.removeGroup = function(group) {
    for (var i = 0; i < this.cubeGroupList.length; ++i) {
        var cur = this.cubeGroupList[i];
        if (cur.getId() == group.getId()) {
            this.cubeGroupList.splice(i, 1);
            break;
        }
    }

    this.messageCatalogue.removeItem(group);
    this.messagePanel.removeGroup(group);
}

/**
 * 更新群组。
 * @param {Group} group 
 */
CubeApp.prototype.updateGroup = function(group) {
    if (group.getState() == GroupState.Dismissed || group.getState() == GroupState.Disabled) {
        this.removeGroup(group);
        return;
    }

    var current = this.getGroup(group.getId());
    if (null == current) {
        this.addGroup(group);
        return;
    }

    for (var i = 0; i < this.cubeGroupList.length; ++i) {
        var cur = this.cubeGroupList[i];
        if (cur.getId() == group.getId()) {
            this.cubeGroupList.splice(i, 1);
            break;
        }
    }

    this.cubeGroupList.push(group);

    this.messageCatalogue.updateItem(group.getId(), null, group.getLastActiveTime(), group.getName());
    this.messagePanel.updateGroup(group);
}

/**
 * 当前账号退出登录。
 */
CubeApp.prototype.logout = function() {
    var that = this;
    ui.showConfirm('退出登录', '是否确认退出当前账号登录？', function(confirmed) {
        if (confirmed) {
            ui.showLoading('账号正在登出，请稍后', 5000);

            var timer = 0;
            var id = that.account.id;

            var logout = function() {
                $.post('/account/logout', {
                    "id": id
                }, function(data, textStatus, jqXHR) {
                    clearTimeout(timer);

                    // 本示例程序将回到登录界面，因此停止引擎
                    that.cube.stop();

                    window.location.href = '/?t=' + Date.now();
                }, 'json');
            };

            // 将 Cube 账号签出
            that.cube.contact.signOut(function(self) {
                logout();
            });

            timer = setTimeout(function() {
                logout();
            }, 4000);
        }
    });
}

/**
 * 从服务器查询账号信息。
 * @param {number} id 
 * @param {function} handler 
 */
CubeApp.prototype.requestAccount = function(id, handler) {
    $.get('/account/info', {
        "id" : id
    }, function(data, textStatus, jqXHR) {
        handler(data, textStatus);
    }, 'json');
}

CubeApp.prototype.showImage = function(fileCode) {
    this.cube.fileStorage.getFileURL(fileCode, function(fileCode, url) {
        var image = new Image();
        image.src = url;
        var viewer = new Viewer(image, {
            hidden: function () {
                viewer.destroy();
            }
        });
        viewer.show();
    });
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

CubeApp.prototype.onCatalogClick = function(item) {
    var target = this.getContact(item.id);
    if (null == target) {
        target = this.getGroup(item.id);
        if (null == target) {
            return;
        }
    }

    this.messagePanel.changeTarget(target);
}

CubeApp.prototype.fireSend = function(to, content) {
    // 调用消息模块的 sendTo 发送消息
    var text = (typeof content === 'string') ? content : '[文件] ' + content.name;
    var payload = { "content": text };
    var file = (content instanceof File) ? content : null;

    var message = this.cube.messaging.sendTo(to, payload, file);
    if (null == message) {
        this.launchToast(CubeToast.Warning, '发送消息失败');
        return null;
    }

    this.messageCatalogue.updateItem(to.getId(), content, message.getTimestamp());
    return message;
}

CubeApp.prototype.fireCreateGroup = function(groupName, memberIdList) {
    if (groupName.length == 0) {
        groupName = this.cubeContact.getName() + '创建的群组';
    }

    var memberList = [];
    for (var i = 0; i < memberIdList.length; ++i) {
        var member = this.getContact(memberIdList[i]);
        memberList.push(member);
    }

    var that = this;

    // 调用联系人模块的 createGroup 创建群组
    this.cube.contact.createGroup(groupName, memberList, function(group) {
        console.log('成功创建群组 "' + group.getName() + '"');
        that.launchToast(CubeToast.Success, '成功创建群组 "' + group.getName() + '"');
    }, function(groupId, groupName) {
        console.log('创建群组 "' + groupName + '" 操作失败');
        that.launchToast(CubeToast.Warning, '创建群组 "' + groupName + '" 操作失败');
    });

    return true;
}

CubeApp.prototype.fireQuitGroup = function(groupId) {
    var that = this;
    var group = this.getGroup(groupId);

    if (!window.confirm('您确定要退出 “' + group.getName() + '” 群组吗？')) {
        return false;
    }

    return this.cube.contact.quitGroup(group, function(group) {
        // 删除群组
        that.removeGroup(group);

        that.launchToast(CubeToast.Success, '您是已经退出群组 “' + group.getName() + '”');
    }, function(group) {
        if (group.isOwner(that.cubeContact)) {
            that.launchToast(CubeToast.Warning, '您是群主不能退群！');
        }
        else {
            that.launchToast(CubeToast.Error, '退出群组 "' + group.getName() + '" 失败！');
        }
    });
}

CubeApp.prototype.fireDissolveGroup = function(groupId) {
    var group = this.getGroup(groupId);
    if (!group.getOwner().equals(this.cubeContact)) {
        this.launchToast(CubeToast.Warning, '您不是该群所有者，不能解散该群。');
        return false;
    }

    if (!window.confirm('您确定要解散 “' + group.getName() + '” 这个群组吗？\n* 群组解散后不可恢复。')) {
        return false;
    }

    ui.showLoading('正在解散"' + group.getName() + '"，请稍后');

    var that = this;
    this.cube.contact.dissolveGroup(group, function(group) {
        setTimeout(function() {
            ui.hideLoading();
        }, 1000);
    }, function(group) {
        setTimeout(function() {
            ui.hideLoading();
        }, 1000);

        that.launchToast(CubeToast.Error, '解散群组 "' + group.getName() + '" 失败！');
    });

    return true;
}

CubeApp.prototype.fireModifyGroupName = function(groupId, name) {
    var that = this;
    var group = this.getGroup(groupId);
    group.modifyName(name, function(group) {
        that.launchToast(CubeToast.Success, '已修改群组名称');
    }, function(group) {
        that.launchToast(CubeToast.Warning, '修改群名称失败');
    });
}

CubeApp.prototype.fireAddMember = function(groupId, memberIdList) {
    var group = this.getGroup(groupId);

    var members = [];
    for (var i = 0; i < memberIdList.length; ++i) {
        members.push(this.getContact(memberIdList[i]));
    }

    var that = this;

    // 向群组添加成员
    group.addMembers(members, function(group, members, operator) {
        that.launchToast(CubeToast.Success, '已添加 ' + members.length + ' 名新成员。');
        that.updateGroup(group);
    }, function(group, members, operator) {
        that.launchToast(CubeToast.Error, '添加群成员失败！');
    });
}

CubeApp.prototype.fireRemoveMember = function(groupId, memberId) {
    var group = this.getGroup(groupId);
    var member = this.getContact(memberId);

    var that = this;

    // 从群组里删除成员
    group.removeMembers([ member ], function(group, members, operator) {
        that.launchToast(CubeToast.Success, '已移除成员 "' + member.getName() + '" 。');
        that.updateGroup(group);
    }, function(group, members, operator) {
        that.launchToast(CubeToast.Error, '移除群成员 "' + member.getName() + "' 失败！");
    });
}

CubeApp.prototype.onNewMessage = function(message) {
    // 判断消息是否来自群组
    if (message.isFromGroup()) {
        // 消息来自群组
        var group = this.getGroup(message.getSource());
        if (null != group) {
            // 更新目录
            this.messageCatalogue.updateItem(group.getId(), message, message.getRemoteTimestamp());

            // 更新消息面板
            this.messagePanel.appendMessage(message.getId(), this.getContact(message.getFrom()), message, message.getRemoteTimestamp(), group);
        }
        else {
            // 从服务器获取新群组
            // TODO
        }
    }
    else {
        // 消息来自联系人
        var itemId = 0;
        var sender = this.getContact(message.getFrom());
        var target = null;

        if (this.cubeContact.getId() == message.getFrom()) {
            // 从“我”的其他终端发送的消息
            itemId = message.getTo();
            target = this.getContact(message.getTo());
        }
        else {
            itemId = message.getFrom();
            target = sender;
        }
        
        // 更新目录
        this.messageCatalogue.updateItem(itemId, message, message.getRemoteTimestamp());

        // 更新消息面板
        this.messagePanel.appendMessage(message.getId(), sender, message, message.getRemoteTimestamp(), target);
    }
}

// 启动
$(document).ready(function() {
    // 实例化 Cube 引擎
    var cube = window.cube();

    // 创建 App 实例。
    var app = new CubeApp(cube, gAccount, gContacts);
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
    }, function(error) {
        console.log('Start Cube FAILED: ' + error);
    });

    // 将当前账号签入，将 App 的账号信息设置为 Cube Self 的上下文
    // 在执行 cube#start() 之后可直接签入，不需要等待 Cube 就绪
    cube.signIn(app.account.id, app.account.name, app.account);

    // 应用程序准备数据
    app.prepareData();

    // tips
    $('[data-toggle="tooltip"]').tooltip();
});
