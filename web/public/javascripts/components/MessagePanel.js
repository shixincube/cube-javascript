// MessagePanel.js

(function(g) {
    'use strict'

    var MessagePanel = function(el) {
        this.el = el;
        this.panels = {};

        var that = this;

        /**
         * 当前面板
         */
        this.current = null;

        this.elTitle = this.el.find('.card-title');
        this.elContent = this.el.find('.card-body');
        this.elInput = this.el.find('textarea');
        this.elInput.val('');
        if (!this.elInput[0].hasAttribute('disabled')) {
            this.elInput.attr('disabled', 'disabled');
        }

        // 发送按钮 Click 事件
        this.btnSend = this.el.find('button[data-target="send"]');
        this.btnSend.on('click', function(event) {
            that.onSend(event);
        });
        // 发送框键盘事件
        this.elInput.keypress(function(event) {
            var e = event || window.event;
            if (e && e.keyCode == 13 && e.ctrlKey) {
                that.onSend(e);
            }
        });

        this.btnSendFile = this.el.find('button[data-target="send-file"]');

        this.initContextMenu();
    }

    MessagePanel.prototype.initContextMenu = function() {
        this.elContent.contextMenu({
            selector: '.direct-chat-msg',
            callback: function(key, options) {
                // var m = "clicked: " + key + " on " + $(this).attr('id');
                // console.log(m);
                if (key == 'delete') {
                    //g.app.fireDeleteMessage(parseInt($(this).attr('id')));
                }
                else if (key == 'recall') {
                    //g.app.fireRecallMessage(parseInt($(this).attr('id')));
                }
            },
            items: {
                // "forward": { name: "转发" },
                "recall": { name: "撤回" },
                "delete": { name: "删除" }
            }
        });
    }

    MessagePanel.prototype.changePanel = function(id, entity) {
        var panel = this.panels[id.toString()];
        if (undefined === panel) {
            var el = $('<div class="direct-chat-messages"></div>');
            panel = {
                id: id,
                el: el,
                entity: entity,
                messageIds: []
            };
            this.panels[id.toString()] = panel;
        }

        if (null == this.current) {
            this.elInput.removeAttr('disabled');
            this.btnSend.removeAttr('disabled');
            this.btnSendFile.removeAttr('disabled');
        }
        else {
            this.current.el.remove();
        }

        this.elContent.append(panel.el);

        this.current = panel;

        this.elTitle.text(entity.getName());
    }

    /**
     * 向指定面板内追加消息。
     * @param {number} id 
     * @param {Contact} sender 
     * @param {Message|File|string} content 
     * @param {number} time 
     */
    MessagePanel.prototype.appendMessage = function(id, sender, content, time) {
        var panel = this.panels[id.toString()];
        if (undefined === panel) {
            return;
        }


    }

    MessagePanel.prototype.onSend = function(e) {
        var text = this.elInput.val();
        if (text.length == 0) {
            return;
        }

        this.elInput.val('');

        // 触发发送
        var message = g.app.messagingCtrl.fireSend(this.current.entity, text);

        //this.appendMessage(message.id, g.app.contact, text, Date.now());
    }

    g.MessagePanel = MessagePanel;

})(window);
