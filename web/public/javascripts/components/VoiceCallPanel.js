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
 * 语音通话面板。
 */
(function(g) {
    'use strict'

    var that = null;

    var wfaTimer = 0;

    var callingTimer = 0;
    var callingElapsed = 0;

    /**
     * 语音通话面板。
     * @param {jQuery} el 
     */
    var VoiceCallPanel = function(el) {
        that = this;

        this.el = el;

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
                that.btnMic.empty();
                that.btnMic.append($('<i class="ci ci-btn ci-microphone-opened"></i>'));
            }
            else {
                // 麦克风已静音
                that.btnMic.empty();
                that.btnMic.append($('<i class="ci ci-btn ci-microphone-closed"></i>'));
            }
        });

        this.btnVol = el.find('button[data-target="volume"]');
        this.btnVol.attr('disabled', 'disabled');
        this.btnVol.on('click', function() {
            if (g.app.callCtrl.toggleLoudspeaker()) {
                // 扬声器未静音
                that.btnVol.empty();
                that.btnVol.append($('<i class="ci ci-btn ci-volume-unmuted"></i>'));
            }
            else {
                // 扬声器已静音
                that.btnVol.empty();
                that.btnVol.append($('<i class="ci ci-btn ci-volume-muted"></i>'));
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
    VoiceCallPanel.prototype.showMakeCall = function(target) {
        console.log('发起语音通话 ' + target.getId());

        if (g.app.callCtrl.makeCall(target, false)) {
            this.elPeerAvatar.attr('src', 'images/' + target.getContext().avatar);
            this.elPeerName.text(target.getName());
            this.elInfo.text('正在呼叫...');

            this.el.modal({
                keyboard: false,
                backdrop: false
            });
        }
        else {
            g.dialog.launchToast(Toast.Warning, '您当前正在通话中');
        }
    }

    /**
     * 显示应答通话界面。
     * @param {Contact} caller 
     */
    VoiceCallPanel.prototype.showAnswerCall = function(caller) {
        console.log('应答语音通话 ' + caller.getId());

        this.elPeerAvatar.attr('src', 'images/' + caller.getContext().avatar);
        this.elPeerName.text(caller.getName());
        this.elInfo.text('正在应答...');

        this.el.modal({
            keyboard: false,
            backdrop: false
        });
    }

    /**
     * 关闭面板。
     */
    VoiceCallPanel.prototype.close = function() {
        this.el.modal('hide');
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

        this.btnMic.removeAttr('disabled');
        this.btnVol.removeAttr('disabled');

        callingTimer = setInterval(function() {
            that.elInfo.text(g.formatClockTick(++callingElapsed));
        }, 1000);
    }

    /**
     * 开启通话邀请提示框。
     * @param {Contact} contact 
     */
    VoiceCallPanel.prototype.openNewCallToast = function(contact) {
        var body = [
            '<div class="toasts-info">\
                <div class="info-box">\
                    <span class="info-box-icon"><img src="images/', contact.getContext().avatar, '" /></span>\
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
            icon: 'fas fa-phone',
            close: false,
            class: 'voice-new-call',
            body: body.join('')
        });
    }

    /**
     * 关闭通话邀请提示框。
     */
    VoiceCallPanel.prototype.closeNewCallToast = function() {
        $('#toastsContainerBottomRight').find('.voice-new-call').remove();
    }

    /**
     * 挂断通话。
     */
    VoiceCallPanel.prototype.terminate = function() {
        g.app.callCtrl.hangupCall();
    }

    g.VoiceCallPanel = VoiceCallPanel;

})(window);
