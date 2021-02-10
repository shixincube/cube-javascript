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
    'use strict'

    var that = null;

    function matchFileIcon(type) {
        if (type == 'png' || type == 'jpeg' || type == 'gif' || type == 'jpg' || type == 'bmp') {
            return '<i class="file-icon ci-wide ci-file-image-wide"></i>';
        }
        else if (type == 'xls' || type == 'xlsx') {
            return '<i class="file-icon ci-wide ci-file-excel-wide"></i>';
        }
        else if (type == 'ppt' || type == 'pptx') {
            return '<i class="file-icon ci-wide ci-file-powerpoint-wide"></i>';
        }
        else if (type == 'doc' || type == 'docx') {
            return '<i class="file-icon ci-wide ci-file-word-wide"></i>';
        }
        else if (type == 'mp3' || type == 'ogg' || type == 'wav') {
            return '<i class="file-icon ci-wide ci-file-music-wide"></i>';
        }
        else if (type == 'pdf') {
            return '<i class="file-icon ci-wide ci-file-pdf-wide"></i>';
        }
        else if (type == 'rar') {
            return '<i class="file-icon ci-wide ci-file-rar-wide"></i>';
        }
        else if (type == 'zip' || type == 'gz') {
            return '<i class="file-icon ci-wide ci-file-zip-wide"></i>';
        }
        else if (type == 'txt' || type == 'log') {
            return '<i class="file-icon ci-wide ci-file-text-wide"></i>';
        }
        else if (type == 'mp4' || type == 'mkv' || type == 'avi' || type == 'ts') {
            return '<i class="file-icon ci-wide ci-file-video-wide"></i>';
        }
        else if (type == 'psd') {
            return '<i class="file-icon ci-wide ci-file-psd-wide"></i>';
        }
        else if (type == 'exe' || type == 'dll') {
            return '<i class="file-icon ci-wide ci-file-windows-wide"></i>';
        }
        else if (type == 'apk') {
            return '<i class="file-icon ci-wide ci-file-apk-wide"></i>';
        }
        else if (type == 'dmg') {
            return '<i class="file-icon ci-wide ci-file-dmg-wide"></i>';
        }
        else {
            return '<i class="file-icon ci-wide ci-file-unknown-wide"></i>';
        }
    }

    /**
     * 消息操作主面板。
     * @param {jQuery} el 界面元素。
     */
    var MessagePanel = function(el) {
        this.el = el;
        this.panels = {};

        that = this;

        // 当前面板
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

    /**
     * 初始化上下文菜单操作。
     */
    MessagePanel.prototype.initContextMenu = function() {
        this.elContent.contextMenu({
            selector: '.direct-chat-text',
            callback: function(key, options) {
                // var m = "clicked: " + key + " on " + $(this).attr('id');
                // console.log(m);
                var entity = that.current.entity;
                if (key == 'delete') {
                    g.app.messagingCtrl.deleteMessage(entity, parseInt($(this).attr('data-id')));
                }
                else if (key == 'recall') {
                    g.app.messagingCtrl.recallMessage(entity, parseInt($(this).attr('data-id')));
                }
            },
            items: {
                // "forward": { name: "转发" },
                "recall": {
                    name: "撤回",
                    disabled: function(key, opt) {
                        return ($(this).attr('data-owner') == 'false');
                    }
                },
                "delete": {
                    name: "删除",
                    disabled: function(key, opt) {
                        return false;
                    }
                }
            }
        });
    }

    /**
     * @returns {object} 返回当前面板。
     */
    MessagePanel.prototype.getCurrentPanel = function() {
        return this.current;
    }

    /**
     * @param {number} id 指定面板 ID 。
     * @returns {object}
     */
    MessagePanel.prototype.getPanel = function(id) {
        return this.panels[id.toString()];
    }

    /**
     * 更新面板数据。
     * @param {number} id 
     * @param {Contact|Group} entity 
     */
    MessagePanel.prototype.updatePanel = function(id, entity) {
        var panel = this.panels[id.toString()];
        if (undefined === panel) {
            var el = $('<div class="direct-chat-messages"></div>');
            panel = {
                id: id,
                el: el,
                entity: entity,
                messageIds: [],
                unreadCount: 0,
                groupable: (entity instanceof Group)
            };
            this.panels[id.toString()] = panel;
        }

        if (null != this.current) {
            if (this.current.id == id) {
                if (panel.groupable) {
                    this.elTitle.text(entity.getName());
                }
                else {
                    this.elTitle.text(entity.getPriorityName());
                }
            }
        }
    }

    /**
     * 切换面板。
     * @param {number} id 面板 ID 。
     * @param {Contact|Group} entity 对应的联系人或者群组。
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
                unreadCount: 0,
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
        panel.unreadCount = 0;

        if (panel.groupable) {
            if (!this.btnVideoCall[0].hasAttribute('disabled')) {
                this.btnVideoCall.attr('disabled', 'disabled');
            }
            if (!this.btnVoiceCall[0].hasAttribute('disabled')) {
                this.btnVoiceCall.attr('disabled', 'disabled');
            }

            this.elTitle.text(entity.getName());
        }
        else {
            this.btnVideoCall.removeAttr('disabled');
            this.btnVoiceCall.removeAttr('disabled');

            this.elTitle.text(entity.getAppendix().hasRemarkName() ?
                entity.getAppendix().getRemarkName() : entity.getName());
        }

        // 滚动条控制
        var offset = parseInt(this.elContent.prop('scrollHeight'));
        this.elContent.scrollTop(offset);

        panel.messageIds.forEach(function(messageId) {
            window.cube().messaging.markRead(messageId);
        });
    }

    /**
     * 清空指定面板。
     * @param {number} id 指定面板 ID 。
     */
    MessagePanel.prototype.clearPanel = function(id) {
        var panel = this.panels[id.toString()];
        if (undefined != panel) {
            panel.el.remove();

            if (this.current == panel) {
                this.current = null;
            }

            delete this.panels[id.toString()];
        }

        this.btnVideoCall.attr('disabled', 'disabled');
        this.btnVoiceCall.attr('disabled', 'disabled');
        this.btnSendFile.attr('disabled', 'disabled');
        this.elTitle.text('');
    }

    /**
     * 删除消息。
     * @param {Contact|Group} target 指定面板对应的数据实体。
     * @param {Message} message 指定待删除的消息。
     */
    MessagePanel.prototype.removeMessage = function(target, message) {
        var panelId = target.getId();
        var panel = this.panels[panelId.toString()];
        if (undefined === panel) {
            return;
        }

        var id = message.getId();
        var index = panel.messageIds.indexOf(id);
        if (index >= 0) {
            panel.messageIds.splice(index, 1);
        }

        var panelEl = panel.el;
        var el = panelEl.find('#' + id);
        el.remove();
    }

    /**
     * 向指定面板内追加消息。
     * @param {Contact|Group} target 面板对应的数据实体。
     * @param {Contact} sender 消息发送者。
     * @param {Message} message 消息。
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
                unreadCount: 0,
                groupable: (target instanceof Group)
            };
            this.panels[panelId.toString()] = panel;
        }

        var id = message.getId();
        var time = message.getRemoteTimestamp();

        var index = panel.messageIds.indexOf(id);
        if (index >= 0) {
            return;
        }
        // 更新消息 ID 列表
        panel.messageIds.push(id);

        // 更新未读数量
        if (!message.isRead()) {
            panel.unreadCount += 1;
        }

        var right = '';
        var nfloat = 'float-left';
        var tfloat = 'float-right';

        if (sender.getId() == g.app.getSelf().getId()) {
            right = 'right';
            nfloat = 'float-right';
            tfloat = 'float-left';
        }

        var text = null;
        var attachment = null;

        if (message instanceof TextMessage) {
            text = message.getText();
        }
        else if (message instanceof ImageMessage || message instanceof FileMessage) {
            attachment = message.getAttachment();
        }
        else if (message instanceof CallRecordMessage) {
            var icon = message.getConstraint().video ? '<i class="fas fa-video"></i>' : '<i class="fas fa-phone"></i>';
            var answerTime = message.getAnswerTime();
            var desc = null;
            if (answerTime > 0) {
                desc = '通话时长 ' + g.formatClockTick(parseInt(message.getDuration() / 1000));
            }
            else {
                if (message.isCaller(g.app.getSelf().getId())) {
                    desc = '对方未接听';
                }
                else {
                    desc = '未接听';
                }
            }

            text = [
                '<div>', icon, '&nbsp;&nbsp;<span style="font-size:14px;">', desc, '</span></div>'
            ];
            text = text.join('');
        }
        else {
            return;
        }

        if (null != attachment) {
            var action = null;
            var fileDesc = null;

            if (attachment.isImageType()) {
                action = ['javascript:dialog.showImage(\'', attachment.getFileCode(), '\');'];

                fileDesc = ['<table class="file-label" border="0" cellspacing="4" cellpodding="0">',
                    '<tr>',
                        '<td>',
                            '<img class="thumb" src="', attachment.getDefaultThumbURL(), '" onclick="', action.join(''), '" ',
                                'alt="', attachment.getFileName(), '"', ' />',
                        '</td>',
                    '</tr>',
                '</table>'];
            }
            else {
                action = ['<a class="btn btn-xs btn-default" title="下载文件" href="javascript:dialog.downloadFile(\'',
                                attachment.getFileCode(), '\');">',
                    '<i class="fas fa-download"></i>',
                '</a>'];

                fileDesc = ['<table class="file-label" border="0" cellspacing="4" cellpodding="0">',
                    '<tr>',
                        '<td rowspan="2" valign="middle" align="center">', matchFileIcon(attachment.getFileType()), '</td>',
                        '<td colspan="2" class="file-name">', attachment.getFileName(), '</td>',
                    '</tr>',
                    '<tr>',
                        '<td class="file-size">', formatSize(attachment.getFileSize()), '</td>',
                        '<td class="file-action">', action.join(''), '</td>',
                    '</tr>',
                '</table>'];
            }

            text = fileDesc.join('');
        }

        var html = ['<div id="', id, '" class="direct-chat-msg ', right, '"><div class="direct-chat-infos clearfix">',
            '<span class="direct-chat-name ', nfloat, panel.groupable ? '' : ' no-display', '">',
                sender.getPriorityName(),
            '</span><span class="direct-chat-timestamp ', tfloat, '">',
                formatFullTime(time),
            '</span></div>',
            '<img src="', sender.getContext().avatar, '" class="direct-chat-img">',
            '<div data-id="', id, '" data-owner="', right.length > 0, '" class="direct-chat-text">', text, '</div></div>'
        ];

        var parentEl = panel.el;
        parentEl.append($(html.join('')));

        // 滚动条控制
        var offset = parseInt(this.elContent.prop('scrollHeight'));
        this.elContent.scrollTop(offset);
    }

    /**
     * 插入注解内容到消息面板。
     * @param {Contact|Group} target 面板对应的数据实体。
     * @param {string} note 注解内容。
     */
    MessagePanel.prototype.appendNote = function(target, note) {
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

        var html = [
            '<div class="note">', note, '</div>'
        ];

        var parentEl = panel.el;
        parentEl.append($(html.join('')));

        // 滚动条控制
        var offset = parseInt(this.elContent.prop('scrollHeight'));
        this.elContent.scrollTop(offset);
    }

    /**
     * 当触发发送消息事件时回调。
     * @param {*} e 
     */
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

    /**
     * 当触发点击详情是回调。
     * @param {*} e 
     */
    MessagePanel.prototype.onDetailsClick = function(e) {
        if (null == this.current) {
            return;
        }

        var entity = this.current.entity;

        if (this.current.groupable) {
            g.app.groupDetails.show(entity);
        }
        else {
            g.app.contactDetails.show(entity);
        }
    }

    g.MessagePanel = MessagePanel;

})(window);
