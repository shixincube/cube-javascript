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
 * 语音通话面板。
 */
(function(g) {

    var that = null;

    var wfaTimer = 0;

    var callingTimer = 0;
    var callingElapsed = 0;

    /**
     * 语音通话面板。
     * @param {jQuery} el 
     */
    var VoiceCallPanel = function() {
        that = this;

        var el = $('#voice_call');
        this.panelEl = el;

        this.elPeerAvatar = el.find('img[data-target="avatar"]');
        this.elPeerName = el.find('span[data-target="name"]');
        this.elInfo = el.find('span[data-target="info"]');

        this.remoteVideo = el.find('video[data-target="remote"]')[0];
        this.localVideo = el.find('video[data-target="local"]')[0];

        this.btnMic = el.find('button[data-target="microphone"]');
        this.btnMic.attr('disabled', 'disabled');
        this.btnMic.on('click', function() {
            if (g.app.callCtrl.toggleMicrophone()) {
                // 麦克风未静音
                that.btnMic.html('<i class="ci ci-btn ci-microphone-opened"></i>');
            }
            else {
                // 麦克风已静音
                that.btnMic.html('<i class="ci ci-btn ci-microphone-closed"></i>');
            }
        });

        this.btnVol = el.find('button[data-target="volume"]');
        this.btnVol.attr('disabled', 'disabled');
        this.btnVol.on('click', function() {
            if (g.app.callCtrl.toggleLoudspeaker()) {
                // 扬声器未静音
                that.btnVol.html('<i class="ci ci-btn ci-volume-unmuted"></i>');
            }
            else {
                // 扬声器已静音
                that.btnVol.html('<i class="ci ci-btn ci-volume-muted"></i>');
            }
        });

        this.btnHangup = el.find('button[data-target="hangup"]');
        this.btnHangup.on('click', function() {
            that.terminate();
        });

        el.draggable({
            handle: ".modal-header"
        });

        el.on('hide.bs.modal', function() {
            if (wfaTimer > 0) {
                clearInterval(wfaTimer);
                wfaTimer = 0;
            }

            if (callingTimer > 0) {
                clearTimeout(callingTimer);
                callingTimer = 0;
            }

            callingElapsed = 0;

            that.btnMic.attr('disabled', 'disabled');
            that.btnVol.attr('disabled', 'disabled');
        });
    }

    /**
     * 显示发起通话界面。
     * @param {Contact} target 
     */
    VoiceCallPanel.prototype.open = function(target) {
        console.log('发起语音通话 ' + target.getId());

        var audioDevice = null;

        var handler = function() {
            if (g.app.callCtrl.makeCall(target, false, audioDevice)) {
                that.elPeerAvatar.attr('src', g.helper.getAvatarImage(target.getContext().avatar));
                that.elPeerName.text(target.getName());
                that.elInfo.text('正在呼叫...');

                that.panelEl.modal({
                    keyboard: false,
                    backdrop: false
                });
            }
            else {
                g.dialog.launchToast(Toast.Warning, '您当前正在通话中');
            }
        };

        g.cube().mpComm.listMediaDevices(function(list) {
            if (list.length == 0) {
                g.dialog.showAlert('没有找到可用的麦克风设备，请您确认是否正确连接了麦克风设备。');
                return;
            }

            // 多个设备时进行选择
            var result = [];
            for (var i = 0; i < list.length; ++i) {
                if (list[i].isAudioInput()) {
                    result.push(list[i]);
                }
            }

            if (result.length > 1) {
                g.app.callCtrl.showSelectMediaDevice(result, function(selected, selectedIndex) {
                    if (selected) {
                        if (selectedIndex >= result.length) {
                            g.dialog.showAlert('选择的设备数据错误');
                            return;
                        }

                        // 设置设备
                        audioDevice = result[selectedIndex];
                        handler();
                    }
                    else {
                        // 取消通话
                        return;
                    }
                });
            }
            else {
                handler();
            }
        });
    }

    /**
     * 显示应答通话界面。
     * @param {Contact} caller 
     */
    VoiceCallPanel.prototype.showAnswer = function(caller) {
        console.log('应答语音通话 ' + caller.getId());

        this.elPeerAvatar.attr('src', g.helper.getAvatarImage(caller.getContext().avatar));
        this.elPeerName.text(caller.getName());
        this.elInfo.text('正在应答...');

        this.btnMic.removeAttr('disabled');
        this.btnVol.removeAttr('disabled');

        this.panelEl.modal({
            keyboard: false,
            backdrop: false
        });
    }

    /**
     * 关闭面板。
     */
    VoiceCallPanel.prototype.close = function() {
        this.panelEl.modal('hide');
        // 停止播放等待音
        g.app.mainPanel.stopWaitingTone();
        // 停止播放振铃
        g.app.mainPanel.stopCallRing();

        this.btnMic.attr('disabled', 'disabled');
        this.btnVol.attr('disabled', 'disabled');
    }

    /**
     * 提示等待信息。
     * @param {Contact} callee 
     */
    VoiceCallPanel.prototype.tipWaitForAnswer = function(callee) {
        if (wfaTimer > 0) {
            return;
        }

        var time = 0;
        wfaTimer = setInterval(function() {
            that.elInfo.text('等待应答，已等待 ' + (++time) + ' 秒...');
        }, 1000);

        // 播放等待音
        g.app.mainPanel.playWaitingTone();

        that.btnMic.removeAttr('disabled');
        that.btnVol.removeAttr('disabled');
    }

    /**
     * 提示已接通通话。
     */
    VoiceCallPanel.prototype.tipConnected = function() {
        if (wfaTimer > 0) {
            clearInterval(wfaTimer);
            wfaTimer = 0;
        }

        if (callingTimer > 0) {
            return;
        }

        // 更新按钮状态
        if (g.app.callCtrl.isMicrophoneOpened()) {
            that.btnMic.html('<i class="ci ci-btn ci-microphone-opened"></i>');
        }
        else {
            that.btnMic.html('<i class="ci ci-btn ci-microphone-closed"></i>');
        }

        if (g.app.callCtrl.isUnmuted()) {
            that.btnVol.html('<i class="ci ci-btn ci-volume-unmuted"></i>');
        }
        else {
            that.btnVol.html('<i class="ci ci-btn ci-volume-muted"></i>');
        }

        callingTimer = setInterval(function() {
            that.elInfo.text(g.formatClockTick(++callingElapsed));
        }, 1000);

        // 停止播放等待音
        g.app.mainPanel.stopWaitingTone();
    }

    /**
     * 开启通话邀请提示框。
     * @param {Contact} contact 
     */
    VoiceCallPanel.prototype.openNewCallToast = function(contact) {
        var body = [
            '<div class="toasts-info">\
                <div class="info-box">\
                    <span class="info-box-icon"><img src="', g.helper.getAvatarImage(contact.getContext().avatar), '" /></span>\
                    <div class="info-box-content">\
                        <span class="info-box-text">', contact.getName(), '</span>\
                        <span class="info-box-desc">邀请您参与语音通话</span>\
                    </div>\
                </div>\
                <div class="call-answer">\
                    <button type="button" class="btn btn-danger" onclick="javascript:app.callCtrl.hangupCall();"><i class="ci ci-hangup"></i> 拒绝</button>\
                    <button type="button" class="btn btn-success" onclick="javascript:app.callCtrl.answerCall();"><i class="ci ci-answer"></i> 接听</button>\
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
     * 关闭通话邀请提示框。
     */
    VoiceCallPanel.prototype.closeNewCallToast = function() {
        $('#toastsContainerBottomRight').find('.voice-new-call').remove();

        // 停止振铃音效
        g.app.mainPanel.stopCallRing();
    }

    /**
     * 挂断通话。
     */
    VoiceCallPanel.prototype.terminate = function() {
        g.app.callCtrl.hangupCall();
    }

    g.VoiceCallPanel = VoiceCallPanel;

})(window);
