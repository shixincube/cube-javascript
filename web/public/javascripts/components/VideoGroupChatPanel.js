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

/**
 * 群组视频面板。
 */
(function(g) {

    /**
     * 最大允许的通话人数。
     */
    const maxMembers = 6;

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


    function videoElementAgent(contactId) {
        return panelEl.find('video[data-target="' + contactId + '"]')[0];
    }


    var VideoGroupChatPanel = function() {
        that = this;
        panelEl = $('#group_video_chat');

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
    VideoGroupChatPanel.prototype.makeCall = function(group) {
        invitation.list = null;
        invitation.timer = [];

        panelEl.find('.header-tip').text('');

        // 设置视频标签代理
        g.cube().mpComm.setVideoElementAgent(videoElementAgent);

        var videoDevice = null;

        var handler = function(group, idList) {
            // 获取本地视频窗口
            that.localVideo = videoElementAgent(g.app.getSelf().getId());

            // XJW
            // panelEl.modal({
            //     keyboard: false,
            //     backdrop: false
            // });
            // if (idList) {
            //     function test() {
            //         if (idList.length == 0) {
            //             return;
            //         }

            //         g.app.getContact(idList.pop(), function(contact) {
            //             that.removeContact(contact);
            //         });

            //         setTimeout(test, 5000);
            //     }
            //     setTimeout(test, 5000);
            // }
            // if (panelEl) return;
            // XJW

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
                                handler(group);
                            }
                        });
                    });
                }
                else {
                    var members = [];

                    group.getMembers().forEach(function(element) {
                        if (element.getId() == g.app.getSelf().getId()) {
                            return;
                        }

                        g.app.getContact(element.getId(), function(contact) {
                            members.push(contact);

                            if (members.length == group.numMembers() - 1) {
                                // 显示联系人列表对话框，以便选择邀请通话的联系人。
                                g.app.contactListDialog.show(members, [], function(result) {
                                    result.unshift(g.app.getSelf().getId());

                                    if (result.length > maxMembers) {
                                        g.dialog.showAlert('超过最大通话人数（最大通话人数 ' + maxMembers + ' 人）。');
                                        return;
                                    }

                                    // 界面布局
                                    that.resetLayout(result);

                                    // 邀请列表要移除自己
                                    result.shift();

                                    // 调用启动通话
                                    handler(group, result);

                                }, '群通话', '请选择要邀请通话的群组成员');
                            }
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

            // XJW
            // videoDevice = deviceList[1];
            // deviceList.splice(0, deviceList.length);
            // XJW

            if (deviceList.length > 1) {
                g.app.callCtrl.showSelectMediaDevice(deviceList, function(selected, selectedIndex) {
                    if (selected) {
                        if (selectedIndex >= deviceList.length) {
                            g.dialog.showAlert('选择的设备错误');
                            return;
                        }

                        // 设置设备
                        videoDevice = deviceList[selectedIndex];

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

            g.cube().mpComm.inviteCall(activeCall.field, invitation.list);
        }
    }

    VideoGroupChatPanel.prototype.tipConnected = function(activeCall) {
        panelEl.find('.header-tip').text('');
    }

    VideoGroupChatPanel.prototype.close = function() {
        panelEl.modal('hide');
        panelEl.find('.header-tip').text('');

        invitation.timer.forEach(function(value) {
            clearTimeout(value);
        });
        invitation.timer.splice(0, invitation.timer.length);
    }

    VideoGroupChatPanel.prototype.terminate = function() {
        g.app.callCtrl.hangupCall();
    }

    VideoGroupChatPanel.prototype.appendContact = function(contact) {
        for (var i = 0; i < currentLayoutList.length; ++i) {
            var c = currentLayoutList[i];
            if (c.getId() == contact.getId()) {
                return;
            }
        }

        currentLayoutList.push(contact);
        this.updateLayout(currentLayoutList);
    }

    VideoGroupChatPanel.prototype.removeContact = function(contact) {
        for (var i = 0; i < currentLayoutList.length; ++i) {
            var c = currentLayoutList[i];
            if (c.getId() == contact.getId()) {
                currentLayoutList.splice(i, 1);
                break;
            }
        }

        this.updateLayout(currentLayoutList);
    }

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

    VideoGroupChatPanel.prototype.closeInviteToast = function() {
        $('#toastsContainerBottomRight').find('.video-new-call').remove();

        // 停止振铃音效
        g.app.mainPanel.stopCallRing();
    }

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
