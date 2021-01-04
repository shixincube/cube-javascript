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

    var remoteVideo = null;
    var localVideo = null;

    var mainVideo = null;

    var VideoChatPanel = function(el) {
        this.el = el;
        that = this;

        el.draggable({
            handle: ".modal-header"
        });

        el.on('hide.bs.modal', function() {
        });

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

        remoteVideo = remoteContainer[0].querySelector('video');
        localVideo = localContainer[0].querySelector('video');
        mainVideo = remoteVideo;

        this.btnHangup = el.find('button[data-target="hangup"]');
        this.btnHangup.on('click', function() {
            that.terminate();
        });
    }

    VideoChatPanel.prototype.restore = function() {
        var content = this.el.find('.modal-content');
        var footer = this.el.find('.modal-footer');

        if (sizeState == 0) {
            this.el.removeClass('video-chat-panel-mini');
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

            this.el.css('left', lastX);
            this.el.css('top', lastY);
            this.el.css('width', '');
            this.el.css('height', '');

            var dialog = this.el.find('.modal-dialog');
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
            this.el.draggable({
                handle: ".modal-header",
                disabled: false
            });
        }

        sizeState = 1;
    }

    VideoChatPanel.prototype.minimize = function() {
        if (sizeState != 1) {
            return;
        }

        sizeState = 0;

        var content = this.el.find('.modal-content');
        var footer = this.el.find('.modal-footer');

        this.el.addClass('video-chat-panel-mini');
        content.addClass('modal-content-mini');
        remoteContainer.addClass('video-mini');
        localContainer.addClass('video-mini');
        localContainer.css('visibility', 'hidden');
        footer.css('display', 'none');
        btnMin.css('display', 'none');
        btnMax.css('display', 'none');
        btnRes.css('display', 'block');
    }

    VideoChatPanel.prototype.maximize = function() {
        if (sizeState != 1) {
            return;
        }

        sizeState = 2;

        this.resize();

        btnMin.css('display', 'none');
        btnMax.css('display', 'none');
        btnRes.css('display', 'block');

        this.el.draggable({ disabled: true });
    }

    VideoChatPanel.prototype.showMakeCall = function(target) {
        console.log('尝试视频连线 ' + target.getId());

        this.el.modal({
            keyboard: false,
            backdrop: false
        });
    }

    VideoChatPanel.prototype.close = function() {
        this.el.modal('hide');
    }

    VideoChatPanel.prototype.tipWaitForAnswer = function() {

    }

    VideoChatPanel.prototype.switchVideo = function() {
        if (mainVideo == remoteVideo) {
            remoteContainer.removeClass('video-main');
            localContainer.removeClass('video-pip');

            remoteContainer.addClass('video-pip');
            localContainer.addClass('video-main');

            mainVideo = localVideo;
        }
        else {
            localContainer.removeClass('video-main');
            remoteContainer.removeClass('video-pip');

            localContainer.addClass('video-pip');
            remoteContainer.addClass('video-main');

            mainVideo = remoteVideo;
        }
    }

    /**
     * 挂断通话。
     */
    VideoChatPanel.prototype.terminate = function() {
        g.app.callCtrl.hangupCall();
        this.close();
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

        lastX = this.el.css('left');
        lastY = this.el.css('top');

        this.el.css('left', '322px');
        this.el.css('top', '-1px');
        this.el.css('width', w + 'px');
        this.el.css('height', h + 'px');

        var dialog = this.el.find('.modal-dialog');
        var content = this.el.find('.modal-content');
        var footer = this.el.find('.modal-footer');

        w = w - 2;
        h = h - 2;
        dialog.css('width', w + 'px');
        dialog.css('height', h + 'px');
        content.css('width', w + 'px');
        content.css('height', h + 'px');

        remoteContainer.css('width', (w - 2) + 'px');
        remoteContainer.css('height', (h - 105 - 2) + 'px');

        footer.css('width', w + 'px');
    }

    g.VideoChatPanel = VideoChatPanel;

})(window);
