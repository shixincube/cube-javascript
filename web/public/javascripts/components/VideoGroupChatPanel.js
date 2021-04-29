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

    var invitationList = null;

    var currentLayoutList = [];     // 当前布局的联系人列表

    var btnMinimize = null;
    var btnRestore = null;

    var btnHangup = null;


    function videoElementAgent(contactId) {

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
     * 
     * @param {Group} group 
     */
    VideoGroupChatPanel.prototype.makeCall = function(group) {
        invitationList = null;

        panelEl.find('.header-tip').text('');

        // 设置视频标签代理
        g.cube().mpComm.setVideoElementAgent(videoElementAgent);

        var videoDevice = null;

        var handler = function(group, idList) {
            // 获取本地视频窗口
            that.localVideo = panelEl.find('video[data-target="' + g.app.getSelf().getId() + '"]')[0];

            // XJW
            // 显示窗口
            // panelEl.modal({
            //     keyboard: false,
            //     backdrop: false
            // });
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
                    invitationList = idList;
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
            videoDevice = deviceList[1];
            deviceList.splice(0, deviceList.length);
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
        if (null != invitationList) {
            g.cube().mpComm.inviteCall(activeCall.field, invitationList);
        }
    }

    VideoGroupChatPanel.prototype.tipConnected = function(activeCall) {
        panelEl.find('.header-tip').text('');
    }

    VideoGroupChatPanel.prototype.close = function() {
        panelEl.modal('hide');
        panelEl.find('.header-tip').text('');
    }

    VideoGroupChatPanel.prototype.terminate = function() {
        g.app.callCtrl.hangupCall();
    }

    /**
     * @private
     * @param {Array} list 
     */
    VideoGroupChatPanel.prototype.resetLayout = function(list) {
        var contactList = [];

        for (var i = 0; i < list.length; ++i) {
            var cid = list[i];
            g.app.getContact(cid, function(contact) {
                contactList.push(contact);

                if (contactList.length == list.length) {
                    that.doLayout(contactList);
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

    g.VideoGroupChatPanel = VideoGroupChatPanel;

})(window);
