// MessagingController.js

(function(g) {
    'use strict'

    var cube = null;

    var contacts = null;

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

            if (list.length > 0) {
                var last = list[list.length - 1];
                // 更新目录项
                g.app.messageCatalog.updateItem(id, last, last.getRemoteTimestamp());
            }
        }

        for (var i = 0; i < cubeContacts.length; ++i) {
            var contact = cubeContacts[i];
            cube.messaging.queryMessageWithContact(contact, time, function(id, time, list) {
                handler(id, list);
            });
        }
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
            //message = new FileMessage(content);
        }
        else {
            g.dialog.launchToast(Toast.Warning, '程序内部错误');
            return null;
        }

        message = cube.messaging.sendTo(target, message);
        return message;
    }

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

    MessagingController.prototype.onNewMessage = function(message) {

    }

    g.MessagingController = MessagingController;

})(window);
