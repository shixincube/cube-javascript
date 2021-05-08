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
 * 视频聊天面板。
 */
(function(g) {
    'use strict'

    var that = null;

    var btnMin = null;
    var btnMax = null;
    var btnRes = null;

    var resizeTimer = 0;
    var lastX = '640px';
    var lastY = '0px';

    /**
     * 0 - 最小化
     * 1 - 标准大小
     * 2 - 最大化
     */
    var sizeState = 1;

    var remoteContainer = null;
    var localContainer = null;
    var primaryCon = null;
    var secondaryCon = null;

    var remoteVideo = null;
    var localVideo = null;
    var mainVideo = null;

    var wfaTimer = 0;
    var callingTimer = 0;
    var callingElapsed = 0;

    /**
     * 视频通话面板。
     * @param {jQuery} el 
     */
    var VideoChatPanel = function(el) {
        that = this;

        var el = $('#video_chat');
        this.panelEl = el;

        // 监听窗口大小变化
        window.addEventListener('resize', this.onResize, false);

        btnMin = el.find('button[data-target="minimize"]');
        btnMin.on('click', function() {
            that.minimize();
        });
        btnMax = el.find('button[data-target="maximize"]');
        btnMax.on('click', function() {
            that.maximize();
        });
        btnRes = el.find('button[data-target="restore"]');
        btnRes.on('click', function() {
            that.restore();
        });
        btnRes.css('display', 'none');

        remoteContainer = el.find('div[data-target="video-remote"]');
        localContainer = el.find('div[data-target="video-local"]');

        remoteContainer.on('click', function(e) {
            if (mainVideo == localVideo) {
                that.switchVideo();
            }
        });

        localContainer.on('click', function(e) {
            if (mainVideo == remoteVideo) {
                that.switchVideo();
            }
        });

        // 主副容器
        primaryCon = remoteContainer;
        secondaryCon = localContainer;

        remoteVideo = remoteContainer[0].querySelector('video');
        localVideo = localContainer[0].querySelector('video');
        mainVideo = remoteVideo;
        remoteVideo.style.visibility = 'hidden';

        this.remoteVideo = remoteVideo;
        this.localVideo = localVideo;

        this.headerTip = el.find('.header-tip');
        this.callTip = el.find('.call-tip');

        this.elRemoteLabel = remoteContainer.find('.video-label');
        this.elLocalLabel = localContainer.find('.video-label');

        this.btnCam = el.find('button[data-target="camera"]');
        this.btnMic = el.find('button[data-target="microphone"]');
        this.btnVol = el.find('button[data-target="volume"]');

        this.btnCam.attr('disabled', 'disabled');
        this.btnMic.attr('disabled', 'disabled');
        this.btnVol.attr('disabled', 'disabled');

        this.btnCam.on('click', function() {
            if (g.app.callCtrl.toggleCamera()) {
                // 摄像头已启用
                that.btnCam.html('<i class="ci ci-btn ci-camera-opened"></i>');
            }
            else {
                // 摄像头已停用
                that.btnCam.html('<i class="ci ci-btn ci-camera-closed"></i>');
            }
        });
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

        // 允许拖拽
        el.draggable({
            handle: '.modal-header',
            containment: 'document'
        });

        el.on('hide.bs.modal', function() {
            if (wfaTimer > 0) {
                clearInterval(wfaTimer);
                wfaTimer = 0;
            }
            if (callingTimer > 0) {
                clearInterval(callingTimer);
                callingTimer = 0;
            }
            callingElapsed = 0;

            remoteVideo.style.visibility = 'hidden';

            that.callTip.text('');
            that.headerTip.text('');
        });
    }

    /**
     * 窗口恢复。
     */
    VideoChatPanel.prototype.restore = function() {
        var content = this.panelEl.find('.modal-content');
        var footer = this.panelEl.find('.modal-footer');

        if (sizeState == 0) {
            this.panelEl.removeClass('video-chat-panel-mini');
            content.removeClass('modal-content-mini');
            remoteContainer.removeClass('video-mini');
            localContainer.removeClass('video-mini');
            localContainer.css('visibility', 'visible');
            footer.css('display', 'flex');
            btnMin.css('display', 'block');
            btnMax.css('display', 'block');
            btnRes.css('display', 'none');
        }
        else if (sizeState == 2) {
            if (resizeTimer > 0) {
                clearTimeout(resizeTimer);
                resizeTimer = 0;
            }

            this.panelEl.css('left', lastX);
            this.panelEl.css('top', lastY);
            this.panelEl.css('width', '');
            this.panelEl.css('height', '');

            var dialog = this.panelEl.find('.modal-dialog');
            dialog.css('width', '');
            dialog.css('height', '');
            content.css('width', '');
            content.css('height', '');
            footer.css('width', '');

            remoteContainer.css('width', '');
            remoteContainer.css('height', '');
            localContainer.css('width', '');
            localContainer.css('height', '');

            btnMin.css('display', 'block');
            btnMax.css('display', 'block');
            btnRes.css('display', 'none');

            // 恢复拖放
            this.panelEl.draggable({
                handle: '.modal-header',
                containment: 'document',
                disabled: false
            });
        }

        this.refresh();

        sizeState = 1;
    }

    /**
     * 窗口最小化。
     */
    VideoChatPanel.prototype.minimize = function() {
        if (sizeState != 1) {
            return;
        }

        sizeState = 0;

        var content = this.panelEl.find('.modal-content');
        var footer = this.panelEl.find('.modal-footer');

        this.panelEl.addClass('video-chat-panel-mini');
        content.addClass('modal-content-mini');
        remoteContainer.addClass('video-mini');
        localContainer.addClass('video-mini');
        localContainer.css('visibility', 'hidden');
        footer.css('display', 'none');
        btnMin.css('display', 'none');
        btnMax.css('display', 'none');
        btnRes.css('display', 'block');

        this.refresh();
    }

    /**
     * 窗口最大化。
     */
    VideoChatPanel.prototype.maximize = function() {
        if (sizeState != 1) {
            return;
        }

        sizeState = 2;

        this.resize();

        btnMin.css('display', 'none');
        btnMax.css('display', 'none');
        btnRes.css('display', 'block');

        this.panelEl.draggable({ disabled: true });
    }

    /**
     * 发起通话。
     * @param {Contact} target 
     */
    VideoChatPanel.prototype.open = function(target) {
        console.log('发起视频连线 ' + target.getId());

        var videoDevice = null;

        var handler = function() {
            if (g.app.callCtrl.makeCall(target, true, videoDevice)) {
                that.elRemoteLabel.text(target.getName());
                that.elLocalLabel.text('我');

                that.panelEl.modal({
                    keyboard: false,
                    backdrop: false
                });
            }
            else {
                g.dialog.launchToast(Toast.Warning, '您当前正在通话中');
            }
        }

        g.cube().mpComm.listMediaDevices(function(list) {
            if (list.length == 0) {
                g.dialog.showAlert('没有找到可用的摄像机设备，请您确认是否正确连接了摄像机设备。');
                return;
            }

            // 多个设备时进行选择
            var result = [];
            for (var i = 0; i < list.length; ++i) {
                if (list[i].isVideoInput()) {
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
                        videoDevice = result[selectedIndex];
                        // console.log('Select device: ' + videoDevice.label);
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
     * 发起应答。
     * @param {Contact} caller 
     */
    VideoChatPanel.prototype.showAnswer = function(caller) {
        console.log('应答视频通话 ' + caller.getId());

        this.elRemoteLabel.text(caller.getName());
        this.elLocalLabel.text('我');

        that.btnCam.removeAttr('disabled');
        that.btnMic.removeAttr('disabled');
        that.btnVol.removeAttr('disabled');

        this.panelEl.modal({
            keyboard: false,
            backdrop: false
        });
    }

    /**
     * 关闭窗口。
     */
    VideoChatPanel.prototype.close = function() {
        this.panelEl.modal('hide');

        // 停止播放等待音
        g.app.mainPanel.stopWaitingTone();
        // 停止播放振铃
        g.app.mainPanel.stopCallRing();
    }

    /**
     * 在主屏上提示正在呼叫。
     * @param {Contact} callee 
     */
    VideoChatPanel.prototype.tipWaitForAnswer = function(callee) {
        if (wfaTimer > 0) {
            return;
        }

        var h = that.callTip.parent().height();
        var y = (h - 21) * 0.5;
        that.callTip.css('top', y + 'px');

        var time = 0;
        wfaTimer = setInterval(function() {
            that.callTip.text('正在呼叫“' + callee.getName() + '”：' + (++time) + ' 秒...');
        }, 1000);

        // 播放等待音
        g.app.mainPanel.playWaitingTone();

        that.btnCam.removeAttr('disabled');
        that.btnMic.removeAttr('disabled');
        that.btnVol.removeAttr('disabled');
    }

    /**
     * 在主屏上提示已接通。
     */
    VideoChatPanel.prototype.tipConnected = function() {
        if (wfaTimer > 0) {
            clearInterval(wfaTimer);
            wfaTimer = 0;
        }

        if (callingTimer > 0) {
            return;
        }

        that.callTip.text('');

        remoteVideo.style.visibility = 'visible';

        callingTimer = setInterval(function() {
            that.headerTip.text(g.formatClockTick(++callingElapsed));
        }, 1000);

        // 更新按钮状态
        if (g.app.callCtrl.isCameraOpened()) {
            that.btnCam.html('<i class="ci ci-btn ci-camera-opened"></i>');
        }
        else {
            that.btnCam.html('<i class="ci ci-btn ci-camera-closed"></i>');
        }

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
    }

    /**
     * 开启有通话邀请的提示框。
     * @param {Contact} contact 
     */
    VideoChatPanel.prototype.openNewCallToast = function(contact) {
        var body = [
            '<div class="toasts-info">\
                <div class="info-box">\
                    <span class="info-box-icon"><img src="images/', contact.getContext().avatar, '" /></span>\
                    <div class="info-box-content">\
                        <span class="info-box-text">', contact.getName(), '</span>\
                        <span class="info-box-desc">邀请您参与视频通话</span>\
                    </div>\
                </div>\
                <div class="call-answer">\
                    <button type="button" class="btn btn-danger" onclick="javascript:app.callCtrl.hangupCall();"><i class="ci ci-hangup"></i> 拒绝</button>\
                    <button type="button" class="btn btn-success" onclick="javascript:app.callCtrl.answerCall();"><i class="ci ci-answer"></i> 接听</button>\
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
     * 关闭有通话邀请的提示框。
     */
    VideoChatPanel.prototype.closeNewCallToast = function() {
        $('#toastsContainerBottomRight').find('.video-new-call').remove();
    }

    /**
     * 切换主视频和画中画。
     */
    VideoChatPanel.prototype.switchVideo = function() {
        if (mainVideo == remoteVideo) {
            mainVideo = localVideo;

            primaryCon = localContainer;
            secondaryCon = remoteContainer;
        }
        else {
            mainVideo = remoteVideo;

            primaryCon = remoteContainer;
            secondaryCon = localContainer;
        }

        primaryCon.removeClass('video-pip');
        secondaryCon.removeClass('video-main');
        primaryCon.addClass('video-main');
        secondaryCon.addClass('video-pip');

        if (sizeState == 2) {
            // 当最大化时需要调整主画面大小
            var w = parseInt(document.body.clientWidth);
            var h = g.dialog.getFullHeight();
            primaryCon.css('width', (w - 4) + 'px');
            primaryCon.css('height', (h - 105 - 4) + 'px');
            secondaryCon.css('width', '');
            secondaryCon.css('height', '');
        }
    }

    /**
     * 挂断通话。
     */
    VideoChatPanel.prototype.terminate = function() {
        g.app.callCtrl.hangupCall();
    }

    VideoChatPanel.prototype.onResize = function(event) {
        if (sizeState != 2) {
            return;
        }

        if (resizeTimer > 0) {
            clearTimeout(resizeTimer);
            resizeTimer = 0;
        }

        resizeTimer = setTimeout(function() {
            clearTimeout(resizeTimer);
            resizeTimer = 0;

            that.resize();
        }, 600);
    }

    VideoChatPanel.prototype.resize = function() {
        if (sizeState != 2) {
            return;
        }

        var w = parseInt(document.body.clientWidth);
        var h = g.dialog.getFullHeight();

        lastX = this.panelEl.css('left');
        lastY = this.panelEl.css('top');

        this.panelEl.css('left', '322px');
        this.panelEl.css('top', '-1px');
        this.panelEl.css('width', w + 'px');
        this.panelEl.css('height', h + 'px');

        var dialog = this.panelEl.find('.modal-dialog');
        var content = this.panelEl.find('.modal-content');
        var footer = this.panelEl.find('.modal-footer');

        w = w - 2;
        h = h - 2;
        dialog.css('width', w + 'px');
        dialog.css('height', h + 'px');
        content.css('width', w + 'px');
        content.css('height', h + 'px');

        primaryCon.css('width', (w - 2) + 'px');
        primaryCon.css('height', (h - 105 - 2) + 'px');

        footer.css('width', w + 'px');

        this.refresh();
    }

    VideoChatPanel.prototype.refresh = function() {
        var h = that.callTip.parent().height();
        var y = (h - 21) * 0.5;
        that.callTip.css('top', y + 'px');
    }

    g.VideoChatPanel = VideoChatPanel;

})(window);
