/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020-2023 Cube Team.
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
 * 群组语音面板。
 */
(function(g) {

    /**
     * 最大允许的通话人数。
     */
    const maxMembers = 16;

    /**
     * @type {VoiceGroupCallPanel}
     */
    var that = null;

    var panelEl = null;

    var invitation = {
        list: null,
        timer: []
    };

    var btnMinimize = null;
    var btnRestore = null;
    
    var btnHangup = null;

    var minimized = false;

    var tickTimer = 0;

    var minisizeDurationEl = null;

    /**
     * 群组语音通话面板。
     */
    var VoiceGroupCallPanel = function() {
        that = this;
        panelEl = $('#group_voice_call');

        minisizeDurationEl = panelEl.find('.voice-group-minisize .duration');

        that.localVideo = panelEl.find('video[data-target="local"]')[0];
        that.remoteVideo = panelEl.find('video[data-target="remote"]')[0];

        btnMinimize = panelEl.find('button[data-target="minimize"]');
        btnMinimize.click(function() {
            that.minimize();
        });

        btnRestore = panelEl.find('button[data-target="restore"]');
        btnRestore.click(function() {
            that.restore();
        });

        btnHangup = panelEl.find('button[data-target="hangup"]');
        btnHangup.click(function() {
            that.terminate();
        });

        panelEl.draggable({
            handle: ".modal-header"
        });
    }

    /**
     * 开启面板。
     * @param {Group} group 
     */
    VoiceGroupCallPanel.prototype.open = function(group) {
        invitation.list = null;
        invitation.timer = [];

        panelEl.find('.header-tip').text('');

        var audioDevice = null;

        var handler = function(group, idList) {

            if (g.app.callCtrl.makeCall(group, false, audioDevice)) {
                panelEl.find('.voice-group-default .modal-title').text('群通话 - ' + group.getName());
                panelEl.find('.voice-group-minisize .modal-title').text(group.getName());

                panelEl.find('.header-tip').text('正在接通，请稍候...');

                // 显示窗口
                panelEl.modal({
                    keyboard: false,
                    backdrop: false
                });

                if (idList) {
                    invitation.list = idList;
                }
            }
            else {
                g.dialog.launchToast(Toast.Warning, '您当前正在通话中');
            }
        }

        var start = function() {
            panelEl.find('.header-tip').text('正在启动麦克风...');

            // 如果群组正在通话，则加入
            g.cube().mpComm.isCalling(group, function(calling) {
                if (calling) {
                    // 获取当前群组的通讯场域
                    g.cube().mpComm.getCommField(group, function(commField) {
                        // 当前在通讯的联系人
                        var clist = [ g.app.getSelf().getId() ];

                        commField.getEndpoints().forEach(function(ep) {
                            // 添加联系人的 ID
                            clist.push(ep.getContact().getId());

                            if (clist.length == commField.numEndpoints() + 1) {
                                // 界面布局
                                that.resetLayout(clist);

                                clist.shift();

                                // 调用启动通话
                                setTimeout(function() {
                                    handler(group);
                                }, 1);
                            }
                        });
                    });
                }
                else {
                    var members = [];

                    group.getMembers(function(list, group) {
                        list.forEach(function(element) {
                            if (element.getId() == g.app.getSelf().getId()) {
                                return;
                            }

                            g.app.getContact(element.getId(), function(contact) {
                                members.push(contact);

                                if (members.length == group.numMembers() - 1) {
                                    // 显示联系人列表对话框，以便选择邀请通话的联系人。
                                    g.app.contactListDialog.show(members, [], function(result) {
                                        if (result.length == 0) {
                                            g.dialog.showAlert('没有邀请任何联系人参与群通话');
                                            return false;
                                        }

                                        result.unshift(g.app.getSelf().getId());

                                        if (result.length > maxMembers) {
                                            g.dialog.showAlert('超过最大通话人数（最大通话人数 ' + maxMembers + ' 人）');
                                            return false;
                                        }

                                        // 界面布局
                                        that.resetLayout(result);

                                        // 邀请列表要移除自己
                                        result.shift();

                                        // 调用启动通话
                                        handler(group, result);

                                    }, '群通话', '请选择要邀请通话的群组成员', (maxMembers - 1));
                                }
                            });
                        });
                    });
                }
            });
        }

        // 检测是否有多个可用设备
        g.cube().mpComm.listMediaDevices(function(list) {
            if (list.length == 0) {
                g.dialog.showAlert('没有找到可用的麦克风设备，请您确认是否正确连接了麦克风设备。');
                return;
            }

            // 多个设备时进行选择
            var deviceList = [];
            for (var i = 0; i < list.length; ++i) {
                if (list[i].isAudioInput()) {
                    deviceList.push(list[i]);
                }
            }

            if (deviceList.length > 1) {
                g.app.callCtrl.showSelectMediaDevice(deviceList, function(selected, selectedIndex) {
                    if (selected) {
                        if (selectedIndex >= deviceList.length) {
                            g.dialog.showAlert('选择的设备错误');
                            return;
                        }

                        // 设置设备
                        audioDevice = deviceList[selectedIndex];
                        console.log('Select device: ' + audioDevice.label);
                        start();
                    }
                    else {
                        // 取消通话
                        return;
                    }
                });
            }
            else {
                start();
            }
        });
    }

    /**
     * 关闭面板。
     */
    VoiceGroupCallPanel.prototype.close = function() {
        panelEl.modal('hide');
    }

    /**
     * 提示正在等待接通。
     * @param {*} activeCall 
     */
    VoiceGroupCallPanel.prototype.tipWaitForAnswer = function(activeCall) {
        panelEl.find('.header-tip').text('正在等待服务器应答...');

        // 尝试邀请列表里联系人
        if (null != invitation.list) {
            invitation.list.forEach(function(value) {
                var timer = setTimeout(function() {
                    that.fireInviteTimeout(value);
                }, 30000);
                invitation.timer.push(timer);
            });

            // 发送加入邀请
            g.cube().mpComm.inviteCall(activeCall.field, invitation.list);
        }
    }

    /**
     * 提示已接通。
     * @param {*} activeCall 
     */
    VoiceGroupCallPanel.prototype.tipConnected = function(activeCall) {
        panelEl.find('.header-tip').text('');

        this.refreshState(activeCall);
    }

    /**
     * 刷新状态。
     */
    VoiceGroupCallPanel.prototype.refreshState = function(activeCall) {
        if (tickTimer > 0) {
            clearInterval(tickTimer);
        }

        tickTimer = setInterval(function() {
            if (null == activeCall.field) {
                clearInterval(tickTimer);
                tickTimer = 0;
                return;
            }

            var startTime = activeCall.field.startTime;
            if (startTime <= 0) {
                return;
            }
            var now = Date.now();
            var duration = Math.round((now - startTime) / 1000.0);
            var durationString = g.formatClockTick(duration);
            panelEl.find('.header-tip').text(durationString);
            minisizeDurationEl.text(durationString);
        }, 1000);

        panelEl.find('.voice-group-minisize .number-of-member').text(activeCall.field.numEndpoints());
    }

    /**
     * 取消遮罩
     * @param {Contact} contact 
     */
    VoiceGroupCallPanel.prototype.unmark = function(contact) {
        var layoutEl = panelEl.find('.layout');
        layoutEl.find('div[data="' + contact.getId() + '"]').find('.mask').css('visibility', 'hidden');
    }

    /**
     * 界面最小化。
     */
    VoiceGroupCallPanel.prototype.minimize = function() {
        if (minimized) {
            return;
        }

        minimized = true;

        panelEl.addClass('voice-group-panel-mini');
        panelEl.find('.voice-group-default').css('display', 'none');
        panelEl.find('.voice-group-minisize').css('display', 'block');
    }

    /**
     * 恢复界面。
     */
    VoiceGroupCallPanel.prototype.restore = function() {
        if (!minimized) {
            return;
        }

        minimized = false;

        panelEl.removeClass('voice-group-panel-mini');
        panelEl.find('.voice-group-default').css('display', 'block');
        panelEl.find('.voice-group-minisize').css('display', 'none');
    }

    /**
     * 结束通话。
     */
    VoiceGroupCallPanel.prototype.terminate = function() {
        if (!g.app.callCtrl.hangupCall()) {
            that.close();
        }
    }

    /**
     * 添加联系人到面板，并更新面板布局。
     * @param {Contact} contact 
     */
    VoiceGroupCallPanel.prototype.appendContact = function(contact, spinning) {
        var layoutEl = panelEl.find('.layout');
        var el = layoutEl.find('div[data="' + contact.getId() + '"]');
        if (el.length > 0) {
            return;
        }

        var col = 'col-3';
        var html = [
            '<div data="', contact.getId(), '" class="', col, '">',
                '<div class="avatar">',
                    '<img src="', g.helper.getAvatarImage(contact.getContext().avatar), '" />',
                '</div>',
                '<div class="name">',
                    '<div>', contact.getName(), '</div>',
                '</div>',
                '<div class="mask"', spinning ? '' : ' style="visibility:hidden;"', '>',
                    '<div>', '<i class="fas fa-spinner"></i>', '</div>',
                '</div>',
            '</div>'
        ];

        layoutEl.append($(html.join('')));
    }

    /**
     * 移除联系人，并更新面板布局。
     * @param {Contact} contact 
     */
    VoiceGroupCallPanel.prototype.removeContact = function(contact) {
        var layoutEl = panelEl.find('.layout');
        var el = layoutEl.find('div[data="' + contact.getId() + '"]');
        if (el.length == 0) {
            return;
        }

        el.remove();
    }

    /**
     * 重置布局。
     * @private
     * @param {Array} list 
     */
    VoiceGroupCallPanel.prototype.resetLayout = function(list) {
        var layoutEl = panelEl.find('.layout');
        var num = list.length;
        var col = 'col-3';

        var html = [];

        var handler = function() {
            layoutEl.html(html.join(''));
        };

        for (var i = 0; i < num; ++i) {
            var cid = list[i];
            g.app.getContact(cid, function(contact) {
                var chtml = [
                    '<div data="', contact.getId(), '" class="', col, '">',
                        '<div class="avatar">',
                            '<img src="', g.helper.getAvatarImage(contact.getContext().avatar), '" />',
                        '</div>',
                        '<div class="name">',
                            '<div>', contact.getName(), '</div>',
                        '</div>',
                        '<div class="mask"', (i == 0) ? ' style="visibility:hidden;"' : '', '>',
                            '<div>', '<i class="fas fa-spinner"></i>', '</div>',
                        '</div>',
                    '</div>'
                ];

                html.push(chtml.join(''));

                if (html.length == num) {
                    handler();
                }
            });
        }
    }

    /**
     * 提示被邀请提示。
     * @param {*} group 
     */
    VoiceGroupCallPanel.prototype.openInviteToast = function(group) {
        var body = [
            '<div class="toasts-info">\
                <div class="info-box">\
                    <span class="info-box-icon"><img src="images/group-avatar.png" /></span>\
                    <div class="info-box-content">\
                        <span class="info-box-text">', group.getName(), '</span>\
                        <span class="info-box-desc">邀请您参与群组通话</span>\
                    </div>\
                </div>\
                <div class="call-answer">\
                    <button type="button" class="btn btn-danger" onclick="javascript:app.callCtrl.rejectInvitation();"><i class="ci ci-hangup"></i> 拒绝</button>\
                    <button type="button" class="btn btn-success" onclick="javascript:app.callCtrl.acceptInvitation();"><i class="ci ci-answer"></i> 加入</button>\
                </div>\
            </div>'
        ];

        $(document).Toasts('create', {
            title: '语音通话邀请',
            position: 'bottomRight',
            icon: 'fas fa-phone-alt',
            close: false,
            class: 'voice-new-call',
            body: body.join('')
        });

        // 播放振铃音效
        g.app.mainPanel.playCallRing();
    }

    /**
     * 关闭邀请提示面板。
     */
    VoiceGroupCallPanel.prototype.closeInviteToast = function() {
        $('#toastsContainerBottomRight').find('.voice-new-call').remove();

        // 停止振铃音效
        g.app.mainPanel.stopCallRing();
    }

    /**
     * 执行邀请超时。
     * @param {*} contactId 
     */
    VoiceGroupCallPanel.prototype.fireInviteTimeout = function(contactId) {
        var index = invitation.list.indexOf(contactId);
        if (index >= 0) {
            var timer = invitation.timer[index];
            clearTimeout(timer);
            invitation.list.splice(index, 1);
            invitation.timer.splice(index, 1);
        }

        g.app.getContact(contactId, function(contact) {
            that.removeContact(contact);
        });
    }

    g.VoiceGroupCallPanel = VoiceGroupCallPanel;

})(window);
