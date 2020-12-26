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
    }

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
            }

            if (list.length > 0) {
                var last = list[list.length - 1];
                // 更新目录项
                g.app.messageCatalog.updateItem(id, last);
            }
        }

        for (var i = 0; i < cubeContacts.length; ++i) {
            var contact = cubeContacts[i];
            cube.messaging.queryMessageWithContact(contact, time, function(id, time, list) {
                handler(id, list);
            });
        }
    }

    g.MessagingController = MessagingController;
})(window);
