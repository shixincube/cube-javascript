// main.js

/**
 * Toast 提示类型。
 */
var CubeToast = {
    Success: 'success',
    Info: 'info',
    Error: 'error',
    Warning: 'warning',
    Question: 'question'
};


/**
 * 应用程序类。
 * @param {CubeEngine} cube 
 * @param {object} account 
 * @param {Array} contacts 
 * @param {Array} catalogues 
 */
function CubeApp(cube, account, contacts, catalogues) {
    this.cube = cube;           // Cube 实例
    this.account = account;     // App 的当前账号
    this.contacts = contacts;       // App 的联系人列表
    this.catalogues = catalogues;   // 界面目录数据

    this.cubeContact = null;        // 对应的 Cube 的用户实例
    this.cubeContactList = [];      // 对应的 Cube 的联系人清单
    this.cubeGroupList = [];        // 对应的 Cube 的群组清单

    this.messageCatalogue = null;   // 消息目录
    this.messagePanel = null;       // 消息面板

    var that = this;
    setTimeout(function() {
        that.initUI();
        that.config(cube);
    }, 10);

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
    app.messageCatalogue.setClickListener(function(contact) {
        app.onCatalogClick(contact);
    });

    app.messagePanel = new MessagePanel(app);
    app.messagePanel.setSendListener(function(to, content) {
        app.onSendClick(to, content);
    });
    app.messagePanel.setSubmitNewGroupListener(function(groupName, memberIdList) {
        app.onSubmitNewGroup(groupName, memberIdList);
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

    // 监听签入事件
    cube.contact.on(ContactEvent.SignIn, function(event) {
        app.launchToast(CubeToast.Info, '已签入ID ：' + event.data.getId());
    });

    // 监听创建群组事件
    cube.contact.on(ContactEvent.GroupCreated, function(event) {
        app.addGroup(event.data);
    });

    // 监听消息已发送事件
    cube.messaging.on(MessagingEvent.Sent, function(event) {
        var message = event.data;

        console.log('触发 "MessagingEvent.Sent" 事件，消息 ID : ' + message.getId());
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
    if (null == this.messagePanel) {
        setTimeout(function() {
            that.prepareData();
        }, 10);
        return;
    }

    // 使用 Cube 的联系人
    this.cubeContact = new Contact(this.account.id, this.account.name);
    // 将 App 的账号数据设置为 Cube 联系人的上下文，这样 Cube 将携带这些数据以便进行相关的数据操作和显示操作
    this.cubeContact.setContext(this.account);

    // 建立联系人列表，并查询每个联系人的消息记录
    var time = Date.now() - window.AWeek;
    for (var i = 0; i < this.contacts.length; ++i) {
        var contact = this.contacts[i];

        var cubeContact = new Contact(contact.id, contact.name);
        // 将 App 的账号数据设置为 Cube 联系人的上下文
        cubeContact.setContext(contact);
        this.cubeContactList.push(cubeContact);

        // 逐一查询消息
        this.cube.messaging.queryMessageWithContact(contact.id, time, function(id, time, list) {
            for (var i = 0; i < list.length; ++i) {
                var message = list[i];
                var sender = that.getContact(message.getFrom());
                // 添加消息的消息面板
                that.messagePanel.appendMessage(sender,
                    message.getPayload().content, message.getRemoteTimestamp(), that.getContact(id));
            }
            if (list.length > 0) {
                var last = list[list.length - 1];
                that.messageCatalogue.updateSubLabel(id, last.getPayload().content, last.getRemoteTimestamp());
            }
        });
    }

    // 查询群组
    this.cube.contact.queryGroups(function(groupList) {
        var handler = function(groupList) {
            for (var i = 0; i < groupList.length; ++i) {
                var group = groupList[i];
                if (group.getState() == GroupState.Dismissed) {
                    // 已解散的群，不添加
                    continue;
                }

                that.addGroup(group);
            }
        };

        if (groupList.length == 0) {
            // 如果本地没有找到任务群组，尝试从服务器获取（可能客户端清理过存储和缓存）
            if (that.cube.contact.hasSignedIn()) {
                // 客户端已经签入服务器
                that.cube.contact.listGroups(handler);
            }
            else {
                setTimeout(function() {
                    that.cube.contact.listGroups(handler);
                }, 1000);
            }
            return;
        }

        handler(groupList);
    });
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
 * @param {Group} 返回指定 ID 的群组对象。
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

CubeApp.prototype.onSendClick = function(to, content) {
    // 调用消息模块的 sendToContact 发送消息
    var message = this.cube.messaging.sendToContact(to.id, { "content": content });
    if (null == message) {
        this.launchToast(CubeToast.Warning, '发送消息失败');
        return;
    }

    this.messageCatalogue.updateSubLabel(to.id, content, message.getTimestamp());
}

CubeApp.prototype.onSubmitNewGroup = function(groupName, memberIdList) {
    if (groupName.length == 0) {
        groupName = this.account.name + '创建的群组';
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
}

CubeApp.prototype.onNewMessage = function(message) {
    var content = message.getPayload().content;

    // 以下，演示两种处理消息的方式

    // 1. 方式一，用此方式更新目录
    var itemId = 0;
    if (this.cubeContact.getId() == message.getFrom()) {
        // 从“我”的其他终端发送的消息
        itemId = message.getTo();
    }
    else {
        itemId = message.getFrom();
    }
    // 更新目录
    this.messageCatalogue.updateSubLabel(itemId, content, message.getRemoteTimestamp());

    // 2. 方式二，用此方式更新消息面板
    // 判断消息是否是“我”发的
    var sender = null;
    var target = null;
    if (this.cube.messaging.isSender(message)) {
        sender = this.cubeContact;
        target = this.getContact(message.getTo());
    }
    else {
        sender = this.getContact(message.getFrom());
        target = sender;
    }
    
    this.messagePanel.appendMessage(sender, content, message.getRemoteTimestamp(), target);
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
        cube.signIn(app.account.id, app.account.name);

        // 应用程序准备数据
        app.prepareData();
    }, function(error) {
        console.log('Start Cube failed: ' + error);
    });
});
