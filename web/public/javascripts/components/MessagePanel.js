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

/**
 * 消息操作主面板。
 */
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
        this.btnSend = el.find('button[data-target="send"]');
        this.btnSend.attr('disabled', 'disabled');
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

        // 发送文件
        this.btnSendFile = el.find('button[data-target="send-file"]');
        this.btnSendFile.attr('disabled', 'disabled');
        this.btnSendFile.on('click', function(event) {
            g.app.messagingCtrl.selectFile($('#select_file'));
        });

        // 视频通话
        this.btnVideoCall = el.find('button[data-target="video-call"]');
        this.btnVideoCall.attr('disabled', 'disabled');
        this.btnVideoCall.on('click', function() {
            g.app.messagingCtrl.openVideoChat(that.current.entity);
        });

        // 语音通话
        this.btnVoiceCall = el.find('button[data-target="voice-call"]');
        this.btnVoiceCall.attr('disabled', 'disabled');
        this.btnVoiceCall.on('click', function() {
            g.app.messagingCtrl.openVoiceCall(that.current.entity);
        });

        // 详情按钮
        el.find('button[data-target="details"]').on('click', function(e) {
            that.onDetailsClick(e);
        });

        // 新建群组
        this.btnNewGroup = el.find('button[data-target="new-group"]');
        this.btnNewGroup.on('click', function(e) {
            g.app.newGroupDialog.show();
        });

        // 初始化上下文菜单
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

    /**
     * 切换面板。
     * @param {number} id 
     * @param {Contact|Group} entity 
     */
    MessagePanel.prototype.changePanel = function(id, entity) {
        var panel = this.panels[id.toString()];
        if (undefined === panel) {
            var el = $('<div class="direct-chat-messages"></div>');
            panel = {
                id: id,
                el: el,
                entity: entity,
                messageIds: [],
                groupable: (entity instanceof Group)
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

        if (panel.groupable) {
            if (!this.btnVideoCall[0].hasAttribute('disabled')) {
                this.btnVideoCall.attr('disabled', 'disabled');
            }
            if (!this.btnVoiceCall[0].hasAttribute('disabled')) {
                this.btnVoiceCall.attr('disabled', 'disabled');
            }
        }
        else {
            this.btnVideoCall.removeAttr('disabled');
            this.btnVoiceCall.removeAttr('disabled');
        }

        this.elTitle.text(entity.getName());
    }

    /**
     * 向指定面板内追加消息。
     * @param {Contact|Group} target 
     * @param {Contact} sender 
     * @param {Message} message 
     */
    MessagePanel.prototype.appendMessage = function(target, sender, message) {
        var panelId = target.getId();

        var panel = this.panels[panelId.toString()];
        if (undefined === panel) {
            var el = $('<div class="direct-chat-messages"></div>');
            panel = {
                id: panelId,
                el: el,
                entity: target,
                messageIds: [],
                groupable: (target instanceof Group)
            };
            this.panels[panelId.toString()] = panel;
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
        var attachment = null;

        if (message instanceof TextMessage) {
            text = message.getText();
        }
        else if (message instanceof FileMessage) {
            attachment = message.getAttachment();
        }
        else {
            return;
        }

        if (null != attachment) {
            var action = null;

            var type = attachment.getFileType();
            if (type == 'png' || type == 'jpg' || type == 'gif') {
                action = ['<a class="btn btn-xs btn-default" title="查看图片" href="javascript:dialog.showImage(\'',
                                attachment.getFileCode(), '\');">',
                    '<i class="fas fa-file-image"></i>',
                '</a>'];
            }
            else {
                action = ['<a class="btn btn-xs btn-default" title="下载文件" href="javascript:dialog.downloadFile(\'',
                                attachment.getFileCode(), '\');">',
                    '<i class="fas fa-download"></i>',
                '</a>'];
            }

            var fileDesc = ['<table class="file-label" border="0" cellspacing="4" cellpodding="0">',
                    '<tr>',
                        '<td rowspan="2">', '<i class="fa fa-file file-icon"></i>', '</td>',
                        '<td colspan="2" class="file-name">', attachment.getFileName(), '</td>',
                    '</tr>',
                    '<tr>',
                        '<td class="file-size">', formatSize(attachment.getFileSize()), '</td>',
                        '<td class="file-action">', action.join(''), '</td>',
                    '</tr>',
                '</table>'];
            text = fileDesc.join('');
        }

        var html = ['<div id="', id, '" class="direct-chat-msg ', right, '"><div class="direct-chat-infos clearfix">',
            '<span class="direct-chat-name ', nfloat, '">',
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
            g.dialog.launchToast(Toast.Error, '发送消息失败');
        }
    }

    MessagePanel.prototype.onDetailsClick = function(e) {
        if (null == this.current) {
            return;
        }

        var entity = this.current.entity;

        if (this.current.groupable) {
            var el = $('#modal_group_details');
            el.find('.widget-user-username').text(entity.getName());
    
            // 设置数据
            $('#group_details_quit').attr('data', entity.getId());
            $('#group_details_dissolve').attr('data', entity.getId());

            var table = el.find('.table');
            table.find('tbody').remove();
            table.append(this.current.detailMemberTable);
            el.modal('show');
        }
        else {
            g.app.contactDetails.show(entity);
        }
    }

    g.MessagePanel = MessagePanel;

})(window);
