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

    var that = null;

    var tabId = 'messaging';
    var tabBtnId = 'tab_messaging';

    var pushMenu = null;
    var collapseSidebar = false;
    var mouseleaveTimer = 0;

    var audioCallRing = null;
    var audioWaitingTone = null;

    /**
     * 主面板。
     * 封装了主面板上的辅助和共用功能。
     */
    var MainPanel = function() {
        that = this;

        var body = $('body');
        pushMenu = body.find('a[data-widget="pushmenu"]');

        $(document).on('shown.lte.pushmenu', function() {
            collapseSidebar = false;
            g.app.saveConfig('sidebarCollapse', collapseSidebar);
        });
        $(document).on('collapsed.lte.pushmenu', function() {
            collapseSidebar = true;
            g.app.saveConfig('sidebarCollapse', collapseSidebar);
        });

        $('.main-sidebar').on('mouseleave', function() {
            if (collapseSidebar) {
                if (mouseleaveTimer > 0) {
                    return;
                }
                mouseleaveTimer = setTimeout(function() {
                    clearTimeout(mouseleaveTimer);
                    mouseleaveTimer = 0;
                    $('.main-sidebar').removeClass('sidebar-focused');
                }, 100);
            }
        });
    }

    /**
     * 初始化面板上的控件数据。
     */
    MainPanel.prototype.prepare = function() {
        // 加载侧边栏是否展开配置
        var value = g.app.loadConfig('sidebarCollapse');
        if (null != value && undefined !== value) {
            collapseSidebar = value;
            if (collapseSidebar) {
                pushMenu.PushMenu('collapse');
            }
        }

        // 查找 audio
        audioCallRing = $('audio[data-target="call-ring"]')[0];
        audioWaitingTone = $('audio[data-target="waiting-tone"]')[0];
    }

    /**
     * 切换主界面。
     * @param {string} id 界面 ID 。
     */
    MainPanel.prototype.toggle = function(id) {
        if (null != app.globalPopover) {
            // 关闭全局 Popover 层
            app.globalPopover.popover('hide');
        }

        if (tabId == id) {
            return;
        }

        var btnId = 'tab_' + id;

        $('#' + tabId).addClass('content-wrapper-hidden');
        $('#' + id).removeClass('content-wrapper-hidden');
        tabId = id;

        $('#' + tabBtnId).removeClass('active');
        $('#' + btnId).addClass('active');
        tabBtnId = btnId;

        if (id == 'messaging') {
            $('.main-title').text('消息');
        }
        else if (id == 'files') {
            $('.main-title').text('文件');
        }
        else if (id == 'conference') {
            $('.main-title').text('会议');
        }
        else if (id == 'contacts') {
            $('.main-title').text('联系人');
        }
    }

    /**
     * 隐藏指定的界面。
     * @param {string} id 界面 ID 。
     */
    MainPanel.prototype.hide = function(id) {
        var btnId = 'tab_' + id;
        $('#' + btnId).parent().css('display', 'none');

        $('#' + id).removeClass('content-wrapper-hidden');
        $('#' + id).addClass('content-wrapper-hidden');
    }

    /**
     * 播放振铃音效。
     */
    MainPanel.prototype.playCallRing = function() {
        audioCallRing.volume = 1.0;

        if (audioCallRing.paused) {
            audioCallRing.removeAttribute('muted');
            audioCallRing.play();
        }
    }

    /**
     * 停止振铃音效。
     */
    MainPanel.prototype.stopCallRing = function() {
        audioCallRing.pause();
        audioCallRing.setAttribute('muted', 'muted');
    }

    /**
     * 播放等待接通音效。
     */
    MainPanel.prototype.playWaitingTone = function() {
        audioWaitingTone.volume = 1.0;

        if (audioWaitingTone.paused) {
            audioWaitingTone.removeAttribute('muted');
            audioWaitingTone.play();
        }
    }

    /**
     * 停止等待接通音效。
     */
    MainPanel.prototype.stopWaitingTone = function() {
        audioWaitingTone.pause();
        audioWaitingTone.setAttribute('muted', 'muted');
    }

    g.MainPanel = MainPanel;

})(window);
