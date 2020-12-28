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
     * @param {number} panelId 
     * @param {Contact} sender 
     * @param {Message} message 
     */
    MessagePanel.prototype.appendMessage = function(panelId, sender, message) {
        var panel = this.panels[panelId.toString()];
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

        var id = message.getId();
        var time = message.getLocalTimestamp();

        var index = panel.messageIds.indexOf(id);
        if (index >= 0) {
            return;
        }
        // 更新消息 ID 列表
        panel.messageIds.push(id);

        var right = '';
        var nfloat = 'float-left';
        var tfloat = 'float-right';

        if (sender.id == g.app.getSelf().getId()) {
            right = 'right';
            nfloat = 'float-right';
            tfloat = 'float-left';
        }

        var text = null;
        var fileInfo = null;

        var attachment = null;

        if (message instanceof TextMessage) {
            text = message.getText();
        }

        // if (typeof content === 'string') {
        //     text = content;
        // }
        // else if (content instanceof Message) {
        //     if (content.hasAttachment()) {
        //         attachment = content.getAttachment();
        //         fileInfo = {
        //             name: attachment.getFileName(),
        //             size: attachment.getFileSize()
        //         };
        //     }
        //     else {
        //         text = content.getPayload().content;
        //     }
        // }
        // else if (content instanceof File) {
        //     fileInfo = {
        //         name: content.name,
        //         size: content.size
        //     };
        // }

        if (null != fileInfo) {
            var action = null;
            if (null == attachment) {
                action = [];
            }
            else {
                var type = attachment.getFileType();
                if (type == 'png' || type == 'jpg' || type == 'gif') {
                    action = ['<a class="btn btn-xs btn-info" title="查看图片" href="javascript:app.showImage(\'',
                                    attachment.getFileCode(), '\');">',
                        '<i class="fas fa-file-image"></i>',
                    '</a>'];
                }
                else {
                    action = ['<a class="btn btn-xs btn-info" title="下载文件" href="javascript:app.downloadFile(\'',
                                    attachment.getFileCode(), '\');">',
                        '<i class="fas fa-download"></i>',
                    '</a>'];
                }
            }

            var fileDesc = ['<table class="file-label" border="0" cellspacing="4" cellpodding="0">',
                    '<tr>',
                        '<td rowspan="2">', '<i class="fa fa-file file-icon"></i>', '</td>',
                        '<td colspan="2" class="file-name">', fileInfo.name, '</td>',
                    '</tr>',
                    '<tr>',
                        '<td class="file-size">', formatSize(fileInfo.size), '</td>',
                        '<td class="file-action">', action.join(''), '</td>',
                    '</tr>',
                '</table>'];
            text = fileDesc.join('');
        }

        var html = ['<div id="', id, '" class="direct-chat-msg ',
                right, '"><div class="direct-chat-infos clearfix"><span class="direct-chat-name ', nfloat, '">',
            sender.getName(),
            '</span><span class="direct-chat-timestamp ', tfloat, '">',
            formatFullTime(time),
            '</span></div>',
            '<img src="', sender.getContext().avatar, '" class="direct-chat-img">',
            '<div class="direct-chat-text">', text, '</div></div>'
        ];

        var parentEl = panel.el;
        parentEl.append($(html.join('')));

        // 滚动条控制
        var offset = parseInt(this.elContent.prop('scrollHeight'));
        this.elContent.scrollTop(offset);
    }

    MessagePanel.prototype.onSend = function(e) {
        var text = this.elInput.val();
        if (text.length == 0) {
            return;
        }

        this.elInput.val('');

        // 触发发送
        var message = g.app.messagingCtrl.fireSend(this.current.entity, text);
        if (null == message) {
            return;
        }

        this.appendMessage(this.current.id, g.app.getSelf(), message);
    }

    g.MessagePanel = MessagePanel;

})(window);
