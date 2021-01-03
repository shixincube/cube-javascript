/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020 Shixin Cube Team.
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
    'use strict'

    var cube = null;

    var contacts = null;

    var elSelectFile = null;

    var getContact = function(id) {
        for (var i = 0; i < contacts.length; ++i) {
            var c = contacts[i];
            if (c.getId() == id) {
                return c;
            }
        }
        return null;
    }

    var MessagingController = function(cubeEngine) {
        cube = cubeEngine;
        var that = this;

        // 监听消息已发送事件
        cube.messaging.on(MessagingEvent.Sent, function(event) {
            var message = event.data;
            g.app.messagePanel.appendMessage(g.app.messagePanel.current.entity, g.app.getSelf(), message);
            g.app.messageCatalog.updateItem(message.getTo(), message, message.getLocalTimestamp());
        });

        // 监听接收消息事件
        cube.messaging.on(MessagingEvent.Notify, function(event) {
            var message = event.data;
            // 触发 UI 事件
            that.onNewMessage(message);
        });
    }

    /**
     * 更新联系人的消息清单。
     * @param {Array} cubeContacts 
     */
    MessagingController.prototype.updateContactMessages = function(cubeContacts) {
        contacts = cubeContacts;
        var time = Date.now() - window.AWeek;

        var announcer = new Announcer(contacts.length - 1, 10000);
        announcer.addAudience(function(total, map) {
            g.app.messageCatalog.refreshOrder();
        });

        var handler = function(id, list) {
            for (var i = 0; i < list.length; ++i) {
                var message = list[i];
                var target = null;
                // 判断自己是否是该消息的发件人
                if (cube.messaging.isSender(message)) {
                    target = getContact(message.getTo());
                }
                else {
                    target = getContact(message.getFrom());
                }

                // 添加到消息面板
                g.app.messagePanel.appendMessage(target, getContact(message.getFrom()), message);
            }

            for (var i = list.length - 1; i >= 0; --i) {
                var last = list[i];
                // 更新目录项
                if (g.app.messageCatalog.updateItem(id, last, last.getRemoteTimestamp())) {
                    break;
                }
            }

            announcer.announce(id.toString(), list);
        }

        for (var i = 0; i < cubeContacts.length; ++i) {
            var contact = cubeContacts[i];
            if (contact.getId() == g.app.account.id) {
                // 跳过自己
                continue;
            }

            cube.messaging.queryMessageWithContact(contact, time, function(id, time, list) {
                handler(id, list);
            });
        }
    }

    MessagingController.prototype.selectFile = function(el) {
        if (null == elSelectFile) {
            var that = this;
            elSelectFile = el;
            elSelectFile.on('change', function(e) {
                var file = e.target.files[0];
                that.fireSend(g.app.messagePanel.current.entity, file);
            });
        }

        elSelectFile.click();
    }

    /**
     * 发送消息。
     * @param {number} id 
     * @param {Contact|Group} target 
     * @param {string|File} content 
     */
    MessagingController.prototype.fireSend = function(target, content) {
        var message = null;

        if (typeof content === 'string') {
            message = new TextMessage(content);
        }
        else if (content instanceof File) {
            message = new FileMessage(content);
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
     * @param {number} id 
     */
    MessagingController.prototype.toggle = function(id) {
        var handle = function(item) {
            if (null == item) {
                return;
            }

            g.app.messagePanel.changePanel(id, item);
        }

        g.app.getGroup(id, function(group) {
            if (null == group) {
                g.app.getContact(id, handle);
            }
            else {
                handle(group);
            }
        });
    }

    MessagingController.prototype.recallMessage = function(entity, id) {
        cube.messaging.recallMessage(id, function(message) {
            g.app.messagePanel.appendNote(entity, '消息已撤回 ' + g.formatFullTime(Date.now()));
            g.app.messagePanel.removeMessage(entity, message);
        }, function(error) {
            g.dialog.launchToast(Toast.Error,
                (error.code == MessagingServiceState.DataTimeout) ? '消息发送超过2分钟，不能撤回' : '撤回消息失败');
            console.log('撤回消息失败 - ' + error);
        })
    }

    MessagingController.prototype.deleteMessage = function(entity, id) {
        cube.messaging.deleteMessage(id, function(message) {
            g.dialog.launchToast(Toast.Success, '消息已删除');
            g.app.messagePanel.removeMessage(entity, message);
        }, function(error) {
            g.dialog.launchToast(Toast.Error, '删除消息失败');
            console.log('删除消息失败 - ' + error);
        });
    }

    MessagingController.prototype.openVoiceCall = function(target) {
        g.app.voiceCallPanel.showMakeCall(target);
    }

    MessagingController.prototype.closeVoiceCall = function() {

    }

    MessagingController.prototype.openVideoChat = function(target) {
        g.app.videoChatPanel.show(target);
    }

    MessagingController.prototype.closeVideoChat = function() {
        
    }

    MessagingController.prototype.onNewMessage = function(message) {
        // 判断消息是否来自群组
        if (message.isFromGroup()) {
            // 消息来自群组
            /*var group = this.getGroup(message.getSource());
            if (null != group) {
                // 更新目录
                this.messageCatalogue.updateItem(group.getId(), message, message.getRemoteTimestamp());

                // 更新消息面板
                this.messagePanel.appendMessage(message.getId(), this.getContact(message.getFrom()), message, message.getRemoteTimestamp(), group);
            }
            else {
                // 从服务器获取新群组
                // TODO
            }*/
        }
        else {
            // 消息来自联系人
            var itemId = 0;
            var sender = g.app.queryContact(message.getFrom());
            var target = null;

            if (g.app.account.id == message.getFrom()) {
                // 从“我”的其他终端发送的消息
                itemId = message.getTo();
                target = g.app.queryContact(message.getTo());
            }
            else {
                itemId = message.getFrom();
                target = sender;
            }

            g.app.messagePanel.appendMessage(target, sender, message);
            g.app.messageCatalog.updateItem(itemId, message, message.getLocalTimestamp());
        }
    }

    g.MessagingController = MessagingController;

})(window);
