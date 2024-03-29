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

(function(g) {

    /**
     * 最大允许的通话人数。
     */
    const maxMembers = 6;

    /**
     * @type {VideoGroupChatPanel}
     */
    var that = null;

    var panelEl = null;

    var invitation = {
        list: null,
        timer: []
    };

    var currentLayoutList = [];     // 当前布局的联系人列表

    var btnMinimize = null;
    var btnRestore = null;

    var btnHangup = null;

    var tickTimer = 0;

    var minisizeDurationEl = null;

    function videoElementAgent(contact) {
        var contactId = (contact instanceof Contact) ? contact.getId() : parseInt(contact);
        return panelEl.find('video[data-target="' + contactId + '"]')[0];
    }

    /**
     * 群组视频面板。
     */
    var VideoGroupChatPanel = function() {
        that = this;
        panelEl = $('#group_video_chat');

        minisizeDurationEl = panelEl.find('.video-group-minisize .duration');

        that.localVideo = null;

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
     * 启动通话。
     * @param {Group} group 
     */
    VideoGroupChatPanel.prototype.open = function(group) {
        invitation.list = null;
        invitation.timer = [];

        panelEl.find('.header-tip').text('');

        // 设置视频标签代理
        g.cube().mpComm.setVideoElementAgent(videoElementAgent);

        var videoDevice = null;

        var handler = function(group, idList) {
            // 获取本地视频窗口
            that.localVideo = videoElementAgent(g.app.getSelf().getId());
            if (undefined === that.localVideo) {
                alert('查找本地视频标签错误');
            }

            if (g.app.callCtrl.makeCall(group, true, videoDevice)) {
                panelEl.find('.video-group-default .modal-title').text('群通话 - ' + group.getName());
                panelEl.find('.video-group-minisize .modal-title').text(group.getName());

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
            panelEl.find('.header-tip').text('正在启动摄像机...');

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
                                }, 100);
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
                                            g.dialog.showAlert('没有邀请任何联系人参与视频通话');
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

                                    }, '群视频', '请选择要邀请视频通话的群组成员', (maxMembers - 1));
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
                g.dialog.showAlert('没有找到可用的摄像机设备，请您确认是否正确连接了摄像机设备。');
                return;
            }

            // 多个设备时进行选择
            var deviceList = [];
            for (var i = 0; i < list.length; ++i) {
                if (list[i].isVideoInput()) {
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
                        videoDevice = deviceList[selectedIndex];
                        console.log('Select device: ' + videoDevice.label);
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
     * 提示正在等待服务器应答。
     * @param {*} activeCall 
     */
    VideoGroupChatPanel.prototype.tipWaitForAnswer = function(activeCall) {
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
     * 提示已经接通。
     * @param {*} activeCall 
     */
    VideoGroupChatPanel.prototype.tipConnected = function(activeCall) {
        panelEl.find('.header-tip').text('');

        this.refreshState(activeCall);
    }

    /**
     * 刷新状态。
     */
    VideoGroupChatPanel.prototype.refreshState = function(activeCall) {
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

        panelEl.find('.video-group-minisize .number-of-member').text(activeCall.field.numEndpoints());
    }

    /**
     * 接触视频图层遮罩并显示用户工具栏。
     * @param {*} contact 
     */
    VideoGroupChatPanel.prototype.unmark = function(contact) {
        var container = panelEl.find('.container');
        var el = container.find('td[data="' + contact.getId() + '"]');
        el.find('.mask').css('visibility', 'hidden');
        el.find('.toolbar').css('visibility', 'visible');
    }

    /**
     * 关闭群聊面板。
     */
    VideoGroupChatPanel.prototype.close = function() {
        if (tickTimer > 0) {
            clearInterval(tickTimer);
            tickTimer = 0;
        }

        panelEl.modal('hide');
        panelEl.find('.header-tip').text('');

        invitation.timer.forEach(function(value) {
            clearTimeout(value);
        });
        invitation.timer.splice(0, invitation.timer.length);
    }


    /**
     * 终止当前己方的通话。
     */
    VideoGroupChatPanel.prototype.terminate = function() {
        if (!g.app.callCtrl.hangupCall()) {
            that.close();
        }
    }

    /**
     * 添加联系人到面板，并更新面板布局。
     * @param {Contact} contact 
     */
    VideoGroupChatPanel.prototype.appendContact = function(contact) {
        for (var i = 0; i < currentLayoutList.length; ++i) {
            var c = currentLayoutList[i];
            if (c.getId() == contact.getId()) {
                return;
            }
        }

        currentLayoutList.push(contact);
        this.updateLayout(currentLayoutList);

        panelEl.find('.video-group-minisize .number-of-member').text(currentLayoutList.length);
    }

    /**
     * 移除联系人，并更新面板布局。
     * @param {Contact} contact 
     */
    VideoGroupChatPanel.prototype.removeContact = function(contact) {
        for (var i = 0; i < currentLayoutList.length; ++i) {
            var c = currentLayoutList[i];
            if (c.getId() == contact.getId()) {
                currentLayoutList.splice(i, 1);
                break;
            }
        }

        this.updateLayout(currentLayoutList);

        panelEl.find('.video-group-minisize .number-of-member').text(currentLayoutList.length);
    }

    /**
     * 更新当前布局。
     * @private
     * @param {*} newContactList 
     */
    VideoGroupChatPanel.prototype.updateLayout = function(newContactList) {
        // 被保留的 td 标签
        var tdElList = [];

        var container = panelEl.find('.container');

        // 对每个联系人创建 td 标签
        newContactList.forEach(function(contact) {
            var el = container.find('td[data="' + contact.getId() + '"]');
            if (el.length > 0) {
                if (el.hasClass('colspan')) {
                    el.removeClass('colspan');
                    el.removeAttr('colspan');
                }

                tdElList.push(el);
            }
            else {
                el = $([
                    '<td data="', contact.getId(), '">',
                        '<div class="viewport"><video autoplay data-target="', contact.getId(), '"></video></div>',
                        '<div class="mask" style="background-image:linear-gradient(rgba(0,0,0,0.7),rgba(0,0,0,0.7)), url(images/', contact.context.avatar, ');"><div>接入“', contact.getPriorityName(), '”...</div></div>',
                        '<div class="toolbar"><div class="name">', contact.getPriorityName(), '</div></div>',
                    '</td>'
                ].join(''));
                tdElList.push(el);
            }
        });

        var html = null;
        var newEl = null;

        if (newContactList.length <= 2) {
            html = [
                '<table class="table table-borderless layout-pattern-1">',
                    '<tr></tr>',
                '</table>'
            ];

            newEl = $(html.join(''));

            tdElList.forEach(function(el) {
                newEl.find('tr').append(el);
            });

            panelEl.css('height', '366px');
        }
        else if (newContactList.length == 3) {
            html = [
                '<table class="table table-borderless layout-pattern-1">',
                    '<tr></tr>',
                    '<tr></tr>',
                '</table>'
            ];

            newEl = $(html.join(''));

            var first = tdElList[0];
            first.attr('colspan', '2');
            first.addClass('colspan');
            newEl.find('tr').eq(0).append(first);
            newEl.find('tr').eq(1).append(tdElList[1]);
            newEl.find('tr').eq(1).append(tdElList[2]);

            panelEl.css('height', '606px');
        }
        else if (newContactList.length == 4) {
            html = [
                '<table class="table table-borderless layout-pattern-2">',
                    '<tr></tr>',
                    '<tr></tr>',
                '</table>'
            ];

            newEl = $(html.join(''));

            var tr1 = newEl.find('tr').eq(0);
            tr1.append(tdElList[0]);
            tr1.append(tdElList[1]);

            var tr2 = newEl.find('tr').eq(1);
            tr2.append(tdElList[2]);
            tr2.append(tdElList[3]);

            panelEl.css('height', '606px');
        }
        else if (newContactList.length >= 5) {
            var numCol = 3;
            var numRow = parseInt(Math.ceil(newContactList.length / numCol));
            var index = 0;

            html = [ '<table class="table table-borderless layout-pattern-3">' ];
            while (index < numRow) {
                html.push('<tr></tr>');
                ++index;
            }
            html.push('</table>');

            newEl = $(html.join(''));

            index = 0;
            for (var i = 0; i < numRow; ++i) {
                var tr = newEl.find('tr').eq(i);
                for (var j = 0; j < numCol; ++j) {
                    tr.append(tdElList[index]);
                    ++index;
                }
            }

            panelEl.css('height', '406px');
        }

        container.empty();
        container.append(newEl);
    }

    /**
     * 重置布局，清空整个界面元素，不对之前布局的元素进行保留。
     * @private
     * @param {Array} list 
     */
    VideoGroupChatPanel.prototype.resetLayout = function(list) {
        currentLayoutList = [];

        for (var i = 0; i < list.length; ++i) {
            var cid = list[i];
            g.app.getContact(cid, function(contact) {
                currentLayoutList.push(contact);

                if (currentLayoutList.length == list.length) {
                    that.doLayout(currentLayoutList);
                }
            });
        }
    }

    /**
     * 执行全新的布局。
     * @private
     * @param {*} list 
     */
    VideoGroupChatPanel.prototype.doLayout = function(list) {
        var html = null;

        if (list.length == 2) {
            html = [
                '<table class="table table-borderless layout-pattern-1">',
                    '<tr>',
                        '<td data="', list[0].getId(), '">',
                            '<div class="viewport"><video autoplay data-target="', list[0].getId(), '"></video></div>',
                            '<div class="toolbar"><div class="name">', list[0].getPriorityName(), '</div></div>',
                        '</td>',
                        '<td data="', list[1].getId(), '">',
                            '<div class="viewport"><video autoplay data-target="', list[1].getId(), '"></video></div>',
                            '<div class="mask" style="background-image:linear-gradient(rgba(0,0,0,0.7),rgba(0,0,0,0.7)), url(images/', list[1].context.avatar, ');"><div>正在邀请“', list[1].getPriorityName(), '”...</div></div>',
                            '<div class="toolbar"><div class="name">', list[1].getPriorityName(), '</div></div>',
                        '</td>',
                    '</tr>',
                '</table>'
            ];

            panelEl.css('height', '366px');
        }
        else if (list.length == 3) {
            html = [
                '<table class="table table-borderless layout-pattern-1">',
                    '<tr>',
                        '<td colspan="2" class="colspan" data="', list[0].getId(), '">',
                            '<div class="viewport"><video autoplay data-target="', list[0].getId(), '"></video></div>',
                            '<div class="toolbar"><div class="name">', list[0].getPriorityName(), '</div></div>',
                        '</td>',
                    '</tr>',
                    '<tr>',
                        '<td data="', list[1].getId(), '">',
                            '<div class="viewport"><video autoplay data-target="', list[1].getId(), '"></video></div>',
                            '<div class="mask" style="background-image:linear-gradient(rgba(0,0,0,0.7),rgba(0,0,0,0.7)), url(images/', list[1].context.avatar, ');"><div>正在邀请“', list[1].getPriorityName(), '”...</div></div>',
                            '<div class="toolbar"><div class="name">', list[1].getPriorityName(), '</div></div>',
                        '</td>',
                        '<td data="', list[2].getId(), '">',
                            '<div class="viewport"><video autoplay data-target="', list[2].getId(), '"></video></div>',
                            '<div class="mask" style="background-image:linear-gradient(rgba(0,0,0,0.7),rgba(0,0,0,0.7)), url(images/', list[2].context.avatar, ');"><div>正在邀请“', list[2].getPriorityName(), '”...</div></div>',
                            '<div class="toolbar"><div class="name">', list[2].getPriorityName(), '</div></div>',
                        '</td>',
                    '</tr>',
                '</table>'
            ];

            panelEl.css('height', '606px');
        }
        else if (list.length == 4) {
            html = [
                '<table class="table table-borderless layout-pattern-2">',
                    '<tr>',
                        '<td data="', list[0].getId(), '">',
                            '<div class="viewport"><video autoplay data-target="', list[0].getId(), '"></video></div>',
                            '<div class="toolbar"><div class="name">', list[0].getPriorityName(), '</div></div>',
                        '</td>',
                        '<td data="', list[1].getId(), '">',
                            '<div class="viewport"><video autoplay data-target="', list[1].getId(), '"></video></div>',
                            '<div class="mask" style="background-image:linear-gradient(rgba(0,0,0,0.7),rgba(0,0,0,0.7)), url(images/', list[1].context.avatar, ');"><div>正在邀请“', list[1].getPriorityName(), '”...</div></div>',
                            '<div class="toolbar"><div class="name">', list[1].getPriorityName(), '</div></div>',
                        '</td>',
                    '</tr>',
                    '<tr>',
                        '<td data="', list[2].getId(), '">',
                            '<div class="viewport"><video autoplay data-target="', list[2].getId(), '"></video></div>',
                            '<div class="mask" style="background-image:linear-gradient(rgba(0,0,0,0.7),rgba(0,0,0,0.7)), url(images/', list[2].context.avatar, ');"><div>正在邀请“', list[2].getPriorityName(), '”...</div></div>',
                            '<div class="toolbar"><div class="name">', list[2].getPriorityName(), '</div></div>',
                        '</td>',
                        '<td data="', list[3].getId(), '">',
                            '<div class="viewport"><video autoplay data-target="', list[3].getId(), '"></video></div>',
                            '<div class="mask" style="background-image:linear-gradient(rgba(0,0,0,0.7),rgba(0,0,0,0.7)), url(images/', list[3].context.avatar, ');"><div>正在邀请“', list[3].getPriorityName(), '”...</div></div>',
                            '<div class="toolbar"><div class="name">', list[3].getPriorityName(), '</div></div>',
                        '</td>',
                    '</tr>',
                '</table>'
            ];

            panelEl.css('height', '606px');
        }
        else if (list.length >= 5) {
            html = [ '<table class="table table-borderless layout-pattern-3">' ];
            var numCol = 3;
            var numRow = parseInt(Math.ceil(list.length / numCol));
            var index = 0;

            while (numRow > 0) {
                html.push('<tr>');

                while (numCol > 0) {
                    var contact = list[index];
                    var chtml = [
                        '<td data="', contact.getId(), '">',
                            '<div class="viewport"><video autoplay data-target="', contact.getId(), '"></video></div>',

                            (index != 0) ? '<div class="mask" style="background-image:linear-gradient(rgba(0,0,0,0.7),rgba(0,0,0,0.7)), url(images/' + contact.context.avatar + ');"><div>正在邀请“' + contact.getPriorityName() + '”...</div></div>' : '',

                            '<div class="toolbar"><div class="name">', contact.getPriorityName(), '</div></div>',
                        '</td>'
                    ];
                    html.push(chtml.join(''));

                    ++index;
                    --numCol;

                    if (index >= list.length) {
                        break;
                    }
                }

                html.push('</tr>');

                --numRow;
                numCol = 3;

                if (index >= list.length) {
                    break;
                }
            }
            html.push('</table>');

            panelEl.css('height', '406px');
        }

        panelEl.find('.container').html(html.join(''));
    }

    /**
     * 将界面最小化。
     */
    VideoGroupChatPanel.prototype.minimize = function() {
        // 将自己的视频节点切换都新界面
        var selfId = g.app.getSelf().getId();
        var curVideo = panelEl.find('video[data-target="' + selfId + '"]');

        var miniEl = panelEl.find('.video-group-minisize');
        var defaultEl = panelEl.find('.video-group-default');

        var vp = miniEl.find('.viewport');
        vp.empty();

        curVideo.remove();
        vp.append(curVideo);

        panelEl.addClass('video-group-panel-mini');
        defaultEl.css('visibility', 'collapse');
        miniEl.css('visibility', 'visible');

        defaultEl.insertAfter(miniEl);
    }

    /**
     * 恢复界面最小化。
     */
    VideoGroupChatPanel.prototype.restore = function() {
        var selfId = g.app.getSelf().getId();
        var curVideo = panelEl.find('video[data-target="' + selfId + '"]');

        var miniEl = panelEl.find('.video-group-minisize');
        var defaultEl = panelEl.find('.video-group-default');

        curVideo.remove();
        var parent = panelEl.find('td[data="' + selfId +'"]').find('.viewport');
        parent.append(curVideo);

        panelEl.removeClass('video-group-panel-mini');
        defaultEl.css('visibility', 'visible');
        miniEl.css('visibility', 'collapse');

        miniEl.insertAfter(defaultEl);
    }

    /**
     * 提示被邀请提示。
     * @param {*} group 
     */
    VideoGroupChatPanel.prototype.openInviteToast = function(group) {
        var body = [
            '<div class="toasts-info">\
                <div class="info-box">\
                    <span class="info-box-icon"><img src="images/group-avatar.png" /></span>\
                    <div class="info-box-content">\
                        <span class="info-box-text">', group.getName(), '</span>\
                        <span class="info-box-desc">邀请您参与群组视频通话</span>\
                    </div>\
                </div>\
                <div class="call-answer">\
                    <button type="button" class="btn btn-danger" onclick="javascript:app.callCtrl.rejectInvitation();"><i class="ci ci-hangup"></i> 拒绝</button>\
                    <button type="button" class="btn btn-success" onclick="javascript:app.callCtrl.acceptInvitation();"><i class="ci ci-answer"></i> 加入</button>\
                </div>\
            </div>'
        ];

        $(document).Toasts('create', {
            title: '视频通话邀请',
            position: 'bottomRight',
            icon: 'fas fa-video',
            close: false,
            class: 'video-new-call',
            body: body.join('')
        });

        // 播放振铃音效
        g.app.mainPanel.playCallRing();
    }

    /**
     * 关闭邀请提示面板。
     */
    VideoGroupChatPanel.prototype.closeInviteToast = function() {
        $('#toastsContainerBottomRight').find('.video-new-call').remove();

        // 停止振铃音效
        g.app.mainPanel.stopCallRing();
    }

    /**
     * 执行邀请超时。
     * @param {*} contactId 
     */
    VideoGroupChatPanel.prototype.fireInviteTimeout = function(contactId) {
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

    g.VideoGroupChatPanel = VideoGroupChatPanel;

})(window);
