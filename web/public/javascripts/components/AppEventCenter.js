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
    'use strict';

    var cube = null;
    var sidebarLogEl = null;
    var that = null;

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
        });
        cube.contact.on(ContactEvent.GroupMemberRemoved, function(event) {
            that.appendLog(event.name, event.data.group.getName());
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
            var log = [
                event.data.getType(), ' - ',
                event.data.getSender().getName(), ' -> ',
                event.data.isFromGroup() ? event.data.getSourceGroup().getName() : event.data.getReceiver().getName()
            ];
            that.appendLog(event.name, log.join(''));
        });
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

    g.AppEventCenter = AppEventCenter;

})(window);
