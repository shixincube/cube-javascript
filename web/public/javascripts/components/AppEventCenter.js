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
 * 事件监听器。
 */
(function(g) {

    var cube = null;
    var sidebarLogEl = null;

    /**
     * @type {AppEventCenter}
     */
    var that = null;


    // 多方通讯事件 - 开始

    function onInProgress(event) {
        that.appendLog(event.name, event.data.getName());
    }

    function onRinging(event) {
        that.appendLog(event.name, event.data.field.getName());
    }

    function onConnected(event) {
        that.appendLog(event.name, event.data.field.getName());
    }

    function onBye(event) {
        that.appendLog(event.name, event.data.field.getName());
    }

    function onTimeout(event) {
        that.appendLog(event.name, event.data.field.getName());
    }

    function onNewCall(event) {
        that.appendLog(event.name, event.data.field.getName());
    }

    function onInvited(event) {
        that.appendLog(event.name, event.data.getName());
    }

    function onArrived(event) {
        that.appendLog(event.name, event.data.getName());
    }

    function onLeft(event) {
        that.appendLog(event.name, event.data.getName());
    }

    function onFollowed(event) {
        that.appendLog(event.name, event.data.getName());
    }

    function onUnfollowed(event) {
        that.appendLog(event.name, event.data.getName());
    }

    // 多方通讯事件 - 结束


    var AppEventCenter = function() {
        that = this;
        sidebarLogEl = $('aside.control-sidebar').find('#app-details-log');
    }

    AppEventCenter.prototype.start = function(cubeEngine) {
        cube = cubeEngine;

        // 监听网络状态
        cube.on('network', function(event) {
            if (event.name == 'failed') {
                g.dialog.launchToast(Toast.Error, '网络错误：' + event.error.code, true);
            }
            else if (event.name == 'connected') {
                g.dialog.launchToast(Toast.Info, '已连接到服务器', true);
                that.appendLog('Network', 'Ready');
            }
        });

        // 联系人登录相关事件
        cube.contact.on(ContactEvent.SignIn, function(event) {
            that.appendLog(event.name, event.data.id);
        });
        cube.contact.on(ContactEvent.SignOut, function(event) {
            that.appendLog(event.name, event.data.id);
        });
        cube.contact.on(ContactEvent.Comeback, function(event) {
            that.appendLog(event.name, event.data.id);
        });

        // 群组相关事件
        // 群组数据更新
        cube.contact.on(ContactEvent.GroupUpdated, function(event) {
            that.appendLog(event.name, event.data.name);
            that.onGroupUpdated(event.data);
        });
        cube.contact.on(ContactEvent.GroupCreated, function(event) {
            that.appendLog(event.name, event.data.name);
            that.onGroupCreated(event.data);
        });
        cube.contact.on(ContactEvent.GroupDissolved, function(event) {
            that.appendLog(event.name, event.data.name);
            that.onGroupDissolved(event.data);
        });
        cube.contact.on(ContactEvent.GroupMemberAdded, function(event) {
            that.appendLog(event.name, event.data.group.getName());
            that.onGroupMemberAdded(event.data.group);
        });
        cube.contact.on(ContactEvent.GroupMemberRemoved, function(event) {
            that.appendLog(event.name, event.data.group.getName());
            that.onGroupMemberRemoved(event.data.group);
        });

        // 消息相关事件
        cube.messaging.on(MessagingEvent.Notify, function(event) {
            var log = [
                event.data.getType(), ' - ',
                event.data.getSender().getName(), ' -> ',
                event.data.isFromGroup() ? event.data.getSourceGroup().getName() : event.data.getReceiver().getName()
            ];
            that.appendLog(event.name, log.join(''));
        });
        cube.messaging.on(MessagingEvent.Sent, function(event) {
            var log = [
                event.data.getType(), ' - ',
                event.data.getSender().getName(), ' -> ',
                event.data.isFromGroup() ? event.data.getSourceGroup().getName() : event.data.getReceiver().getName()
            ];
            that.appendLog(event.name, log.join(''));
        });
        cube.messaging.on(MessagingEvent.Recall, function(event) {
            console.log(event.data);
            // var log = [
            //     event.data.getType(), ' - ',
            //     event.data.getSender().getName(), ' -> ',
            //     event.data.isFromGroup() ? event.data.getSourceGroup().getName() : event.data.getReceiver().getName()
            // ];
            // that.appendLog(event.name, log.join(''));
        });
        // 消息被发送端阻止
        cube.messaging.on(MessagingEvent.SendBlocked, function(event) {
            var log = [
                event.data.getType(), ' - ',
                event.data.getSender().getName(), ' -> ',
                event.data.isFromGroup() ? event.data.getSourceGroup().getName() : event.data.getReceiver().getName()
            ];
            that.appendLog(event.name, log.join(''));
        });
        // 消息被接收端阻止
        cube.messaging.on(MessagingEvent.ReceiveBlocked, function(event) {
            var log = [
                event.data.getType(), ' - ',
                event.data.getSender().getName(), ' -> ',
                event.data.isFromGroup() ? event.data.getSourceGroup().getName() : event.data.getReceiver().getName()
            ];
            that.appendLog(event.name, log.join(''));
        });


        // 多方通讯事件 - 开始 ---------------------------------------------------

        cube.mpComm.on(CommEvent.InProgress, onInProgress);
        cube.mpComm.on(CommEvent.Ringing, onRinging);
        cube.mpComm.on(CommEvent.Connected, onConnected);
        cube.mpComm.on(CommEvent.Bye, onBye);
        cube.mpComm.on(CommEvent.Timeout, onTimeout);   // 过程性事件

        cube.mpComm.on(CommEvent.NewCall, onNewCall);

        cube.mpComm.on(CommEvent.Invited, onInvited);
        cube.mpComm.on(CommEvent.Arrived, onArrived);
        cube.mpComm.on(CommEvent.Left, onLeft);
        cube.mpComm.on(CommEvent.Followed, onFollowed);
        cube.mpComm.on(CommEvent.Unfollowed, onUnfollowed);

        // 多方通讯事件 - 结束 ---------------------------------------------------
    }

    /**
     * 添加到日志。
     * @param {*} event 
     * @param {*} desc 
     */
    AppEventCenter.prototype.appendLog = function(event, desc) {
        var date = new Date();

        var html = [
            '<div class="row align-items-center">',
                '<div class="col-3">',
                    g.formatNumber(date.getHours()), ':', g.formatNumber(date.getMinutes()), ':', g.formatNumber(date.getSeconds()),
                '</div>',
                '<div class="col-4"><b>',
                    event,
                '</b></div>',
                '<div class="col-5">',
                    desc,
                '</div>',
            '</div>'
        ];

        sidebarLogEl.append($(html.join('')));
    }

    AppEventCenter.prototype.onGroupUpdated = function(group) {
        // 更新消息界面
        g.app.messagingCtrl.updateGroup(group);
        // 更新联系人界面
        g.app.contactsCtrl.updateGroup(group);
    }

    AppEventCenter.prototype.onGroupCreated = function(group) {
        // 添加到联系人界面的表格
        g.app.contactsCtrl.updateGroup(group);

        // Toast 提示
        g.dialog.launchToast(Toast.Info,
            group.isOwner() ? '群组“' + group.getName() + '”已创建。' : 
                '“' + group.getOwner().getName() + '”邀请你加入群组“' + group.getName() + '” 。',
            true);
    }

    AppEventCenter.prototype.onGroupDissolved = function(group) {
        // 从联系人群组界面移除群组
        g.app.contactsCtrl.removeGroup(group);

        // 更新消息面板
        g.app.messagePanel.updatePanel(group.getId(), group);

        // Toast 提示
        g.dialog.launchToast(Toast.Info,
            '群组 “' + group.getName() + '” 已解散。',
            true);
    }

    AppEventCenter.prototype.onGroupMemberAdded = function(group) {
        g.app.messagePanel.updatePanel(group.getId(), group);
    }

    AppEventCenter.prototype.onGroupMemberRemoved = function(group) {
        g.app.messagePanel.updatePanel(group.getId(), group);
    }

    g.AppEventCenter = AppEventCenter;

})(window);
