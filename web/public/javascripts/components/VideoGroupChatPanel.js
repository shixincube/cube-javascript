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

    var that = null;

    var panelEl = null;

    var btnHangup = null;

    var VideoGroupChatPanel = function() {
        that = this;
        panelEl = $('#group_video_chat');

        that.localVideo = null;

        btnHangup = panelEl.find('button[data-target="hangup"]');
        btnHangup.click(function() {
            that.terminate();
        });
    }

    /**
     * 
     * @param {Group} group 
     */
    VideoGroupChatPanel.prototype.makeCall = function(group) {
        var members = [];

        var videoDevice = null;

        var handler = function(group, idList) {
            if (g.app.callCtrl.makeCall(group, true, videoDevice)) {
                panelEl.find('.video-group-default .modal-title').text('群通话 - ' + group.getName());
                // panelEl.find('.voice-group-minisize .modal-title').text(group.getName());

                // 显示窗口
                panelEl.modal({
                    keyboard: false,
                    backdrop: false
                });
            }
            else {
                g.dialog.launchToast(Toast.Warning, '您当前正在通话中');
            }
        }
        
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

                        // 界面布局
                        that.resetLayout(result);

                        // 进行呼叫
                        result.shift();
                        handler(group, result);

                    }, '群通话', '请选择要邀请通话的群组成员');
                }
            });
        });
    }

    VideoGroupChatPanel.prototype.close = function() {
        panelEl.modal('hide');
    }

    VideoGroupChatPanel.prototype.terminate = function() {
        g.app.callCtrl.hangupCall();
    }

    /**
     * @private
     * @param {Array} list 
     */
     VideoGroupChatPanel.prototype.resetLayout = function(list) {
     }

    g.VideoGroupChatPanel = VideoGroupChatPanel;

})(window);
