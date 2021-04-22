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
 * 群组语音面板。
 */
(function(g) {

    var that = null;

    var panelEl = null;

    var btnMin = null;
    var btnRestore = null;
    var btnHangup = null;

    var minimized = false;

    var VoiceGroupCallPanel = function() {
        that = this;
        panelEl = $('#group_voice_call');
        that.localVideo = panelEl.find('video[data-target="local"]')[0];

        btnMin = panelEl.find('button[data-target="minimize"]');
        btnMin.click(function() {
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

    VoiceGroupCallPanel.prototype.showMakeCall = function(group) {
        var members = [];

        var audioDevice = null;

        var handler = function(group, idList) {
            if (g.app.callCtrl.makeCall(group, false, audioDevice)) {
                panelEl.find('.voice-group-default .modal-title').text('群通话 - ' + group.getName());
                panelEl.find('.voice-group-minisize .modal-title').text(group.getName());

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

    VoiceGroupCallPanel.prototype.minimize = function() {
        if (minimized) {
            return;
        }

        minimized = true;

        panelEl.addClass('voice-group-panel-mini');
        panelEl.find('.voice-group-default').css('display', 'none');
        panelEl.find('.voice-group-minisize').css('display', 'block');
    }

    VoiceGroupCallPanel.prototype.restore = function() {
        if (!minimized) {
            return;
        }

        minimized = false;

        panelEl.removeClass('voice-group-panel-mini');
        panelEl.find('.voice-group-default').css('display', 'block');
        panelEl.find('.voice-group-minisize').css('display', 'none');
    }

    VoiceGroupCallPanel.prototype.terminate = function() {
        panelEl.modal('hide');
    }

    /**
     * @private
     * @param {Array} list 
     */
    VoiceGroupCallPanel.prototype.resetLayout = function(list) {
        var layoutEl = panelEl.find('.layout');
        var num = list.length;
        var col = 'col-3';

        var html = [];

        var handler = function() {
            layoutEl.empty();
            layoutEl.append($(html.join('')));
        };

        for (var i = 0; i < num; ++i) {
            var cid = list[i];
            g.app.getContact(cid, function(contact) {
                var chtml = [
                    '<div class="', col, '">',
                        '<div class="avatar">',
                            '<img src="images/', contact.getContext().avatar, '" />',
                        '</div>',
                        '<div class="name">',
                            '<div>', contact.getName(), '</div>',
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

    g.VoiceGroupCallPanel = VoiceGroupCallPanel;

})(window);
