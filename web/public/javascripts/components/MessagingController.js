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

(function(g) {
    
    var that = null;

    var cube = null;

    var queryNum = 10;

    var elSelectFile = null;

    var colCatalog = null;
    var colContent = null;
    var colSidebar = null;

    var groupSidebar = true;
    var contactSidebar = true;

    /**
     * Notify Event
     * @param {*} event 
     */
    function onMessageNotify(event) {
        that.onNewMessage(event.data);
    }

    /**
     * Sending
     * @param {*} event 
     */
    function onMessageSending(event) {
        var message = event.data;

        // 使用动画效果
        g.app.messagePanel.appendMessage(g.app.messagePanel.current.entity, g.app.getSelf(), message, true, true);

        if (message.isFromGroup()) {
            g.app.messageCatalog.updateItem(message.getSource(), message, message.getRemoteTimestamp());
        }
        else {
            g.app.messageCatalog.updateItem(message.getTo(), message, message.getRemoteTimestamp());
        }
    }

    /**
     * Sent
     * @param {*} event 
     */
    function onMessageSent(event) {
        g.app.messagePanel.changeMessageState(event.data);
    }

    /**
     * Mark Only Owner
     * @param {*} event 
     */
    function onMarkOnlyOwner(event) {
        var message = event.data;
        g.app.messagePanel.appendMessage(message.getReceiver(), g.app.getSelf(), message, true);
    }

    /**
     * Send Blocked
     * @param {*} event 
     */
    function onMessageSendBlocked(event) {
        var message = event.data;
        g.app.messagePanel.changeMessageState(message);

        // 全局笔记
        var note = new LocalNoteMessage('“' + message.getReceiver().getName() + '”在你的“黑名单”里，不能向他发送消息！');
        note.setLevel(3);
        cube.messaging.markLocalOnlyOwner(message.getReceiver(), note);
    }

    /**
     * Receive Blocked
     * @param {*} event 
     */
    function onMessageReceiveBlocked(event) {
        var message = event.data;
        g.app.messagePanel.changeMessageState(message);

        // 全局笔记
        var note = new LocalNoteMessage('“' + message.getReceiver().getName() + '”已拒收你的消息！');
        note.setLevel(3);
        cube.messaging.markLocalOnlyOwner(message.getReceiver(), note);
    }

    /**
     * Fault
     * @param {*} event 
     */
    function onMessageFault(event) {
        var error = event.data;
        var message = error.data;
    }


    /**
     * 消息模块的控制器。
     * @param {Cube} cubeEngine 
     */
    var MessagingController = function(cubeEngine) {
        cube = cubeEngine;
        that = this;

        colCatalog = $('#col_messaging_catalog');
        colContent = $('#col_messaging_content');
        colSidebar = $('#col_messaging_sidebar');
        if (!colSidebar.hasClass('no-display')) {
            colSidebar.addClass('no-display');
        }

        // 监听消息正在发送事件
        cube.messaging.on(MessagingEvent.Sending, onMessageSending);
        // 监听消息已发送事件
        cube.messaging.on(MessagingEvent.Sent, onMessageSent);

        // 监听接收消息事件
        cube.messaging.on(MessagingEvent.Notify, onMessageNotify);

        cube.messaging.on(MessagingEvent.MarkOnlyOwner, onMarkOnlyOwner);

        // 消息被阻止
        cube.messaging.on(MessagingEvent.SendBlocked, onMessageSendBlocked);
        cube.messaging.on(MessagingEvent.ReceiveBlocked, onMessageReceiveBlocked);

        // 发生故障
        cube.messaging.on(MessagingEvent.Fault, onMessageFault);
    }

    /**
     * 更新联系人的消息清单。
     * @param {Contact} contact 
     * @param {funciton} completed
     */
    MessagingController.prototype.updateContactMessages = function(contact, completed) {
        if (contact.getId() == g.app.account.id) {
            // 不查询自己
            return;
        }

        var count = 0;

        var handler = function(message) {
            // 判断自己是否是该消息的发件人
            if (cube.messaging.isSender(message)) {
                g.app.messagePanel.appendMessage(message.getReceiver(), message.getSender(), message, true);
            }
            else {
                g.app.messagePanel.appendMessage(message.getSender(), message.getSender(), message, true);
            }

            --count;
            if (completed && count == 0) {
                completed();
            }
        }

        cube.messaging.queryRecentMessagesWithContact(contact, queryNum, function(id, list) {
            count = list.length;

            if (count == 0) {
                // 没有消息
                if (completed) {
                    completed();
                }
                return;
            }

            var unreadCount = 0;
            for (var i = 0; i < list.length; ++i) {
                var message = list[i];
                handler(message);

                if (!message.isRead()) {
                    ++unreadCount;
                }
            }

            for (var i = list.length - 1; i >= 0; --i) {
                var last = list[i];
                // 更新目录项
                if (g.app.messageCatalog.updateItem(id, last, last.getRemoteTimestamp())) {
                    if (unreadCount > 0) {
                        g.app.messageCatalog.updateBadge(id, unreadCount);
                    }
                    break;
                }
            }
        });
    }

    /**
     * 更新群组的消息。
     * @param {Group} group 
     * @param {funciton} completed
     */
    MessagingController.prototype.updateGroupMessages = function(group, completed) {
        var count = 0;
        var messageList = null;
        var senderMap = new OrderMap();

        var handler = function(group, message) {
            g.app.getContact(message.getFrom(), function(sender) {
                // 记录发件人
                senderMap.put(message.getId(), sender);

                --count;
                if (count == 0) {
                    messageList.forEach(function(msg) {
                        var sender = senderMap.get(msg.getId());
                        // 添加到消息面板
                        g.app.messagePanel.appendMessage(group, sender, msg, true);
                    });

                    messageList = null;
                    senderMap.clear();
                    senderMap = null;

                    if (completed) {
                        completed();
                    }
                }
            });
        }

        cube.messaging.queryRecentMessagesWithGroup(group, queryNum, function(groupId, list) {
            count = list.length;

            if (count == 0) {
                // 没有数据
                if (completed) {
                    completed();
                }
                return;
            }

            messageList = list;

            var unreadCount = 0;
            for (var i = 0; i < list.length; ++i) {
                var message = list[i];
                handler(group, message);

                if (!message.isRead()) {
                    ++unreadCount;
                }
            }

            for (var i = list.length - 1; i >= 0; --i) {
                var last = list[i];
                // 更新目录项
                if (g.app.messageCatalog.updateItem(groupId, last, last.getRemoteTimestamp())) {
                    if (unreadCount > 0) {
                        g.app.messageCatalog.updateBadge(groupId, unreadCount);
                    }
                    break;
                }
            }
        });
    }

    /**
     * 更新联系人在 UI 里的信息。
     * @param {Contact} contact 
     */
    MessagingController.prototype.updateContact = function(contact) {
        g.app.messagePanel.updatePanel(contact.getId(), contact);
        g.app.messageCatalog.updateItem(contact, null, null,
            contact.getAppendix().hasRemarkName() ? contact.getAppendix().getRemarkName() : contact.getName());
        g.app.messageSidebar.update(group);
    }

    /**
     * 更新群组在 UI 里的信息。
     * @param {Group} group 
     */
    MessagingController.prototype.updateGroup = function(group) {
        g.app.messagePanel.updatePanel(group.getId(), group);
        g.app.messageCatalog.updateItem(group, null, null, group.getName());
        g.app.messageSidebar.update(group);
    }

    /**
     * 显示选择文件界面。
     * @param {*} el 
     */
    MessagingController.prototype.selectFile = function(el) {
        if (null == elSelectFile) {
            elSelectFile = el;
            elSelectFile.on('change', function(e) {
                var file = e.target.files[0];
                that.fireSend(g.app.messagePanel.current.entity, file);
            });
        }

        elSelectFile.click();
    }

    /**
     * 触发发送消息。
     * @param {Contact|Group} target 接收消息的对象。
     * @param {string|File} content 消息内容。
     * @returns {Message} 返回消息对象实例。
     */
    MessagingController.prototype.fireSend = function(target, content) {
        // 验证目标
        if (target instanceof Group) {
            if (target.getState() != GroupState.Normal) {
                return null;
            }
        }

        var message = null;

        if (typeof content === 'string') {
            message = new HyperTextMessage(content);// new TextMessage(content);
        }
        else if (content instanceof File) {
            var type = content.type;
            if (type.indexOf('image') >= 0) {
                message = new ImageMessage(content);
            }
            else {
                message = new FileMessage(content);
            }
        }
        else {
            g.dialog.launchToast(Toast.Warning, '程序内部错误');
            return null;
        }

        message = cube.messaging.sendTo(target, message);
        return message;
    }

    /**
     * 切换消息面板。
     * @param {number} id 切换消息面板的目标 ID 。
     */
    MessagingController.prototype.toggle = function(id) {
        if (id == g.app.account.id) {
            return;
        }

        var handle = function(item) {
            if (null == item) {
                return;
            }

            g.app.messagePanel.changePanel(id, item);
            g.app.messageCatalog.activeItem(id);
            g.app.messageCatalog.updateBadge(id, 0);
        }

        g.app.getGroup(id, function(group) {
            if (null == group) {
                g.app.getContact(id, function(contact) {
                    handle(contact);
                    g.app.messageSidebar.update(contact);
                    if (contactSidebar) {
                        that.showSidebar();
                    }
                    else {
                        that.hideSidebar();
                    }
                });
            }
            else {
                handle(group);
                g.app.messageSidebar.update(group);
                if (groupSidebar) {
                    that.showSidebar();
                }
                else {
                    that.hideSidebar();
                }
            }
        });
    }

    /**
     * 开关侧边栏。
     */
    MessagingController.prototype.toggleSidebar = function() {
        if (colSidebar.hasClass('no-display')) {
            this.showSidebar();

            if (g.app.messagePanel.getCurrentPanel().groupable) {
                groupSidebar = true;
            }
            else {
                contactSidebar = true;
            }
        }
        else {
            this.hideSidebar();

            if (g.app.messagePanel.getCurrentPanel().groupable) {
                groupSidebar = false;
            }
            else {
                contactSidebar = false;
            }
        }
    }

    /**
     * 显示侧边栏。
     */
    MessagingController.prototype.showSidebar = function() {
        if (!colSidebar.hasClass('no-display')) {
            return;
        }

        colContent.removeClass('col-md-9');
        colContent.removeClass('col-sm-10');
        colContent.addClass('col-md-6');
        colContent.addClass('col-sm-6');
        colSidebar.removeClass('no-display');
    }

    /**
     * 隐藏侧边栏。
     */
    MessagingController.prototype.hideSidebar = function() {
        if (colSidebar.hasClass('no-display')) {
            return;
        }

        colContent.removeClass('col-md-6');
        colContent.removeClass('col-sm-6');
        colContent.addClass('col-md-9');
        colContent.addClass('col-sm-10');
        colSidebar.addClass('no-display');
    }

    MessagingController.prototype.showGroupMember = function() {
        // TODO
    }

    /**
     * 撤回消息。
     * @param {Contact|Group} entity 当前操作对应的联系人或群组。
     * @param {number} id 待撤回消息的 ID 。
     */
    MessagingController.prototype.recallMessage = function(entity, id) {
        cube.messaging.recallMessage(id, function(message) {
            // TODO xjw
            g.app.messagePanel.appendNote(entity, '消息已撤回 ' + g.formatFullTime(Date.now()));

            g.app.messagePanel.removeMessage(entity, message);
        }, function(error) {
            g.dialog.launchToast(Toast.Error,
                (error.code == MessagingServiceState.DataTimeout) ? '消息发送超过2分钟，不能撤回' : '撤回消息失败');
            console.log('撤回消息失败 - ' + error);
        })
    }

    /**
     * 删除消息。
     * @param {Contact|Group} entity 当前操作对应的联系人或群组。
     * @param {number} id 待删除消息的 ID 。
     */
    MessagingController.prototype.deleteMessage = function(entity, id) {
        cube.messaging.deleteMessage(id, function(message) {
            g.dialog.launchToast(Toast.Success, '消息已删除');
            g.app.messagePanel.removeMessage(entity, message);
        }, function(error) {
            g.dialog.launchToast(Toast.Error, '删除消息失败');
            console.log('删除消息失败 - ' + error);
        });
    }

    /**
     * 在消息面板前插入指定 ID 面板的之前消息。
     * @param {number} id 目标面板 ID 。
     */
    MessagingController.prototype.prependMore = function(id) {
        var panel = g.app.messagePanel.getPanel(id);
        var timestamp = (panel.messageTimes.length == 0) ? Date.now() : panel.messageTimes[0] - 1;

        // 计数
        var count = queryNum;

        if (panel.groupable) {
            cube.messaging.reverseIterateMessageWithGroup(id, timestamp, function(groupId, message) {
                // 添加消息
                g.app.messagePanel.appendMessage(panel.entity, message.getSender(), message, false);

                --count;
                if (count == 0) {
                    return false;
                }
                else {
                    return true;
                }
            }, function() {
                if (count == queryNum) {
                    g.dialog.launchToast(Toast.Info, '没有更多消息了');
                }
            });
        }
        else {
            cube.messaging.reverseIterateMessageWithContact(id, timestamp, function(contactId, message) {
                // 添加消息
                g.app.messagePanel.appendMessage(panel.entity, message.getSender(), message, false);

                --count;
                if (count == 0) {
                    return false;
                }
                else {
                    return true;
                }
            }, function() {
                if (count == queryNum) {
                    g.dialog.launchToast(Toast.Info, '没有更多消息了');
                }
            });
        }
    }

    /**
     * 打开语音通话界面。
     * @param {Contact} target 通话对象。
     */
    MessagingController.prototype.openVoiceCall = function(target) {
        g.app.callCtrl.callContact(target);
    }

    /**
     * 打开视频通话界面。
     * @param {Contact} target 通话对象。
     */
    MessagingController.prototype.openVideoChat = function(target) {
        g.app.callCtrl.callContact(target, true);
    }

    /**
     * 从 Cube 收到新消息时回调该方法。
     * @param {Message} message 收到的消息。
     */
    MessagingController.prototype.onNewMessage = function(message) {
        // 判断消息是否来自群组
        if (message.isFromGroup()) {
            // 更新消息面板
            if (g.app.messagePanel.hasPanel(message.getSourceGroup())) {
                g.app.messagePanel.appendMessage(message.getSourceGroup(), message.getSender(), message);
            }
            else {
                that.updateGroupMessages(message.getSourceGroup(), function() {
                    g.app.messagePanel.appendMessage(message.getSourceGroup(), message.getSender(), message, false);
                });
            }

            // 更新消息目录
            var result = g.app.messageCatalog.updateItem(message.getSourceGroup(), message, message.getRemoteTimestamp());
            if (!result) {
                console.debug('#onNewMessage - update catalog item failed');
            }

            that.updateUnread(message.getSource(), message);
        }
        else {
            // 消息来自联系人

            if (g.app.account.id == message.getFrom()) {
                // 从“我”的其他终端发送的消息
                // 更新消息面板
                if (g.app.messagePanel.hasPanel(message.getReceiver())) {
                    g.app.messagePanel.appendMessage(message.getReceiver(), message.getSender(), message);
                }
                else {
                    that.updateContactMessages(message.getReceiver(), function() {
                        g.app.messagePanel.appendMessage(message.getReceiver(), message.getSender(), message, false);
                    });
                }

                // 更新消息目录
                g.app.messageCatalog.updateItem(message.getReceiver(), message, message.getRemoteTimestamp());

                that.updateUnread(message.getTo(), message);
            }
            else {
                // 更新消息面板
                if (g.app.messagePanel.hasPanel(message.getSender())) {
                    g.app.messagePanel.appendMessage(message.getSender(), message.getSender(), message, false);
                }
                else {
                    that.updateContactMessages(message.getSender(), function() {
                        g.app.messagePanel.appendMessage(message.getSender(), message.getSender(), message, false);
                    });
                }

                // 更新消息目录
                g.app.messageCatalog.updateItem(message.getSender(), message, message.getRemoteTimestamp());

                that.updateUnread(message.getFrom(), message);
            }
        }
    }

    /**
     * 更新未读消息状态。
     * @param {number} id 
     * @param {Message} message 
     */
    MessagingController.prototype.updateUnread = function(id, message) {
        if (message.isRead()) {
            return;
        }

        var panel = g.app.messagePanel.getCurrentPanel();
        if (null != panel && panel.id == id) {
            // 将新消息标记为已读
            cube.messaging.markRead(message);
            return;
        }

        panel = g.app.messagePanel.getPanel(id);
        if (undefined !== panel && panel.unreadCount > 0) {
            g.app.messageCatalog.updateBadge(id, panel.unreadCount);
        }
    }

    /**
     * 修改群组名称。
     * @param {Group} group 
     * @param {string} newName 
     * @param {funciton} handle 
     */
    MessagingController.prototype.modifyGroupName = function(group, newName, handle) {
        group.modifyName(newName, function(group) {
            g.dialog.launchToast(Toast.Success, '已修改群组名称');
            if (handle) {
                handle(group);
            }
        }, function(error) {
            g.dialog.launchToast(Toast.Warning, '修改群名称失败: ' + error.code);
        });
    }

    /**
     * 从界面上移除群组。
     * @param {Group} group 
     */
    MessagingController.prototype.removeGroup = function(group) {
        g.app.messageCatalog.removeItem(group);
        g.app.messagePanel.clearPanel(group.getId());
        this.hideSidebar();

        // 从列表里删除
        cube.messaging.deleteRecentMessager(group);
    }

    /**
     * 从界面上移除联系人。
     * @param {Group} group 
     */
     MessagingController.prototype.removeContact = function(contact) {
        g.app.messageCatalog.removeItem(contact);
        g.app.messagePanel.clearPanel(contact.getId());
        this.hideSidebar();

        // 从列表里删除
        cube.messaging.deleteRecentMessager(contact);
    }

    g.MessagingController = MessagingController;

})(window);
