/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020-2022 Cube Team.
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

    // 消息输入框是否使用编辑器
    var activeEditor = true;

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
        this.elStateBar = this.el.find('.card-header').find('.state-bar');
        this.elInfoBar = this.el.find('.card-header').find('.info-bar');
        this.elContent = this.el.find('.card-body');

        this.inputEditor = null;
        this.elInput = null;

        this.atPanel = this.el.find('.at-someone');
        this.atPanel.blur(function(e) { that.onAtPanelBlur(e); });
        this.atElList = [];

        // 格式化内容
        this.formatContents = [];
        // 最近一次内容记录
        this.lastInput = '';

        if (activeEditor) {
            this.el.find('textarea').parent().remove();
            $('#message-editor').parent().css('display', 'flex');

            var editor = new window.wangEditor('#message-editor');
            editor.config.menus = [];
            editor.config.height = 70;
            editor.config.placeholder = '';
            editor.config.fontSizes = { normal: '14px', value: '3' };
            editor.config.lineHeights = ['1'];
            editor.config.onchange = function(html) {
                that.onEditorChange(html);
            };
            editor.config.pasteTextHandle = function(pasteStr) {
                return that.handlePasteText(pasteStr);
            };
            editor.create();
            editor.disable();
            this.inputEditor = editor;

            var weEl = $('#message-editor').find('.w-e-text');
            weEl.keypress(function(event) {
                that.onEditorKeypress(event);
            });
            this.weEl = weEl;
            // weEl[0].addEventListener('paste', function(event) {
            //     return that.onEditorPaste(event);
            // });
            // weEl.on('paste', function(event) {
            //     return that.onEditorPaste(event.originalEvent);
            // });
        }
        else {
            $('#message-editor').parent().remove();

            this.elInput = this.el.find('textarea');
            this.elInput.parent().css('display', 'flex');
            this.elInput.val('');
            if (!this.elInput[0].hasAttribute('disabled')) {
                this.elInput.attr('disabled', 'disabled');
            }
            // 发送框键盘事件
            this.elInput.keypress(function(event) {
                var e = event || window.event;
                if (e && e.keyCode == 13 && e.ctrlKey) {
                    that.onSend(e);
                }
            });
        }

        // 状态信息条显示控制
        this.infoBarDelayTimer = 0;
        this.elStateBar.on('mouseenter', function() {
            if (that.infoBarDelayTimer > 0) {
                clearTimeout(that.infoBarDelayTimer);
                that.infoBarDelayTimer = 0;
            }
            that.toggleBarInfo();
        });
        this.elStateBar.on('mouseleave', function() {
            that.infoBarDelayTimer = setTimeout(function() {
                that.toggleBarInfo();
                clearTimeout(that.infoBarDelayTimer);
                that.infoBarDelayTimer = 0;
            }, 1000);
        });
        this.elInfoBar.on('mouseenter', function() {
            if (that.infoBarDelayTimer > 0) {
                clearTimeout(that.infoBarDelayTimer);
                that.infoBarDelayTimer = 0;
            }
        });
        this.elInfoBar.on('mouseleave', function() {
            if (that.infoBarDelayTimer > 0) {
                clearTimeout(that.infoBarDelayTimer);
                that.infoBarDelayTimer = 0;
            }
            that.toggleBarInfo();
        });

        // 发送按钮 Click 事件
        this.btnSend = el.find('button[data-target="send"]');
        this.btnSend.attr('disabled', 'disabled');
        this.btnSend.on('click', function(event) {
            that.onSend(event);
        });

        // 表情符号
        this.emojiPanel = new EmojiPanel(that.onEmojiClick);
        this.btnEmoji = el.find('button[data-target="emoji"]');
        this.btnEmoji.attr('disabled', 'disabled');
        this.btnEmoji.on('mouseover', function() {
            if (null == that.current) {
                return;
            }
            that.emojiPanel.show(that.btnEmoji);
        });
        this.btnEmoji.on('mouseout', function() {
            if (null == that.current) {
                return;
            }
            that.emojiPanel.tryHide();
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

        // 新建群组
        el.find('button[data-target="new-group"]').on('click', function(e) {
            that.onNewGroupClick(e);
        });

        // 详情按钮
        el.find('button[data-target="details"]').on('click', function(e) {
            that.onDetailsClick(e);
        });

        // 折叠辅助信息
        el.find('button[data-target="collapse"]').on('click', function(e) {
            that.onCollapseClick(e);
        });

        // 对当前选择的实体的通话进行时间计数的计时器
        this.callTimer = 0;
        this.callStartTime = 0;

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
     * 获取当前操作的面板。
     * @returns {object} 返回当前面板。
     */
    MessagePanel.prototype.getCurrentPanel = function() {
        return this.current;
    }

    /**
     * 获取指定 ID 实体的面板。
     * @param {number} id 指定面板 ID 。
     * @returns {object}
     */
    MessagePanel.prototype.getPanel = function(id) {
        return this.panels[id.toString()];
    }

    /**
     * 是否包含该目标的面板。
     * @param {number|Contact|Group} idOrEntity 
     * @returns {boolean}
     */
    MessagePanel.prototype.hasPanel = function(idOrEntity) {
        if (typeof idOrEntity === 'number') {
            return (undefined !== this.panels[idOrEntity.toString()]);
        }
        else {
            return (undefined !== this.panels[idOrEntity.getId().toString()]);
        }
    }

    /**
     * 更新面板数据。
     * @param {number} id 
     * @param {Contact|Group} entity 
     */
    MessagePanel.prototype.updatePanel = function(id, entity) {
        var panel = this.panels[id.toString()];
        if (undefined === panel) {
            var el = $('<div class="direct-chat-messages"><div class="more-messages"><a href="javascript:app.messagingCtrl.prependMore(' + id + ');">查看更多消息</a></div></div>');
            panel = {
                id: id,
                el: el,
                entity: entity,
                messageIds: [],
                messageTimes: [],
                unreadCount: 0,
                groupable: (entity instanceof Group)
            };
            this.panels[id.toString()] = panel;
        }

        if (null != this.current) {
            if (this.current.id == id) {
                this.current.entity = entity;

                if (panel.groupable) {
                    this.elTitle.text(entity.getName());
                }
                else {
                    this.elTitle.text(entity.getPriorityName());
                }

                this.refreshStateBar();
            }
        }
    }

    /**
     * 刷新状态条信息。
     */
    MessagePanel.prototype.refreshStateBar = function() {
        if (null == this.current) {
            this.elInfoBar.css('visibility', 'hidden');
            this.elStateBar.css('visibility', 'hidden');
            if (this.callTimer > 0) {
                clearInterval(this.callTimer);
                this.callTimer = 0;
            }
            this.callStartTime = 0;
            return;
        }

        var entity = this.current.entity;

        if (entity instanceof Group) {
            entity.getAppendix().getCommId(function(commId) {
                if (commId != 0) {
                    g.cube().mpComm.getCommField(commId, function(commField) {
                        if (that.callTimer > 0) {
                            clearInterval(that.callTimer);
                        }

                        var videoEnabled = commField.mediaConstraint.videoEnabled;

                        // 更新图标
                        that.elStateBar.find('.col-2').html(videoEnabled ? '<i class="fas fa-video"></i>' : '<i class="fas fa-phone-alt"></i>');

                        // 设置人数信息
                        that.elStateBar.find('.participant').text(commField.numEndpoints() + '/' + (videoEnabled ? '6' : '16'));

                        that.callStartTime = commField.startTime;

                        function intervalHandler() {
                            if (that.callStartTime == 0) {
                                g.cube().mpComm.getCommField(commId, function(commField) {
                                    that.callStartTime = commField.startTime;
                                    if (that.callStartTime == 0) {
                                        that.callStartTime = Date.now();
                                    }
                                });
                                return;
                            }

                            var now = Date.now();
                            var duration = now - that.callStartTime;
                            that.elStateBar.find('.timer').text(g.formatClockTick(Math.round(duration/1000)));
                        }
                        that.callTimer = setInterval(intervalHandler, 1000);

                        that.elStateBar.find('.timer').text('--:--:--');
                        intervalHandler();
                        that.elStateBar.css('visibility', 'visible');

                        // 填充信息
                        var rowEl = that.elInfoBar.find('.row').eq(0);
                        rowEl.empty();
                        var html = [];
                        commField.getEndpoints().forEach(function(value) {
                            var contact = value.contact;
                            g.app.getContact(contact.getId(), function(contact) {
                                html.push('<div class="col-3"><img src="' + g.helper.getAvatarImage(contact.getContext().avatar) + '" /></div>');
                            });
                        });
                        rowEl.html(html.join(''));
                    });
                }
                else {
                    if (that.callTimer > 0) {
                        clearInterval(that.callTimer);
                        that.callTimer = 0;
                    }
                    that.callStartTime = 0;

                    that.elStateBar.css('visibility', 'hidden');
                }
            });
        }
        else {
            this.elInfoBar.css('visibility', 'hidden');
            this.elStateBar.css('visibility', 'hidden');
        }
    }

    /**
     * 显示通话信息。
     */
    MessagePanel.prototype.toggleBarInfo = function() {
        var el = this.elInfoBar;
        if (el.css('visibility') == 'hidden') {
            el.css('visibility', 'visible');
        }
        else {
            el.css('visibility', 'hidden');
        }
    }

    /**
     * 切换面板。
     * @param {number} id 面板 ID 。
     * @param {Conversation|Contact|Group} entity 对应的会话。
     */
    MessagePanel.prototype.changePanel = function(id, entity) {
        var panel = this.panels[id.toString()];
        if (undefined === panel) {
            var el = $('<div class="direct-chat-messages"><div class="more-messages"><a href="javascript:app.messagingCtrl.prependMore(' + id + ');">查看更多消息</a></div></div>');
            panel = {
                id: id,
                el: el,
                entity: entity.getPivotal(),
                conversation: entity,
                messageIds: [],
                messageTimes: [],
                unreadCount: 0, // 需要作废
                groupable: (entity instanceof Group) || (entity.getType() == ConversationType.Group)    // 需要作废
            };
            this.panels[id.toString()] = panel;
        }

        if (null == this.current) {
            if (activeEditor) {
                this.inputEditor.enable();
            }
            else {
                this.elInput.removeAttr('disabled');
            }

            this.btnEmoji.removeAttr('disabled');
            this.btnSend.removeAttr('disabled');
            this.btnSendFile.removeAttr('disabled');
            this.btnVideoCall.removeAttr('disabled');
            this.btnVoiceCall.removeAttr('disabled');
        }
        else {
            // 生成草稿
            var text = activeEditor ? this.inputEditor.txt.text().trim() : this.elInput.val().trim();
            if (text.startsWith('&nbsp;')) {
                text = text.substring(6, text.length);
            }
            if (text.endsWith('&nbsp;')) {
                text = text.substring(0, text.length - 6);
            }

            if (text.length > 0) {
                // 保存草稿
                var formatText = this.serializeHyperText();
                var htMessage = new HyperTextMessage(formatText);
                if (window.cube().messaging.saveDraft(this.current.entity, htMessage)) {
                    g.app.messageCatalog.updateItem(this.current.id, '<span class="text-danger">[草稿] ' + htMessage.getSummary() + '</span>', null, null);
                }
            }
            else {
                // 删除草稿
                window.cube().messaging.deleteDraft(this.current.id);
            }

            if (activeEditor) {
                this.inputEditor.txt.clear();
            }
            else {
                this.elInput.val('');
            }
            this.current.el.remove();
        }

        // 更新 HTML 数据
        this.elContent.append(panel.el);

        this.current = panel;
        panel.unreadCount = 0;

        if (panel.groupable) {
            // if (!this.btnVideoCall[0].hasAttribute('disabled')) {
            //     this.btnVideoCall.attr('disabled', 'disabled');
            // }
            // if (!this.btnVoiceCall[0].hasAttribute('disabled')) {
            //     this.btnVoiceCall.attr('disabled', 'disabled');
            // }

            this.elTitle.text(entity.getName());
        }
        else {
            if (entity instanceof Conversation) {
                this.elTitle.text(entity.getName());
            }
            else {
                this.elTitle.text(entity.getAppendix().hasRemarkName() ?
                    entity.getAppendix().getRemarkName() : entity.getName());
            }
        }

        // 刷新状态条
        this.refreshStateBar();

        // 滚动条控制
        var offset = parseInt(this.elContent.prop('scrollHeight'));
        this.elContent.scrollTop(offset);

        panel.messageIds.forEach(function(messageId) {
            window.cube().messaging.markRead(messageId);
        });

        // 加载草稿
        window.cube().messaging.loadDraft(this.current.id, function(draft) {
            // 更新目录
            // 最后一条消息
            if (panel.groupable) {
                window.cube().messaging.queryLastMessageWithGroup(panel.entity.getId(), function(message) {
                    g.app.messageCatalog.restoreDesc(panel.id, message.getSummary());
                });
            }
            else {
                window.cube().messaging.queryLastMessageWithContact(panel.entity.getId(), function(message) {
                    g.app.messageCatalog.restoreDesc(panel.id, message.getSummary());
                });
            }

            if (activeEditor) {
                var input = that.deserializeHyperText(draft.getMessage(), true);
                that.inputEditor.txt.append(input);
            }
            else {
                that.elInput.val(draft.getMessage().getPlaintext());
            }
        });
    }

    /**
     * 清空指定面板。
     * @param {number} id 指定面板 ID 。
     */
    MessagePanel.prototype.clearPanel = function(id) {
        var panel = this.panels[id.toString()];
        if (undefined !== panel) {
            panel.el.remove();

            if (this.current == panel) {
                this.btnEmoji.attr('disabled', 'disabled');
                this.btnVideoCall.attr('disabled', 'disabled');
                this.btnVoiceCall.attr('disabled', 'disabled');
                this.btnSendFile.attr('disabled', 'disabled');
                this.elTitle.text('');

                if (activeEditor) {
                    this.inputEditor.txt.clear();
                    this.inputEditor.disable();
                }
                else {
                    this.elInput.val('');
                    this.elInput.attr('disabled', 'disabled');
                }

                this.formatContents = [];
                this.lastInput = '';

                this.current = null;

                this.refreshStateBar();
            }

            delete this.panels[id.toString()];
        }
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
            panel.messageTimes.splice(index, 1);
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
     * @param {boolean} [scrollBottom] 是否滚动到底部。不设置该参数则不滚动。
     * @param {boolean} [animation] 是否使用动画效果。
     * @returns {jQuery} 返回添加到消息面板里的新节点。
     */
    MessagePanel.prototype.appendMessage = function(target, sender, message, scrollBottom, animation) {
        var panelId = target.getId();

        var panel = this.panels[panelId.toString()];
        if (undefined === panel) {
            var el = $('<div class="direct-chat-messages"><div class="more-messages"><a href="javascript:app.messagingCtrl.prependMore(' + panelId + ');">查看更多消息</a></div></div>');
            panel = {
                id: panelId,
                el: el,
                entity: target,
                messageIds: [],
                messageTimes: [],
                unreadCount: 0,
                groupable: (target instanceof Group)
            };
            this.panels[panelId.toString()] = panel;
        }

        var id = message.getId();
        var time = message.getRemoteTimestamp();

        var index = panel.messageIds.indexOf(id);
        if (index >= 0) {
            // console.log('消息已添加 ' + panelId + ' - ' + id);
            return null;
        }

        if (panel.messageIds.length == 0) {
            panel.messageTimes.push(time);
            panel.messageIds.push(id);
        }
        else {
            // 根据消息时间戳判断消息顺序
            for (var i = 0, len = panel.messageTimes.length; i < len; ++i) {
                var cur = panel.messageTimes[i];
                if (time <= cur) {
                    panel.messageTimes.splice(i, 0, time);
                    panel.messageIds.splice(i, 0, id);
                    break;
                }

                var next = (i + 1) < len ? panel.messageTimes[i + 1] : null;
                if (null != next) {
                    if (time < next) {
                        panel.messageTimes.splice(i + 1, 0, time);
                        panel.messageIds.splice(i + 1, 0, id);
                        break;
                    }
                }
                else {
                    panel.messageTimes.push(time);
                    panel.messageIds.push(id);
                    break;
                }
            }
        }

        // 更新索引
        index = panel.messageIds.indexOf(id);

        // 更新未读数量
        if (!message.isRead()) {
            panel.unreadCount += 1;
        }

        var html = null;
        var text = null;
        var attachment = null;

        if (message instanceof TextMessage) {
            text = message.getText();
        }
        else if (message instanceof HyperTextMessage) {
            text = this.deserializeHyperText(message);
        }
        else if (message instanceof ImageMessage || message instanceof FileMessage) {
            attachment = message.getAttachment();
            var action = null;
            var fileDesc = null;

            if (null == attachment.getFileURL()) {
                fileDesc = ['<div>', attachment.getFileName(), '<div>'];
            }
            else {
                if (attachment.isImageType()) {
                    action = ['javascript:dialog.showImage(\'', attachment.getFileCode(), '\');'];
    
                    fileDesc = ['<table class="file-label" border="0" cellspacing="4" cellpodding="0">',
                        '<tr>',
                            '<td>',
                                '<img class="thumb" src="', attachment.getDefaultThumbURL(), '" onclick="', action.join(''), '"',
                                    ' onload="app.messagePanel.refreshScroll()"',
                                    ' alt="', attachment.getFileName(), '"', ' />',
                            '</td>',
                        '</tr>',
                    '</table>'];
                }
                else {
                    /*action = ['<a class="btn btn-xs btn-default" title="下载文件" href="javascript:dialog.downloadFile(\'',
                                    attachment.getFileCode(), '\');">',
                                '<i class="fas fa-download"></i>', '</a>'];*/

                    action = ['<a class="text-secondary text-xs" title="下载文件" href="javascript:dialog.downloadFile(\'',
                                attachment.getFileCode(), '\');">',
                                '<i class="fas fa-download"></i>', '</a>'];

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
            }

            text = fileDesc.join('');
        }
        else if (message instanceof CallRecordMessage) {
            var icon = message.getConstraint().video ? '<i class="fas fa-video"></i>' : '<i class="fas fa-phone-alt"></i>';
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
        else if (message instanceof LocalNoteMessage) {
            var note = message.getText();
            var level = message.getLevel();
            if (1 == level) {
                html = [
                    '<div id="', message.getId(), '" class="note">', note, '</div>'
                ];
            }
            else if (2 == level) {
                html = [
                    '<div id="', message.getId(), '" class="note"><span class="text-warning">', note, '</span></div>'
                ];
            }
            else {
                html = [
                    '<div id="', message.getId(), '" class="note"><span class="text-danger">', note, '</span></div>'
                ];
            }
        }
        else {
            return null;
        }

        if (null == html) {
            var right = '';
            var nfloat = 'float-left';
            var tfloat = 'float-right';

            if (sender.getId() == g.app.getSelf().getId()) {
                right = 'right';
                nfloat = 'float-right';
                tfloat = 'float-left';
            }

            var stateDesc = [];
            if (right.length > 0) {
                if (message.getState() == MessageState.Sending) {
                    stateDesc.push('<div class="direct-chat-state"><i class="fas fa-spinner sending"></i></div>');
                }
                else if (message.getState() == MessageState.SendBlocked || message.getState() == MessageState.ReceiveBlocked) {
                    stateDesc.push('<div class="direct-chat-state"><i class="fas fa-exclamation-circle fault"></i></div>');
                }
            }

            // 动画效果
            var animationClass = '';
            if (undefined !== animation && animation) {
                animationClass = 'direct-chat-text-anim';
            }

            html = ['<div id="', id, '" class="direct-chat-msg ', right, '"><div class="direct-chat-infos clearfix">',
                '<span class="direct-chat-name ', nfloat, panel.groupable ? '' : ' no-display', '">',
                    sender.getPriorityName(),
                '</span><span class="direct-chat-timestamp ', tfloat, '">',
                    formatFullTime(time),
                '</span></div>',
                // 头像
                '<img src="', g.helper.getAvatarImage(sender.getContext().avatar), '" class="direct-chat-img">',
                // 状态
                stateDesc.join(''),
                '<div data-id="', id, '" data-owner="', right.length > 0, '" class="direct-chat-text ', animationClass, '">', text, '</div></div>'
            ];
        }

        var newEl = $(html.join(''));

        var parentEl = panel.el;
        if (index == 0) {
            parentEl.find('.more-messages').after(newEl);
        }
        else if (index == panel.messageIds.length - 1) {
            parentEl.append(newEl);
        }
        else {
            var prevId = (index - 1) >= 0 ? panel.messageIds[index - 1] : 0;
            var nextId = (index + 1) < panel.messageIds.length ? panel.messageIds[index + 1] : 0;
            if (prevId > 0) {
                parentEl.find('#' + prevId).after(newEl);
            }
            else if (nextId > 0) {
                parentEl.find('#' + nextId).before(newEl);
            }
        }

        if (undefined !== scrollBottom) {
            if (scrollBottom) {
                // 滚动到底部
                var offset = parseInt(this.elContent.prop('scrollHeight'));
                this.elContent.scrollTop(offset);
            }
            else {
                // 滚动到顶部
                this.elContent.scrollTop(0);
            }
        }

        // 加载草稿
        this.loadDraft(panel);

        return newEl;
    }

    /**
     * 刷新当前面板里的消息。
     * @param {*} sender 
     * @param {*} message 
     */
    MessagePanel.prototype.refreshMessage = function(sender, message) {
        var parentEl = this.current.el;
        var msgEl = parentEl.find('#' + message.getId());
        if (msgEl.length == 0) {
            return;
        }

        if (message instanceof ImageMessage || message instanceof FileMessage) {
            attachment = message.getAttachment();
            var action = null;
            var fileDesc = null;

            if (attachment.isImageType()) {
                action = ['javascript:dialog.showImage(\'', attachment.getFileCode(), '\');'];

                fileDesc = ['<table class="file-label" border="0" cellspacing="4" cellpodding="0">',
                    '<tr>',
                        '<td>',
                            '<img class="thumb" src="', attachment.getDefaultThumbURL(), '" onclick="', action.join(''), '"',
                                ' onload="app.messagePanel.refreshScroll()"',
                                ' alt="', attachment.getFileName(), '"', ' />',
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

            var el = msgEl.find('div[data-id="'+ message.getId() +'"]');
            el.html(fileDesc.join(''));
        }
    }

    /**
     * 变更消息状态。
     * @param {Message} message 
     */
    MessagePanel.prototype.changeMessageState = function(message) {
        var el = this.elContent.find('#' + message.getId()).find('.direct-chat-state');
        if (message.getState() == MessageState.Sent) {
            el.html('');
        }
        else if (message.getState() == MessageState.SendBlocked || message.getState() == MessageState.ReceiveBlocked) {
            el.html('<i class="fas fa-exclamation-circle fault"></i>');
        }
        else if (message.getState() == MessageState.Sending) {
            el.html('<i class="fas fa-spinner sending"></i>');
        }
    }

    /**
     * 插入注解内容到消息面板。
     * @param {Contact|Group|number} target 面板对应的数据实体。
     * @param {string} note 注解内容。
     */
    MessagePanel.prototype.appendNote = function(target, note) {
        var panelId = (typeof target === 'number') ? target : target.getId();

        var panel = this.panels[panelId.toString()];
        if (undefined === panel) {
            var el = $('<div class="direct-chat-messages"><div class="more-messages"><a href="javascript:app.messagingCtrl.prependMore(' + panelId + ');">查看更多消息</a></div></div>');
            panel = {
                id: panelId,
                el: el,
                entity: target,
                messageIds: [],
                messageTimes: [],
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

    MessagePanel.prototype.refreshScroll = function() {
        // 滚动条控制
        var offset = parseInt(this.elContent.prop('scrollHeight'));
        this.elContent.scrollTop(offset);
    }

    /**
     * 加载面板草稿。
     * @param {*} panel 
     */
    MessagePanel.prototype.loadDraft = function(panel) {
        // 加载草稿
        window.cube().messaging.loadDraft(panel.id, function(draft) {
            // 更新目录
            g.app.messageCatalog.restoreDesc(panel.id, '<span class="text-danger">[草稿] ' + draft.getMessage().getSummary() + '</span>');
        });
    }

    /**
     * 将当前输入的格式化数据转为超文本。
     * @returns {string}
     */
    MessagePanel.prototype.serializeHyperText = function() {
        // 解析输入内容
        var formatText = [];
        for (var i = 0; i < this.formatContents.length; ++i) {
            var c = this.formatContents[i];
            if (c.format == 'txt') {
                formatText.push(filterFormatText(c.data));
            }
            else if (c.format == 'emoji') {
                var array = [
                    '[E', c.desc, '#', c.data, ']'
                ];
                formatText.push(array.join(''));
            }
            else if (c.format == 'at') {
                var array = [
                    '[@', c.name, '#', c.data, ']'
                ];
                formatText.push(array.join(''));
            }
        }

        return formatText.join('');
    }

    /**
     * 将超文本格式转为 HTML 格式。
     * @param {HyperTextMessage} message 
     * @param {boolean} forInput 是否转为输入编辑器支持的模式。
     */
    MessagePanel.prototype.deserializeHyperText = function(message, forInput) {
        var html = [];

        if (forInput) {
            var list = message.getFormattedContents();
            for (var i = 0, len = list.length - 1; i < len; ++i) {
                var value = list[i];
                if (value.format == 'text') {
                    html.push('<p>');
                    html.push(value.content);
                    html.push('</p>');
                }
                else if (value.format == 'emoji') {
                    var emoji = String.fromCodePoint('0x' + value.content.code);
                    html.push('<p>&nbsp;</p><p class="emoji" desc="');
                    html.push(value.content.desc);
                    html.push('">');
                    html.push(emoji);
                    html.push('</p><p>&nbsp;</p>');
                }
                else if (value.format == 'at') {
                    html.push('<p>&nbsp;</p><p class="at-wrapper"><span class="at">@');
                    html.push(value.content.name);
                    html.push('</span></p><p>&nbsp;</p>');
                }
            }

            // 处理最后一个
            var last = list[list.length - 1];
            if (last.format == 'text') {
                html.push('<p>' + last.content + '<br></p>');
            }
            else if (last.format == 'emoji') {
                var emoji = String.fromCodePoint('0x' + last.content.code);
                html.push('<p>&nbsp;</p><p class="emoji" desc="' + last.content.desc + '">' + emoji + '</p><p><br></p>');
            }
            else if (last.format == 'at') {
                html.push('<p>&nbsp;</p><p class="at-wrapper"><span class="at">@' + last.content.name + '</span></p><p><br></p>');
            }
        }
        else {
            message.getFormattedContents().forEach(function(value) {
                if (value.format == 'text') {
                    html.push(value.content);
                }
                else if (value.format == 'emoji') {
                    var emoji = String.fromCodePoint('0x' + value.content.code);
                    html.push('&nbsp;<span class="emoji">' + emoji + '</span>&nbsp;');
                }
                else if (value.format == 'at') {
                    html.push('&nbsp;<span class="at">@' + value.content.name + '</span>&nbsp;');
                }
            });
        }

        return html.join('');
    }

    /**
     * 在表情符号面板点击了表情符号。
     * @param {*} emoji 
     */
    MessagePanel.prototype.onEmojiClick = function(emoji) {
        var emojiHtml = String.fromCodePoint('0x' + emoji.code);
        if (activeEditor) {
            that.inputEditor.cmd.do('insertHTML', '<p>&nbsp;</p><p class="emoji" desc="' + emoji.desc + '">' + emojiHtml + '</p><p>&nbsp;</p>');
        }
        else {
            // TODO
        }
    }

    /**
     * 当触发发送消息事件时回调。
     * @param {*} e 
     */
    MessagePanel.prototype.onSend = function(e) {
        var text = activeEditor ? this.inputEditor.txt.text() : this.elInput.val();
        if (text.length == 0) {
            return;
        }

        // 格式化的内容
        text = this.serializeHyperText();

        if (this.current.entity instanceof Group) {
            var state = this.current.entity.getState();
            if (state == GroupState.Dismissed) {
                this.appendNote(this.current.entity, '群组已解散');
                return;
            }
            else if (state == GroupState.Disabled) {
                this.appendNote(this.current.entity, '群组已删除');
                return;
            }
        }

        if (activeEditor) {
            this.inputEditor.txt.clear();
        }
        else {
            this.elInput.val('');
        }

        // 触发发送
        var message = g.app.messagingCtrl.fireSend(this.current.entity, text);
        if (null == message) {
            g.dialog.launchToast(Toast.Error, '发送消息失败');
        }

        // 清理格式化内容
        if (this.formatContents.length > 0) {
            this.formatContents.splice(0, this.formatContents.length);
        }
        this.lastInput = '';
    }

    /**
     * 点击“创建群组”。
     * @param {*} e 
     */
    MessagePanel.prototype.onNewGroupClick = function(e) {
        if (null == this.current) {
            return;
        }

        if (this.current.groupable) {
            var currentGroup = this.current.entity;
            var list = g.app.contactsCtrl.getContacts();
            var result = [];
            var contains = false;

            currentGroup.getMembers(function(members, group) {
                for (var i = 0; i < list.length; ++i) {
                    var contact = list[i];
                    contains = false;
                    for (var j = 0; j < members.length; ++j) {
                        var member = members[j];
                        if (member.id == contact.id) {
                            contains = true;
                            break;
                        }
                    }

                    if (!contains) {
                        result.push(contact);
                    }
                }

                g.app.contactListDialog.show(result, [], function(list) {
                    if (list.length > 0) {
                        currentGroup.addMembers(list, function(group) {
                            g.app.messageSidebar.update(group);
                        }, function(error) {
                            g.dialog.launchToast(Toast.Error, '邀请入群操作失败 - ' + error.code);
                        });
                    }
                }, '邀请入群', '请选择您要邀请入群的联系人');
            });
        }
        else {
            g.app.newGroupDialog.show([this.current.entity.getId()]);
        }
    }

    /**
     * 点击“详情”。
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

    /**
     * 点击“折叠”。
     * @param {*} e 
     */
    MessagePanel.prototype.onCollapseClick = function(e) {
        if (null == this.current) {
            return;
        }
        
        g.app.messagingCtrl.toggleSidebar();
    }

    /**
     * 当消息输入框内容变化时回调。
     * @param {string} html 
     */
    MessagePanel.prototype.onEditorChange = function(html) {
        if (html.length == 0) {
            this.formatContents.splice(0, this.formatContents.length);
            this.lastInput = '';
            // 删除草稿
            if (null != this.current) {
                window.cube().messaging.deleteDraft(this.current.id);
            }
            return;
        }

        if (this.lastInput == html) {
            return;
        }

        var text = html.replace(/<[^<>]+>/g, "");
        if (text.length == 0 || text == ' ' || text == '&nbsp;') {
            this.formatContents.splice(0, this.formatContents.length);
            this.lastInput = '';
            // 删除草稿
            if (null != this.current) {
                window.cube().messaging.deleteDraft(this.current.id);
            }
            return;
        }

        var result = calcInput(this.lastInput, html);

        if (result.deleted) {
            // 有格式化整体内容被删除
            var formatContents = result.newestContents;
            var content = [];
            for (var i = 0; i < formatContents.length; ++i) {
                var c = formatContents[i];
                if (c.format == "txt") {
                    content.push('<p>' + c.data + '</p>');
                }
                else if (c.format == "emoji") {
                    var emoji = String.fromCodePoint('0x' + c.data);
                    content.push('<p>&nbsp;</p><p class="emoji" desc="' + c.desc + '">' + emoji + '</p><p>&nbsp;</p>');
                }
                else if (c.format == "at") {
                    var atContent = '<p>&nbsp;</p><p class="at-wrapper" data="' + c.data + '"><span class="at">@' + c.name + '</span></p><p>&nbsp;</p>';
                    content.push(atContent);
                }
            }
            setTimeout(function() {
                that.inputEditor.txt.html(content.join(''));
            }, 10);
        }

        this.formatContents = result.newestContents;

        this.lastInput = html;
    }

    /**
     * 处理粘贴内容。
     * @param {string} paste 
     * @returns {string}
     */
    MessagePanel.prototype.handlePasteText = function(paste) {
        return paste.replace(/<[^<>]+>/g, "");;
    }

    /**
     * 当编辑框触发 Key Press 事件时回调。
     * @param {*} event 
     * @returns 
     */
    MessagePanel.prototype.onEditorKeypress = function(event) {
        var e = event || window.event;
        if (e && e.keyCode == 13 && e.ctrlKey) {
            that.onSend(e);
            return;
        }

        // @ - 64
        if (64 == e.keyCode && this.current.groupable) {
            // 群组的 @ 功能
            this.makeAtPanel(this.current.entity);

            this.atPanel.css('display', 'block');
            this.atPanel.focus();
            g.app.onKeyUp(that.onAtPanelKeyUp);
        }
    }

    /*
    MessagePanel.prototype.onEditorPaste = function(event) {
        var clipboardData = (event.clipboardData || window.clipboardData);
        var paste = clipboardData.getData('text');
        if (null == paste || paste.length == 0) {
            return false;
        }

        const selection = window.getSelection();
        if (!selection.rangeCount) {
            return false;
        }

        selection.deleteFromDocument();
        var range = selection.getRangeAt(0);
        // 删除选中文本
        range.deleteContents();
        // 插入文本
        range.insertNode(document.createTextNode(paste));

        event.preventDefault();
        return false;
    }
    MessagePanel.prototype.onEditorKeydown = function(event) {
        var e = event || window.event;
        // 退格键 - 8，删除键 - 46
        // if (e.keyCode == 8 || e.keyCode == 46) {
        //     // var text = this.inputEditor.txt.text();
        //     e.preventDefault();
        //     return false;
        // }
    }*/

    /**
     * 动态生成 AT 面板。
     * @param {Group} group 
     * @returns 
     */
    MessagePanel.prototype.makeAtPanel = function(group) {
        var that = this;
        group.getMembers(function(members, group) {
            that._makeAtPanel(group, members);
        });
    }

    MessagePanel.prototype._makeAtPanel = function(group, list) {
        var num = list.length - 1;

        this.atElList = [];
        this.atPanel.empty();

        var dom = null;
        var parentId = $('#message-editor').find('.w-e-text').attr('id');
        var cursor = getCurrentCursorPosition(parentId);
        var dom = cursor.node;

        if (dom == null) {
            return;
        }

        var width = parseInt(dom.clientWidth || dom.offsetWidth || dom.style.width|| dom.scrollWidth);

        var left = parseInt(dom.offsetLeft) + parseInt(dom.offsetParent.offsetLeft);
        var top = parseInt(dom.offsetTop) + parseInt(dom.offsetParent.offsetTop);

        // 计算位置
        left += calcCursorPosition(cursor.charCount)[0];
        var offset = 12;
        if (left + offset >= width) {
            var d = Math.floor((left + offset) / width);
            var mod = (left + offset) % width;
            top += (d * 21);
            left = mod + offset;
        }

        if (num <= 5) {
            this.atPanel.css('height', ((num * 32) + 2) + 'px');
            top -= ((num * 32) + 4);
        }
        else {
            this.atPanel.css('height', '162px');
            top -= 170;
        }

        for (var i = 0; i < list.length; ++i) {
            var member = list[i];
            if (member.getId() == g.app.account.id) {
                // 排除自己
                continue;
            }

            g.app.getContact(member.getId(), function(contact) {
                // 修改群成员数据
                group.modifyMember(contact);

                var name = group.getMemberName(contact);
                var html = [
                    '<div class="row align-items-center" data="', contact.getId(), '">',
                        '<div class="col-2 avatar"><img src="', g.helper.getAvatarImage(contact.getContext().avatar), '" /></div>',
                        '<div class="col-10">', name, '</div>',
                    '</div>'
                ];

                var el = $(html.join(''));
                el.on('click', function() {
                    that.onAtRowClick($(this));
                });
                that.atElList.push(el);

                if (that.atElList.length == 1) {
                    that.atElList[0].addClass('active');
                }

                that.atPanel.append(el);
            });
        }

        // 位置
        this.atPanel.css('left', left + 'px');
        this.atPanel.css('top', top + 'px');
    }

    /**
     * 选择当前指定的 AT 项。
     */
    MessagePanel.prototype.selectAtItem = function() {
        if (!that.current.groupable) {
            return;
        }

        var id = parseInt(that.atPanel.find('.active').attr('data'));
        var member = that.current.entity.getMemberById(id);

        var atContent = '<p>&nbsp;</p><p class="at-wrapper" data="' + id + '"><span class="at">@' + that.current.entity.getMemberName(member) + '</span></p><p>&nbsp;</p>';
        that.inputEditor.cmd.do('insertHTML', atContent);
        that.atPanel.blur();
    }

    MessagePanel.prototype.onAtRowClick = function(target) {
        var index = 0;
        for (var i = 0; i < that.atElList.length; ++i) {
            var el = that.atElList[i];
            if (el.hasClass('active')) {
                index = i;
                break;
            }
        }

        var cur = that.atElList[index];
        cur.removeClass('active');
        target.addClass('active');

        that.selectAtItem();
    }

    MessagePanel.prototype.onAtPanelBlur = function(event) {
        g.app.unKeyUp(that.onAtPanelKeyUp);
        that.atElList = [];
        that.atPanel.css('display', 'none');
    }

    MessagePanel.prototype.onAtPanelKeyUp = function(event) {
        if (event.keyCode == 13) {
            that.selectAtItem();
            return;
        }
        else if (event.keyCode == 27) {
            // ESC - 27
            that.atPanel.blur();
            that.inputEditor.txt.append('@');
            return;
        }

        // Up - 38, Down - 40

        if (event.keyCode == 40 || event.keyCode == 38) {
            var index = 0;
            for (var i = 0; i < that.atElList.length; ++i) {
                var el = that.atElList[i];
                if (el.hasClass('active')) {
                    index = i;
                    break;
                }
            }

            var cur = that.atElList[index];

            if (event.keyCode == 40) {
                cur.removeClass('active');
                if (index >= that.atElList.length - 1) {
                    index = 0;
                }
                else {
                    index += 1;
                }
                that.atElList[index].addClass('active');
            }
            else if (event.keyCode == 38) {
                cur.removeClass('active');
                if (index == 0) {
                    index = that.atElList.length - 1;
                }
                else {
                    index -= 1;
                }
                that.atElList[index].addClass('active');
            }
        }
    }

    function calcInput(lastHtml, newestHtml) {
        var lastContents = parseContent(lastHtml);
        var newestContents = parseContent(newestHtml);

        var deleted = false;

        // 判断上一次的内容里是否少了 AT 格式的内容
        for (var i = 0; i < lastContents.length && i < newestContents.length; ++i) {
            var last = lastContents[i];
            var newest = newestContents[i];

            if (last.format == "at" && newest.format == "at") {
                if (last.name != newest.name) {
                    deleted = true;
                    newestContents.splice(i, 1);
                    break;
                }
            }
        }

        return { "deleted": deleted, "newestContents": newestContents, "lastContents": lastContents };
    }

    function parseContent(html) {
        var formatContents = [];

        var htmlEl = $('<div>' + html + '</div>');
        var pEl = htmlEl.find('p');

        var skipNextBlank = false;

        pEl.each(function() {
            var el = $(this);
            if (el.hasClass('emoji')) {
                // 移除上一个空格
                if (formatContents.length > 0 && formatContents[formatContents.length - 1].data.charCodeAt(0) == 160) {
                    formatContents.pop();
                }

                var c = el.text();
                if (c.length == 0) {
                    return;
                }

                var emoji = c.codePointAt(0).toString(16);
                var desc = el.attr('desc');
                formatContents.push({ "format": "emoji", "data": emoji, "desc": desc });

                skipNextBlank = true;
            }
            else if (el.hasClass('at-wrapper')) {
                // 移除上一个空格
                if (formatContents.length > 0 && formatContents[formatContents.length - 1].data.charCodeAt(0) == 160) {
                    formatContents.pop();
                }

                var c = el.text();
                formatContents.push({ "format": "at", "data": parseInt(el.attr('data')), "name": c.substring(1) });

                skipNextBlank = true;
            }
            else {
                if (skipNextBlank) {
                    skipNextBlank = false;
                    var c = el.text();
                    if (c.charCodeAt(0) == 160 && c.length == 1) {
                        return;
                    }

                    c = c.substring(1);
                    if (c.length > 0) {
                        formatContents.push({ "format": "txt", "data": c });
                        return;
                    }
                }

                if (el.text().length == 0) {
                    return;
                }

                formatContents.push({ "format": "txt", "data": el.text() });
            }
        });

        return formatContents;
    }

    // 计算当前光标位置
    function calcCursorPosition(count) {
        var length = 0;
        var plain = that.lastInput.replace(/<[^<>]+>/g, "");
        var string = plain.replaceAll('&nbsp;', ' ');

        var offset = 0;

        for (var i = 0; i < string.length && i < count; ++i) {
            var c = string.charCodeAt(i);
            if (c > 127 || c == 94) {
                length += 2;
                offset += 14;
            }
            else {
                length += 1;
                if ((c >= 105 && c <= 108) || c == 114 || c == 116) {
                    offset += 4;
                }
                else if (c >= 64 && c <= 90) {
                    // @符号和大写字母
                    offset += 10;
                }
                else {
                    offset += 8;
                }
            }
        }

        return [ Math.round(offset), length ];
    }

    function filterFormatText(input) {
        var output = [];
        for (var i = 0; i < input.length; ++i) {
            var c = input.charAt(i);
            if (c == '[' || c == ']') {
                // 转义
                output.push('\\');
            }

            output.push(c);
        }
        return output.join('');
    }

    // 获取当前输入框光标位置
    function getCurrentCursorPosition(parentId) {
        var selection = window.getSelection(),
            charCount = -1,
            node = null;

        if (selection.focusNode) {
            if (isChildOf(selection.focusNode, parentId)) {
                node = selection.focusNode; 
                charCount = selection.focusOffset;
    
                while (node) {
                    if (node.id === parentId) {
                        break;
                    }
    
                    if (node.previousSibling) {
                        node = node.previousSibling;
                        charCount += node.textContent.length;
                    }
                    else {
                         node = node.parentNode;
                         if (node === null) {
                             break
                         }
                    }
                }
            }
        }
        return { "node": node, "charCount": charCount };
    }

    function isChildOf(node, parentId) {
        while (node !== null) {
            if (node.id === parentId) {
                return true;
            }
            node = node.parentNode;
        }

        return false;
    }

    g.MessagePanel = MessagePanel;

})(window);
