// MessagingController.js

(function(g) {
    'use strict'

    var cube = null;

    var MessagingController = function(cubeEngine) {
        cube = cubeEngine;
    }

    MessagingController.prototype.updateContactMessages = function(cubeContacts) {
        var time = Date.now() - window.AWeek;

        var handler = function(id, list) {
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
