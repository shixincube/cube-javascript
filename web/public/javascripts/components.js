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

// 对话框组件
(function(g) {
    'use strict';

    /**
     * Toast 提示类型。
     */
    var Toast = {
        Success: 'success',
        Info: 'info',
        Error: 'error',
        Warning: 'warning',
        Question: 'question'
    };

    var toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
    });

    var toastBE = Swal.mixin({
        toast: true,
        position: 'bottom-end',
        showConfirmButton: false,
        timer: 3000
    });

    var promptCallback = function() {};

    var confirmCallback = function() {};

    var alertCallback = null;

    var loadingModal = null;
    var loading = false;

    var dialog = {

        /**
         * 获取浏览器内容区域高度。
         */
        getFullHeight: function() {
            return parseInt(document.body.clientHeight) + 57 + 8;
        },

        /**
         * 显示吐司提示。
         * @param {string} type 
         * @param {string} text 
         * @param {boolean} [rb] 是否右下角
         */
        launchToast: function(type, text, rb) {
            if (rb) {
                toastBE.fire({
                    icon: type,
                    title: text
                });
            }
            else {
                toast.fire({
                    icon: type,
                    title: text
                });
            }
        },

        /**
         * 显示提示输入框。
         * @param {string} title 标题。
         * @param {string} label 输入内容提示。
         * @param {function} callback 回调函数。回调函数不返回值或者返回 {@linkcode true} 时关闭对话框。
         * @param {string} [prevalue] 预置输入框内的文本。
         */
        showPrompt: function(title, label, callback, prevalue) {
            var el = $('#modal_prompt');
            el.find('.modal-title').text(title);
            el.find('.prompt-label').text(label);

            if (prevalue) {
                el.find('.prompt-input').val(prevalue);
            }
            else {
                el.find('.prompt-input').val('');
            }

            promptCallback = callback;

            el.modal();
        },

        /**
         * 关闭提示输入框。
         * @param {boolean} ok 是否点击了确定按钮。
         */
        closePrompt: function(ok) {
            var el = $('#modal_prompt');
            if (ok) {
                var res = promptCallback(ok, el.find('.prompt-input').val());
                if (undefined === res || res) {
                    el.modal('hide');
                }
            }
            else {
                promptCallback(ok, el.find('.prompt-input').val());
            }
        },

        /**
         * 隐藏提示输入框。
         * @param {boolean} [ok] 是否点击确定。
         */
        hidePrompt: function(ok) {
            if (undefined !== ok) {
                this.closePrompt(ok);
            }
            else {
                var el = $('#modal_prompt');
                el.modal('hide');
            }
        },

        /**
         * 显示确认框。
         * @param {string} title 标题。
         * @param {string} content 提示内容。
         * @param {function} callback 回调函数。
         * @param {string} [okButtonLabel] 确认按钮的显示文本，默认：“确定”。
         */
        showConfirm: function(title, content, callback, okButtonLabel) {
            var el = $('#modal_confirm');
            el.find('.modal-title').text(title);
            el.find('.modal-body').html('<p>' + content + '</p>');

            el.find('.btn-primary').text(okButtonLabel ? okButtonLabel : '确定');

            confirmCallback = callback;

            el.modal();
        },

        /**
         * 关闭确认框。
         * @param {boolean} yesOrNo 是否点击了确定按钮。
         */
        closeConfirm: function(yesOrNo) {
            confirmCallback(yesOrNo);
        },

        hideConfirm: function(yesOrNo) {
            this.closeConfirm(yesOrNo);
        },

        /**
         * 显示提示框。
         * @param {string} content 内容。
         * @param {function} [callback] 回调函数。
         * @param {string} [buttonLabel] 按钮显示的文本，默认：“确定”
         */
        showAlert: function(content, callback, buttonLabel) {
            var el = $('#modal_alert');
            el.find('.modal-body').html('<p>' + content + '</p>');

            if (buttonLabel) {
                el.find('button.btn-default').text(buttonLabel);
            }
            else {
                el.find('button.btn-default').text('确定');
            }
    
            if (undefined === callback) {
                alertCallback = null;
            }
            else {
                alertCallback = callback;
            }
    
            el.modal();
        },

        /**
         * 关闭提示框。
         */
        closeAlert: function() {
            if (null != alertCallback) {
                alertCallback();
            }
            $('#modal_alert').modal('hide');
        },

        hideAlert: function() {
            this.closeAlert();
        },

        /**
         * 显示进度提示。
         * @param {string} content 提示的内容。
         * @param {number} timeout 超时时长。单位：毫秒。
         */
        showLoading: function(content, timeout) {
            if (loading) {
                return;
            }

            loading = true;

            if (undefined === timeout) {
                timeout = 8000;
            }

            var timer = 0;
            var timeoutTimer = 0;

            if (null == loadingModal) {
                loadingModal = $('#modal_loading');
                loadingModal.on('hidden.bs.modal', function() {
                    if (timer != 0) {
                        clearInterval(timer);
                    }
                    if (timeoutTimer != 0) {
                        clearTimeout(timeoutTimer);
                    }

                    loading = false;
                });
            }

            var el = loadingModal;
            el.find('.modal-title').html(content + '&hellip;');

            var elElapsed = el.find('.modal-elapsed-time');
            elElapsed.text('0 秒');

            var count = 0;
            timer = setInterval(function() {
                ++count;
                elElapsed.text(count + ' 秒');
            }, 1000);

            el.modal({
                keyboard: false,
                backdrop: 'static'
            });

            timeoutTimer = setTimeout(function() {
                clearInterval(timer);
                timer = 0;
                clearTimeout(timeoutTimer);
                timeoutTimer = 0;
                el.modal('hide');
            }, timeout);

            return el;
        },

        /**
         * 隐藏加载提示对话框。
         */
        hideLoading: function() {
            if (null != loadingModal) {
                loadingModal.modal('hide');
            }
            else {
                $('#modal_loading').modal('hide');
            }
        },

        /**
         * 显示指定文件标签的图片。
         * @param {FileLabel} file 文件标签。
         */
        showImage: function(file) {
            var show = function(url) {
                var image = new Image();
                image.src = url;
                var viewer = new Viewer(image, {
                    hidden: function () {
                        viewer.destroy();
                    }
                });
                viewer.show();
            };

            g.cube().fileStorage.getFileURL(file, function(fileLabel, url, surl) {
                show(url);
            });
        },

        /**
         * 下载文件并显示保存文件对话框。
         * @param {string} fileCode 指定下载文件的文件码。
         */
        downloadFile: function(fileCode) {
            g.cube().fileStorage.downloadFile(fileCode);
        }
    };

    g.dialog = dialog;

    g.Toast = Toast;

})(window);


/**
 * 主面板。
 */
(function(g) {
    'use strict';

    var that = null;

    var tabId = 'messaging';
    var tabBtnId = 'tab_messaging';

    var pushMenu = null;
    var collapseSidebar = false;
    var mouseoutTimer = 0;

    var audioCallRing = null;
    var audioWaitingTone = null;

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

        $('.main-sidebar').on('mouseout', function() {
            if (collapseSidebar) {
                if (mouseoutTimer > 0) {
                    return;
                }
                mouseoutTimer = setTimeout(function() {
                    clearTimeout(mouseoutTimer);
                    mouseoutTimer = 0;
                    $('.main-sidebar').removeClass('sidebar-focused');
                }, 100);
            }
        });
    }

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
     * @param {string} id 
     */
    MainPanel.prototype.toggle = function(id) {
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
     * 
     */
    MainPanel.prototype.playCallRing = function() {
        audioCallRing.volume = 1.0;

        if (audioCallRing.paused) {
            audioCallRing.play();
        }
    }

    /**
     * 
     */
    MainPanel.prototype.stopCallRing = function() {
        audioCallRing.pause();
    }

    /**
     * 
     */
    MainPanel.prototype.playWaitingTone = function() {
        audioWaitingTone.volume = 1.0;

        if (audioWaitingTone.paused) {
            audioWaitingTone.play();
        }
    }

    /**
     * 
     */
    MainPanel.prototype.stopWaitingTone = function() {
        audioWaitingTone.pause();
    }

    g.MainPanel = MainPanel;

})(window);

(function(g) {

    var that = null;

    var panelEl = null;
    var recentTrEl = null;
    var hideTimer = 0;

    var recentList = null;

    var clickEmojiHandler = null;

    function mouseover() {
        if (hideTimer > 0) {
            clearTimeout(hideTimer);
            hideTimer = 0;
        }
    }

    function mouseout() {
        if (hideTimer > 0) {
            return;
        }

        hideTimer = setTimeout(function() {
            that.hide();
        }, 500);
    }

    function emojiMouseover() {
        var el = $(this);
        el.next().css('display', 'block');
    }
    function emojiMouseout() {
        var el = $(this);
        el.next().css('display', 'none');
    }

    function emojiClick() {
        var el = $(this);
        var data = {
            "code": el.text().codePointAt(0).toString(16),
            "desc": el.next().text()
        };
        clickEmojiHandler(data);

        if (!el.hasClass('recent-emoji')) {
            that.appendRecent(data);
        }
    }

    var EmojiPanel = function(clickHandler) {
        that = this;

        clickEmojiHandler = clickHandler;

        panelEl = $('.emoji-panel');
        panelEl.on('mouseover', mouseover);
        panelEl.on('mouseout', mouseout);
        panelEl.blur(blur);

        panelEl.find('.emoji').on('mouseover', emojiMouseover);
        panelEl.find('.emoji').on('mouseout', emojiMouseout);
        panelEl.find('.emoji').click(emojiClick);

        recentTrEl = panelEl.find('.recent');

        setTimeout(function() {
            that.loadRecent();
        }, 1000);
    }

    EmojiPanel.prototype.show = function(anchorEl) {
        var left = g.getElementLeft(anchorEl[0]);
        var top = g.getElementTop(anchorEl[0]);

        top -= 64 + 42 + 232;

        panelEl.css('left', left + 'px');
        panelEl.css('top', top + 'px');
        panelEl.css('display', 'block');

        if (hideTimer > 0) {
            clearTimeout(hideTimer);
            hideTimer = 0;
        }
    }

    EmojiPanel.prototype.hide = function() {
        panelEl.css('display', 'none');
    }

    EmojiPanel.prototype.tryHide = function() {
        if (hideTimer > 0) {
            clearTimeout(hideTimer);
            hideTimer = 0;
        }

        hideTimer = setTimeout(function() {
            that.hide();
        }, 500);
    }

    EmojiPanel.prototype.loadRecent = function() {
        recentList = g.app.loadConfig('recentEmoji');
        if (null == recentList) {
            recentList = [];
            return;
        }

        for (var i = 0; i < recentList.length; ++i) {
            var value = recentList[i];
            var el = recentTrEl.find('.recent-' + i);
            el.find('.emoji').html('&#x' + value.code + ';');
            el.find('.emoji-desc').html(value.desc);
            el.css('visibility', 'visible');
        }
    }

    EmojiPanel.prototype.appendRecent = function(data) {
        // 不能添加重复的表情，删除已存在的表情
        for (var i = 0; i < recentList.length; ++i) {
            var r = recentList[i];
            if (r.code == data.code) {
                recentList.splice(i, 1);
                break;
            }
        }

        recentList.unshift(data);
        if (recentList.length > 10) {
            recentList.pop();
        }

        for (var i = 0; i < recentList.length; ++i) {
            var value = recentList[i];
            var el = recentTrEl.find('.recent-' + i);
            el.find('.emoji').html('&#x' + value.code + ';');
            el.find('.emoji-desc').html(value.desc);
            el.css('visibility', 'visible');
        }

        for (var i = recentList.length; i < 10; ++i) {
            var el = recentTrEl.find('.recent-' + i);
            el.find('.emoji').html('&nbsp;');
            el.find('.emoji-desc').html('&nbsp;');
            el.css('visibility', 'hidden');
        }

        g.app.saveConfig('recentEmoji', recentList);
    }

    g.EmojiPanel = EmojiPanel;

})(window);

(function(g) {
    'use strict'

    var dialogEl = null;

    /**
     * 文件详情对话框。
     * @param {jQuery} el 
     */
    var FileDetails = function(el) {
        dialogEl = el;
    }

    /**
     * 打开文件详情对话框。
     * @param {FileLabel} fileLabel 文件标签。
     * @param {Directory} [directory] 文件所在的目录。
     */
    FileDetails.prototype.open = function(fileLabel, directory) {
        dialogEl.find('h3[data-target="file-name"]').text(fileLabel.getFileName());
        dialogEl.find('h5[data-target="file-type"]').text(fileLabel.getFileType().toUpperCase());
        dialogEl.find('h5[data-target="file-size"]').text(g.formatSize(fileLabel.getFileSize()));
        dialogEl.find('h5[data-target="file-date"]').text(g.formatYMDHMS(fileLabel.getLastModified()));

        if (directory) {
            var path = [];
            g.recurseParent(path, directory);
            var dirList = [];
            if (path.length == 1) {
                dirList.push('/');
            }
            else {
                path.forEach(function(dir) {
                    if (!dir.isRoot()) {
                        dirList.push(dir.getName() + ' &gt; ');
                    }
                });
            }
            dialogEl.find('h5[data-target="file-path"]').html(dirList.join(''));
        }
        else {
            dialogEl.find('h5[data-target="file-path"]').text('--');
        }

        dialogEl.modal('show');
    }

    /**
     * 关闭对话框。
     */
    FileDetails.prototype.close = function() {
        dialogEl.modal('hide');
    }

    g.FileDetails = FileDetails;

})(window);

(function(g) {
    'use strict';

    /**
     * 侧边栏账号面板。
     * @param {jQuery} el 
     */
    var SidebarAccountPanel = function(el) {
        this.el = el;
        var that = this;
        this.el.find('a[data-target="name"]').on('click', function() {
            that.showDetail();
        });
    };

    SidebarAccountPanel.prototype.updateAvatar = function(path) {
        this.el.find('img[data-target="avatar"]').attr('src', 'images/' + path);
    }

    SidebarAccountPanel.prototype.updateName = function(name) {
        this.el.find('a[data-target="name"]').text(name);
    }

    SidebarAccountPanel.prototype.showDetail = function() {
        // Nothing
    }

    g.SidebarAccountPanel = SidebarAccountPanel;

})(window);

(function(g) {
    'use strict';

    function sortItem(a, b) {
        if (b.time == 0 && a.time == 0) {
            return b.label.localeCompare(a.label);
        }
        else {
            return b.time - a.time;
        }
    }

    /**
     * 消息目录。
     * @param {jQuery} el 界面元素。
     */
    var MessageCatalogue = function(el) {
        this.el = el.find('ul[data-target="catalogue"]');
        this.noMsgEl = el.find('.no-message');
        this.items = [];
        this.topItems = [];
        this.currentItem = null;
    }

    /**
     * @returns {object} 返回当前激活的目录项。
     */
    MessageCatalogue.prototype.getActiveItem = function() {
        return this.currentItem;
    }

    /**
     * 获取指定 ID 的目录项。
     * @param {number|string} itemId 目录项的 ID 。
     * @returns {object} 目录项对象。
     */
    MessageCatalogue.prototype.getItem = function(itemId) {
        var id = parseInt(itemId);
        for (var i = 0; i < this.items.length; ++i) {
            var item = this.items[i];
            if (item.id == id) {
                return item;
            }
        }
        return null;
    }

    /**
     * 追加菜单项。
     * @param {Contact|Group|object} value 数据值。
     * @param {boolean} [first] 是否插入到队列首位。
     * @returns {boolean} 返回 {@linkcode true} 表示追加成功。
     */
    MessageCatalogue.prototype.appendItem = function(value, first) {
        var index = this.items.length;
        var id = 0;
        var el = null;
        var thumb = 'images/group-avatar.png';
        var label = null;
        var desc = null;
        var lastDesc = '　';
        var timeBadge = null;
        var time = 0;

        if (value instanceof Group) {
            id = value.getId();
            label = value.getName();
            desc = '　';
            timeBadge = formatShortTime(value.getLastActiveTime());
            time = value.getLastActiveTime();
        }
        else if (value instanceof Contact) {
            id = value.getId();
            thumb = 'images/' + value.getContext().avatar;
            if (value.getAppendix().hasRemarkName()) {
                label = value.getAppendix().getRemarkName();
            }
            else {
                label = value.getContext().name;
            }
            desc = '　';
            timeBadge = '';
        }
        else if (typeof value === 'object') {
            id = value.id;
            thumb = 'images/' + value.avatar;
            label = value.name;
            desc = '　';
            timeBadge = '';
        }

        if (undefined == label || null == label) {
            return false;
        }

        var item = this.getItem(id);
        if (null != item) {
            return false;
        }

        // 隐藏无消息提示
        this.noMsgEl.css('display', 'none');

        item = {
            index: index,
            id: id,
            el: el,
            entity: value,
            thumb: thumb,
            label: label,
            desc: desc,
            lastDesc: lastDesc,
            timeBadge: timeBadge,
            time: time,
            top: false
        };

        var html = [
            '<li id="mc_item_', index, '" class="item pl-2 pr-2" data="', id, '">',
                '<div class="item-img" style="background-image:url(', thumb, ');">',
                    '<div class="item-top"><div class="top-action" onclick="app.messageCatalog.topItem(', id, ');">',
                        '<i class="fas fa-sort-up"></i><div>置顶</div>',
                    '</div></div>',
                    '<span class="badge badge-danger unread-badge"></span>',
                    '<div class="top-wrapper">',
                        '<div class="top text-primary"><i class="fas fa-caret-up"></i></div>',
                    '</div>',
                '</div>',
                '<div class="product-info ellipsis">',
                    '<span class="product-title ellipsis">',
                        '<span class="title">', label, '</span>',
                        '<span class="badge badge-light float-right last-time">', timeBadge, '</span>',
                    '</span>',
                    '<span class="product-description">', desc, '</span>',
                    '<div class="item-close">',
                        '<a href="javascript:;" onclick="app.messageCatalog.onItemClose(', id, ');"><span class="badge badge-light"><i class="fas fa-times"></i></span></a>',
                    '</div>',
                '</div>',
            '</li>'];

        var el = $(html.join(''));

        item.el = el;

        if (first) {
            if (this.items.length == 0) {
                this.el.append(el);
            }
            else {
                for (var i = 0; i < this.items.length; ++i) {
                    var curItem = this.items[i];
                    var itemIndex = this.topItems.indexOf(curItem);
                    if (itemIndex >= 0) {
                        continue;
                    }
    
                    curItem.el.before(el);
                    break;
                }
            }

            this.items.unshift(item);
        }
        else {
            this.el.append(el);
            this.items.push(item);
        }

        // 绑定事件
        this.bindEvent(el);

        return true;
    }

    /**
     * 移除指定数据对应的目录项。
     * @param {Group|Contact|number|string} target 数据项。
     */
    MessageCatalogue.prototype.removeItem = function(target) {
        var itemId = 0;
        if (target instanceof Group) {
            itemId = target.getId();
        }
        else if (target instanceof Contact) {
            itemId = target.getId();
        }
        else {
            itemId = parseInt(target);
        }

        var item = null;
        for (var i = 0; i < this.items.length; ++i) {
            var data = this.items[i];
            if (data.id == itemId) {
                item = data;
                this.items.splice(i, 1);
                break;
            }
        }

        if (this.items.length == 0) {
            // 显示无消息列表
            this.noMsgEl.css('display', 'table');
        }

        if (null != this.currentItem && itemId == this.currentItem.id) {
            this.currentItem = null;
        }

        if (null == item) {
            return;
        }

        item.el.remove();
    }

    /**
     * 更新目录项。
     * @param {number|Group|Contact} target 数据目标。
     * @param {string} desc 描述信息。
     * @param {number} time 时间标签。
     * @param {string} [label] 主标签。
     */
    MessageCatalogue.prototype.updateItem = function(target, desc, time, label) {
        var id = 0;

        if (typeof target === 'number') {
            id = target;
        }
        else if (target instanceof Group) {
            id = target.getId();
        }
        else if (target instanceof Contact) {
            id = target.getId();
        }
        else {
            console.log('[App] MessageCatalogue#updateItem 输入参数错误');
            return false;
        }

        var item = this.getItem(id);
        if (null == item) {
            if (!this.appendItem(target, true)) {
                return false;
            }

            item = this.getItem(id);
        }

        var el = item.el;

        if (null != desc) {
            item.lastDesc = item.desc;

            if (typeof desc === 'string') {
                item.desc = desc.length == 0 ? '　' : desc;
            }
            else if (desc instanceof TextMessage) {
                item.desc = desc.getSummary();
            }
            else if (desc instanceof HyperTextMessage) {
                item.desc = desc.getSummary();
            }
            else if (desc instanceof ImageMessage) {
                item.desc = desc.getSummary();
            }
            else if (desc instanceof FileMessage) {
                var msg = desc;
                if (msg.hasAttachment()) {
                    item.desc = msg.getSummary();
                }
                else {
                    item.desc = '[文件]';
                }
            }
            else if (desc instanceof CallRecordMessage) {
                if (desc.getConstraint().video) {
                    item.desc = '[视频通话]';
                }
                else {
                    item.desc = '[语音通话]';
                }
            }
            else if (desc instanceof File) {
                item.desc = '[文件] ' + desc.name;
            }
            else {
                return false;
            }

            el.find('.product-description').html(item.desc);
        }

        // 更新时间
        if (null != time) {
            item.time = time;
            el.find('.last-time').text(formatShortTime(time));
        }

        if (label) {
            item.label = label;
            el.find('.title').text(label);
        }

        // 将 item 插入到最前
        for (var i = 0; i < this.items.length; ++i) {
            if (this.items[i] == item) {
                this.items.splice(i, 1);
                break;
            }
        }
        this.items.unshift(item);

        // 排序
        if (item.top) {
            for (var i = 0; i < this.topItems.length; ++i) {
                if (this.topItems[i] == item) {
                    this.topItems.splice(i, 1);
                    break;
                }
            }
            this.topItems.unshift(item);

            // 移除
            el.remove();
            // 将节点添加到首位
            this.el.prepend(el);
        }
        else {
            // 移除
            el.remove();

            if (this.items.length == 1) {
                this.el.append(el);
            }
            else {
                var insert = false;
                for (var i = 1; i < this.items.length; ++i) {
                    if (!this.items[i].top) {
                        // 添加到前面
                        insert = true;
                        this.items[i].el.before(el);
                        break;
                    }
                }

                if (!insert) {
                    this.el.append(el);
                }
            }
        }

        // 绑定事件
        this.bindEvent(el);

        return true;
    }

    /**
     * 置顶目录项。
     * @param {*} id 
     */
    MessageCatalogue.prototype.topItem = function(id) {
        var item = this.getItem(id);
        if (null == item) {
            return;
        }

        var that = this;

        if (item.top) {
            g.cube().contact.removeTopList(item.entity, function() {
                item.top = false;
                item.el.find('.top-action').html('<i class="fas fa-sort-up"></i><div>置顶</div>');
                item.el.find('.top-wrapper').css('visibility', 'hidden');

                var index = that.topItems.indexOf(item);
                that.topItems.splice(index, 1);

                that.items.sort(sortItem);

                var noTopList = [];
                for (var i = 0; i < that.items.length; ++i) {
                    var data = that.items[i];
                    if (that.topItems.indexOf(data) >= 0) {
                        continue;
                    }
                    noTopList.push(data);
                }

                index = noTopList.indexOf(item);
                if (index == 0 && noTopList.length > 1) {
                    item.el.remove();
                    noTopList[index + 1].el.before(item.el);
                    that.bindEvent(item.el);
                }
                else if (index > 0) {
                    item.el.remove();
                    noTopList[index - 1].el.after(item.el);
                    that.bindEvent(item.el);
                }
            });
        }
        else {
            g.cube().contact.addTopList(item.entity, function() {
                // 重新排序
                item.top = true;
                item.el.find('.top-action').html('<i class="fas fa-sort"></i>');
                item.el.find('.top-wrapper').css('visibility', 'visible');

                that.topItems.push(item);
                that.topItems.sort(sortItem);
                var index = that.topItems.indexOf(item);
                if (index == 0) {
                    item.el.remove();
                    that.el.prepend(item.el);
                    that.bindEvent(item.el);
                }
                else {
                    item.el.remove();
                    that.topItems[index - 1].el.after(item.el);
                    that.bindEvent(item.el);
                }
            });
        }
    }

    MessageCatalogue.prototype.restoreDesc = function(target, desc) {
        var id = 0;

        if (typeof target === 'number') {
            id = target;
        }
        else if (target instanceof Contact) {
            id = target.getId();
        }
        else if (target instanceof Group) {
            id = target.getId();
        }
        else {
            console.log('[App] MessageCatalogue#restoreLastDesc 输入参数错误');
            return;
        }

        var item = this.getItem(id);
        if (null == item) {
            return;
        }

        item.el.find('.product-description').html(desc);
        item.desc = desc;
    }

    MessageCatalogue.prototype.updateBadge = function(id, badge) {
        var item = this.getItem(id);
        if (null == item) {
            return;
        }

        if (0 == badge) {
            item.el.find('.unread-badge').text('');
        }
        else {
            if (badge > 99) {
                item.el.find('.unread-badge').text('99+');
            }
            else {
                item.el.find('.unread-badge').text(badge);
            }
        }
    }

    /**
     * 刷新当前目录项顺序，按照时间倒序进行排序。
     */
    MessageCatalogue.prototype.refreshOrder = function() {
        var that = this;

        // 获取置顶数据
        that.topItems = [];
        g.cube().contact.queryTopList(function(list) {
            // 获取置顶的 ID
            for (var i = 0; i < list.length; ++i) {
                var item = that.getItem(list[i].id);
                if (null != item) {
                    that.topItems.push(item);
                    item.top = true;
                }
            }

            // 对所有数据进行排序
            that.items.sort(sortItem);

            // 对 top 列表进行排序
            that.topItems.sort(sortItem);

            // 按照 top items 列表的倒序，依次把数据插入到 items 列表头部
            var tmpList = that.topItems.concat();
            while (tmpList.length > 0) {
                var last = tmpList.pop();
                for (var i = 0; i < that.items.length; ++i) {
                    if (last.id == that.items[i].id) {
                        that.items.splice(i, 1);
                        break;
                    }
                }
                that.items.unshift(last);
                last.el.find('.top-action').html('<i class="fas fa-sort"></i>');
                last.el.find('.top-wrapper').css('visibility', 'visible');
            }

            that.el.empty();
            that.items.forEach(function(item) {
                that.el.append(item.el);
                that.bindEvent(item.el);
            });
        });
    }

    /**
     * 激活指定 ID 的目录项。
     * @param {number} id 
     */
    MessageCatalogue.prototype.activeItem = function(id) {
        if (null != this.currentItem) {
            if (this.currentItem.id == id) {
                // 同一个 item 元素
                return;
            }

            this.currentItem.el.removeClass('catalog-active');
        }

        var current = this.getItem(id);
        current.el.addClass('catalog-active');

        this.currentItem = current;
    }

    /**
     * 点击目录项时回调。
     * @param {number} id 被点击的目录项 ID 。
     */
    MessageCatalogue.prototype.onItemClick = function(id) {
        if (null != this.currentItem) {
            if (this.currentItem.id == id) {
                // 同一个 item 元素
                return;
            }

            this.currentItem.el.removeClass('catalog-active');
        }

        var current = this.getItem(id);

        current.el.addClass('catalog-active');

        this.currentItem = current;

        // 切换消息面板
        g.app.messagingCtrl.toggle(this.currentItem.id);
    }

    /**
     * 双击目录项时回调。
     * @param {number} id 双击的目录项的 ID 。
     */
    MessageCatalogue.prototype.onItemDoubleClick = function(id) {
        var entity = g.app.queryContact(id);
        if (null != entity) {
            g.app.contactDetails.show(entity);
            return;
        }

        g.cube().contact.getGroup(id, function(group) {
            g.app.groupDetails.show(group);
        });
    }

    MessageCatalogue.prototype.onItemMouseover = function(id) {
        var current = this.getItem(id);
        current.el.find('.item-close').css('visibility', 'visible');
    }

    MessageCatalogue.prototype.onItemMouseout = function(id) {
        var current = this.getItem(id);
        current.el.find('.item-close').css('visibility', 'hidden');
    }

    MessageCatalogue.prototype.onItemClose = function(id) {
        var entity = g.app.queryContact(id);
        if (null != entity) {
            g.app.messagingCtrl.removeContact(entity);
            return;
        }

        g.cube().contact.getGroup(id, function(group) {
            g.app.messagingCtrl.removeGroup(group);
        });
    }

    /**
     * @private
     * @param {*} el 
     */
    MessageCatalogue.prototype.bindEvent = function(el) {
        var that = this;
        el.on('click', function(e) {
            var itemId = parseInt($(this).attr('data'));
            that.onItemClick(itemId);
        });
        el.on('dblclick', function(e) {
            var itemId = parseInt($(this).attr('data'));
            that.onItemDoubleClick(itemId);
        });
        el.on('mouseover', function(e) {
            var itemId = parseInt($(this).attr('data'));
            that.onItemMouseover(itemId);
        });
        el.on('mouseout', function(e) {
            var itemId = parseInt($(this).attr('data'));
            that.onItemMouseout(itemId);
        });
    }

    g.MessageCatalogue = MessageCatalogue;

})(window);

(function(g) {

    // 消息输入框是否使用编辑器
    var activeEditor = true;

    var that = null;

    function matchFileIcon(type) {
        if (type == 'png' || type == 'jpeg' || type == 'gif' || type == 'jpg' || type == 'bmp') {
            return '<i class="file-icon ci-wide ci-file-image-wide"></i>';
        }
        else if (type == 'xls' || type == 'xlsx') {
            return '<i class="file-icon ci-wide ci-file-excel-wide"></i>';
        }
        else if (type == 'ppt' || type == 'pptx') {
            return '<i class="file-icon ci-wide ci-file-powerpoint-wide"></i>';
        }
        else if (type == 'doc' || type == 'docx') {
            return '<i class="file-icon ci-wide ci-file-word-wide"></i>';
        }
        else if (type == 'mp3' || type == 'ogg' || type == 'wav') {
            return '<i class="file-icon ci-wide ci-file-music-wide"></i>';
        }
        else if (type == 'pdf') {
            return '<i class="file-icon ci-wide ci-file-pdf-wide"></i>';
        }
        else if (type == 'rar') {
            return '<i class="file-icon ci-wide ci-file-rar-wide"></i>';
        }
        else if (type == 'zip' || type == 'gz') {
            return '<i class="file-icon ci-wide ci-file-zip-wide"></i>';
        }
        else if (type == 'txt' || type == 'log') {
            return '<i class="file-icon ci-wide ci-file-text-wide"></i>';
        }
        else if (type == 'mp4' || type == 'mkv' || type == 'avi' || type == 'ts') {
            return '<i class="file-icon ci-wide ci-file-video-wide"></i>';
        }
        else if (type == 'psd') {
            return '<i class="file-icon ci-wide ci-file-psd-wide"></i>';
        }
        else if (type == 'exe' || type == 'dll') {
            return '<i class="file-icon ci-wide ci-file-windows-wide"></i>';
        }
        else if (type == 'apk') {
            return '<i class="file-icon ci-wide ci-file-apk-wide"></i>';
        }
        else if (type == 'dmg') {
            return '<i class="file-icon ci-wide ci-file-dmg-wide"></i>';
        }
        else {
            return '<i class="file-icon ci-wide ci-file-unknown-wide"></i>';
        }
    }

    /**
     * 消息操作主面板。
     * @param {jQuery} el 界面元素。
     */
    var MessagePanel = function(el) {
        this.el = el;
        this.panels = {};

        that = this;

        // 当前面板
        this.current = null;

        this.elTitle = this.el.find('.card-title');
        this.elContent = this.el.find('.card-body');

        this.inputEditor = null;
        this.elInput = null;

        this.atPanel = this.el.find('.at-someone');
        this.atPanel.blur(function(e) { that.onAtPanelBlur(e); });
        this.atElList = [];

        // 格式化内容
        this.formatContents = [];
        // 最近一次内容记录
        this.lastInput = '';

        if (activeEditor) {
            this.el.find('textarea').parent().remove();
            $('#message-editor').parent().css('display', 'flex');

            var editor = new window.wangEditor('#message-editor');
            editor.config.menus = [];
            editor.config.height = 70;
            editor.config.placeholder = '';
            editor.config.fontSizes = { normal: '14px', value: '3' };
            editor.config.lineHeights = ['1'];
            editor.config.onchange = function(html) {
                that.onEditorChange(html);
            };
            editor.config.pasteTextHandle = function(pasteStr) {
                return that.handlePasteText(pasteStr);
            };
            editor.create();
            editor.disable();
            this.inputEditor = editor;

            var weEl = $('#message-editor').find('.w-e-text');
            weEl.keypress(function(event) {
                that.onEditorKeypress(event);
            });
            this.weEl = weEl;
            // weEl[0].addEventListener('paste', function(event) {
            //     return that.onEditorPaste(event);
            // });
            // weEl.on('paste', function(event) {
            //     return that.onEditorPaste(event.originalEvent);
            // });
        }
        else {
            $('#message-editor').parent().remove();

            this.elInput = this.el.find('textarea');
            this.elInput.parent().css('display', 'flex');
            this.elInput.val('');
            if (!this.elInput[0].hasAttribute('disabled')) {
                this.elInput.attr('disabled', 'disabled');
            }
            // 发送框键盘事件
            this.elInput.keypress(function(event) {
                var e = event || window.event;
                if (e && e.keyCode == 13 && e.ctrlKey) {
                    that.onSend(e);
                }
            });
        }

        // 发送按钮 Click 事件
        this.btnSend = el.find('button[data-target="send"]');
        this.btnSend.attr('disabled', 'disabled');
        this.btnSend.on('click', function(event) {
            that.onSend(event);
        });

        // 表情符号
        this.emojiPanel = new EmojiPanel(that.onEmojiClick);
        this.btnEmoji = el.find('button[data-target="emoji"]');
        this.btnEmoji.attr('disabled', 'disabled');
        this.btnEmoji.on('mouseover', function() {
            if (null == that.current) {
                return;
            }
            that.emojiPanel.show(that.btnEmoji);
        });
        this.btnEmoji.on('mouseout', function() {
            if (null == that.current) {
                return;
            }
            that.emojiPanel.tryHide();
        });

        // 发送文件
        this.btnSendFile = el.find('button[data-target="send-file"]');
        this.btnSendFile.attr('disabled', 'disabled');
        this.btnSendFile.on('click', function(event) {
            g.app.messagingCtrl.selectFile($('#select_file'));
        });

        // 视频通话
        this.btnVideoCall = el.find('button[data-target="video-call"]');
        this.btnVideoCall.attr('disabled', 'disabled');
        this.btnVideoCall.on('click', function() {
            g.app.messagingCtrl.openVideoChat(that.current.entity);
        });

        // 语音通话
        this.btnVoiceCall = el.find('button[data-target="voice-call"]');
        this.btnVoiceCall.attr('disabled', 'disabled');
        this.btnVoiceCall.on('click', function() {
            g.app.messagingCtrl.openVoiceCall(that.current.entity);
        });

        // 新建群组
        el.find('button[data-target="new-group"]').on('click', function(e) {
            that.onNewGroupClick(e);
        });

        // 详情按钮
        el.find('button[data-target="details"]').on('click', function(e) {
            that.onDetailsClick(e);
        });

        // 折叠辅助信息
        el.find('button[data-target="collapse"]').on('click', function(e) {
            that.onCollapseClick(e);
        });

        // 初始化上下文菜单
        this.initContextMenu();
    }

    /**
     * 初始化上下文菜单操作。
     */
    MessagePanel.prototype.initContextMenu = function() {
        this.elContent.contextMenu({
            selector: '.direct-chat-text',
            callback: function(key, options) {
                // var m = "clicked: " + key + " on " + $(this).attr('id');
                // console.log(m);
                var entity = that.current.entity;
                if (key == 'delete') {
                    g.app.messagingCtrl.deleteMessage(entity, parseInt($(this).attr('data-id')));
                }
                else if (key == 'recall') {
                    g.app.messagingCtrl.recallMessage(entity, parseInt($(this).attr('data-id')));
                }
            },
            items: {
                // "forward": { name: "转发" },
                "recall": {
                    name: "撤回",
                    disabled: function(key, opt) {
                        return ($(this).attr('data-owner') == 'false');
                    }
                },
                "delete": {
                    name: "删除",
                    disabled: function(key, opt) {
                        return false;
                    }
                }
            }
        });
    }

    /**
     * 获取当前操作的面板。
     * @returns {object} 返回当前面板。
     */
    MessagePanel.prototype.getCurrentPanel = function() {
        return this.current;
    }

    /**
     * 获取指定 ID 实体的面板。
     * @param {number} id 指定面板 ID 。
     * @returns {object}
     */
    MessagePanel.prototype.getPanel = function(id) {
        return this.panels[id.toString()];
    }

    /**
     * 是否包含该目标的面板。
     * @param {number|Contact|Group} idOrEntity 
     * @returns {boolean}
     */
    MessagePanel.prototype.hasPanel = function(idOrEntity) {
        if (typeof idOrEntity === 'number') {
            return (undefined !== this.panels[idOrEntity.toString()]);
        }
        else {
            return (undefined !== this.panels[idOrEntity.getId().toString()]);
        }
    }

    /**
     * 更新面板数据。
     * @param {number} id 
     * @param {Contact|Group} entity 
     */
    MessagePanel.prototype.updatePanel = function(id, entity) {
        var panel = this.panels[id.toString()];
        if (undefined === panel) {
            var el = $('<div class="direct-chat-messages"><div class="more-messages"><a href="javascript:app.messagingCtrl.prependMore(' + id + ');">查看更多消息</a></div></div>');
            panel = {
                id: id,
                el: el,
                entity: entity,
                messageIds: [],
                messageTimes: [],
                unreadCount: 0,
                groupable: (entity instanceof Group)
            };
            this.panels[id.toString()] = panel;
        }

        if (null != this.current) {
            if (this.current.id == id) {
                this.current.entity = entity;

                if (panel.groupable) {
                    this.elTitle.text(entity.getName());
                }
                else {
                    this.elTitle.text(entity.getPriorityName());
                }
            }
        }
    }

    /**
     * 切换面板。
     * @param {number} id 面板 ID 。
     * @param {Contact|Group} entity 对应的联系人或者群组。
     */
    MessagePanel.prototype.changePanel = function(id, entity) {
        var panel = this.panels[id.toString()];
        if (undefined === panel) {
            var el = $('<div class="direct-chat-messages"><div class="more-messages"><a href="javascript:app.messagingCtrl.prependMore(' + id + ');">查看更多消息</a></div></div>');
            panel = {
                id: id,
                el: el,
                entity: entity,
                messageIds: [],
                messageTimes: [],
                unreadCount: 0,
                groupable: (entity instanceof Group)
            };
            this.panels[id.toString()] = panel;
        }

        if (null == this.current) {
            if (activeEditor) {
                this.inputEditor.enable();
            }
            else {
                this.elInput.removeAttr('disabled');
            }

            this.btnEmoji.removeAttr('disabled');
            this.btnSend.removeAttr('disabled');
            this.btnSendFile.removeAttr('disabled');
            this.btnVideoCall.removeAttr('disabled');
            this.btnVoiceCall.removeAttr('disabled');
        }
        else {
            // 生成草稿
            var text = activeEditor ? this.inputEditor.txt.text().trim() : this.elInput.val().trim();
            if (text.startsWith('&nbsp;')) {
                text = text.substring(6, text.length);
            }
            if (text.endsWith('&nbsp;')) {
                text = text.substring(0, text.length - 6);
            }

            if (text.length > 0) {
                // 保存草稿
                var formatText = this.serializeHyperText();
                var htMessage = new HyperTextMessage(formatText);
                if (window.cube().messaging.saveDraft(this.current.entity, htMessage)) {
                    g.app.messageCatalog.updateItem(this.current.id, '<span class="text-danger">[草稿] ' + htMessage.getSummary() + '</span>', null, null);
                }
            }
            else {
                // 删除草稿
                window.cube().messaging.deleteDraft(this.current.id);
            }

            if (activeEditor) {
                this.inputEditor.txt.clear();
            }
            else {
                this.elInput.val('');
            }
            this.current.el.remove();
        }

        // 更新 HTML 数据
        this.elContent.append(panel.el);

        this.current = panel;
        panel.unreadCount = 0;

        if (panel.groupable) {
            // if (!this.btnVideoCall[0].hasAttribute('disabled')) {
            //     this.btnVideoCall.attr('disabled', 'disabled');
            // }
            // if (!this.btnVoiceCall[0].hasAttribute('disabled')) {
            //     this.btnVoiceCall.attr('disabled', 'disabled');
            // }

            this.elTitle.text(entity.getName());
        }
        else {
            this.elTitle.text(entity.getAppendix().hasRemarkName() ?
                entity.getAppendix().getRemarkName() : entity.getName());
        }

        // 滚动条控制
        var offset = parseInt(this.elContent.prop('scrollHeight'));
        this.elContent.scrollTop(offset);

        panel.messageIds.forEach(function(messageId) {
            window.cube().messaging.markRead(messageId);
        });

        // 加载草稿
        window.cube().messaging.loadDraft(this.current.id, function(draft) {
            // 更新目录
            // 最后一条消息
            if (panel.groupable) {
                window.cube().messaging.queryLastMessageWithGroup(panel.entity.getId(), function(message) {
                    g.app.messageCatalog.restoreDesc(panel.id, message.getSummary());
                });
            }
            else {
                window.cube().messaging.queryLastMessageWithContact(panel.entity.getId(), function(message) {
                    g.app.messageCatalog.restoreDesc(panel.id, message.getSummary());
                });
            }

            if (activeEditor) {
                var input = that.deserializeHyperText(draft.getMessage(), true);
                that.inputEditor.txt.append(input);
            }
            else {
                that.elInput.val(draft.getMessage().getPlaintext());
            }
        });
    }

    /**
     * 清空指定面板。
     * @param {number} id 指定面板 ID 。
     */
    MessagePanel.prototype.clearPanel = function(id) {
        var panel = this.panels[id.toString()];
        if (undefined !== panel) {
            panel.el.remove();

            if (this.current == panel) {
                this.btnEmoji.attr('disabled', 'disabled');
                this.btnVideoCall.attr('disabled', 'disabled');
                this.btnVoiceCall.attr('disabled', 'disabled');
                this.btnSendFile.attr('disabled', 'disabled');
                this.elTitle.text('');

                if (activeEditor) {
                    this.inputEditor.txt.clear();
                    this.inputEditor.disable();
                }
                else {
                    this.elInput.val('');
                    this.elInput.attr('disabled', 'disabled');
                }

                this.formatContents = [];
                this.lastInput = '';

                this.current = null;
            }

            delete this.panels[id.toString()];
        }
    }

    /**
     * 删除消息。
     * @param {Contact|Group} target 指定面板对应的数据实体。
     * @param {Message} message 指定待删除的消息。
     */
    MessagePanel.prototype.removeMessage = function(target, message) {
        var panelId = target.getId();
        var panel = this.panels[panelId.toString()];
        if (undefined === panel) {
            return;
        }

        var id = message.getId();
        var index = panel.messageIds.indexOf(id);
        if (index >= 0) {
            panel.messageIds.splice(index, 1);
            panel.messageTimes.splice(index, 1);
        }

        var panelEl = panel.el;
        var el = panelEl.find('#' + id);
        el.remove();
    }

    /**
     * 向指定面板内追加消息。
     * @param {Contact|Group} target 面板对应的数据实体。
     * @param {Contact} sender 消息发送者。
     * @param {Message} message 消息。
     * @param {boolean} [scrollBottom] 是否滚动到底部。不设置该参数则不滚动。
     * @param {boolean} [animation] 是否使用动画效果。
     * @returns {jQuery} 返回添加到消息面板里的新节点。
     */
    MessagePanel.prototype.appendMessage = function(target, sender, message, scrollBottom, animation) {
        var panelId = target.getId();

        var panel = this.panels[panelId.toString()];
        if (undefined === panel) {
            var el = $('<div class="direct-chat-messages"><div class="more-messages"><a href="javascript:app.messagingCtrl.prependMore(' + panelId + ');">查看更多消息</a></div></div>');
            panel = {
                id: panelId,
                el: el,
                entity: target,
                messageIds: [],
                messageTimes: [],
                unreadCount: 0,
                groupable: (target instanceof Group)
            };
            this.panels[panelId.toString()] = panel;
        }

        var id = message.getId();
        var time = message.getRemoteTimestamp();

        var index = panel.messageIds.indexOf(id);
        if (index >= 0) {
            // console.log('消息已添加 ' + panelId + ' - ' + id);
            return null;
        }

        if (panel.messageIds.length == 0) {
            panel.messageTimes.push(time);
            panel.messageIds.push(id);
        }
        else {
            // 根据消息时间戳判断消息顺序
            for (var i = 0, len = panel.messageTimes.length; i < len; ++i) {
                var cur = panel.messageTimes[i];
                if (time <= cur) {
                    panel.messageTimes.splice(i, 0, time);
                    panel.messageIds.splice(i, 0, id);
                    break;
                }

                var next = (i + 1) < len ? panel.messageTimes[i + 1] : null;
                if (null != next) {
                    if (time < next) {
                        panel.messageTimes.splice(i + 1, 0, time);
                        panel.messageIds.splice(i + 1, 0, id);
                        break;
                    }
                }
                else {
                    panel.messageTimes.push(time);
                    panel.messageIds.push(id);
                    break;
                }
            }
        }

        // 更新索引
        index = panel.messageIds.indexOf(id);

        // 更新未读数量
        if (!message.isRead()) {
            panel.unreadCount += 1;
        }

        var html = null;
        var text = null;
        var attachment = null;

        if (message instanceof TextMessage) {
            text = message.getText();
        }
        else if (message instanceof HyperTextMessage) {
            text = this.deserializeHyperText(message);
        }
        else if (message instanceof ImageMessage || message instanceof FileMessage) {
            attachment = message.getAttachment();
            var action = null;
            var fileDesc = null;

            if (attachment.isImageType()) {
                action = ['javascript:dialog.showImage(\'', attachment.getFileCode(), '\');'];

                fileDesc = ['<table class="file-label" border="0" cellspacing="4" cellpodding="0">',
                    '<tr>',
                        '<td>',
                            '<img class="thumb" src="', attachment.getDefaultThumbURL(), '" onclick="', action.join(''), '"',
                                ' onload="app.messagePanel.refreshScroll()"',
                                ' alt="', attachment.getFileName(), '"', ' />',
                        '</td>',
                    '</tr>',
                '</table>'];
            }
            else {
                action = ['<a class="btn btn-xs btn-default" title="下载文件" href="javascript:dialog.downloadFile(\'',
                                attachment.getFileCode(), '\');">',
                    '<i class="fas fa-download"></i>',
                '</a>'];

                fileDesc = ['<table class="file-label" border="0" cellspacing="4" cellpodding="0">',
                    '<tr>',
                        '<td rowspan="2" valign="middle" align="center">', matchFileIcon(attachment.getFileType()), '</td>',
                        '<td colspan="2" class="file-name">', attachment.getFileName(), '</td>',
                    '</tr>',
                    '<tr>',
                        '<td class="file-size">', formatSize(attachment.getFileSize()), '</td>',
                        '<td class="file-action">', action.join(''), '</td>',
                    '</tr>',
                '</table>'];
            }

            text = fileDesc.join('');
        }
        else if (message instanceof CallRecordMessage) {
            var icon = message.getConstraint().video ? '<i class="fas fa-video"></i>' : '<i class="fas fa-phone-alt"></i>';
            var answerTime = message.getAnswerTime();
            var desc = null;
            if (answerTime > 0) {
                desc = '通话时长 ' + g.formatClockTick(parseInt(message.getDuration() / 1000));
            }
            else {
                if (message.isCaller(g.app.getSelf().getId())) {
                    desc = '对方未接听';
                }
                else {
                    desc = '未接听';
                }
            }

            text = [
                '<div>', icon, '&nbsp;&nbsp;<span style="font-size:14px;">', desc, '</span></div>'
            ];
            text = text.join('');
        }
        else if (message instanceof LocalNoteMessage) {
            var note = message.getText();
            var level = message.getLevel();
            if (1 == level) {
                html = [
                    '<div id="', message.getId(), '" class="note">', note, '</div>'
                ];
            }
            else if (2 == level) {
                html = [
                    '<div id="', message.getId(), '" class="note"><span class="text-warning">', note, '</span></div>'
                ];
            }
            else {
                html = [
                    '<div id="', message.getId(), '" class="note"><span class="text-danger">', note, '</span></div>'
                ];
            }
        }
        else {
            return null;
        }

        if (null == html) {
            var right = '';
            var nfloat = 'float-left';
            var tfloat = 'float-right';
    
            if (sender.getId() == g.app.getSelf().getId()) {
                right = 'right';
                nfloat = 'float-right';
                tfloat = 'float-left';
            }
    
            var stateDesc = [];
            if (right.length > 0) {
                if (message.getState() == MessageState.Sending) {
                    stateDesc.push('<div class="direct-chat-state"><i class="fas fa-spinner sending"></i></div>');
                }
                else if (message.getState() == MessageState.SendBlocked || message.getState() == MessageState.ReceiveBlocked) {
                    stateDesc.push('<div class="direct-chat-state"><i class="fas fa-exclamation-circle fault"></i></div>');
                }
            }

            // 动画效果
            var animationClass = '';
            if (undefined !== animation && animation) {
                animationClass = 'direct-chat-text-anim';
            }

            html = ['<div id="', id, '" class="direct-chat-msg ', right, '"><div class="direct-chat-infos clearfix">',
                '<span class="direct-chat-name ', nfloat, panel.groupable ? '' : ' no-display', '">',
                    sender.getPriorityName(),
                '</span><span class="direct-chat-timestamp ', tfloat, '">',
                    formatFullTime(time),
                '</span></div>',
                // 头像
                '<img src="images/', sender.getContext().avatar, '" class="direct-chat-img">',
                // 状态
                stateDesc.join(''),
                '<div data-id="', id, '" data-owner="', right.length > 0, '" class="direct-chat-text ', animationClass, '">', text, '</div></div>'
            ];
        }

        var newEl = $(html.join(''));

        var parentEl = panel.el;
        if (index == 0) {
            parentEl.find('.more-messages').after(newEl);
        }
        else if (index == panel.messageIds.length - 1) {
            parentEl.append(newEl);
        }
        else {
            var prevId = (index - 1) >= 0 ? panel.messageIds[index - 1] : 0;
            var nextId = (index + 1) < panel.messageIds.length ? panel.messageIds[index + 1] : 0;
            if (prevId > 0) {
                parentEl.find('#' + prevId).after(newEl);
            }
            else if (nextId > 0) {
                parentEl.find('#' + nextId).before(newEl);
            }
        }

        if (undefined !== scrollBottom) {
            if (scrollBottom) {
                // 滚动到底部
                var offset = parseInt(this.elContent.prop('scrollHeight'));
                this.elContent.scrollTop(offset);
            }
            else {
                // 滚动到顶部
                this.elContent.scrollTop(0);
            }
        }

        // 加载草稿
        this.loadDraft(panel);

        return newEl;
    }

    /**
     * 变更消息状态。
     * @param {Message} message 
     */
    MessagePanel.prototype.changeMessageState = function(message) {
        var el = this.elContent.find('#' + message.getId()).find('.direct-chat-state');
        if (message.getState() == MessageState.Sent) {
            el.html('');
        }
        else if (message.getState() == MessageState.SendBlocked || message.getState() == MessageState.ReceiveBlocked) {
            el.html('<i class="fas fa-exclamation-circle fault"></i>');
        }
        else if (message.getState() == MessageState.Sending) {
            el.html('<i class="fas fa-spinner sending"></i>');
        }
    }

    /**
     * 插入注解内容到消息面板。
     * @param {Contact|Group|number} target 面板对应的数据实体。
     * @param {string} note 注解内容。
     */
    MessagePanel.prototype.appendNote = function(target, note) {
        var panelId = (typeof target === 'number') ? target : target.getId();

        var panel = this.panels[panelId.toString()];
        if (undefined === panel) {
            var el = $('<div class="direct-chat-messages"><div class="more-messages"><a href="javascript:app.messagingCtrl.prependMore(' + panelId + ');">查看更多消息</a></div></div>');
            panel = {
                id: panelId,
                el: el,
                entity: target,
                messageIds: [],
                messageTimes: [],
                groupable: (target instanceof Group)
            };
            this.panels[panelId.toString()] = panel;
        }

        var html = [
            '<div class="note">', note, '</div>'
        ];

        var parentEl = panel.el;
        parentEl.append($(html.join('')));

        // 滚动条控制
        var offset = parseInt(this.elContent.prop('scrollHeight'));
        this.elContent.scrollTop(offset);
    }

    MessagePanel.prototype.refreshScroll = function() {
        // 滚动条控制
        var offset = parseInt(this.elContent.prop('scrollHeight'));
        this.elContent.scrollTop(offset);
    }

    /**
     * 加载面板草稿。
     * @param {*} panel 
     */
    MessagePanel.prototype.loadDraft = function(panel) {
        // 加载草稿
        window.cube().messaging.loadDraft(panel.id, function(draft) {
            // 更新目录
            g.app.messageCatalog.restoreDesc(panel.id, '<span class="text-danger">[草稿] ' + draft.getMessage().getSummary() + '</span>');
        });
    }

    /**
     * 将当前输入的格式化数据转为超文本。
     * @returns {string}
     */
    MessagePanel.prototype.serializeHyperText = function() {
        // 解析输入内容
        var formatText = [];
        for (var i = 0; i < this.formatContents.length; ++i) {
            var c = this.formatContents[i];
            if (c.format == 'txt') {
                formatText.push(filterFormatText(c.data));
            }
            else if (c.format == 'emoji') {
                var array = [
                    '[E', c.desc, '#', c.data, ']'
                ];
                formatText.push(array.join(''));
            }
            else if (c.format == 'at') {
                var array = [
                    '[@', c.name, '#', c.data, ']'
                ];
                formatText.push(array.join(''));
            }
        }

        return formatText.join('');
    }

    /**
     * 将超文本格式转为 HTML 格式。
     * @param {HyperTextMessage} message 
     * @param {boolean} forInput 是否转为输入编辑器支持的模式。
     */
    MessagePanel.prototype.deserializeHyperText = function(message, forInput) {
        var html = [];

        if (forInput) {
            var list = message.getFormattedContents();
            for (var i = 0, len = list.length - 1; i < len; ++i) {
                var value = list[i];
                if (value.format == 'text') {
                    html.push('<p>');
                    html.push(value.content);
                    html.push('</p>');
                }
                else if (value.format == 'emoji') {
                    var emoji = String.fromCodePoint('0x' + value.content.code);
                    html.push('<p>&nbsp;</p><p class="emoji" desc="');
                    html.push(value.content.desc);
                    html.push('">');
                    html.push(emoji);
                    html.push('</p><p>&nbsp;</p>');
                }
                else if (value.format == 'at') {
                    html.push('<p>&nbsp;</p><p class="at-wrapper"><span class="at">@');
                    html.push(value.content.name);
                    html.push('</span></p><p>&nbsp;</p>');
                }
            }

            // 处理最后一个
            var last = list[list.length - 1];
            if (last.format == 'text') {
                html.push('<p>' + last.content + '<br></p>');
            }
            else if (last.format == 'emoji') {
                var emoji = String.fromCodePoint('0x' + last.content.code);
                html.push('<p>&nbsp;</p><p class="emoji" desc="' + last.content.desc + '">' + emoji + '</p><p><br></p>');
            }
            else if (last.format == 'at') {
                html.push('<p>&nbsp;</p><p class="at-wrapper"><span class="at">@' + last.content.name + '</span></p><p><br></p>');
            }
        }
        else {
            message.getFormattedContents().forEach(function(value) {
                if (value.format == 'text') {
                    html.push(value.content);
                }
                else if (value.format == 'emoji') {
                    var emoji = String.fromCodePoint('0x' + value.content.code);
                    html.push('&nbsp;<span class="emoji">' + emoji + '</span>&nbsp;');
                }
                else if (value.format == 'at') {
                    html.push('&nbsp;<span class="at">@' + value.content.name + '</span>&nbsp;');
                }
            });
        }

        return html.join('');
    }

    /**
     * 在表情符号面板点击了表情符号。
     * @param {*} emoji 
     */
    MessagePanel.prototype.onEmojiClick = function(emoji) {
        var emojiHtml = String.fromCodePoint('0x' + emoji.code);
        if (activeEditor) {
            that.inputEditor.cmd.do('insertHTML', '<p>&nbsp;</p><p class="emoji" desc="' + emoji.desc + '">' + emojiHtml + '</p><p>&nbsp;</p>');
        }
        else {
            // TODO
        }
    }

    /**
     * 当触发发送消息事件时回调。
     * @param {*} e 
     */
    MessagePanel.prototype.onSend = function(e) {
        var text = activeEditor ? this.inputEditor.txt.text() : this.elInput.val();
        if (text.length == 0) {
            return;
        }

        // 格式化的内容
        text = this.serializeHyperText();

        if (this.current.entity instanceof Group) {
            var state = this.current.entity.getState();
            if (state == GroupState.Dismissed) {
                this.appendNote(this.current.entity, '群组已解散');
                return;
            }
            else if (state == GroupState.Disabled) {
                this.appendNote(this.current.entity, '群组已删除');
                return;
            }
        }

        if (activeEditor) {
            this.inputEditor.txt.clear();
        }
        else {
            this.elInput.val('');
        }

        // 触发发送
        var message = g.app.messagingCtrl.fireSend(this.current.entity, text);
        if (null == message) {
            g.dialog.launchToast(Toast.Error, '发送消息失败');
        }

        // 清理格式化内容
        if (this.formatContents.length > 0) {
            this.formatContents.splice(0, this.formatContents.length);
        }
        this.lastInput = '';
    }

    /**
     * 点击“创建群组”。
     * @param {*} e 
     */
    MessagePanel.prototype.onNewGroupClick = function(e) {
        if (null == this.current) {
            return;
        }

        if (this.current.groupable) {
            var currentGroup = this.current.entity;
            var list = g.app.contactsCtrl.getContacts();
            var members = currentGroup.getMembers();
            var result = [];
            var contains = false;
            for (var i = 0; i < list.length; ++i) {
                var contact = list[i];
                contains = false;
                for (var j = 0; j < members.length; ++j) {
                    var member = members[j];
                    if (member.id == contact.id) {
                        contains = true;
                        break;
                    }
                }

                if (!contains) {
                    result.push(contact);
                }
            }

            g.app.contactListDialog.show(result, [], function(list) {
                if (list.length > 0) {
                    currentGroup.addMembers(list, function(group) {
                        g.app.messageSidebar.update(group);
                    }, function(error) {
                        g.dialog.launchToast(Toast.Error, '邀请入群操作失败 - ' + error.code);
                    });
                }
            }, '邀请入群', '请选择您要邀请入群的联系人');
        }
        else {
            g.app.newGroupDialog.show([this.current.entity.getId()]);
        }
    }

    /**
     * 点击“详情”。
     * @param {*} e 
     */
    MessagePanel.prototype.onDetailsClick = function(e) {
        if (null == this.current) {
            return;
        }

        var entity = this.current.entity;

        if (this.current.groupable) {
            g.app.groupDetails.show(entity);
        }
        else {
            g.app.contactDetails.show(entity);
        }
    }

    /**
     * 点击“折叠”。
     * @param {*} e 
     */
    MessagePanel.prototype.onCollapseClick = function(e) {
        if (null == this.current) {
            return;
        }
        
        g.app.messagingCtrl.toggleSidebar();
    }

    /**
     * 当消息输入框内容变化时回调。
     * @param {string} html 
     */
    MessagePanel.prototype.onEditorChange = function(html) {
        if (html.length == 0) {
            this.formatContents.splice(0, this.formatContents.length);
            this.lastInput = '';
            // 删除草稿
            if (null != this.current) {
                window.cube().messaging.deleteDraft(this.current.id);
            }
            return;
        }

        if (this.lastInput == html) {
            return;
        }

        var text = html.replace(/<[^<>]+>/g, "");
        if (text.length == 0 || text == ' ' || text == '&nbsp;') {
            this.formatContents.splice(0, this.formatContents.length);
            this.lastInput = '';
            // 删除草稿
            if (null != this.current) {
                window.cube().messaging.deleteDraft(this.current.id);
            }
            return;
        }

        var result = calcInput(this.lastInput, html);

        if (result.deleted) {
            // 有格式化整体内容被删除
            var formatContents = result.newestContents;
            var content = [];
            for (var i = 0; i < formatContents.length; ++i) {
                var c = formatContents[i];
                if (c.format == "txt") {
                    content.push('<p>' + c.data + '</p>');
                }
                else if (c.format == "emoji") {
                    var emoji = String.fromCodePoint('0x' + c.data);
                    content.push('<p>&nbsp;</p><p class="emoji" desc="' + c.desc + '">' + emoji + '</p><p>&nbsp;</p>');
                }
                else if (c.format == "at") {
                    var atContent = '<p>&nbsp;</p><p class="at-wrapper" data="' + c.data + '"><span class="at">@' + c.name + '</span></p><p>&nbsp;</p>';
                    content.push(atContent);
                }
            }
            setTimeout(function() {
                that.inputEditor.txt.html(content.join(''));
            }, 10);
        }

        this.formatContents = result.newestContents;

        this.lastInput = html;
    }

    /**
     * 处理粘贴内容。
     * @param {string} paste 
     * @returns {string}
     */
    MessagePanel.prototype.handlePasteText = function(paste) {
        return paste.replace(/<[^<>]+>/g, "");;
    }

    /**
     * 当编辑框触发 Key Press 事件时回调。
     * @param {*} event 
     * @returns 
     */
    MessagePanel.prototype.onEditorKeypress = function(event) {
        var e = event || window.event;
        if (e && e.keyCode == 13 && e.ctrlKey) {
            that.onSend(e);
            return;
        }

        // @ - 64
        if (64 == e.keyCode && this.current.groupable) {
            // 群组的 @ 功能
            this.makeAtPanel(this.current.entity);

            this.atPanel.css('display', 'block');
            this.atPanel.focus();
            g.app.onKeyUp(that.onAtPanelKeyUp);
        }
    }

    /*
    MessagePanel.prototype.onEditorPaste = function(event) {
        var clipboardData = (event.clipboardData || window.clipboardData);
        var paste = clipboardData.getData('text');
        if (null == paste || paste.length == 0) {
            return false;
        }

        const selection = window.getSelection();
        if (!selection.rangeCount) {
            return false;
        }

        selection.deleteFromDocument();
        var range = selection.getRangeAt(0);
        // 删除选中文本
        range.deleteContents();
        // 插入文本
        range.insertNode(document.createTextNode(paste));

        event.preventDefault();
        return false;
    }
    MessagePanel.prototype.onEditorKeydown = function(event) {
        var e = event || window.event;
        // 退格键 - 8，删除键 - 46
        // if (e.keyCode == 8 || e.keyCode == 46) {
        //     // var text = this.inputEditor.txt.text();
        //     e.preventDefault();
        //     return false;
        // }
    }*/

    /**
     * 动态生成 AT 面板。
     * @param {Group} group 
     * @returns 
     */
    MessagePanel.prototype.makeAtPanel = function(group) {
        var list = group.getMembers();
        var num = list.length - 1;

        this.atElList = [];
        this.atPanel.empty();

        var dom = null;
        var parentId = $('#message-editor').find('.w-e-text').attr('id');
        var cursor = getCurrentCursorPosition(parentId);
        var dom = cursor.node;

        if (dom == null) {
            return;
        }

        var width = parseInt(dom.clientWidth || dom.offsetWidth || dom.style.width|| dom.scrollWidth);

        var left = parseInt(dom.offsetLeft) + parseInt(dom.offsetParent.offsetLeft);
        var top = parseInt(dom.offsetTop) + parseInt(dom.offsetParent.offsetTop);

        // 计算位置
        left += calcCursorPosition(cursor.charCount)[0];
        var offset = 12;
        if (left + offset >= width) {
            var d = Math.floor((left + offset) / width);
            var mod = (left + offset) % width;
            top += (d * 21);
            left = mod + offset;
        }

        if (num <= 5) {
            this.atPanel.css('height', ((num * 32) + 2) + 'px');
            top -= ((num * 32) + 4);
        }
        else {
            this.atPanel.css('height', '162px');
            top -= 170;
        }

        for (var i = 0; i < list.length; ++i) {
            var member = list[i];
            if (member.getId() == g.app.account.id) {
                // 排除自己
                continue;
            }

            g.app.getContact(member.getId(), function(contact) {
                // 修改群成员数据
                group.modifyMember(contact);

                var name = group.getMemberName(contact);
                var html = [
                    '<div class="row align-items-center" data="', contact.getId(), '">',
                        '<div class="col-2 avatar"><img src="images/', contact.getContext().avatar, '" /></div>',
                        '<div class="col-10">', name, '</div>',
                    '</div>'
                ];

                var el = $(html.join(''));
                el.on('click', function() {
                    that.onAtRowClick($(this));
                });
                that.atElList.push(el);

                if (that.atElList.length == 1) {
                    that.atElList[0].addClass('active');
                }

                that.atPanel.append(el);
            });
        }

        // 位置
        this.atPanel.css('left', left + 'px');
        this.atPanel.css('top', top + 'px');
    }

    /**
     * 选择当前指定的 AT 项。
     */
    MessagePanel.prototype.selectAtItem = function() {
        if (!that.current.groupable) {
            return;
        }

        var id = parseInt(that.atPanel.find('.active').attr('data'));
        var member = that.current.entity.getMemberById(id);

        var atContent = '<p>&nbsp;</p><p class="at-wrapper" data="' + id + '"><span class="at">@' + that.current.entity.getMemberName(member) + '</span></p><p>&nbsp;</p>';
        that.inputEditor.cmd.do('insertHTML', atContent);
        that.atPanel.blur();
    }

    MessagePanel.prototype.onAtRowClick = function(target) {
        var index = 0;
        for (var i = 0; i < that.atElList.length; ++i) {
            var el = that.atElList[i];
            if (el.hasClass('active')) {
                index = i;
                break;
            }
        }

        var cur = that.atElList[index];
        cur.removeClass('active');
        target.addClass('active');

        that.selectAtItem();
    }

    MessagePanel.prototype.onAtPanelBlur = function(event) {
        g.app.unKeyUp(that.onAtPanelKeyUp);
        that.atElList = [];
        that.atPanel.css('display', 'none');
    }

    MessagePanel.prototype.onAtPanelKeyUp = function(event) {
        if (event.keyCode == 13) {
            that.selectAtItem();
            return;
        }
        else if (event.keyCode == 27) {
            // ESC - 27
            that.atPanel.blur();
            that.inputEditor.txt.append('@');
            return;
        }

        // Up - 38, Down - 40

        if (event.keyCode == 40 || event.keyCode == 38) {
            var index = 0;
            for (var i = 0; i < that.atElList.length; ++i) {
                var el = that.atElList[i];
                if (el.hasClass('active')) {
                    index = i;
                    break;
                }
            }

            var cur = that.atElList[index];

            if (event.keyCode == 40) {
                cur.removeClass('active');
                if (index >= that.atElList.length - 1) {
                    index = 0;
                }
                else {
                    index += 1;
                }
                that.atElList[index].addClass('active');
            }
            else if (event.keyCode == 38) {
                cur.removeClass('active');
                if (index == 0) {
                    index = that.atElList.length - 1;
                }
                else {
                    index -= 1;
                }
                that.atElList[index].addClass('active');
            }
        }
    }

    function calcInput(lastHtml, newestHtml) {
        var lastContents = parseContent(lastHtml);
        var newestContents = parseContent(newestHtml);

        var deleted = false;

        // 判断上一次的内容里是否少了 AT 格式的内容
        for (var i = 0; i < lastContents.length && i < newestContents.length; ++i) {
            var last = lastContents[i];
            var newest = newestContents[i];

            if (last.format == "at" && newest.format == "at") {
                if (last.name != newest.name) {
                    deleted = true;
                    newestContents.splice(i, 1);
                    break;
                }
            }
        }

        return { "deleted": deleted, "newestContents": newestContents, "lastContents": lastContents };
    }

    function parseContent(html) {
        var formatContents = [];

        var htmlEl = $('<div>' + html + '</div>');
        var pEl = htmlEl.find('p');

        var skipNextBlank = false;

        pEl.each(function() {
            var el = $(this);
            if (el.hasClass('emoji')) {
                // 移除上一个空格
                if (formatContents.length > 0 && formatContents[formatContents.length - 1].data.charCodeAt(0) == 160) {
                    formatContents.pop();
                }

                var c = el.text();
                if (c.length == 0) {
                    return;
                }

                var emoji = c.codePointAt(0).toString(16);
                var desc = el.attr('desc');
                formatContents.push({ "format": "emoji", "data": emoji, "desc": desc });

                skipNextBlank = true;
            }
            else if (el.hasClass('at-wrapper')) {
                // 移除上一个空格
                if (formatContents.length > 0 && formatContents[formatContents.length - 1].data.charCodeAt(0) == 160) {
                    formatContents.pop();
                }

                var c = el.text();
                formatContents.push({ "format": "at", "data": parseInt(el.attr('data')), "name": c.substring(1) });

                skipNextBlank = true;
            }
            else {
                if (skipNextBlank) {
                    skipNextBlank = false;
                    var c = el.text();
                    if (c.charCodeAt(0) == 160 && c.length == 1) {
                        return;
                    }

                    c = c.substring(1);
                    if (c.length > 0) {
                        formatContents.push({ "format": "txt", "data": c });
                        return;
                    }
                }

                if (el.text().length == 0) {
                    return;
                }

                formatContents.push({ "format": "txt", "data": el.text() });
            }
        });

        return formatContents;
    }

    // 计算当前光标位置
    function calcCursorPosition(count) {
        var length = 0;
        var plain = that.lastInput.replace(/<[^<>]+>/g, "");
        var string = plain.replaceAll('&nbsp;', ' ');

        var offset = 0;

        for (var i = 0; i < string.length && i < count; ++i) {
            var c = string.charCodeAt(i);
            if (c > 127 || c == 94) {
                length += 2;
                offset += 14;
            }
            else {
                length += 1;
                if ((c >= 105 && c <= 108) || c == 114 || c == 116) {
                    offset += 4;
                }
                else if (c >= 64 && c <= 90) {
                    // @符号和大写字母
                    offset += 10;
                }
                else {
                    offset += 8;
                }
            }
        }

        return [ Math.round(offset), length ];
    }

    function filterFormatText(input) {
        var output = [];
        for (var i = 0; i < input.length; ++i) {
            var c = input.charAt(i);
            if (c == '[' || c == ']') {
                // 转义
                output.push('\\');
            }

            output.push(c);
        }
        return output.join('');
    }

    // 获取当前输入框光标位置
    function getCurrentCursorPosition(parentId) {
        var selection = window.getSelection(),
            charCount = -1,
            node = null;

        if (selection.focusNode) {
            if (isChildOf(selection.focusNode, parentId)) {
                node = selection.focusNode; 
                charCount = selection.focusOffset;
    
                while (node) {
                    if (node.id === parentId) {
                        break;
                    }
    
                    if (node.previousSibling) {
                        node = node.previousSibling;
                        charCount += node.textContent.length;
                    }
                    else {
                         node = node.parentNode;
                         if (node === null) {
                             break
                         }
                    }
                }
            }
        }
        return { "node": node, "charCount": charCount };
    }

    function isChildOf(node, parentId) {
        while (node !== null) {
            if (node.id === parentId) {
                return true;
            }
            node = node.parentNode;
        }

        return false;
    }

    g.MessagePanel = MessagePanel;

})(window);

(function(g) {
    'use strict'

    var that = null;

    var currentGroup = null;
    var currentGroupRemark = null;
    var currentGroupNotice = null;

    var currentContact = null;
    var currentContactRemark = null;

    var sidebarEl = null;
    var groupSidebarEl = null;
    var contactSidebarEl = null;

    // var imageFileListEl = null;

    // 群组相关
    var inputGroupRemark = null;
    var btnGroupRemark = null;
    var textGroupNotice = null;
    var memberListEl = null;
    var switchGroupNoNoticing = null;

    // 联系人相关
    var inputContactRemark = null;
    var btnContactRemark = null;
    var switchContactNoNoticing = null;

    function onGroupRemarkClick() {
        if (inputGroupRemark.prop('disabled')) {
            currentGroupRemark = inputGroupRemark.val().trim();
            inputGroupRemark.removeAttr('disabled');
            inputGroupRemark.focus();
        }
        else {
            var text = inputGroupRemark.val().trim();
            inputGroupRemark.attr('disabled', 'disabled');
            if (currentGroupRemark == text) {
                return;
            }

            window.cube().contact.remarkGroup(currentGroup, text, function() {
                dialog.launchToast(Toast.Success, '已备注群组');
            }, function(error) {
                dialog.launchToast(Toast.Error, '修改群组备注失败：' + error.code);
                inputGroupRemark.val(currentGroupRemark);
            });
        }
    }

    function onGroupRemarkBlur() {
        onGroupRemarkClick();
    }

    function onNoticeClick() {
        if (textGroupNotice.prop('disabled')) {
            currentGroupNotice = textGroupNotice.val().trim();
            textGroupNotice.removeAttr('disabled');
            textGroupNotice.focus();
        }
        else {
            var text = textGroupNotice.val().trim();
            textGroupNotice.attr('disabled', 'disabled');
            if (currentGroupNotice == text) {
                return;
            }

            // 更新群组公告
            currentGroup.getAppendix().updateNotice(text, function() {
                dialog.launchToast(Toast.Success, '已修改群组公告');
            }, function(error) {
                dialog.launchToast(Toast.Error, '修改群组公告失败：' + error.code);
                textGroupNotice.val(currentGroupNotice);
            });
        }
    }

    function onNoticeBlur() {
        onNoticeClick();
    }

    function onMemberNameKeyup(event) {
        if (event.keyCode == 13) {
            onMemberNameModified($(this));
        }
    }

    function onMemberNameBlur(event) {
        onMemberNameModified($(this));
    }

    function onMemberNameModified(thisEl) { 
        var newText = thisEl.val();
        var preText = thisEl.attr('predata');
        var memberId = thisEl.attr('data-target');

        if (newText == preText || newText.length < 3) {
            g.app.messageSidebar.recoverMemberName(memberId, thisEl.parent(), preText);
            return;
        }

        // 更新群组成员的备注
        currentGroup.getAppendix().updateMemberRemark(memberId, newText, function() {
            dialog.launchToast(Toast.Success, '已修改群组成员备注');
        }, function(error) {
            dialog.launchToast(Toast.Error, '备注群组成员失败：' + error.code);
        });

        // 恢复 UI 显示
        g.app.messageSidebar.recoverMemberName(memberId, thisEl.parent(), newText);
    }

    function onAddMemberClick(e) {
        var list = g.app.contactsCtrl.getContacts();
        var members = currentGroup.getMembers();
        var result = [];
        var contains = false;
        for (var i = 0; i < list.length; ++i) {
            var contact = list[i];
            contains = false;
            for (var j = 0; j < members.length; ++j) {
                var member = members[j];
                if (member.id == contact.id) {
                    contains = true;
                    break;
                }
            }

            if (!contains) {
                result.push(contact);
            }
        }

        g.app.contactListDialog.show(result, [], function(list) {
            if (list.length > 0) {
                currentGroup.addMembers(list, function(group) {
                    that.updateGroup(group);
                }, function(error) {
                    g.dialog.launchToast(Toast.Error, '邀请入群操作失败 - ' + error.code);
                });
            }
        }, '邀请入群', '请选择您要邀请入群的联系人');
    }

    function onRemoveMemberClick(e) {
        if (!currentGroup.isOwner()) {
            g.dialog.launchToast(Toast.Info, '您不能移除该群组成员。');
            return;
        }

        var members = currentGroup.getMembers().concat();
        if (members.length == 2) {
            g.dialog.launchToast(Toast.Warning, '群里仅有两名成员，没有可移除的成员。');
            return;
        }

        for (var i = 0; i < members.length; ++i) {
            var member = members[i];
            if (member.id == g.app.account.id) {
                members.splice(i, 1);
                break;
            }
        }

        g.app.contactListDialog.show(members, [], function(list) {
            if (list.length > 0) {
                currentGroup.removeMembers(list, function(group) {
                    that.updateGroup(group);
                }, function(error) {
                    g.dialog.launchToast(Toast.Error, '移除成员操作失败 - ' + error.code);
                });
            }
        }, '移除成员', '请选择您要从群组移除的联系人');
    }


    function onContactRemarkClick() {
        if (inputContactRemark.prop('disabled')) {
            currentContactRemark = inputContactRemark.val().trim();
            inputContactRemark.removeAttr('disabled');
            inputContactRemark.focus();
        }
        else {
            var text = inputContactRemark.val().trim();
            inputContactRemark.attr('disabled', 'disabled');
            if (currentContactRemark == text) {
                return;
            }

            window.cube().contact.remarkContactName(currentContact, text, function() {
                dialog.launchToast(Toast.Success, '已备注联系人');
            }, function(error) {
                dialog.launchToast(Toast.Error, '修改联系人备注失败：' + error.code);
                inputContactRemark.val(currentContactRemark);
            });
        }
    }

    function onContactRemarkBlur() {
        onContactRemarkClick();
    }

    function onSwitchGroupNoNoticing(event, state) {
        // 通过附录来管理消息免打扰
        var appendix = g.cube().contact.getSelf().getAppendix();

        if (state) {
            appendix.addNoNoticeGroup(currentGroup.getId());
        }
        else {
            appendix.removeNoNoticeGroup(currentGroup.getId());
        }
    }

    function onSwitchContactNoNoticing(event, state) {
        // 通过附录来管理消息免打扰
        var appendix = g.cube().contact.getSelf().getAppendix();

        if (state) {
            appendix.addNoNoticeContact(currentContact.getId());
        }
        else {
            appendix.removeNoNoticeContact(currentContact.getId());
        }
    }


    /**
     * 消息面板侧边栏。
     */
    var MessageSidebar = function(el) {
        that = this;

        sidebarEl = el;
        groupSidebarEl = sidebarEl.find('.for-group');
        contactSidebarEl = sidebarEl.find('.for-contact');

        // imageFileListEl = sidebarEl.find('.image-file-list');

        // 群组界面

        inputGroupRemark= groupSidebarEl.find('input[data-target="group-remark"]');
        inputGroupRemark.attr('disabled', 'disabled');
        inputGroupRemark.blur(onGroupRemarkBlur);

        btnGroupRemark = groupSidebarEl.find('button[data-target="remark"]');
        btnGroupRemark.click(onGroupRemarkClick);

        textGroupNotice = groupSidebarEl.find('textarea[data-target="group-notice"]');
        textGroupNotice.attr('disabled', 'disabled');
        textGroupNotice.blur(onNoticeBlur);
        groupSidebarEl.find('button[data-target="notice"]').click(onNoticeClick);

        groupSidebarEl.find('button[data-target="add-member"]').click(onAddMemberClick);
        groupSidebarEl.find('button[data-target="remove-member"]').click(onRemoveMemberClick);
        memberListEl = groupSidebarEl.find('.group-member-list');

        switchGroupNoNoticing = groupSidebarEl.find('input[data-target="no-noticing-switch"]');
        switchGroupNoNoticing.bootstrapSwitch({
            onText: '已开启',  
	        offText: '已关闭',
            size: 'small',
            handleWith: 50,
            labelWidth: 15,
            onSwitchChange: onSwitchGroupNoNoticing
        });

        // 联系人界面

        inputContactRemark = contactSidebarEl.find('input[data-target="contact-remark"]');
        inputContactRemark.attr('disabled', 'disabled');
        inputContactRemark.blur(onContactRemarkBlur);

        btnContactRemark = contactSidebarEl.find('button[data-target="remark"]');
        btnContactRemark.click(onContactRemarkClick);

        // 联系人消息免打扰
        switchContactNoNoticing = contactSidebarEl.find('input[data-target="no-noticing-switch"]');
        switchContactNoNoticing.bootstrapSwitch({
            onText: '已开启',  
	        offText: '已关闭',
            size: 'small',
            handleWith: 50,
            labelWidth: 15,
            onSwitchChange: onSwitchContactNoNoticing
        });
    }

    /**
     * 更新数据。
     * @param {Group|Contact} entity 
     */
    MessageSidebar.prototype.update = function(entity) {
        if (entity instanceof Group) {
            this.updateGroup(entity);
            if (groupSidebarEl.hasClass('no-display')) {
                groupSidebarEl.removeClass('no-display');
            }
            if (!contactSidebarEl.hasClass('no-display')) {
                contactSidebarEl.addClass('no-display');
            }
        }
        else {
            this.updateContact(entity);
            if (contactSidebarEl.hasClass('no-display')) {
                contactSidebarEl.removeClass('no-display');
            }
            if (!groupSidebarEl.hasClass('no-display')) {
                groupSidebarEl.addClass('no-display');
            }
        }
    }

    /**
     * 更新联系人数据。
     * @param {Contact} contact 
     */
    MessageSidebar.prototype.updateContact = function(contact) {
        currentContact = contact;

        contactSidebarEl.find('input[data-target="contact-name"]').val(contact.getName());

        inputContactRemark.val(contact.getAppendix().hasRemarkName() ? contact.getAppendix().getRemarkName() : '');

        // 配置信息
        var appendix = g.app.getSelf().getAppendix();
        if (appendix.isNoNoticeContact(contact)) {
            switchContactNoNoticing.bootstrapSwitch('state', true);
        }
        else {
            switchContactNoNoticing.bootstrapSwitch('state', false);
        }
    }

    /**
     * 更新群组数据。
     * @param {Group} group 
     */
    MessageSidebar.prototype.updateGroup = function(group) {
        currentGroup = group;

        groupSidebarEl.find('input[data-target="group-name"]').val(group.getName());

        if (!currentGroup.isOwner()) {
            groupSidebarEl.find('.group-notice-btn-group').css('display', 'none');
        }
        else {
            groupSidebarEl.find('.group-notice-btn-group').css('display', 'block');
        }

        // 读取群组的附录，从附录里读取群组的备注
        // window.cube().contact.getAppendix(group, function(appendix) {
        //     inputGroupRemark.val(appendix.getRemark());
        //     textGroupNotice.val(appendix.getNotice());
        // }, function(error) {
        //     console.log(error.toString());
        // });

        inputGroupRemark.val(group.getAppendix().getRemark());
        textGroupNotice.val(group.getAppendix().getNotice());

        // 加载成员列表
        memberListEl.empty();

        group.getMembers().forEach(function(element) {
            g.app.getContact(element.getId(), function(contact) {
                // 更新本地数据
                group.modifyMember(contact);

                var operate = [ '<button class="btn btn-sm btn-default btn-flat"' ,
                    ' onclick="javascript:app.messageSidebar.fireUpdateMemberRemark(', contact.getId(), ');"><i class="fas fa-edit"></i></button>' ];
                var html = [
                    '<div class="group-member-cell" data-target="', contact.getId(), '" ondblclick="javascript:app.contactDetails.show(', contact.getId(), ');">',
                        '<div class="member-avatar"><img class="img-size-32 img-round-rect" src="images/', contact.getContext().avatar, '" /></div>',
                        '<div class="member-name">',
                            group.getAppendix().hasMemberRemark(contact) ? group.getAppendix().getMemberRemark(contact) : contact.getPriorityName(),
                        '</div>',
                        '<div class="member-operate">',
                            group.isOwner() ? operate.join('') :
                                (contact.getId() == g.app.account.id ? operate.join('') : ''),
                        '</div>',
                    '</div>'
                ];
                memberListEl.append($(html.join('')));
            });
        });

        // 配置信息
        var appendix = g.app.getSelf().getAppendix();
        if (appendix.isNoNoticeGroup(group)) {
            switchContactNoNoticing.bootstrapSwitch('state', true);
        }
        else {
            switchContactNoNoticing.bootstrapSwitch('state', false);
        }

        // 检索群组的图片
        /*window.cube().fs.getRoot(group, function(root) {
            root.searchFile({
                "type": ['jpg', 'png', 'gif', 'bmp'],
                "begin": 0,
                "end": 20,
                "inverseOrder": true
            }, function(filter, list) {
                list.forEach(function(item) {
                    that.appendImage(item.file);
                });
            }, function(error) {
                console.log('MessageSidebar #searchFile() : ' + error.code);
            });
        }, function(error) {
            console.log('MessageSidebar #getRoot() : ' + error.code);
        });*/
    }

    MessageSidebar.prototype.appendImage = function(fileLabel) {
        var html = [
            '<div class="file-cell">',
                '<div class="file-type">',
                    '<div class="file-thumb"></div>',
                '</div>',
                '<div class="file-info">',
                    '<div data-target="date">2021年1月3日</div>',
                    '<div data-target="size">902 KB</div>',
                '</div>',
            '</div>'
        ];
    }

    MessageSidebar.prototype.fireUpdateMemberRemark = function(id) {
        var el = sidebarEl.find('div[data-target="' + id + '"]');

        var btn = el.find('button');
        btn.attr('disabled', 'disabled');

        var width = parseInt(el.width());
        el = el.find('.member-name');
        var name = el.text();
        el.empty();

        width -= 44 + 40 + 16;
        var html = ['<input class="form-control form-control-sm" type="text" style="width:', width, 'px;" predata="', name, '" data-target="'
            , id, '" />'];
        el.html(html.join(''));

        var inputEl = el.find('input');
        inputEl.blur(onMemberNameBlur);
        inputEl.keyup(onMemberNameKeyup);
        inputEl.focus();
    }

    MessageSidebar.prototype.recoverMemberName = function(memberId, el, text) {
        el.empty();
        el.text(text);

        var cellEl = sidebarEl.find('div[data-target="' + memberId + '"]');
        cellEl.find('.member-operate').find('button').removeAttr('disabled');
    }

    g.MessageSidebar = MessageSidebar;

})(window);

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
    VoiceCallPanel.prototype.makeCall = function(target) {
        console.log('发起语音通话 ' + target.getId());

        var audioDevice = null;

        var handler = function() {
            if (g.app.callCtrl.makeCall(target, false, audioDevice)) {
                that.elPeerAvatar.attr('src', 'images/' + target.getContext().avatar);
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

        this.elPeerAvatar.attr('src', 'images/' + caller.getContext().avatar);
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
    VideoChatPanel.prototype.makeCall = function(target) {
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
                        // g.dialog.showAlert(videoDevice.label);
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

/**
 * 群组语音面板。
 */
(function(g) {

    /**
     * 最大允许的通话人数。
     */
    const maxMembers = 16;

    var that = null;

    var panelEl = null;

    var btnMinimize = null;
    var btnRestore = null;
    
    var btnHangup = null;

    var minimized = false;

    var VoiceGroupCallPanel = function() {
        that = this;
        panelEl = $('#group_voice_call');
        that.localVideo = panelEl.find('video[data-target="local"]')[0];

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

    VoiceGroupCallPanel.prototype.makeCall = function(group) {
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

                        result.shift();

                        // 调用启动通话
                        handler(group, result);

                    }, '群通话', '请选择要邀请通话的群组成员');
                }
            });
        });
    }

    VoiceGroupCallPanel.prototype.close = function() {
        panelEl.modal('hide');
    }

    VoiceGroupCallPanel.prototype.tipWaitForAnswer = function(activeCall) {
        panelEl.find('.header-tip').text('正在等待服务器应答...');
    }

    VoiceGroupCallPanel.prototype.tipConnected = function(activeCall) {
        panelEl.find('.header-tip').text('已接通...');
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
        g.app.callCtrl.hangupCall();
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

    var btnMinimize = null;
    var btnRestore = null;

    var btnHangup = null;

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
        var members = [];

        var videoDevice = null;

        var handler = function(group, idList) {
            // 获取本地视频窗口
            that.localVideo = panelEl.find('video[data-target="' + g.app.getSelf().getId() + '"]')[0];

            if (g.app.callCtrl.makeCall(group, true, videoDevice)) {
                panelEl.find('.video-group-default .modal-title').text('群通话 - ' + group.getName());
                panelEl.find('.video-group-minisize .modal-title').text(group.getName());

                panelEl.find('.header-tip').text('正在接通，请稍候...');

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

                        if (result.length > maxMembers) {
                            g.dialog.showAlert('超过最大通话人数（最大通话人数 ' + maxMembers + ' 人）。');
                            return;
                        }

                        // 界面布局
                        that.resetLayout(result);

                        result.shift();

                        panelEl.find('.header-tip').text('正在启动摄像机...');

                        // 调用启动通话
                        handler(group, result);

                    }, '群通话', '请选择要邀请通话的群组成员');
                }
            });
        });
    }

    VideoGroupChatPanel.prototype.tipWaitForAnswer = function(activeCall) {
        panelEl.find('.header-tip').text('正在等待服务器应答...');
    }

    VideoGroupChatPanel.prototype.tipConnected = function(activeCall) {
        panelEl.find('.header-tip').text('已接通...');
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
                        '<td>',
                            '<div class="viewport" data="', list[0].getId(), '"><video autoplay data-target="', list[0].getId(), '"></video></div>',
                            '<div class="toolbar"><div class="name">', list[0].getPriorityName(), '</div></div>',
                        '</td>',
                        '<td>',
                            '<div class="viewport" data="', list[1].getId(), '"><video autoplay data-target="', list[1].getId(), '"></video></div>',
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
                        '<td colspan="2" class="colspan">',
                            '<div class="viewport" data="', list[0].getId(), '"><video autoplay data-target="', list[0].getId(), '"></video></div>',
                            '<div class="toolbar"><div class="name">', list[0].getPriorityName(), '</div></div>',
                        '</td>',
                    '</tr>',
                    '<tr>',
                        '<td>',
                            '<div class="viewport" data="', list[1].getId(), '"><video autoplay data-target="', list[1].getId(), '"></video></div>',
                            '<div class="toolbar"><div class="name">', list[1].getPriorityName(), '</div></div>',
                        '</td>',
                        '<td>',
                            '<div class="viewport" data="', list[2].getId(), '"><video autoplay data-target="', list[2].getId(), '"></video></div>',
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
                        '<td>',
                            '<div class="viewport" data="', list[0].getId(), '"><video autoplay data-target="', list[0].getId(), '"></video></div>',
                            '<div class="toolbar"><div class="name">', list[0].getPriorityName(), '</div></div>',
                        '</td>',
                        '<td>',
                            '<div class="viewport" data="', list[1].getId(), '"><video autoplay data-target="', list[1].getId(), '"></video></div>',
                            '<div class="toolbar"><div class="name">', list[1].getPriorityName(), '</div></div>',
                        '</td>',
                    '</tr>',
                    '<tr>',
                        '<td>',
                            '<div class="viewport" data="', list[2].getId(), '"><video autoplay data-target="', list[2].getId(), '"></video></div>',
                            '<div class="toolbar"><div class="name">', list[2].getPriorityName(), '</div></div>',
                        '</td>',
                        '<td>',
                            '<div class="viewport" data="', list[3].getId(), '"><video autoplay data-target="', list[3].getId(), '"></video></div>',
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
                        '<td>',
                            '<div class="viewport" data="', contact.getId(), '"><video autoplay data-target="', contact.getId(), '"></video></div>',
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

        var vp = panelEl.find('.video-group-minisize').find('.viewport');
        vp.empty();

        curVideo.remove();
        vp.append(curVideo);

        panelEl.addClass('video-group-panel-mini');
        panelEl.find('.video-group-default').css('display', 'none');
        panelEl.find('.video-group-minisize').css('display', 'block');
    }

    VideoGroupChatPanel.prototype.restore = function() {
        var selfId = g.app.getSelf().getId();
        var curVideo = panelEl.find('video[data-target="' + selfId + '"]');

        curVideo.remove();
        var parent = panelEl.find('div[data="' + selfId +'"]');
        parent.append(curVideo);

        panelEl.removeClass('video-group-panel-mini');
        panelEl.find('.video-group-default').css('display', 'block');
        panelEl.find('.video-group-minisize').css('display', 'none');
    }

    g.VideoGroupChatPanel = VideoGroupChatPanel;

})(window);

(function(g) {
    'use strict';

    var dialogEl = null;

    var btnEditName = null;

    var currentContact = null;

    var editName = function() {
        if (currentContact.getId() == g.app.getSelf().getId()) {
            dialog.showPrompt('修改我的昵称', '请输入新昵称：', function(ok, text) {
                if (ok) {
                    if (text.length == 0) {
                        return;
                    }

                    $.ajax({
                        type: 'POST',
                        url: '/account/info',
                        data: { "name": text },
                        success: function(response, status, xhr) {
                            if (null == response) {
                                return;
                            }

                            // 修改 Cube 的联系人
                            g.cube().contact.modifyContact(text, response, function(contact) {
                                g.app.updateContact(contact);
                                g.app.sidebarAccountPanel.updateName(contact.getName());
                            }, function(error) {
                                console.log(error);
                            });

                            dialogEl.find('.widget-user-username').text(response.name);
                        },
                        error: function(xhr, error) {
                            console.log(error);
                        }
                    });
                }
            });
        }
        else {
            dialog.showPrompt('修改联系人备注', '请输入“'+ currentContact.getName() +'”的备注名：', function(ok, text) {
                if (ok) {
                    // 修改联系人附录里的备注名
                    currentContact.getAppendix().updateRemarkName(text, function(appendix) {
                        dialog.launchToast(Toast.Success, '已修改联系人备注名');
                        dialogEl.find('.widget-user-username').text(appendix.hasRemarkName() ? appendix.getRemarkName() : currentContact.getName());
                        g.app.messagingCtrl.updateContact(currentContact);
                    }, function(error) {
                        dialog.launchToast(Toast.Success, '修改联系人备注名失败: ' + error.code);
                    });
                }
            }, currentContact.getAppendix().getRemarkName());
        }
    }

    /**
     * 联系人详情对话框。
     * @param {jQuery} el 
     */
    var ContactDetails = function(el) {
        dialogEl = el;
        btnEditName = el.find('button[data-target="edit-remarkname"]');
        btnEditName.click(editName);
    }

    /**
     * 显示对话框。
     * @param {Contact|number} contact 
     */
    ContactDetails.prototype.show = function(contact) {
        var handler = function(contact) {
            var el = dialogEl;
            var name = contact.getAppendix().hasRemarkName() ? contact.getAppendix().getRemarkName() : contact.getName();
            el.find('.widget-user-username').text(name);
            el.find('.user-avatar').attr('src', 'images/' + contact.getContext().avatar);
            el.find('.user-id').text(contact.getId());
            el.find('.user-region').text(contact.getContext().region);
            el.find('.user-department').text(contact.getContext().department);

            if (contact.getId() == g.app.getSelf().getId()) {
                // btnEditName.css('visibility', 'hidden');
                btnEditName.attr('title', '修改昵称');
                el.find('.widget-user-desc').text('');
            }
            else {
                // btnEditName.css('visibility', 'visible');
                btnEditName.attr('title', '修改备注');
                el.find('.widget-user-desc').text(contact.getName());
            }

            el.modal('show');
        }

        if (contact instanceof Contact) {
            currentContact = contact;
            handler(currentContact);
        }
        else {
            var contactId = contact;

            g.app.getContact(contactId, function(contact) {
                currentContact = contact;
                if (null == currentContact) {
                    return;
                }

                handler(currentContact);
            });
        }
    }

    /**
     * 隐藏对话框。
     */
    ContactDetails.prototype.hide = function() {
        dialogEl.modal('hide');
    }

    g.ContactDetails = ContactDetails;

})(window);

(function(g) {

    var lastGroup = null;
    var lastTimestamp = 0;

    var elGroupName = null;

    var btnModify = null;
    var btnAddMember = null;
    var btnQuit = null;
    var btnDissolve = null;

    var fireModify = function() {
        g.dialog.showPrompt('修改群名称', '请输入新的群组名', function(ok, text) {
            if (ok) {
                if (text.length >= 3) {
                    g.app.messagingCtrl.modifyGroupName(lastGroup, text, function(group) {
                        // 修改对话框里的群组名
                        elGroupName.text(group.getName());
                    });
                }
                else {
                    g.dialog.showAlert('输入的群组名称不能少于3个字符。');
                    return false;
                }
            }
        });
    }

    var fireAddMember = function() {
        var contactList = g.app.getMyContacts();
        var members = lastGroup.getMembers();
        g.app.contactListDialog.show(contactList, members, function(list) {
            if (contactList.length == members.length + 1) {
                // 当前账号的联系人都已经是群组成员
                return true;
            }

            if (list.length == 0) {
                g.dialog.showAlert('没有选择联系人');
                return false;
            }

            lastGroup.addMembers(list, function() {
                g.app.groupDetails.refresh();
            }, function(error) {
                g.dialog.launchToast(Toast.Error, '添加群组成员失败: ' + error.code);
            });

            return true;
        });
    }

    var fireQuit = function() {
        if (lastGroup.isOwner()) {
            g.dialog.showAlert('您是该群组的群主，不能退出该群。', null, '我知道了');
            return;
        }

        g.dialog.showConfirm('退出群组', '您确定要退出“' + lastGroup.getName() + '”群组吗？', function(ok) {
            if (ok) {
                window.cube().contact.quitGroup(lastGroup, function() {
                    g.app.messagingCtrl.removeGroup(lastGroup);
                    g.app.groupDetails.hide();
                }, function(error) {
                    g.dialog.launchToast(Toast.Error, '退出群组失败: ' + error.code);
                });
            }
        });
    }

    var fireDissolve = function() {
        if (!lastGroup.isOwner()) {
            g.dialog.showAlert('您不是该群组的群主，不能解散该群。', null, '我知道了');
            return;
        }

        g.dialog.showConfirm('解散群组', '您确定要解散“' + lastGroup.getName() + '”群组吗？', function(ok) {
            if (ok) {
                window.cube().contact.dissolveGroup(lastGroup, function(group) {
                    // [TIP] 这里无需处理数据，在 Event Center 通过接收事件更新数据
                    g.app.groupDetails.hide();
                }, function(error) {
                    g.dialog.launchToast(Toast.Error, '解散群组失败: ' + error.code);
                });
            }
        });
    }

    /**
     * 群组详情对话框。
     * @param {jQuery} el 界面元素。
     */
    var GroupDetails = function(el) {
        this.el = el;

        elGroupName = el.find('.widget-user-username');

        btnModify = $('#group_details_modify');
        btnModify.click(fireModify);

        btnAddMember = $('#group_details_add');
        btnAddMember.click(fireAddMember);

        btnQuit = $('#group_details_quit');
        btnQuit.click(fireQuit);

        btnDissolve = $('#group_details_dissolve');
        btnDissolve.click(fireDissolve);
    }

    /**
     * 显示群组详情界面。
     * @param {Group} group 指定群组。
     */
    GroupDetails.prototype.show = function(group) {
        if (null != lastGroup && lastGroup.getId() == group.getId() && group.getLastActiveTime() == lastTimestamp) {
            this.el.modal('show');
            return;
        }

        lastGroup = group;
        lastTimestamp = group.getLastActiveTime();

        var el = this.el;

        elGroupName.text(group.getName());

        // 设置数据
        btnModify.attr('data', group.getId());
        btnAddMember.attr('data', group.getId());
        btnQuit.attr('data', group.getId());
        btnDissolve.attr('data', group.getId());

        var table = el.find('.table');
        table.find('tbody').remove();
        table.append(this.createGroupDetailsTable(group));
        el.modal('show');
    }

    /**
     * 隐藏群组详情界面。
     */
    GroupDetails.prototype.hide = function() {
        this.el.modal('hide');
    }

    /**
     * 刷新当前群组信息。
     */
    GroupDetails.prototype.refresh = function() {
        if (null == lastGroup) {
            return;
        }

        var el = this.el;
        var table = el.find('.table');
        table.find('tbody').remove();
        table.append(this.createGroupDetailsTable(lastGroup));
        el.modal('show');
    }

    /**
     * @private
     * @param {Group} group 
     */
    GroupDetails.prototype.createGroupDetailsTable = function(group) {
        var detailMemberTable = $('<tbody></tbody>');

        var removeable = group.isOwner();

        var clickEvent = [
            'app.contactsCtrl.removeGroupMember(', 
                'parseInt($(this).attr(\'data-group\')),',
                'parseInt($(this).attr(\'data-member\'))',
            ');'
        ];
        clickEvent = clickEvent.join('');

        var members = group.getMembers();
        for (var i = 0; i < members.length; ++i) {
            var member = members[i];

            var operation = removeable ? [ '<button class="btn btn-danger btn-xs" onclick="', clickEvent, '"',
                    ' data-member="', member.getId(), '"',
                    ' data-group="', group.getId(), '"',
                    ' data-original-title="从本群中移除" data-placement="top" data-toggle="tooltip"><i class="fas fa-minus"></i></button>']
                : [];

            if (removeable) {
                if (member.equals(g.app.getSelf())) {
                    operation = [];
                }
            }

            operation = operation.join('');

            var contact = g.app.queryContact(member.getId());
            var html = [
                '<tr>',
                    '<td>', (i + 1), '</td>',
                    '<td><img class="table-avatar" src="images/', contact.getContext().avatar, '" /></td>',
                    '<td>', contact.getPriorityName(), '</td>',
                    '<td>', contact.getId(), '</td>',
                    '<td>', contact.getContext().region, '</td>',
                    '<td>', contact.getContext().department, '</td>',
                    '<td>', operation, '</td>',
                '</tr>'];
    
            var elMem = $(html.join(''));
            detailMemberTable.append(elMem);
        }
    
        return detailMemberTable;
    }

    g.GroupDetails = GroupDetails;

})(window);

/**
 * 新建群组对话框。
 */
(function(g) {
    'use strict';

    var contacts = null;

    var dialogEl = null;
    var elMyContacts = null;
    var elGroupName = null;

    var btnConfirm = null;

    /**
     * 新建群组对话框。
     * @param {jQuery} el 
     */
    var NewGroupDialog = function(el) {
        dialogEl = el;
        elMyContacts = el.find('div[data-target="my-contacts"]');
        elGroupName = el.find('input[data-target="group-name"]');

        btnConfirm = el.find('button[data-target="confirm"]');
        btnConfirm.click(function() {
            var groupName = elGroupName.val().trim();
            if (groupName.length == 0) {
                groupName = g.app.getSelf().getName() + '创建的群组';
            }

            var members = [];
            elMyContacts.find('input[type="checkbox"]:checked').each(function(index, item) {
                members.push(parseInt($(item).attr('data')));
            });

            if (members.length == 0) {
                g.dialog.showAlert('请选择群组成员。', null, '我知道了');
                return;
            }

            window.cube().contact.createGroup(groupName, members, function(group) {
                // 添加到消息目录
                g.app.messageCatalog.appendItem(group);

                dialogEl.modal('hide');
            }, function(error) {
                g.dialog.launchToast(Toast.Error, '创建群组失败: ' + error.code);
            });
        });
    }

    /**
     * 显示对话框。
     * @param {Array} selectedList
     */
    NewGroupDialog.prototype.show = function(selectedList) {
        contacts = g.app.getMyContacts();

        elGroupName.val('');
        elMyContacts.empty();

        for (var i = 0; i < contacts.length; ++i) {
            var contact = contacts[i];
            var id = contact.getId();
            var avatar = contact.getContext().avatar;
            var name = contact.getPriorityName();

            var checked = undefined !== selectedList && selectedList.indexOf(id) >= 0;

            var html = [
                '<div class="col-6"><div class="form-group"><div class="custom-control custom-checkbox select-group-member">',
                    '<input class="custom-control-input" type="checkbox"', checked ? ' checked="checked"' : '', ' id="group_member_', i, '" data="', id, '" />',
                    '<label class="custom-control-label" for="group_member_', i, '">',
                        '<img src="images/', avatar, '" />',
                        '<span>', name, '</span>',
                    '</label>',
                '</div></div></div>'
            ];

            elMyContacts.append($(html.join('')));
        }

        dialogEl.modal('show');
    }

    g.NewGroupDialog = NewGroupDialog;

})(window);

(function(g) {
    'use strict';

    var dialogEl = null;

    var currentList = null;
    var preselected = null;

    var btnConfirm = null;
    var confirmCallback = null;

    /**
     * 在指定列表里查找是否有指定联系人。
     * @param {Contact|number} contact 
     * @param {Array} list 
     */
    function findContact(contact, list) {
        var cid = (typeof contact === 'number') ? contact : contact.getId();
        for (var i = 0; i < list.length; ++i) {
            var c = list[i];
            if (c.getId() == cid) {
                return c;
            }
        }
        return null;
    }

    function fireConfirm() {
        if (null == confirmCallback) {
            return;
        }

        var result = [];

        var tbody = dialogEl.find('tbody');
        tbody.find('input[type="checkbox"]:checked').each(function(i, item) {
            var id = parseInt($(item).attr('data'));
            var contact = findContact(id, preselected);
            if (null == contact) {
                // 是新选择联系人，记录 ID
                result.push(id);
            }
        });

        // 回调，参数为新选择的联系人
        var res = confirmCallback(result);
        if (undefined === res || res) {
            dialogEl.modal('hide');
            confirmCallback = null;
        }
    }

    /**
     * 联系人列表对话框。
     */
    var ContactListDialog = function() {
        dialogEl = $('#contact_list_dialog');
        btnConfirm = dialogEl.find('button[data-target="confirm"]');

        btnConfirm.click(fireConfirm);
    }

    /**
     * 显示联系人列表对话框。
     * @param {Array} list 联系人列表。
     * @param {Array} selectedList 已经被选中的联系人列表。
     * @param {function} confirmHandle 确认事件回调。参数：({@linkcode list}:{@linkcode Array}) 。
     * @param {string} [title] 对话框标题。
     * @param {string} [prompt] 提示内容。
     */
    ContactListDialog.prototype.show = function(list, selectedList, confirmHandle, title, prompt) {
        currentList = list;
        preselected = selectedList;

        if (title) {
            dialogEl.find('.modal-title').text(title);
        }
        else {
            dialogEl.find('.modal-title').text('联系人列表');
        }

        if (prompt) {
            dialogEl.find('.tip').text(prompt);
        }
        else {
            dialogEl.find('.tip').text('请选择联系人');
        }

        if (confirmHandle) {
            confirmCallback = confirmHandle;
        }

        var tbody = dialogEl.find('tbody');
        tbody.empty();

        var html = [];

        for (var i = 0; i < list.length; ++i) {
            var contact = list[i];
            var selected = (null != findContact(contact, selectedList));
            var row = [
                '<tr onclick="app.contactListDialog.toggleChecked(', contact.getId(), ')">',
                    '<td>',
                        '<div class="custom-control custom-checkbox">',
                            '<input class="custom-control-input" type="checkbox" data="', contact.getId(), '" id="list_contact_', contact.getId(), '"',
                                selected ? ' checked="checked" disabled="disabled"' : '', '>',
                            '</input>',
                            '<label class="custom-control-label" for="list_contact_', contact.getId(), '">', '</label>',
                        '</div>',
                    '</td>',
                    '<td><img class="table-avatar" src="images/', contact.getContext().avatar, '" /></td>',
                    '<td>', contact.getName(), '</td>',
                    '<td>', contact.getId(), '</td>',
                    '<td>', contact.getContext().region, '</td>',
                    '<td>', contact.getContext().department, '</td>',
                '</tr>'
            ];

            html = html.concat(row);
        }

        tbody.append(html.join(''));

        // tbody
        dialogEl.modal('show');
    }

    /**
     * 隐藏联系人列表对话框。
     */
    ContactListDialog.prototype.hide = function() {
        dialogEl.modal('hide');
        confirmCallback = null;
    }

    /**
     * 开关当前行的选择状态。
     * @param {*} id 
     */
    ContactListDialog.prototype.toggleChecked = function(id) {
        var el = dialogEl.find('input[data="' + id +'"]');
        if (el.prop('checked')) {
            el.prop('checked', false);
        }
        else {
            el.prop('checked', true);
        }
    }

    g.ContactListDialog = ContactListDialog;

})(window);

(function(g) {
    
    var that = null;

    var cube = null;

    var queryNum = 10;

    var elSelectFile = null;

    var colCatalog = null;
    var colContent = null;
    var colSidebar = null;

    var groupSidebar = true;
    var contactSidebar = true;

    /**
     * Notify Event
     * @param {*} event 
     */
    function onMessageNotify(event) {
        that.onNewMessage(event.data);
    }

    /**
     * Sending
     * @param {*} event 
     */
    function onMessageSending(event) {
        var message = event.data;

        // 使用动画效果
        g.app.messagePanel.appendMessage(g.app.messagePanel.current.entity, g.app.getSelf(), message, true, true);

        if (message.isFromGroup()) {
            g.app.messageCatalog.updateItem(message.getSource(), message, message.getRemoteTimestamp());
        }
        else {
            g.app.messageCatalog.updateItem(message.getTo(), message, message.getRemoteTimestamp());
        }
    }

    /**
     * Sent
     * @param {*} event 
     */
    function onMessageSent(event) {
        g.app.messagePanel.changeMessageState(event.data);
    }

    /**
     * Mark Only Owner
     * @param {*} event 
     */
    function onMarkOnlyOwner(event) {
        var message = event.data;
        g.app.messagePanel.appendMessage(message.getReceiver(), g.app.getSelf(), message, true);
    }

    /**
     * Send Blocked
     * @param {*} event 
     */
    function onMessageSendBlocked(event) {
        var message = event.data;
        g.app.messagePanel.changeMessageState(message);

        // 全局笔记
        var note = new LocalNoteMessage('“' + message.getReceiver().getName() + '”在你的“黑名单”里，不能向他发送消息！');
        note.setLevel(3);
        cube.messaging.markLocalOnlyOwner(message.getReceiver(), note);
    }

    /**
     * Receive Blocked
     * @param {*} event 
     */
    function onMessageReceiveBlocked(event) {
        var message = event.data;
        g.app.messagePanel.changeMessageState(message);

        // 全局笔记
        var note = new LocalNoteMessage('“' + message.getReceiver().getName() + '”已拒收你的消息！');
        note.setLevel(3);
        cube.messaging.markLocalOnlyOwner(message.getReceiver(), note);
    }

    /**
     * Fault
     * @param {*} event 
     */
    function onMessageFault(event) {
        var error = event.data;
        var message = error.data;
    }


    /**
     * 消息模块的控制器。
     * @param {Cube} cubeEngine 
     */
    var MessagingController = function(cubeEngine) {
        cube = cubeEngine;
        that = this;

        colCatalog = $('#col_messaging_catalog');
        colContent = $('#col_messaging_content');
        colSidebar = $('#col_messaging_sidebar');
        if (!colSidebar.hasClass('no-display')) {
            colSidebar.addClass('no-display');
        }

        // 监听消息正在发送事件
        cube.messaging.on(MessagingEvent.Sending, onMessageSending);
        // 监听消息已发送事件
        cube.messaging.on(MessagingEvent.Sent, onMessageSent);

        // 监听接收消息事件
        cube.messaging.on(MessagingEvent.Notify, onMessageNotify);

        cube.messaging.on(MessagingEvent.MarkOnlyOwner, onMarkOnlyOwner);

        // 消息被阻止
        cube.messaging.on(MessagingEvent.SendBlocked, onMessageSendBlocked);
        cube.messaging.on(MessagingEvent.ReceiveBlocked, onMessageReceiveBlocked);

        // 发生故障
        cube.messaging.on(MessagingEvent.Fault, onMessageFault);
    }

    /**
     * 更新联系人的消息清单。
     * @param {Contact} contact 
     * @param {funciton} completed
     */
    MessagingController.prototype.updateContactMessages = function(contact, completed) {
        if (contact.getId() == g.app.account.id) {
            // 不查询自己
            return;
        }

        var count = 0;

        var handler = function(message) {
            // 判断自己是否是该消息的发件人
            if (cube.messaging.isSender(message)) {
                g.app.messagePanel.appendMessage(message.getReceiver(), message.getSender(), message, true);
            }
            else {
                g.app.messagePanel.appendMessage(message.getSender(), message.getSender(), message, true);
            }

            --count;
            if (completed && count == 0) {
                completed();
            }
        }

        cube.messaging.queryRecentMessagesWithContact(contact, queryNum, function(id, list) {
            count = list.length;

            if (count == 0) {
                // 没有消息
                if (completed) {
                    completed();
                }
                return;
            }

            var unreadCount = 0;
            for (var i = 0; i < list.length; ++i) {
                var message = list[i];
                handler(message);

                if (!message.isRead()) {
                    ++unreadCount;
                }
            }

            for (var i = list.length - 1; i >= 0; --i) {
                var last = list[i];
                // 更新目录项
                if (g.app.messageCatalog.updateItem(id, last, last.getRemoteTimestamp())) {
                    if (unreadCount > 0) {
                        g.app.messageCatalog.updateBadge(id, unreadCount);
                    }
                    break;
                }
            }
        });
    }

    /**
     * 更新群组的消息。
     * @param {Group} group 
     * @param {funciton} completed
     */
    MessagingController.prototype.updateGroupMessages = function(group, completed) {
        var count = 0;
        var messageList = null;
        var senderMap = new OrderMap();

        var handler = function(group, message) {
            g.app.getContact(message.getFrom(), function(sender) {
                // 记录发件人
                senderMap.put(message.getId(), sender);

                --count;
                if (count == 0) {
                    messageList.forEach(function(msg) {
                        var sender = senderMap.get(msg.getId());
                        // 添加到消息面板
                        g.app.messagePanel.appendMessage(group, sender, msg, true);
                    });

                    messageList = null;
                    senderMap.clear();
                    senderMap = null;

                    if (completed) {
                        completed();
                    }
                }
            });
        }

        cube.messaging.queryRecentMessagesWithGroup(group, queryNum, function(groupId, list) {
            count = list.length;

            if (count == 0) {
                // 没有数据
                if (completed) {
                    completed();
                }
                return;
            }

            messageList = list;

            var unreadCount = 0;
            for (var i = 0; i < list.length; ++i) {
                var message = list[i];
                handler(group, message);

                if (!message.isRead()) {
                    ++unreadCount;
                }
            }

            for (var i = list.length - 1; i >= 0; --i) {
                var last = list[i];
                // 更新目录项
                if (g.app.messageCatalog.updateItem(groupId, last, last.getRemoteTimestamp())) {
                    if (unreadCount > 0) {
                        g.app.messageCatalog.updateBadge(groupId, unreadCount);
                    }
                    break;
                }
            }
        });
    }

    /**
     * 更新联系人在 UI 里的信息。
     * @param {Contact} contact 
     */
    MessagingController.prototype.updateContact = function(contact) {
        g.app.messagePanel.updatePanel(contact.getId(), contact);
        g.app.messageCatalog.updateItem(contact, null, null,
            contact.getAppendix().hasRemarkName() ? contact.getAppendix().getRemarkName() : contact.getName());
        g.app.messageSidebar.update(group);
    }

    /**
     * 更新群组在 UI 里的信息。
     * @param {Group} group 
     */
    MessagingController.prototype.updateGroup = function(group) {
        g.app.messagePanel.updatePanel(group.getId(), group);
        g.app.messageCatalog.updateItem(group, null, null, group.getName());
        g.app.messageSidebar.update(group);
    }

    /**
     * 显示选择文件界面。
     * @param {*} el 
     */
    MessagingController.prototype.selectFile = function(el) {
        if (null == elSelectFile) {
            elSelectFile = el;
            elSelectFile.on('change', function(e) {
                var file = e.target.files[0];
                that.fireSend(g.app.messagePanel.current.entity, file);
            });
        }

        elSelectFile.click();
    }

    /**
     * 触发发送消息。
     * @param {Contact|Group} target 接收消息的对象。
     * @param {string|File} content 消息内容。
     * @returns {Message} 返回消息对象实例。
     */
    MessagingController.prototype.fireSend = function(target, content) {
        // 验证目标
        if (target instanceof Group) {
            if (target.getState() != GroupState.Normal) {
                return null;
            }
        }

        var message = null;

        if (typeof content === 'string') {
            message = new HyperTextMessage(content);// new TextMessage(content);
        }
        else if (content instanceof File) {
            var type = content.type;
            if (type.indexOf('image') >= 0) {
                message = new ImageMessage(content);
            }
            else {
                message = new FileMessage(content);
            }
        }
        else {
            g.dialog.launchToast(Toast.Warning, '程序内部错误');
            return null;
        }

        message = cube.messaging.sendTo(target, message);
        return message;
    }

    /**
     * 切换消息面板。
     * @param {number} id 切换消息面板的目标 ID 。
     */
    MessagingController.prototype.toggle = function(id) {
        if (id == g.app.account.id) {
            return;
        }

        var handle = function(item) {
            if (null == item) {
                return;
            }

            g.app.messagePanel.changePanel(id, item);
            g.app.messageCatalog.activeItem(id);
            g.app.messageCatalog.updateBadge(id, 0);
        }

        g.app.getGroup(id, function(group) {
            if (null == group) {
                g.app.getContact(id, function(contact) {
                    handle(contact);
                    g.app.messageSidebar.update(contact);
                    if (contactSidebar) {
                        that.showSidebar();
                    }
                    else {
                        that.hideSidebar();
                    }
                });
            }
            else {
                handle(group);
                g.app.messageSidebar.update(group);
                if (groupSidebar) {
                    that.showSidebar();
                }
                else {
                    that.hideSidebar();
                }
            }
        });
    }

    /**
     * 开关侧边栏。
     */
    MessagingController.prototype.toggleSidebar = function() {
        if (colSidebar.hasClass('no-display')) {
            this.showSidebar();

            if (g.app.messagePanel.getCurrentPanel().groupable) {
                groupSidebar = true;
            }
            else {
                contactSidebar = true;
            }
        }
        else {
            this.hideSidebar();

            if (g.app.messagePanel.getCurrentPanel().groupable) {
                groupSidebar = false;
            }
            else {
                contactSidebar = false;
            }
        }
    }

    /**
     * 显示侧边栏。
     */
    MessagingController.prototype.showSidebar = function() {
        if (!colSidebar.hasClass('no-display')) {
            return;
        }

        colContent.removeClass('col-md-9');
        colContent.removeClass('col-sm-10');
        colContent.addClass('col-md-6');
        colContent.addClass('col-sm-6');
        colSidebar.removeClass('no-display');
    }

    /**
     * 隐藏侧边栏。
     */
    MessagingController.prototype.hideSidebar = function() {
        if (colSidebar.hasClass('no-display')) {
            return;
        }

        colContent.removeClass('col-md-6');
        colContent.removeClass('col-sm-6');
        colContent.addClass('col-md-9');
        colContent.addClass('col-sm-10');
        colSidebar.addClass('no-display');
    }

    MessagingController.prototype.showGroupMember = function() {
        // TODO
    }

    /**
     * 撤回消息。
     * @param {Contact|Group} entity 当前操作对应的联系人或群组。
     * @param {number} id 待撤回消息的 ID 。
     */
    MessagingController.prototype.recallMessage = function(entity, id) {
        cube.messaging.recallMessage(id, function(message) {
            // TODO xjw
            g.app.messagePanel.appendNote(entity, '消息已撤回 ' + g.formatFullTime(Date.now()));

            g.app.messagePanel.removeMessage(entity, message);
        }, function(error) {
            g.dialog.launchToast(Toast.Error,
                (error.code == MessagingServiceState.DataTimeout) ? '消息发送超过2分钟，不能撤回' : '撤回消息失败');
            console.log('撤回消息失败 - ' + error);
        })
    }

    /**
     * 删除消息。
     * @param {Contact|Group} entity 当前操作对应的联系人或群组。
     * @param {number} id 待删除消息的 ID 。
     */
    MessagingController.prototype.deleteMessage = function(entity, id) {
        cube.messaging.deleteMessage(id, function(message) {
            g.dialog.launchToast(Toast.Success, '消息已删除');
            g.app.messagePanel.removeMessage(entity, message);
        }, function(error) {
            g.dialog.launchToast(Toast.Error, '删除消息失败');
            console.log('删除消息失败 - ' + error);
        });
    }

    /**
     * 在消息面板前插入指定 ID 面板的之前消息。
     * @param {number} id 目标面板 ID 。
     */
    MessagingController.prototype.prependMore = function(id) {
        var panel = g.app.messagePanel.getPanel(id);
        var timestamp = (panel.messageTimes.length == 0) ? Date.now() : panel.messageTimes[0] - 1;

        // 计数
        var count = queryNum;

        if (panel.groupable) {
            cube.messaging.reverseIterateMessageWithGroup(id, timestamp, function(groupId, message) {
                // 添加消息
                g.app.messagePanel.appendMessage(panel.entity, message.getSender(), message, false);

                --count;
                if (count == 0) {
                    return false;
                }
                else {
                    return true;
                }
            }, function() {
                if (count == queryNum) {
                    g.dialog.launchToast(Toast.Info, '没有更多消息了');
                }
            });
        }
        else {
            cube.messaging.reverseIterateMessageWithContact(id, timestamp, function(contactId, message) {
                // 添加消息
                g.app.messagePanel.appendMessage(panel.entity, message.getSender(), message, false);

                --count;
                if (count == 0) {
                    return false;
                }
                else {
                    return true;
                }
            }, function() {
                if (count == queryNum) {
                    g.dialog.launchToast(Toast.Info, '没有更多消息了');
                }
            });
        }
    }

    /**
     * 打开语音通话界面。
     * @param {Contact|Group} target 通话对象。
     */
    MessagingController.prototype.openVoiceCall = function(target) {
        if (target instanceof Group) {
            g.app.callCtrl.launchGroupCall(target);
        }
        else {
            g.app.callCtrl.callContact(target);
        }
    }

    /**
     * 打开视频通话界面。
     * @param {Contact|Group} target 通话对象。
     */
    MessagingController.prototype.openVideoChat = function(target) {
        if (target instanceof Group) {
            g.app.callCtrl.launchGroupCall(target, true);
        }
        else {
            g.app.callCtrl.callContact(target, true);
        }
    }

    /**
     * 从 Cube 收到新消息时回调该方法。
     * @param {Message} message 收到的消息。
     */
    MessagingController.prototype.onNewMessage = function(message) {
        // 判断消息是否来自群组
        if (message.isFromGroup()) {
            // 更新消息面板
            if (g.app.messagePanel.hasPanel(message.getSourceGroup())) {
                g.app.messagePanel.appendMessage(message.getSourceGroup(), message.getSender(), message);
            }
            else {
                that.updateGroupMessages(message.getSourceGroup(), function() {
                    g.app.messagePanel.appendMessage(message.getSourceGroup(), message.getSender(), message, false);
                });
            }

            // 更新消息目录
            var result = g.app.messageCatalog.updateItem(message.getSourceGroup(), message, message.getRemoteTimestamp());
            if (!result) {
                console.debug('#onNewMessage - update catalog item failed');
            }

            that.updateUnread(message.getSource(), message);
        }
        else {
            // 消息来自联系人

            if (g.app.account.id == message.getFrom()) {
                // 从“我”的其他终端发送的消息
                // 更新消息面板
                if (g.app.messagePanel.hasPanel(message.getReceiver())) {
                    g.app.messagePanel.appendMessage(message.getReceiver(), message.getSender(), message);
                }
                else {
                    that.updateContactMessages(message.getReceiver(), function() {
                        g.app.messagePanel.appendMessage(message.getReceiver(), message.getSender(), message, false);
                    });
                }

                // 更新消息目录
                g.app.messageCatalog.updateItem(message.getReceiver(), message, message.getRemoteTimestamp());

                that.updateUnread(message.getTo(), message);
            }
            else {
                // 更新消息面板
                if (g.app.messagePanel.hasPanel(message.getSender())) {
                    g.app.messagePanel.appendMessage(message.getSender(), message.getSender(), message, false);
                }
                else {
                    that.updateContactMessages(message.getSender(), function() {
                        g.app.messagePanel.appendMessage(message.getSender(), message.getSender(), message, false);
                    });
                }

                // 更新消息目录
                g.app.messageCatalog.updateItem(message.getSender(), message, message.getRemoteTimestamp());

                that.updateUnread(message.getFrom(), message);
            }
        }
    }

    /**
     * 更新未读消息状态。
     * @param {number} id 
     * @param {Message} message 
     */
    MessagingController.prototype.updateUnread = function(id, message) {
        if (message.isRead()) {
            return;
        }

        var panel = g.app.messagePanel.getCurrentPanel();
        if (null != panel && panel.id == id) {
            // 将新消息标记为已读
            cube.messaging.markRead(message);
            return;
        }

        panel = g.app.messagePanel.getPanel(id);
        if (undefined !== panel && panel.unreadCount > 0) {
            g.app.messageCatalog.updateBadge(id, panel.unreadCount);
        }
    }

    /**
     * 修改群组名称。
     * @param {Group} group 
     * @param {string} newName 
     * @param {funciton} handle 
     */
    MessagingController.prototype.modifyGroupName = function(group, newName, handle) {
        group.modifyName(newName, function(group) {
            g.dialog.launchToast(Toast.Success, '已修改群组名称');
            if (handle) {
                handle(group);
            }
        }, function(error) {
            g.dialog.launchToast(Toast.Warning, '修改群名称失败: ' + error.code);
        });
    }

    /**
     * 从界面上移除群组。
     * @param {Group} group 
     */
    MessagingController.prototype.removeGroup = function(group) {
        g.app.messageCatalog.removeItem(group);
        g.app.messagePanel.clearPanel(group.getId());
        this.hideSidebar();

        // 从列表里删除
        cube.messaging.deleteRecentMessager(group);
    }

    /**
     * 从界面上移除联系人。
     * @param {Group} group 
     */
     MessagingController.prototype.removeContact = function(contact) {
        g.app.messageCatalog.removeItem(contact);
        g.app.messagePanel.clearPanel(contact.getId());
        this.hideSidebar();

        // 从列表里删除
        cube.messaging.deleteRecentMessager(contact);
    }

    g.MessagingController = MessagingController;

})(window);

(function(g) {
    
    var cube = null;

    var that = null;

    var selectMediaDeviceEl = null;
    var selectMediaDeviceCallback = null;
    var selectVideoDevice = false;
    var selectVideoData = [];

    var working = false;

    var voiceCall = false;
    var groupCall = false;

    var volume = 0.7;


    function onNewCall(event) {
        var record = event.data;
        var caller = record.getCaller();
        if (null == caller) {
            return;
        }

        // 显示有新通话邀请
        if (record.callerMediaConstraint.videoEnabled) {
            // 主叫使用视频呼叫
            voiceCall = false;
            working = true;
            g.app.videoChatPanel.openNewCallToast(caller);
        }
        else {
            // 主叫使用语音呼叫
            voiceCall = true;
            working = true;
            g.app.voiceCallPanel.openNewCallToast(caller);
        }
    }

    function onInProgress(event) {
        console.log('#onInProgress');
    }

    function onRinging(event) {
        if (groupCall) {
            if (voiceCall) {
                g.app.voiceGroupCallPanel.tipWaitForAnswer(event.data);
            }
            else {
                g.app.videoGroupChatPanel.tipWaitForAnswer(event.data);
            }
        }
        else {
            if (voiceCall) {
                g.app.voiceCallPanel.tipWaitForAnswer(event.data.getCallee());
            }
            else {
                g.app.videoChatPanel.tipWaitForAnswer(event.data.getCallee());
            }
        }
    }

    function onConnected(event) {
        if (groupCall) {
            if (voiceCall) {
                g.app.voiceGroupCallPanel.tipConnected(event.data);
            }
            else {
                g.app.videoGroupChatPanel.tipConnected(event.data);
            }
        }
        else {
            if (voiceCall) {
                g.app.voiceCallPanel.tipConnected();
            }
            else {
                g.app.videoChatPanel.tipConnected();
            }
        }
    }

    function onMediaConnected(event) {
        console.log('#onMediaConnected');
    }

    function onMediaDisconnected(event) {
        console.log('#onMediaDisconnected');
    }

    function onBye(event) {
        var record = event.data;
        working = false;

        // console.log('DEBUG - ' + record.getCaller().getId() + ' -> ' + record.getCallee().getId());

        if (groupCall) {
            if (voiceCall) {
                g.app.voiceGroupCallPanel.close();

                g.dialog.launchToast(Toast.Info, '群组语音通话已结束');
            }
            else {
                g.app.videoGroupChatPanel.close();

                g.dialog.launchToast(Toast.Info, '群组视频通话已结束');
            }
        }
        else {
            if (voiceCall) {
                g.app.voiceCallPanel.close();

                if (record.isCaller()) {
                    var recordMessage = new CallRecordMessage(record);
                    cube.messaging.sendTo(record.getCallee(), recordMessage);
                }
            }
            else {
                g.app.videoChatPanel.close();
    
                if (record.isCaller()) {
                    var recordMessage = new CallRecordMessage(record);
                    cube.messaging.sendTo(record.getCallee(), recordMessage);
                }
            }

            var duration = record.getDuration();
            var log = duration > 1000 ? '通话结束 - ' + g.formatClockTick(parseInt(duration / 1000)) : '通话结束';
            console.log(log);

            g.dialog.launchToast(Toast.Info, log);
        }
    }

    function onBusy(event) {
        var record = event.data;
        working = false;

        var log = null;
        if (record.isCaller()) {
            log = '被叫忙，拒绝通话';
        }
        else {
            log = '已拒绝通话邀请';
        }
        console.log(log);
        g.dialog.launchToast(Toast.Info, log);

        if (voiceCall) {
            g.app.voiceCallPanel.close();
            g.app.voiceCallPanel.closeNewCallToast();
        }
        else {
            g.app.videoChatPanel.close();
            g.app.videoChatPanel.closeNewCallToast();
        }
    }

    function onTimeout(event) {
        if (groupCall) {

        }
        else {
            if (voiceCall) {
                g.app.voiceCallPanel.close();
                g.app.voiceCallPanel.closeNewCallToast();
            }
            else {
                g.app.videoChatPanel.close();
                g.app.videoChatPanel.closeNewCallToast();
            }
    
            if (event.data.isCaller()) {
                g.dialog.launchToast(Toast.Info, '对方无应答');
            }
        }
    }

    function onCallFailed(event) {
        var error = event.data;
        working = false;
        console.log('onCallFailed - ' + error);

        if (error.code == CallState.MediaPermissionDenied) {
            if (voiceCall) {
                g.dialog.launchToast(Toast.Warning, '未能获得麦克风使用权限');
            }
            else {
                g.dialog.launchToast(Toast.Warning, '未能获得摄像头/麦克风使用权限');
            }
        }
        else if (error.code == CallState.BeCallerBlocked) {
            // 对方在自己的黑名单里
            g.dialog.showAlert('你已经把“' + error.data.field.callee.getName() + '”添加到黑名单里，不能邀请他通话！');
        }
        else if (error.code == CallState.BeCalleeBlocked) {
            // 自己在对方的黑名单里
            g.dialog.showAlert('“' + error.data.field.callee.getName() + '”已经阻止了你的通话邀请！');
        }
        else {
            g.dialog.launchToast(Toast.Warning, '通话失败，故障码：' + error.code);
        }

        setTimeout(function() {
            if (groupCall) {
                console.log('#onCallFailed: ' + error.code);
            }
            else {
                if (voiceCall) {
                    g.app.voiceCallPanel.close();
                    g.app.voiceCallPanel.closeNewCallToast();
                }
                else {
                    g.app.videoChatPanel.close();
                    g.app.videoChatPanel.closeNewCallToast();
                }
            }
        }, 500);
    }

    /**
     * 通话控制器。
     * @param {Cube} cubeEngine 
     */
    var CallController = function(cubeEngine) {
        that = this;

        cube = cubeEngine;

        cube.mpComm.on(CallEvent.InProgress, onInProgress);
        cube.mpComm.on(CallEvent.Ringing, onRinging);
        cube.mpComm.on(CallEvent.NewCall, onNewCall);
        cube.mpComm.on(CallEvent.Connected, onConnected);
        cube.mpComm.on(CallEvent.Bye, onBye);
        cube.mpComm.on(CallEvent.Busy, onBusy);
        cube.mpComm.on(CallEvent.Timeout, onTimeout);
        cube.mpComm.on(CallEvent.CallFailed, onCallFailed);
        cube.mpComm.on(CallEvent.MediaConnected, onMediaConnected);
        cube.mpComm.on(CallEvent.MediaDisconnected, onMediaDisconnected);
    }

    /**
     * 显示选择设备对话框。
     * @param {Array} list 
     * @param {function} callback 
     */
    CallController.prototype.showSelectMediaDevice = function(list, callback) {
        // 记录 Callback
        selectMediaDeviceCallback = callback;
        if (list[0].isVideoInput()) {
            selectVideoDevice = true;
        }
        else {
            selectVideoDevice = false;
        }

        if (null == selectMediaDeviceEl) {
            var el = $('#select_media_device');

            el.find('button[data-target="cancel"]').click(function() {
                selectMediaDeviceCallback(false);
            });

            el.find('button[data-target="confirm"]').click(function() {
                var queryString = selectVideoDevice ? 'input:radio[name="VideoDevice"]:checked' : 'input:radio[name="AudioDevice"]:checked';
                var data = selectMediaDeviceEl.find(queryString).attr('data');
                selectMediaDeviceCallback(true, parseInt(data));
            });

            el.on('hide.bs.modal', function() {
                if (selectVideoData.length > 0) {
                    for (var i = 0; i < selectVideoData.length; ++i) {
                        var value = selectVideoData[i];
                        // 停止采集流
                        MediaDeviceTool.stopStream(value.stream, value.videoEl);
                    }
                    selectVideoData.splice(0, selectVideoData.length);
                }
            });

            selectMediaDeviceEl = el;
        }

        if (selectVideoDevice) {
            // 调整大小
            var el = selectMediaDeviceEl.find('.modal-dialog');
            if (!el.hasClass('modal-lg')) {
                el.addClass('modal-lg');
            }
            // 隐藏音频设备选择
            selectMediaDeviceEl.find('div[data-target="audio"]').css('display', 'none');

            var videoEl = selectMediaDeviceEl.find('div[data-target="video"]');
            videoEl.css('display', 'flex');
            // 隐藏选项
            videoEl.find('.col-6').css('display', 'none');

            for (var i = 0; i < list.length; ++i) {
                var value = list[i];
                var item = videoEl.find('div[data-target="video-' + i + '"]');
                item.find('label').text(value.label);

                // 将摄像机数据加载到视频标签
                MediaDeviceTool.loadVideoDeviceStream(item.find('video')[0], value, false, function(videoEl, deviceDesc, stream) {
                    selectVideoData.push({
                        videoEl: videoEl,
                        device: deviceDesc,
                        stream: stream,
                    });
                }, function(error) {
                    console.log(error);
                });

                item.css('display', 'block');
            }
        }
        else {
            // 调整大小
            selectMediaDeviceEl.find('.modal-dialog').removeClass('modal-lg');
            // 隐藏视频选择
            selectMediaDeviceEl.find('div[data-target="video"]').css('display', 'none');

            var audioEl = selectMediaDeviceEl.find('div[data-target="audio"]');
            audioEl.css('display', 'block');
            // 隐藏选项
            audioEl.find('.custom-radio').css('display', 'none');

            for (var i = 0; i < list.length; ++i) {
                var value = list[i];
                var item = audioEl.find('div[data-target="audio-' + i + '"]');
                item.find('label').text(value.label);
                item.css('display', 'block');
            }
        }

        selectMediaDeviceEl.modal('show');
    }

    /**
     * 邀请指定联系人通话。
     * @param {Contact} contact 
     * @param {boolean} [video] 
     */
    CallController.prototype.callContact = function(contact, video) {
        groupCall = false;

        cube.contact.queryBlockList(function(list) {
            if (list.indexOf(contact.getId()) >= 0) {
                g.dialog.showAlert('你已经把“' + contact.getName() + '”添加到黑名单里，不能邀请他通话！');
                return;
            }

            if (video) {
                g.app.videoChatPanel.makeCall(contact);
            }
            else {
                g.app.voiceCallPanel.makeCall(contact);
            }
        });
    }

    /**
     * 发起群组通话
     * @param {Group} group 
     * @param {boolean} video 
     */
    CallController.prototype.launchGroupCall = function(group, video) {
        if (group.getState() != GroupState.Normal) {
            g.dialog.showAlert('群组“' + group.getName() + '”已不存在！');
            return;
        }

        groupCall = true;

        if (video) {
            g.app.videoGroupChatPanel.makeCall(group);
        }
        else {
            g.app.voiceGroupCallPanel.makeCall(group);
        }
    }

    /**
     * 发起通话请求。
     * @param {Contact|Group} target 
     * @param {boolean} videoEnabled 
     * @param {MediaDeviceDescription} device
     * @param {function} [callback]
     */
    CallController.prototype.makeCall = function(target, videoEnabled, device, callback) {
        if (working) {
            return false;
        }

        working = true;
        voiceCall = !videoEnabled;

        // 媒体约束
        var mediaConstraint = new MediaConstraint(videoEnabled, true);

        if (target instanceof Contact) {
            if (videoEnabled) {
                // 设置媒体容器
                cube.mpComm.setRemoteVideoElement(g.app.videoChatPanel.remoteVideo);
                cube.mpComm.setLocalVideoElement(g.app.videoChatPanel.localVideo);

                if (device) {
                    mediaConstraint.setVideoDevice(device);
                }
            }
            else {
                // 设置媒体容器
                cube.mpComm.setRemoteVideoElement(g.app.voiceCallPanel.remoteVideo);
                cube.mpComm.setLocalVideoElement(g.app.voiceCallPanel.localVideo);

                if (device) {
                    mediaConstraint.setAudioDevice(device);
                }
            }

            // 发起通话
            return cube.mpComm.makeCall(target, mediaConstraint, callback);
        }
        else if (target instanceof Group) {
            if (videoEnabled) {
                mediaConstraint.setVideoDimension(VideoDimension.QVGA);

                cube.mpComm.setLocalVideoElement(g.app.videoGroupChatPanel.localVideo);
            }
            else {
                cube.mpComm.setLocalVideoElement(g.app.voiceGroupCallPanel.localVideo);
            }

            // 发起通话
            return cube.mpComm.makeCall(target, mediaConstraint, callback);
        }
        else {
            return false;
        }
    }

    /**
     * 应答通话请求。
     */
    CallController.prototype.answerCall = function() {
        if (!working) {
            return false;
        }

        if (voiceCall) {
            g.app.voiceCallPanel.closeNewCallToast();

            // 设置媒体容器
            cube.mpComm.setRemoteVideoElement(g.app.voiceCallPanel.remoteVideo);
            cube.mpComm.setLocalVideoElement(g.app.voiceCallPanel.localVideo);

            // 只使用音频通道
            var mediaConstraint = new MediaConstraint(false, true);
            if (cube.mpComm.answerCall(mediaConstraint)) {
                g.app.voiceCallPanel.showAnswer(cube.mpComm.getActiveRecord().getCaller());
                return true;
            }
        }
        else {
            g.app.videoChatPanel.closeNewCallToast();

            // 设置媒体容器
            cube.mpComm.setRemoteVideoElement(g.app.videoChatPanel.remoteVideo);
            cube.mpComm.setLocalVideoElement(g.app.videoChatPanel.localVideo);

            // 只使用音频通道
            var mediaConstraint = new MediaConstraint(true, true);
            if (cube.mpComm.answerCall(mediaConstraint)) {
                g.app.videoChatPanel.showAnswer(cube.mpComm.getActiveRecord().getCaller());
                return true;
            }
        }

        return false;
    }

    /**
     * 挂断通话或拒绝通话请求。
     */
    CallController.prototype.hangupCall = function() {
        if (!working) {
            return false;
        }

        working = false;

        if (!cube.mpComm.hangupCall()) {
            console.log('CallController 终止通话时发生错误。');
        }

        if (groupCall) {
            if (voiceCall) {
                g.app.voiceGroupCallPanel.close();
            }
            else {
                g.app.videoGroupChatPanel.close();
            }
        }
        else {
            if (voiceCall) {
                g.app.voiceCallPanel.close();
                g.app.voiceCallPanel.closeNewCallToast();
            }
            else {
                g.app.videoChatPanel.close();
                g.app.videoChatPanel.closeNewCallToast();
            }
        }

        return true;
    }

    /**
     * 是否开启了摄像机。
     * @returns {boolean}
     */
    CallController.prototype.isCameraOpened = function() {
        var field = g.cube().mpComm.getActiveField();
        if (null == field) {
            return false;
        }

        var rtcDevice = field.getRTCDevice();
        if (null == rtcDevice) {
            return false;
        }

        return rtcDevice.outboundVideoEnabled();
    }

    /**
     * 开关摄像机设备。
     */
    CallController.prototype.toggleCamera = function() {
        var field = cube.mpComm.getActiveField();
        if (null == field) {
            console.debug('CallController - #toggleCamera() field is null');
            return true;
        }

        var rtcDevice = field.getRTCDevice();
        if (null == rtcDevice) {
            console.debug('CallController - #toggleCamera() rtcDevice is null');
            return true;
        }

        if (rtcDevice.outboundVideoEnabled()) {
            rtcDevice.enableOutboundVideo(false);
        }
        else {
            rtcDevice.enableOutboundVideo(true);
        }
        return rtcDevice.outboundVideoEnabled();
    }

    /**
     * 麦克风是否已开启。
     * @returns {boolean}
     */
    CallController.prototype.isMicrophoneOpened = function() {
        var field = g.cube().mpComm.getActiveField();
        if (null == field) {
            return false;
        }

        var rtcDevice = field.getRTCDevice();
        if (null == rtcDevice) {
            return false;
        }

        return rtcDevice.outboundAudioEnabled();
    }

    /**
     * 开关麦克风设备。
     */
    CallController.prototype.toggleMicrophone = function() {
        var field = cube.mpComm.getActiveField();
        if (null == field) {
            console.debug('CallController - #toggleMicrophone() field is null');
            return true;
        }

        var rtcDevice = field.getRTCDevice();
        if (null == rtcDevice) {
            console.debug('CallController - #toggleMicrophone() rtcDevice is null');
            return true;
        }

        if (rtcDevice.outboundAudioEnabled()) {
            rtcDevice.enableOutboundAudio(false);
        }
        else {
            rtcDevice.enableOutboundAudio(true);
        }
        return rtcDevice.outboundAudioEnabled();
    }

    /**
     * 扬声器是否未静音。
     * @returns {boolean}
     */
    CallController.prototype.isUnmuted = function() {
        var field = g.cube().mpComm.getActiveField();
        if (null == field) {
            return false;
        }

        var rtcDevice = field.getRTCDevice();
        if (null == rtcDevice) {
            return false;
        }

        var vol = rtcDevice.getVolume();
        return (vol > 0);
    }

    /**
     * 开关扬声器设备。
     */
    CallController.prototype.toggleLoudspeaker = function() {
        var field = cube.mpComm.getActiveField();
        if (null == field) {
            console.debug('CallController - #toggleLoudspeaker() field is null');
            return true;
        }

        var rtcDevice = field.getRTCDevice();
        if (null == rtcDevice) {
            console.debug('CallController - #toggleLoudspeaker() rtcDevice is null');
            return true;
        }

        var vol = rtcDevice.getVolume();
        console.debug('CallController - #toggleLoudspeaker() volume is ' + vol);
        if (vol > 0) {
            volume = vol;
            rtcDevice.setVolume(0);
            return false;
        }
        else {
            rtcDevice.setVolume(volume);
            return true;
        }
    }

    CallController.prototype.makeGroupCall = function(target, inviteeList) {

    }

    g.CallController = CallController;

})(window);

(function(g) {
    'use strict'

    var that = null;

    var catalogEl = null;
    var transEl = null;

    var btnAllFiles = null;
    var btnImageFiles = null;
    var btnDocFiles = null;
    var btnRecyclebin = null;

    var btnUploading = null;
    var btnDownloading = null;
    var btnComplete = null;

    var activeBtn = null;

    /**
     * 我的文件主界面的引导目录。
     * @param {jQuery} catalog 主目录元素。
     * @param {jQuery} trans 传输列表元素。
     */
    var FilesCatalogue = function(catalog, trans) {
        catalogEl = catalog;
        transEl = trans;

        btnAllFiles = catalogEl.find('#btn_all_files');
        btnImageFiles = catalogEl.find('#btn_image_files');
        btnDocFiles = catalogEl.find('#btn_doc_files');
        btnRecyclebin = catalogEl.find('#btn_recyclebin');

        btnUploading = transEl.find('#btn_trans_upload');
        btnDownloading = transEl.find('#btn_trans_download');
        btnComplete = transEl.find('#btn_trans_complete');

        activeBtn = btnAllFiles;

        that = this;
    }

    /**
     * 初始化控件数据。
     */
    FilesCatalogue.prototype.prepare = function() {
        g.app.filesPanel.showRoot();

        btnAllFiles.click(function() {
            that.select($(this).attr('id'));
        });
        btnImageFiles.click(function() {
            that.select($(this).attr('id'));
        });
        btnDocFiles.click(function() {
            that.select($(this).attr('id'));
        });
        btnRecyclebin.click(function() {
            that.select($(this).attr('id'));
        });
    }

    /**
     * 选择指定目录ID对应的数据进行显示。
     * @param {string} id 目录ID 。
     */
    FilesCatalogue.prototype.select = function(id) {
        if (activeBtn.attr('id') == id) {
            return;
        }

        activeBtn.removeClass('active');

        if (btnAllFiles.attr('id') == id) {
            activeBtn = btnAllFiles;
            g.app.filesPanel.showRoot();
        }
        else if (btnImageFiles.attr('id') == id) {
            activeBtn = btnImageFiles;
            g.app.filesPanel.showImages();
        }
        else if (btnDocFiles.attr('id') == id) {
            activeBtn = btnDocFiles;
            g.app.filesPanel.showDocuments();
        }
        else if (btnRecyclebin.attr('id') == id) {
            activeBtn = btnRecyclebin;
            g.app.filesPanel.showRecyclebin();
        }

        activeBtn.addClass('active');

        // 更新面板
        g.app.filesPanel.setTitle(activeBtn.attr('title'));
    }

    g.FilesCatalogue = FilesCatalogue;

})(window);

(function(g) {
    'use strict'

    var tableEl = null;
    var noFileBg = null;
    var surface = null;
    var surfaceA = null;
    var surfaceB = null;

    /**
     * 生成文件夹的行界面。
     * @param {*} folder 
     * @param {*} extended 
     */
    function makeFolderRow(folder, extended) {
        var id = folder.getId();
        var name = folder.getName();
        var time = folder.getLastModified();
        if (extended) {
            name = name + ' （于 ' + g.formatYMDHMS(folder.getTrashTimestamp()) + '）';
        }

        return [
            '<tr onclick="app.filesPanel.toggleSelect(\'', id, '\')"',
                    ' ondblclick="app.filesPanel.changeDirectory(\'', id, '\')" id="ftr_', id, '">',
                '<td><div class="icheck-primary">',
                    '<input type="checkbox" data-type="folder" id="', id, '">',
                        '<label for="', id, '"></label></div></td>',
                '<td class="file-icon"><i class="ci ci-file-directory"></i></td>',
                '<td class="file-name"><a href="javascript:app.filesPanel.changeDirectory(\'', id, '\');">', name, '</a></td>',
                '<td class="file-size">--</td>',
                '<td class="file-lastmodifed">', g.formatYMDHMS(time), '</td>',
            '</tr>'
        ];
    }

    /**
     * 生成文件的行界面。
     * @param {*} fileLabel 
     * @param {*} extended 
     */
    function makeFileRow(fileLabel, extended) {
        var name = fileLabel.getFileName();
        if (extended) {
            name = name + ' （于 ' + g.formatYMDHMS(fileLabel.getTrashTimestamp()) + '）';
        }

        var id = fileLabel.getId();
        return [
            '<tr onclick="app.filesPanel.toggleSelect(\'', id, '\')"',
                    ' ondblclick="app.filesPanel.openFileDetails(\'', fileLabel.getFileCode(), '\')"', ' id="ftr_', id, '">',
                '<td><div class="icheck-primary">',
                    '<input type="checkbox" data-type="file" id="', id, '">',
                        '<label for="', id, '"></label></div></td>',
                '<td class="file-icon">', matchFileIcon(fileLabel), '</td>',
                '<td class="file-name"><a href="javascript:app.filesPanel.openFile(\'', fileLabel.getFileCode(), '\');">', name, '</a></td>',
                '<td class="file-size">', g.formatSize(fileLabel.getFileSize()), '</td>',
                '<td class="file-lastmodifed">', g.formatYMDHMS(fileLabel.getLastModified()), '</td>',
            '</tr>'
        ];
    }

    /**
     * 生成搜索结构的行界面。
     * @param {*} item 
     */
    function makeSearchItemRow(item) {
        var fileLabel = item.file;
        var directory = item.directory;
        var dirName = directory.getName();
        if (dirName == 'root') {
            dirName = '/';
        }

        var id = fileLabel.getId();
        return [
            '<tr onclick="app.filesPanel.toggleSelect(\'', id, '\')" id="ftr_', id, '">',
                '<td><div class="icheck-primary">',
                    '<input type="checkbox" data-type="file" id="', id, '">',
                        '<label for="', id, '"></label></div></td>',
                '<td class="file-icon">', matchFileIcon(fileLabel), '</td>',
                '<td class="file-name"><a href="javascript:app.filesPanel.openFile(\'', fileLabel.getFileCode(), '\',\'',
                    directory.getId() , '\');">',
                        fileLabel.getFileName(), '</a>', '<span class="desc">所在目录: ', dirName, '</span>',
                '</td>',
                '<td class="file-size">', g.formatSize(fileLabel.getFileSize()), '</td>',
                '<td class="file-lastmodifed">', g.formatYMDHMS(fileLabel.getLastModified()), '</td>',
            '</tr>'
        ];
    }

    /**
     * 根据文件类型匹配文件图标。
     * @param {FileLabel} fileLabel 
     * @returns {string}
     */
    function matchFileIcon(fileLabel) {
        var type = fileLabel.getFileType();
        if (type == 'png' || type == 'jpeg' || type == 'gif' || type == 'jpg' || type == 'bmp') {
            return '<i class="ci ci-file-image"></i>';
        }
        else if (type == 'xls' || type == 'xlsx') {
            return '<i class="ci ci-file-excel"></i>';
        }
        else if (type == 'ppt' || type == 'pptx') {
            return '<i class="ci ci-file-powerpoint"></i>';
        }
        else if (type == 'doc' || type == 'docx') {
            return '<i class="ci ci-file-word"></i>';
        }
        else if (type == 'mp3' || type == 'ogg' || type == 'wav') {
            return '<i class="ci ci-file-music"></i>';
        }
        else if (type == 'pdf') {
            return '<i class="ci ci-file-pdf"></i>';
        }
        else if (type == 'rar') {
            return '<i class="ci ci-file-rar"></i>';
        }
        else if (type == 'zip' || type == 'gz') {
            return '<i class="ci ci-file-zip"></i>';
        }
        else if (type == 'txt' || type == 'log') {
            return '<i class="ci ci-file-text"></i>';
        }
        else if (type == 'mp4' || type == 'mkv' || type == 'avi' || type == 'ts') {
            return '<i class="ci ci-file-video"></i>';
        }
        else if (type == 'psd') {
            return '<i class="ci ci-file-psd"></i>';
        }
        else if (type == 'exe' || type == 'dll') {
            return '<i class="ci ci-file-windows"></i>';
        }
        else if (type == 'apk') {
            return '<i class="ci ci-file-apk"></i>';
        }
        else if (type == 'dmg') {
            return '<i class="ci ci-file-dmg"></i>';
        }
        else if (type == 'ipa') {
            return '<i class="ci ci-file-ipa"></i>';
        }
        else {
            return '<i class="fa fa-file-alt ci-fa-file"></i>';    //'<i class="ci ci-file-unknown"></i>';
        }
    }


    /**
     * 文件表格。
     * @param {jQuery} el 
     */
    var FilesTable = function(el) {
        tableEl = el;
        noFileBg = $('#table_files_nofile');
        surfaceA = el.find('tbody[data-target="surface-a"]');
        surfaceB = el.find('tbody[data-target="surface-b"]');
        surface = surfaceA;
    }

    /**
     * 更新表格数据。
     * @param {Array} list 数据列表。
     * @param {boolean} [extended] 是否在文件名后附加目录信息。
     */
    FilesTable.prototype.updatePage = function(list, extended) {
        if (list.length == 0) {
            surface[0].innerHTML = '';
            noFileBg.css('display', 'block');
            return;
        }

        var html = [];

        list.forEach(function(element) {
            var rowHtml = null;
            if (element instanceof FileLabel || element instanceof TrashFile) {
                rowHtml = makeFileRow(element, extended);
            }
            else if (element instanceof SearchItem) {
                rowHtml = makeSearchItemRow(element, extended);
            }
            else {
                rowHtml = makeFolderRow(element, extended);
            }

            html = html.concat(rowHtml);
        });

        if (html.length > 0) {
            noFileBg.css('display', 'none');
        }

        surface[0].innerHTML = html.join('');
    }

    /**
     * 切换选择指定 ID 的行。
     * @param {string} id 指定 ID 。
     */
    FilesTable.prototype.toggleSelect = function(id) {
        g.app.filesPanel.resetSelectAllButton();

        var el = tableEl.find('#' + id);
        if (el.prop('checked')) {
            el.prop('checked', false);
            tableEl.find('#ftr_' + id).removeClass('table-primary');
        }
        else {
            el.prop('checked', true);
            tableEl.find('#ftr_' + id).addClass('table-primary');
        }
    }

    /**
     * 取消已选择的行。
     * @param {string} id 指定行 ID 。
     */
    FilesTable.prototype.unselect = function(id) {
        var el = tableEl.find('#' + id);
        if (el.prop('checked')) {
            el.prop('checked', false);
            tableEl.find('#ftr_' + id).removeClass('table-primary');
        }
    }

    /**
     * 在表格首行插入文件夹样式的行。
     * @param {Directory} dir 指定目录。
     */
    FilesTable.prototype.insertFolder = function(dir) {
        var rowHtml = makeFolderRow(dir);
        surface.prepend($(rowHtml.join('')));
    }

    g.FilesTable = FilesTable;

})(window);

(function(g) {
    'use strict'

    var that = null;

    var panelEl = null;

    var btnSelectAll = null;

    var btnUpload = null;
    var btnNewDir = null;
    var btnEmptyTrash = null;
    var btnRestore = null;
    var btnParent = null;
    var btnRecycle = null;

    var infoLoaded = 0;
    var infoTotal = 0;

    var btnPrev = null;
    var btnNext = null;

    var table = null;

    var rootDir = null;
    var currentDir = null;
    var currentPage = {
        page: 0,
        loaded: 0
    };
    var currentFilter = null;

    var selectedSearch = false;
    var selectedRecycleBin = false;

    /**
     * 我的文件主界面的文件表格面板。
     * @param {jQuery} el 界面元素。
     */
    var FilesPanel = function(el) {
        panelEl = el;
        table = new FilesTable(el.find('.table-files'));

        btnSelectAll = el.find('.checkbox-toggle');
        btnUpload = el.find('button[data-target="upload"]');
        btnEmptyTrash = el.find('button[data-target="empty-trash"]');
        btnRestore = el.find('button[data-target="restore"]');
        btnNewDir = el.find('button[data-target="new-dir"]');
        btnParent = el.find('button[data-target="parent"]');
        btnRecycle = el.find('button[data-target="recycle"]');

        infoLoaded = el.find('.info-loaded');
        infoTotal = el.find('.info-total');

        btnPrev = el.find('button[data-target="prev"]');
        btnPrev.attr('disabled', 'disabled');
        btnNext = el.find('button[data-target="next"]');
        btnNext.attr('disabled', 'disabled');

        that = this;

        this.initUI();
    }

    /**
     * 初始化 UI 。
     * @private
     */
    FilesPanel.prototype.initUI = function() {
        // 全选按钮
        btnSelectAll.click(function () {
            var clicks = $(this).data('clicks');
            if (clicks) {
                // Uncheck all checkboxes
                $('.table-files input[type="checkbox"]').prop('checked', false);
                $('.checkbox-toggle .far.fa-check-square').removeClass('fa-check-square').addClass('fa-square');
            }
            else {
                // Check all checkboxes
                $('.table-files input[type="checkbox"]').prop('checked', true);
                $('.checkbox-toggle .far.fa-square').removeClass('fa-square').addClass('fa-check-square');
            }
            $(this).data('clicks', !clicks);
        });

        // 上传文件
        btnUpload.click(function() {
            window.cube().launchFileSelector(function(event) {
                let file = event.target.files[0];
                currentDir.uploadFile(file, function(fileAnchor) {
                    // 正在加载
                }, function(dir, fileLabel) {
                    that.refreshTable(true);
                }, function(error) {

                });
            });
        });

        // 新建文件夹
        btnNewDir.click(function() {
            g.dialog.showPrompt('新建文件夹', '请输入新建文件夹的名称', function(state, value) {
                if (state) {
                    var name = value.trim();
                    if (name.length == 0) {
                        alert('文件夹名称不能为空。');
                        return false;
                    }

                    that.newDirectory(name);
                    return true;
                }
            });
        });

        // 清空回收站
        btnEmptyTrash.click(function() {
            g.dialog.showConfirm('清空回收站', '您确认清空回收站吗？<p class="text-danger tip">清空回收站将删除回收站内的所有文件，不可恢复！</p>', function(ok) {
                if (ok) {
                    window.cube().fs.emptyTrash(function(root) {
                        that.showRecyclebin();
                    }, function(error) {
                        g.dialog.launchToast(Toast.Error, '清空回收站失败: ' + error.code);
                    });
                }
            }, '清空回收站');
        });

        // 恢复文件
        btnRestore.click(function() {
            var idList = [];
            var list = panelEl.find('.table-files input[type="checkbox"]');
            for (var i = 0; i < list.length; ++i) {
                var el = $(list.get(i));
                if (el.prop('checked')) {
                    idList.push(parseInt(el.attr('id')));
                }
            }

            if (idList.length == 0) {
                return;
            }

            window.cube().fs.restoreTrash(idList, function(root, result) {
                // 刷新回收站数据
                that.showRecyclebin();
                // 重置根目录分页数据
                app.filesCtrl.resetPageData(root);
            }, function(error) {
                g.dialog.launchToast(Toast.Error, '清空回收站失败: ' + error.code);
            });
        });

        // 上一级/回到父目录
        btnParent.click(function() {
            if (currentDir == rootDir) {
                return;
            }

            var parent = currentDir.getParent();
            that.changeDirectory(parent);
        });

        // 删除文件或文件夹
        btnRecycle.click(function() {
            var result = [];
            var list = panelEl.find('.table-files input[type="checkbox"]');
            for (var i = 0; i < list.length; ++i) {
                var el = $(list.get(i));
                if (el.prop('checked')) {
                    result.push({
                        id: parseInt(el.attr('id')),
                        type: el.attr('data-type')
                    });
                }
            }

            if (result.length == 0) {
                return;
            }

            var text = null;

            if (selectedRecycleBin) {
                var idList = [];
                result.forEach(function(item) {
                    idList.push(item.id);
                });

                text = ['您确定要删除所选择的“<span class="text-danger">', idList.length, '</span>”个项目吗？',
                    '<p class="text-danger tip">将立即删除此项目。您不能撤销此操作。</p>'];

                g.dialog.showConfirm('立即删除', text.join(''), function(ok) {
                    if (ok) {
                        // 抹除指定文件
                        window.cube().fs.eraseTrash(idList, function(root) {
                            that.showRecyclebin();
                        }, function(error) {
                            g.dialog.launchToast(Toast.Error, '删除文件失败: ' + error.code);
                        });
                    }
                }, '立即删除');
            }
            else {
                if (result.length == 1) {
                    var name = '';
                    var item = currentDir.getDirectory(result[0].id);
                    if (null == item) {
                        item = currentDir.getFile(result[0].id);
                        name = item.getFileName();
                    }
                    else {
                        name = item.getName();
                    }
                    text = ['您确定要删除', result[0].type == 'folder' ? '文件夹' : '文件', '“<span class="text-danger">', name, '</span>”吗？'];
                }
                else {
                    text = ['您确定要删除所选择的<b>', result.length, '</b>个项目吗？'];
                }

                g.dialog.showConfirm('删除文件', text.join(''), function(ok) {
                    if (ok) {
                        var dirList = [];
                        var fileList = [];
                        result.forEach(function(item) {
                            if (item.type == 'folder') {
                                dirList.push(item.id);
                            }
                            else {
                                fileList.push(item.id);
                            }
                        });

                        var dirCompleted = dirList.length == 0 ? true : false;
                        var fileCompleted = fileList.length == 0 ? true : false;

                        currentDir.deleteDirectory(dirList, true, function(workingDir, resultList) {
                            dirCompleted = true;
                            if (fileCompleted) {
                                that.refreshTable(true);
                            }
                        }, function(error) {
                            g.dialog.launchToast(Toast.Error, '删除文件夹失败: ' + error.code);
                        });

                        currentDir.deleteFile(fileList, function(workingDir, resultList) {
                            fileCompleted = true;
                            if (dirCompleted) {
                                that.refreshTable(true);
                            }
                        }, function(error) {
                            g.dialog.launchToast(Toast.Error, '删除文件失败: ' + error.code);
                        });
                    }
                }, '删除');
            }
        });

        // 上一页
        btnPrev.click(function() {
            if (selectedRecycleBin) {

            }
            else if (selectedSearch) {
                if (currentFilter.begin == 0) {
                    return;
                }

                currentFilter.end = currentFilter.begin;
                currentFilter.begin = currentFilter.begin - g.app.filesCtrl.numPerPage;

                if (currentFilter.begin == 0) {
                    btnPrev.attr('disabled', 'disabled');
                }

                // 搜索文件
                window.cube().fs.searchFile(currentFilter, function(filter, list) {
                    if (list.length < g.app.filesCtrl.numPerPage) {
                        btnNext.attr('disabled', 'disabled');

                        if (list.length == 0) {
                            return;
                        }
                    }

                    table.updatePage(list);
                    infoLoaded.text(list.length);

                    btnNext.removeAttr('disabled');
                }, function(error) {
                    g.dialog.launchToast(Toast.Error, '过滤文件错误: ' + error.code);
                });
            }
            else {
                if (currentPage.page == 0) {
                    return;
                }

                currentPage.page -= 1;
                if (currentPage.page == 0) {
                    btnPrev.attr('disabled', 'disabled');
                }

                that.refreshTable();

                btnNext.removeAttr('disabled');
            }
        });

        // 下一页
        btnNext.click(function() {
            if (selectedRecycleBin) {

            }
            else if (selectedSearch) {
                currentFilter.begin = currentFilter.end;
                currentFilter.end = currentFilter.end + g.app.filesCtrl.numPerPage;

                // 搜索文件
                window.cube().fs.searchFile(currentFilter, function(filter, list) {
                    if (list.length < g.app.filesCtrl.numPerPage) {
                        btnNext.attr('disabled', 'disabled');

                        if (list.length == 0) {
                            currentFilter.end = currentFilter.end - g.app.filesCtrl.numPerPage;
                            currentFilter.begin = currentFilter.end - g.app.filesCtrl.numPerPage;
                            return;
                        }
                    }

                    btnPrev.removeAttr('disabled');

                    table.updatePage(list);
                    infoLoaded.text(list.length);
                }, function(error) {
                    g.dialog.launchToast(Toast.Error, '过滤文件错误: ' + error.code);
                });
            }
            else {
                g.app.filesCtrl.getPageData(currentDir, currentPage.page + 1, function(result) {
                    if (null == result) {
                        // 没有新数据
                        btnNext.attr('disabled', 'disabled');

                        if (currentPage.page != 0) {
                            btnPrev.removeAttr('disabled');
                        }

                        g.dialog.launchToast(Toast.Info, '没有更多数据');
                    }
                    else {
                        currentPage.page += 1;
                        that.refreshTable();
                    }
                });
            }
        });
    }

    /**
     * 设置标题。
     * @param {string} title 标题。
     */
    FilesPanel.prototype.setTitle = function(title) {
        panelEl.find('.fp-title').text(title);
    }

    /**
     * 更新标题里的路径信息。
     */
    FilesPanel.prototype.updateTitlePath = function() {
        if (null == currentDir) {
            return;
        }

        var dirList = [];
        this.recurseParent(dirList, currentDir);

        var rootActive = (dirList.length == 0) ? ' active' : '';
        var rootEl = (dirList.length == 0) ? '我的文件' :
            '<a href="javascript:app.filesPanel.changeDirectory(\'' + rootDir.getId() + '\');">我的文件</a>';

        var html = ['<ol class="breadcrumb float-sm-right">',
            '<li class="breadcrumb-item', rootActive, '">', rootEl, '</li>'];

        for (var i = 0; i < dirList.length; ++i) {
            var dir = dirList[i];
            html.push('<li class="breadcrumb-item');
            if (i + 1 == dirList.length) {
                html.push(' active');
                html.push('">');
                html.push(dir.getName());
                html.push('</li>');
            }
            else {
                html.push('"><a href="javascript:;">');
                html.push(dir.getName());
                html.push('</a></li>');
            }
        }

        html.push('</ol>');

        panelEl.find('.fp-path').html(html.join(''));
    }

    /**
     * 向上递归（递归父目录）所有目录，并依次保存到列表里。
     * @param {Array} list 列表。
     * @param {Directory} dir 起始目录。
     */
    FilesPanel.prototype.recurseParent = function(list, dir) {
        var parent = dir.getParent();
        if (null == parent) {
            return;
        }

        list.push(dir);
        this.recurseParent(list, parent);
    }

    /**
     * 使用当前目录数据刷新表格。
     * @param {boolean} reset 是否重置当前目录。
     */
    FilesPanel.prototype.refreshTable = function(reset) {
        if (reset) {
            g.app.filesCtrl.resetPageData(currentDir);
        }

        g.app.filesCtrl.getPageData(currentDir, currentPage.page, function(result) {
            if (null == result) {
                btnNext.attr('disabled', 'disabled');
                table.updatePage([]);
                infoLoaded.text(0);
                infoTotal.text(0);
                return;
            }

            // 更新表格
            table.updatePage(result);

            // 当前加载的数量
            currentPage.loaded = result.length;

            // 更新数量信息
            infoLoaded.text(currentPage.page * g.app.filesCtrl.numPerPage + result.length);
            infoTotal.text(currentDir.totalDirs() + currentDir.totalFiles());

            // 判断下一页
            if (currentPage.loaded < g.app.filesCtrl.numPerPage) {
                btnNext.attr('disabled', 'disabled');
            }
            else {
                btnNext.removeAttr('disabled');
            }
        });

        // 判断上一页
        if (currentPage.page == 0) {
            btnPrev.attr('disabled', 'disabled');
        }
        else {
            btnPrev.removeAttr('disabled');
        }

        // 判断下一页
        if (currentPage.loaded < g.app.filesCtrl.numPerPage) {
            btnNext.attr('disabled', 'disabled');
        }
        else {
            btnNext.removeAttr('disabled');
        }
    }

    /**
     * 显示根目录。
     */
    FilesPanel.prototype.showRoot = function() {
        selectedSearch = false;
        selectedRecycleBin = false;

        if (null == currentDir) {
            g.app.filesCtrl.getRoot(function(root) {
                rootDir = root;
                currentDir = root;
                that.showRoot();
            });
            return;
        }

        btnUpload.css('display', 'inline-block');
        btnNewDir.css('display', 'inline-block');
        btnParent.css('display', 'block');
        btnEmptyTrash.css('display', 'none');
        btnRestore.css('display', 'none');

        this.refreshTable();

        this.updateTitlePath();
    }

    /**
     * 显示图片文件
     */
    FilesPanel.prototype.showImages = function() {
        selectedSearch = true;
        selectedRecycleBin = false;
        btnEmptyTrash.css('display', 'none');
        btnRestore.css('display', 'none');

        panelEl.find('.fp-path').html('');
        btnUpload.css('display', 'none');
        btnNewDir.css('display', 'none');
        btnParent.css('display', 'none');
        btnPrev.attr('disabled', 'disabled');
        btnNext.attr('disabled', 'disabled');

        currentFilter = {
            begin: 0,
            end: g.app.filesCtrl.numPerPage,
            type: ['jpg', 'png', 'gif', 'bmp']
        };

        // 搜索文件
        window.cube().fs.searchFile(currentFilter, function(filter, list) {
            table.updatePage(list);
            infoLoaded.text(list.length);

            if (list.length == g.app.filesCtrl.numPerPage) {
                btnNext.removeAttr('disabled');
            }
        }, function(error) {
            g.dialog.launchToast(Toast.Error, '过滤图片文件: ' + error.code);
        });

        infoTotal.text('--');
    }

    /**
     * 显示文档文件。
     */
    FilesPanel.prototype.showDocuments = function() {
        selectedSearch = true;
        selectedRecycleBin = false;
        btnEmptyTrash.css('display', 'none');
        btnRestore.css('display', 'none');

        panelEl.find('.fp-path').html('');
        btnUpload.css('display', 'none');
        btnNewDir.css('display', 'none');
        btnParent.css('display', 'none');
        btnPrev.attr('disabled', 'disabled');
        btnNext.attr('disabled', 'disabled');

        currentFilter = {
            begin: 0,
            end: g.app.filesCtrl.numPerPage,
            type: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
                'docm', 'dotm', 'dotx', 'ett', 'xlsm', 'xlt', 'dpt',
                'ppsm', 'ppsx', 'pot', 'potm', 'potx', 'pps', 'ptm']
        };

        // 搜索文件
        window.cube().fs.searchFile(currentFilter, function(filter, list) {
            table.updatePage(list);
            infoLoaded.text(list.length);

            if (list.length == g.app.filesCtrl.numPerPage) {
                btnNext.removeAttr('disabled');
            }
        }, function(error) {
            g.dialog.launchToast(Toast.Error, '过滤文档文件: ' + error.code);
        });

        infoTotal.text('--');
    }

    /**
     * 显示回收站。
     */
    FilesPanel.prototype.showRecyclebin = function() {
        selectedSearch = false;
        selectedRecycleBin = true;
        btnEmptyTrash.css('display', 'inline-block');
        btnRestore.css('display', 'inline-block');

        panelEl.find('.fp-path').html('');
        btnUpload.css('display', 'none');
        btnNewDir.css('display', 'none');
        btnParent.css('display', 'none');
        btnPrev.attr('disabled', 'disabled');
        btnNext.attr('disabled', 'disabled');

        window.cube().fs.listTrash(0, 20, function(root, list, begin, end) {
            table.updatePage(list, true);
            infoLoaded.text(list.length);
            infoTotal.text('--');
        }, function(error) {
            g.dialog.launchToast(Toast.Error, '读取回收站数据错误: ' + error.code);
            table.updatePage([]);
            infoLoaded.text(0);
            infoTotal.text('--');
        });
    }

    /**
     * 切换选择指定 ID 的行。
     * @param {string} id 数据的 ID 。
     */
    FilesPanel.prototype.toggleSelect = function(id) {
        table.toggleSelect(id);
    }

    /**
     * 切换目录。
     * @param {number|Directory} idOrDir 指定切换的目录。
     */
    FilesPanel.prototype.changeDirectory = function(idOrDir) {
        if (selectedRecycleBin || selectedSearch) {
            return;
        }

        var type = (typeof idOrDir);
        if (type == 'number' || type == 'string') {
            var dirId = parseInt(idOrDir);

            if (currentDir.getId() == dirId) {
                return;
            }

            if (dirId == rootDir.getId()) {
                currentDir = rootDir;
            }
            else {
                var dir = currentDir.getDirectory(dirId);
                if (null == dir) {
                    // 从 FS 模块直接查询目录
                    dir = g.cube().fs.querySelfDirectory(dirId);
                }
                currentDir = dir;
            }

            table.unselect(dirId);
        }
        else {
            if (idOrDir == currentDir) {
                return;
            }

            currentDir = idOrDir;
        }

        // 刷新列表
        this.refreshTable();

        this.updateTitlePath();
    }

    /**
     * 使用默认方式打开文件。
     * @param {string} fileCode 文件码。
     * @param {number} directoryId 文件所在的目录 ID 。
     */
    FilesPanel.prototype.openFile = function(fileCode, directoryId) {
        var fileLabel = null;
        var directory = null;

        if (selectedRecycleBin) {
        }
        else if (selectedSearch) {
            var searchItem = window.cube().fs.querySearch(directoryId, fileCode);
            if (null != searchItem) {
                directory = searchItem.directory;
                fileLabel = searchItem.file;
            }
        }
        else {
            directory = currentDir;
            fileLabel = directory.getFile(fileCode);
        }

        if (null == fileLabel) {
            return;
        }

        var type = fileLabel.getFileType();
        if (type == 'png' || type == 'jpeg' || type == 'gif' || type == 'jpg' || type == 'bmp') {
            table.unselect(fileCode);
            g.dialog.showImage(fileLabel);
        }
        else {
            table.unselect(fileCode);
            g.app.fileDetails.open(fileLabel, directory);
        }
    }

    /**
     * 打开对应文件的文件详情界面。
     * @param {stirng} fileCode 文件码。
     */
    FilesPanel.prototype.openFileDetails = function(fileCode) {
        if (selectedRecycleBin) {
            return;
        }
        else if (selectedSearch) {
            return;
        }

        var fileLabel = currentDir.getFile(fileCode);
        if (null == fileLabel) {
            return;
        }

        table.unselect(fileCode);
        g.app.fileDetails.open(fileLabel, currentDir);
    }

    /**
     * 在当前表格里插入新的目录。
     * @param {string} dirName 新目录的名称。
     */
    FilesPanel.prototype.newDirectory = function(dirName) {
        g.dialog.launchToast(Toast.Info, '新建文件夹“' + dirName + '”');
        currentDir.newDirectory(dirName, function(newDir) {
            table.insertFolder(newDir);
            // 重置分页数据
            g.app.filesCtrl.resetPageData(currentDir);
        }, function(error) {
            g.dialog.launchToast(Toast.Error, '新建文件夹失败: ' + error.code);
        });
    }

    /**
     * 重置“全选”复选框。
     */
    FilesPanel.prototype.resetSelectAllButton = function() {
        btnSelectAll.data('clicks', false);
        $('.checkbox-toggle .far.fa-check-square').removeClass('fa-check-square').addClass('fa-square');
    }

    g.FilesPanel = FilesPanel;

})(window);

(function(g) {
    'use strict'

    var cube = null;

    var selfRoot = null;

    var folderMap = new OrderMap();

    /**
     * 每页数据条目数。
     * @type {number}
     */
    var numPerPage = 20;

    /**
     * 文件夹描述。
     */
    var Folder = function() {
        this.pages = new OrderMap();
        this.list = [];
        this.fileIndex = 0;
    }

    /**
     * 返回指定页的数据列表。
     * @param {number} page 页码索引。
     * @returns {Array} 返回指定页的数据列表。
     */
    Folder.prototype.get = function(page) {
        return this.pages.get(page);
    }

    /**
     * 添加指定页对应的数据。
     * @param {number} page 页码索引。
     * @param {FileLabel|Directory} data 文件标签或者目录。
     */
    Folder.prototype.append = function(page, data) {
        if (this.contains(data)) {
            return false;
        }

        var pdata = this.pages.get(page);
        if (null == pdata) {
            pdata = [];
            this.pages.put(page, pdata);
        }
        pdata.push(data);
        this.list.push(data);
        return true;
    }

    /**
     * 返回指定页包含的数据数量。
     * @param {number} page 页码索引。
     * @returns {number} 返回指定页包含的数据数量。
     */
    Folder.prototype.size = function(page) {
        var pdata = this.pages.get(page);
        if (null == pdata) {
            return 0;
        }
        return pdata.length;
    }

    /**
     * 当前文件夹是否包含了指定数据。
     * @param {FileLabel|Directory} data 指定数据。
     * @returns {boolean} 如果包含返回 {@linkcode true} 。
     */
    Folder.prototype.contains = function(data) {
        for (var i = 0; i < this.list.length; ++i) {
            var d = this.list[i];
            if (d.getId() == data.getId()) {
                return true;
            }
        }

        return false;
    }


    /**
     * 文件控制器。
     * @param {Cube} cubeEngine 
     */
    var FilesController = function(cubeEngine) {
        cube = cubeEngine;
        this.numPerPage = numPerPage;
    }

    /**
     * 获取当前用户的根目录。
     * @param {function} handler 回调函数，参数：({@linkcode root}:{@link Directory}) 。
     */
    FilesController.prototype.getRoot = function(handler) {
        if (null != selfRoot) {
            handler(selfRoot);
            return;
        }

        cube.fs.getSelfRoot(function(dir) {
            selfRoot = dir;
            handler(selfRoot);
        }, function(error) {
            console.log(error);
        });
    }

    /**
     * 重置目录的分页数据。
     * @param {Directory} directory 目录。
     */
    FilesController.prototype.resetPageData = function(directory) {
        folderMap.remove(directory.getId());
    }

    /**
     * 获取目录的指定页的数据量。
     * @param {Directory} directory 目录。
     * @param {number} page 页码索引。
     * @returns {number} 返回目录的指定页的数据量。
     */
    FilesController.prototype.sizePage = function(directory, page) {
        var folder = folderMap.get(directory.getId());
        if (null == folder) {
            return 0;
        }
        var pageData = folder.get(page);
        if (null == pageData) {
            return 0;
        }
        return pageData.length;
    }

    /**
     * 获取指定目录所在页的分页数据。
     * @param {Directory} directory 目录。
     * @param {number} page 页码索引。
     * @param {function} callback 回调函数。参数：({@linkcode list}:Array<{@link FileLabel}|{@link Directory}>) 。
     */
    FilesController.prototype.getPageData = function(directory, page, callback) {
        var folder = folderMap.get(directory.getId());
        if (null == folder) {
            folder = new Folder();
            folderMap.put(directory.getId(), folder);
        }

        var pageData = folder.get(page);
        if (null != pageData) {
            callback(pageData);
            return;
        }

        directory.listDirectories(function(dir, list) {
            if (folder.list.length < list.length) {
                for (var i = 0; i < list.length; ++i) {
                    folder.append(page, list[i]);

                    // 如果当前页数据已填满，停止遍历
                    if (folder.size(page) == numPerPage) {
                        break;
                    }
                }

                pageData = folder.get(page);
                if (null != pageData && pageData.length == numPerPage) {
                    callback(pageData);
                    return;
                }
            }

            // 加载文件数据
            directory.listFiles(folder.fileIndex, folder.fileIndex + numPerPage, function(dir, files) {
                for (var i = 0; i < files.length; ++i) {
                    if (folder.append(page, files[i])) {
                        // 更新索引
                        folder.fileIndex += 1;

                        if (folder.size(page) == numPerPage) {
                            break;
                        }
                    }
                }

                callback(folder.get(page));
            });
        });
    }

    g.FilesController = FilesController;

})(window);

 (function(g) {

    var that = null;

    var container = null;
    var tableEl = null;
    var tbodyEl = null;
    var pagingEl = null;

    var contactList = [];

    var currentPage = null;

    var pagination = 1;
    var pageSize = 10;
    var maxPagination = 0;

    var ContactsTable = function(el) {
        that = this;
        container = el;
        tableEl = el.find('.table');
        tbodyEl = tableEl.find('tbody');
        pagingEl = el.find('.pagination');
    }

    ContactsTable.prototype.getCurrentContact = function(index) {
        return currentPage[index];
    }

    ContactsTable.prototype.update = function(contacts) {
        if (contacts.length == 0) {
            tbodyEl.empty();
            pagingEl.css('visibility', 'hidden');
            container.find('.no-record').css('display', 'table');
            return;
        }

        container.find('.no-record').css('display', 'none');
        pagingEl.css('visibility', 'visible');

        contactList = contacts;

        contactList.sort(function(a, b) {
            return a.getName().localeCompare(b.getName());
        });

        currentPage = [];
        for (var i = 0; i < pageSize && i < contactList.length; ++i) {
            currentPage.push(contactList[i]);
        }
        
        // 分页
        maxPagination = Math.ceil(contactList.length / pageSize);
        this.paging(maxPagination);

        // 显示指定页
        // 第一页
        pagination = 0;
        this.show(1, currentPage);
    }

    ContactsTable.prototype.showPage = function(newPagination) {
        if (pagination == newPagination) {
            return;
        }

        if (newPagination < 1 || newPagination > maxPagination) {
            return;
        }

        currentPage = [];
        for (var i = (newPagination - 1) * pageSize; i < contactList.length && currentPage.length < pageSize; ++i) {
            currentPage.push(contactList[i]);
        }

        // 更新表格
        this.show(newPagination, currentPage);
    }

    /**
     * 生成分页数据。
     * @param {number} num 
     */
    ContactsTable.prototype.paging = function(num) {
        var html = [
            '<li class="page-item"><a class="page-link" href="javascript:app.contactsCtrl.prevPage();">«</a></li>'
        ];

        for (var i = 1; i <= num; ++i) {
            html.push('<li class="page-item page-' + i + '"><a class="page-link" href="javascript:app.contactsCtrl.showPage(' + i + ');">' + i + '</a></li>');
        }

        html.push('<li class="page-item"><a class="page-link" href="javascript:app.contactsCtrl.nextPage();">»</a></li>');

        pagingEl.html(html.join(''));
    }

    /**
     * 显示指定页码，并加列表里的联系人数据显示在该页。
     * @param {number} page 
     * @param {Array} contacts 
     */
    ContactsTable.prototype.show = function(page, contacts) {
        if (page == pagination) {
            return;
        }

        if (pagination > 0) {
            pagingEl.find('.page-' + pagination).removeClass('active');
        }
        pagingEl.find('.page-' + page).addClass('active');
        // 更新页码
        pagination = page;

        tbodyEl.empty();

        for (var i = 0; i < contacts.length; ++i) {
            var contact = contacts[i];
            var ctx = contact.getContext();
            var appendix = contact.getAppendix();
            var html = [
                '<tr data-target="', i, '">',
                    '<td>', (page - 1) * 10 + (i + 1), '</td>',
                    '<td><img class="table-avatar" src="images/', ctx.avatar, '" /></td>',
                    '<td>', contact.getName(), '</td>',
                    '<td class="text-muted">', appendix.hasRemarkName() ? appendix.getRemarkName() : '', '</td>',
                    '<td>', contact.getId(), '</td>',
                    '<td>', ctx.region, '</td>',
                    '<td>', ctx.department, '</td>',
                    '<td class="text-right">',
                        '<a class="btn btn-primary btn-sm" href="javascript:app.contactsCtrl.goToMessaging(', i, ');"><i class="fas fa-comments"></i> 发消息</a>',
                        '<a class="btn btn-info btn-sm" href="javascript:app.contactsCtrl.editRemark(', i, ');" style="margin-left:8px;"><i class="fas fa-pencil-alt"></i> 备注</a>',
                        '<a class="btn btn-danger btn-sm" href="javascript:app.contactsCtrl.remove(', i, ');" style="margin-left:8px;"><i class="fas fa-user-minus"></i> 删除</a>',
                        '<a class="btn btn-secondary btn-sm" href="javascript:app.contactsCtrl.blockContact(', i, ');" style="margin-left:8px;"><i class="fas fa-user-slash"></i> 黑名单</a>',
                    '</td>',
                '</tr>'
            ];
            tbodyEl.append($(html.join('')));
        }
    }

    /**
     * 切换到上一页。
     */
     ContactsTable.prototype.prevPage = function() {
        if (pagination == 1) {
            return;
        }

        var page = pagination - 1;
        this.showPage(page);
    }

    /**
     * 切换到下一页。
     */
     ContactsTable.prototype.nextPage = function() {
        if (pagination == maxPagination) {
            return;
        }

        var page = pagination + 1;
        this.showPage(page);
    }

    ContactsTable.prototype.modifyRemark = function(rowIndex, remark) {
        this.modifyCell(rowIndex, 3, remark);
    }

    ContactsTable.prototype.modifyCell = function(rowIndex, colIndex, text) {
        var rowEl = tbodyEl.find('tr[data-target="' + rowIndex + '"]');
        var cell = rowEl.find('td').eq(colIndex);
        cell.text(text);
    }

    g.ContactsTable = ContactsTable;

 })(window);
 
 (function(g) {

    var that = null;

    var container = null;
    var tableEl = null;
    var tbodyEl = null;
    var pagingEl = null;

    var groupList = [];

    var currentPage = null;

    var pagination = 1;
    var pageSize = 10;
    var maxPagination = 0;

    var GroupsTable = function(el) {
        that = this;
        container = el;
        tableEl = el.find('.table');
        tbodyEl = tableEl.find('tbody');
        pagingEl = el.find('.pagination');
    }

    GroupsTable.prototype.getCurrentContact = function(index) {
        return currentPage[index];
    }

    GroupsTable.prototype.update = function(groups) {
        if (groups.length == 0) {
            tbodyEl.empty();
            pagingEl.css('visibility', 'hidden');
            container.find('.no-record').css('display', 'table');
            return;
        }

        container.find('.no-record').css('display', 'none');
        pagingEl.css('visibility', 'visible');

        groupList = groups;

        groupList.sort(function(a, b) {
            return a.getName().localeCompare(b.getName());
        });

        currentPage = [];
        for (var i = 0; i < pageSize && i < groupList.length; ++i) {
            currentPage.push(groupList[i]);
        }
        
        // 分页
        maxPagination = Math.ceil(groupList.length / pageSize);
        this.paging(maxPagination);

        // 显示指定页
        // 第一页
        pagination = 0;
        this.show(1, currentPage);
    }

    GroupsTable.prototype.showPage = function(newPagination) {
        if (pagination == newPagination) {
            return;
        }

        if (newPagination < 1 || newPagination > maxPagination) {
            return;
        }

        currentPage = [];
        for (var i = (newPagination - 1) * pageSize; i < groupList.length && currentPage.length < pageSize; ++i) {
            currentPage.push(groupList[i]);
        }

        // 更新表格
        this.show(newPagination, currentPage);
    }


    GroupsTable.prototype.paging = function(num) {
        var html = [
            '<li class="page-item"><a class="page-link" href="javascript:app.contactsCtrl.prevPage();">«</a></li>'
        ];

        for (var i = 1; i <= num; ++i) {
            html.push('<li class="page-item page-' + i + '"><a class="page-link" href="javascript:app.contactsCtrl.showPage(' + i + ');">' + i + '</a></li>');
        }

        html.push('<li class="page-item"><a class="page-link" href="javascript:app.contactsCtrl.nextPage();">»</a></li>');

        pagingEl.html(html.join(''));
    }

    GroupsTable.prototype.show = function(page, groups) {
        if (page == pagination) {
            return;
        }

        if (pagination > 0) {
            pagingEl.find('.page-' + pagination).removeClass('active');
        }
        pagingEl.find('.page-' + page).addClass('active');
        // 更新页码
        pagination = page;

        tbodyEl.empty();

        for (var i = 0; i < groups.length; ++i) {
            var group = groups[i];
            var avatar = 'images/group-avatar.png';
            var appendix = group.getAppendix();

            group.tableSN = i;   // 表格的 SN
            group.listMembers(function(list, group) {
                var cols = 4;
                var count = 8;
                var memberHtml = [
                    '<ul class="list-inline">',
                ];
                list.some(function(value) {
                    var ctx = value.getContext();
                    if (null == ctx) {
                        value = app.queryContact(value.getId());
                        ctx = value.getContext();
                    }
                    var memberAvatar = ctx.avatar;
                    memberHtml.push('<li class="list-inline-item">');
                    memberHtml.push('<img title="' + value.getPriorityName() + '" class="table-avatar" src="images/' + memberAvatar + '" />');
                    memberHtml.push('</li>');
                    
                    --cols;
                    --count;
                    if (count == 0) {
                        return true;
                    }

                    if (cols == 0) {
                        memberHtml.push('</ul><ul class="list-inline">');
                        cols = 4;
                    }
                });
                memberHtml.push('</ul>');

                tbodyEl.find('tr[data-target="' + group.tableSN + '"]').find('.members').html(memberHtml.join(''));
            });

            var html = [
                '<tr data-target="', i, '">',
                    '<td>', (page - 1) * 10 + (i + 1), '</td>',
                    '<td><img class="table-avatar" src="', avatar, '" /></td>',
                    '<td><a href="javascript:app.contactsCtrl.showGroup(', i, ');">', group.getName(), '</a></td>',
                    '<td class="text-muted">', appendix.hasRemark() ? appendix.getRemark() : '', '</td>',
                    '<td>', group.getId(), '</td>',
                    '<td>', appendix.getNotice(), '</td>',
                    '<td class="members">', '</td>',
                    '<td class="text-right">',
                        '<a class="btn btn-primary btn-sm" href="javascript:app.contactsCtrl.goToMessaging(', i, ');"><i class="fas fa-comments"></i> 发消息</a>',
                        '<a class="btn btn-info btn-sm" href="javascript:app.contactsCtrl.editRemark(', i, ');" style="margin-left:8px;"><i class="fas fa-pencil-alt"></i> 备注</a>',
                    '</td>',
                '</tr>'
            ];
            tbodyEl.append($(html.join('')));
        }
    }

    /**
     * 切换到上一页。
     */
    GroupsTable.prototype.prevPage = function() {
        if (pagination == 1) {
            return;
        }

        var page = pagination - 1;
        this.showPage(page);
    }

    /**
     * 切换到下一页。
     */
    GroupsTable.prototype.nextPage = function() {
        if (pagination == maxPagination) {
            return;
        }

        var page = pagination + 1;
        this.showPage(page);
    }

    GroupsTable.prototype.modifyRemark = function(rowIndex, remark) {
        this.modifyCell(rowIndex, 3, remark);
    }

    GroupsTable.prototype.modifyCell = function(rowIndex, colIndex, text) {
        var rowEl = tbodyEl.find('tr[data-target="' + rowIndex + '"]');
        var cell = rowEl.find('td').eq(colIndex);
        cell.text(text);
    }

    g.GroupsTable = GroupsTable;

 })(window);
 
 (function(g) {

    var that = null;

    var container = null;
    var tableEl = null;
    var tbodyEl = null;
    var pagingEl = null;

    var entityList = [];

    var currentPage = null;

    var pagination = 1;
    var pageSize = 10;
    var maxPagination = 0;

    var PendingTable = function(el) {
        that = this;
        container = el;
        tableEl = el.find('.table');
        tbodyEl = tableEl.find('tbody');
        pagingEl = el.find('.pagination');
    }

    PendingTable.prototype.getCurrentContact = function(index) {
        return currentPage[index];
    }

    PendingTable.prototype.update = function(entities) {
        if (entities.length == 0) {
            tbodyEl.empty();
            pagingEl.css('visibility', 'hidden');
            container.find('.no-record').css('display', 'table');
            return;
        }

        container.find('.no-record').css('display', 'none');
        pagingEl.css('visibility', 'visible');

        entityList = entities;

        entityList.sort(function(a, b) {
            return a.getName().localeCompare(b.getName());
        });

        currentPage = [];
        for (var i = 0; i < pageSize && i < entityList.length; ++i) {
            currentPage.push(entityList[i]);
        }
        
        // 分页
        maxPagination = Math.ceil(entityList.length / pageSize);
        this.paging(maxPagination);

        // 显示指定页
        // 第一页
        pagination = 0;
        this.show(1, currentPage);
    }

    PendingTable.prototype.showPage = function(newPagination) {
        if (pagination == newPagination) {
            return;
        }

        if (newPagination < 1 || newPagination > maxPagination) {
            return;
        }

        currentPage = [];
        for (var i = (newPagination - 1) * pageSize; i < entityList.length && currentPage.length < pageSize; ++i) {
            currentPage.push(entityList[i]);
        }

        // 更新表格
        this.show(newPagination, currentPage);
    }


    PendingTable.prototype.paging = function(num) {
        var html = [
            '<li class="page-item"><a class="page-link" href="javascript:app.contactsCtrl.prevPage();">«</a></li>'
        ];

        for (var i = 1; i <= num; ++i) {
            html.push('<li class="page-item page-' + i + '"><a class="page-link" href="javascript:app.contactsCtrl.showPage(' + i + ');">' + i + '</a></li>');
        }

        html.push('<li class="page-item"><a class="page-link" href="javascript:app.contactsCtrl.nextPage();">»</a></li>');

        pagingEl.html(html.join(''));
    }

    PendingTable.prototype.show = function(page, entities) {
        if (page == pagination) {
            return;
        }

        if (pagination > 0) {
            pagingEl.find('.page-' + pagination).removeClass('active');
        }
        pagingEl.find('.page-' + page).addClass('active');
        // 更新页码
        pagination = page;

        tbodyEl.empty();

        for (var i = 0; i < entities.length; ++i) {
            var entity = entities[i];
            var avatar = (entity instanceof Group) ? 'images/group-avatar.png' : 'images/' + entity.getContext().avatar;

            var html = [
                '<tr data-target="', i, '">',
                    '<td>', (page - 1) * 10 + (i + 1), '</td>',
                    '<td><img class="table-avatar" src="', avatar, '" /></td>',
                    '<td>', entity.getName(), '</td>',
                    '<td class="text-muted">', entity.getId(), '</td>',
                    '<td>', entity.postscript, '</td>',
                    '<td class="text-right">',
                        '<a class="btn btn-primary btn-sm" href="javascript:app.contactsCtrl.acceptPendingContact(', i, ');"><i class="fas fa-user-check"></i> 添加联系人</a>',
                    '</td>',
                '</tr>'
            ];
            tbodyEl.append($(html.join('')));
        }
    }

    /**
     * 切换到上一页。
     */
     PendingTable.prototype.prevPage = function() {
        if (pagination == 1) {
            return;
        }

        var page = pagination - 1;
        this.showPage(page);
    }

    /**
     * 切换到下一页。
     */
     PendingTable.prototype.nextPage = function() {
        if (pagination == maxPagination) {
            return;
        }

        var page = pagination + 1;
        this.showPage(page);
    }

    PendingTable.prototype.modifyRemark = function(rowIndex, remark) {
        this.modifyCell(rowIndex, 3, remark);
    }

    PendingTable.prototype.modifyCell = function(rowIndex, colIndex, text) {
        var rowEl = tbodyEl.find('tr[data-target="' + rowIndex + '"]');
        var cell = rowEl.find('td').eq(colIndex);
        cell.text(text);
    }

    g.PendingTable = PendingTable;

 })(window);
 
/**
 * 阻止清单表格。
 */
(function(g) {

    var that;

    var container;
    var tableEl = null;
    var tbodyEl = null;
    var pagingEl = null;

    var currentPage = null;

    var pagination = 1;
    var pageSize = 10;
    var maxPagination = 0;

    var blockIdList = null;
    var contactList = null;

    var BlockListTable = function(el) {
        that = this;
        container = el;
        tableEl = el.find('.table');
        tbodyEl = tableEl.find('tbody');
        pagingEl = el.find('.pagination');
    }

    BlockListTable.prototype.getCurrentContact = function(index) {
        return currentPage[index];
    }

    BlockListTable.prototype.update = function(blockList) {
        if (blockList.length == 0) {
            tbodyEl.empty();
            pagingEl.css('visibility', 'hidden');
            container.find('.no-record').css('display', 'table');
            return;
        }

        container.find('.no-record').css('display', 'none');
        pagingEl.css('visibility', 'visible');

        blockIdList = blockList;
        blockIdList.reverse();

        contactList = [];
        for (var i = 0; i < blockIdList.length; ++i) {
            contactList.push(null);
        }

        var count = 0;
        var limit = Math.min(blockIdList.length, pageSize);

        for (var i = 0; i < blockIdList.length && i < pageSize; ++i) {
            var id = blockIdList[i];
            // 获取联系人数据
            g.app.getContact(id, function(contact) {
                // 计数
                ++count;

                var index = blockIdList.indexOf(contact.getId());
                contactList[index] = contact;

                if (count == limit) {
                    that.handleUpdate();
                }
            });
        }
    }

    BlockListTable.prototype.handleUpdate = function() {
        currentPage = [];
        for (var i = 0; i < pageSize && i < contactList.length; ++i) {
            currentPage.push(contactList[i]);
        }

        // 分页
        maxPagination = Math.ceil(blockIdList.length / pageSize);
        this.paging(maxPagination);

        // 显示指定页
        // 第一页
        pagination = 0;
        this.show(1, currentPage);
    }

    BlockListTable.prototype.showPage = function(newPagination) {
        if (pagination == newPagination) {
            return;
        }

        if (newPagination < 1 || newPagination > maxPagination) {
            return;
        }

        var curIndexList = [];
        for (var i = (newPagination - 1) * pageSize; i < blockIdList.length && curIndexList.length < pageSize; ++i) {
            curIndexList.push(i);
        }

        var handle = function() {
            if (curIndexList.length == currentPage.length) {
                // 更新表格
                that.show(newPagination, currentPage);
            }
        }

        currentPage = [];

        // 判断当前索引处是否有数据
        for (var i = 0; i < curIndexList.length; ++i) {
            var index = curIndexList[i];
            var contact = contactList[index];
            if (null == contact) {
                var id = blockIdList[index];
                g.app.getContact(id, function(contact) {
                    currentPage.push(contact);
                    handle();
                });
            }
            else {
                currentPage.push(contact);
            }

            handle();
        }
    }

    BlockListTable.prototype.paging = function(num) {
        var html = [
            '<li class="page-item"><a class="page-link" href="javascript:app.contactsCtrl.prevPage();">«</a></li>'
        ];

        for (var i = 1; i <= num; ++i) {
            html.push('<li class="page-item page-' + i + '"><a class="page-link" href="javascript:app.contactsCtrl.showPage(' + i + ');">' + i + '</a></li>');
        }

        html.push('<li class="page-item"><a class="page-link" href="javascript:app.contactsCtrl.nextPage();">»</a></li>');

        pagingEl.html(html.join(''));
    }

    BlockListTable.prototype.show = function(page, entities) {
        if (page == pagination) {
            return;
        }

        if (pagination > 0) {
            pagingEl.find('.page-' + pagination).removeClass('active');
        }
        pagingEl.find('.page-' + page).addClass('active');
        // 更新页码
        pagination = page;

        tbodyEl.empty();

        for (var i = 0; i < entities.length; ++i) {
            var entity = entities[i];
            var avatar = 'images/' + entity.getContext().avatar;

            var html = [
                '<tr data-target="', i, '">',
                    '<td>', (page - 1) * 10 + (i + 1), '</td>',
                    '<td><img class="table-avatar" src="', avatar, '" /></td>',
                    '<td>', entity.getName(), '</td>',
                    '<td>', entity.getId(), '</td>',
                    '<td class="text-right">',
                        '<a class="btn btn-danger btn-sm" href="javascript:app.contactsCtrl.unblockContact(', i, ');"><i class="fas fa-user-times"></i> 解除阻止</a>',
                    '</td>',
                '</tr>'
            ];
            tbodyEl.append($(html.join('')));
        }
    }

    /**
     * 切换到上一页。
     */
    BlockListTable.prototype.prevPage = function() {
        if (pagination == 1) {
            return;
        }

        var page = pagination - 1;
        this.showPage(page);
    }

    /**
     * 切换到下一页。
     */
    BlockListTable.prototype.nextPage = function() {
        if (pagination == maxPagination) {
            return;
        }

        var page = pagination + 1;
        this.showPage(page);
    }

    g.BlockListTable = BlockListTable;

})(window);

 (function(g) {
    'use strict';

    var that = null;

    var cube = null;

    var contactList = [];
    var groupList = [];
    var pendingList = [];

    var tabEl = null;

    var contactsTable = null;
    var groupsTable = null;
    var pendingTable = null;
    var blockTable = null;

    var currentTable = null;

    var contactDelayTimer = 0;
    var groupDelayTimer = 0;
    var pendingTimer = 0;

    var btnAddContact = null;
    var btnNewGroup = null;
    var btnRefresh = null;

    function containsGroup(group) {
        for (var i = 0; i < groupList.length; ++i) {
            if (groupList[i].getId() == group.getId()) {
                return i;
            }
        }

        return -1;
    }

    function onTabChanged(e) {
        if (e.target.id == 'contacts-tabs-default-tab') {
            currentTable = contactsTable;
        }
        else if (e.target.id == 'contacts-tabs-groups-tab') {
            currentTable = groupsTable;
        }
        else if (e.target.id == 'contacts-tabs-pending-tab') {
            currentTable = pendingTable;
        }
        else {
            currentTable = blockTable;
        }
    }


    /**
     * 联系人主页面控制器。
     * @param {CubeEngine} cubeEngine 
     */
    var ContactsController = function(cubeEngine) {
        that = this;
        cube = cubeEngine;

        tabEl = $('#contacts-tabs-tab');
        tabEl.on('show.bs.tab', onTabChanged);

        contactsTable = new ContactsTable($('div[data-target="contacts-table"]'));

        groupsTable = new GroupsTable($('div[data-target="groups-table"]'));

        pendingTable = new PendingTable($('div[data-target="pending-table"]'));

        blockTable = new BlockListTable($('div[data-target="block-table"]'));

        btnAddContact = $('.contacts-card').find('a[data-target="add-contact"]');
        btnAddContact.on('click', function() {
            g.app.searchDialog.show();
        });

        btnNewGroup = $('.contacts-card').find('a[data-target="new-group"]');
        btnNewGroup.on('click', function() {
            g.app.newGroupDialog.show();
        });

        btnRefresh = $('.contacts-card').find('button[data-target="refresh"]');
        btnRefresh.on('click', function() {
            that.update();
        });

        currentTable = contactsTable;
    }

    /**
     * 初始化待处理列表。
     * @param {function} [callback]
     */
    ContactsController.prototype.ready = function(callback) {
        pendingList = [];

        cube.contact.getPendingZone(g.app.contactZone, function(zone) {
            var count = zone.contacts.length;

            zone.contacts.forEach(function(value) {
                app.getContact(value, function(contact) {
                    var ps = zone.getPostscript(contact.getId());
                    contact.postscript = ps;
                    that.addPending(contact);
                    --count;

                    if (count == 0 && callback) {
                        callback();
                    }
                });
            });

            if (count == 0 && callback) {
                callback();
            }
        }, function(error) {
            console.log(error);
        });

        // 更新阻止清单
        cube.contact.queryBlockList(function(list) {
            blockTable.update(list);
        });
    }

    /**
     * 返回联系人列表。
     * @returns {Array}
     */
    ContactsController.prototype.getContacts = function() {
        return contactList;
    }

    /**
     * 添加联系人数据。
     * @param {Contact} contact 
     */
    ContactsController.prototype.addContact = function(contact) {
        contactList.push(contact);

        if (contactDelayTimer > 0) {
            clearTimeout(contactDelayTimer);
        }
        contactDelayTimer = setTimeout(function() {
            clearTimeout(contactDelayTimer);
            contactDelayTimer = 0;
            contactsTable.update(contactList);
        }, 1000);
    }

    ContactsController.prototype.removeContact = function(contact) {
        var deleted = false;
        for (var i = 0; i < contactList.length; ++i) {
            var c = contactList[i];
            if (c.getId() == contact.getId()) {
                contactList.splice(i, 1);
                deleted = true;
                break;
            }
        }

        if (deleted) {
            contactsTable.update(contactList);
        }
    }

    ContactsController.prototype.updateGroup = function(group) {
        var index = containsGroup(group);
        if (index >= 0) {
            groupList.splice(index, 1);
        }

        groupList.push(group);

        if (groupDelayTimer > 0) {
            clearTimeout(groupDelayTimer);
        }
        groupDelayTimer = setTimeout(function() {
            clearTimeout(groupDelayTimer);
            groupDelayTimer = 0;
            groupsTable.update(groupList);
        }, 1000);
    }

    ContactsController.prototype.removeGroup = function(group) {
        var deleted = false;
        for (var i = 0; i < groupList.length; ++i) {
            var g = groupList[i];
            if (g.getId() == group.getId()) {
                groupList.splice(i, 1);
                deleted = true;
                break;
            }
        }

        if (deleted) {
            groupsTable.update(groupList);
        }
    }

    ContactsController.prototype.addPending = function(entity) {
        pendingList.push(entity);

        if (pendingTimer > 0) {
            clearTimeout(pendingTimer);
        }
        pendingTimer = setTimeout(function() {
            clearTimeout(pendingTimer);
            pendingTimer = 0;
            pendingTable.update(pendingList);
        }, 1000);
    }

    /**
     * 显示群组详情。
     * @param {number} index 
     * @returns 
     */
    ContactsController.prototype.showGroup = function(index) {
        var entity = currentTable.getCurrentContact(index);
        if (undefined === entity) {
            return;
        }

        g.app.groupDetails.show(entity);
    }

    /**
     * 跳转到消息界面。
     * @param {number} index 
     */
    ContactsController.prototype.goToMessaging = function(index) {
        var entity = currentTable.getCurrentContact(index);
        if (undefined === entity) {
            return;
        }

        // 向消息目录添加联系人
        app.messageCatalog.appendItem(entity, true);

        // 切换到消息面板
        app.toggle('messaging');

        // 获取消息
        setTimeout(function() {
            // 更新消息
            if (entity instanceof Group) {
                app.messagingCtrl.updateGroupMessages(entity, function() {
                    app.messagingCtrl.toggle(entity.getId());
                });
            }
            else {
                app.messagingCtrl.updateContactMessages(entity, function() {
                    app.messagingCtrl.toggle(entity.getId());
                });
            }
        }, 100);
    }

    /**
     * 编辑联系人备注。
     * @param {number} index 
     */
    ContactsController.prototype.editRemark = function(index) {
        if (currentTable == contactsTable) {
            var contact = contactsTable.getCurrentContact(index);
            if (undefined === contact) {
                return;
            }

            g.dialog.showPrompt('备注联系人', '请填写联系人“' + contact.getName() + '”的备注：', function(ok, value) {
                if (ok) {
                    var remark = value.trim();
                    if (remark.length == 0) {
                        g.dialog.launchToast(g.Toast.Warning, '请正确填写联系人备注');
                        return false;
                    }

                    // 更新联系人备注
                    contact.getAppendix().updateRemarkName(remark, function() {
                        contactsTable.modifyRemark(index, remark);
                    });
                }
            });
        }
        else {
            // TODO 群组操作
        }
    }

    /**
     * 删除联系人。
     * @param {number} index 
     */
    ContactsController.prototype.remove = function(index) {
        var contact = contactsTable.getCurrentContact(index);
        g.dialog.showConfirm('删除联系人', '您确认要从“我的联系人”里删除“<b>' + contact.getPriorityName() + '</b>”？', function(yesOrNo) {
            if (yesOrNo) {
                cube.contact.removeContactFromZone(g.app.contactZone, contact.getId(), function(zoneName, contactId) {
                    that.removeContact(contact);
                    g.app.messagingCtrl.removeContact(contact);
                });
            }
        });
    }

    /**
     * 加入黑名单。
     * @param {number} index 
     */
    ContactsController.prototype.blockContact = function(index) {
        var contact = contactsTable.getCurrentContact(index);
        g.dialog.showConfirm('阻止联系人', '您确认要将“<b>' + contact.getPriorityName() + '</b>”加入“黑名单”吗？', function(yesOrNo) {
            if (yesOrNo) {
                cube.contact.addBlockList(contact.getId(), function(id, blockList) {
                    // 从数据中删除
                    that.removeContact(contact);
                    // 更新黑名单
                    blockTable.update(blockList);
                });
            }
        });
    }

    /**
     * 同意添加联系人。
     * @param {number} index 
     */
    ContactsController.prototype.acceptPendingContact = function(index) {
        var contact = currentTable.getCurrentContact(index);
        g.dialog.showConfirm('添加联系人', '您确认要添加联系人“<b>' + contact.getName() + '</b>”吗？', function(yesOrNo) {
            if (yesOrNo) {
                cube.contact.addContactToZone(g.app.contactZone, contact.getId(), null, function() {
                    // 将其添加到联系人列表
                    contactList.push(contact);

                    that.ready(function() {
                        that.update();
                    });
                });
            }
        });
    }

    /**
     * 添加联系人到指定分区。
     * @param {string} zoneName
     * @param {number} contactId 
     * @param {string} postscript
     * @param {function} [callback]
     */
    ContactsController.prototype.addContactToZone = function(zoneName, contactId, postscript, callback) {
        cube.contact.addContactToZone(zoneName, contactId, postscript, function(zoneName, contactId) {
            g.app.getContact(contactId, function(contact) {
                that.addContact(contact);
                if (callback) {
                    callback(contact);
                }
            });
        }, function(error) {
            console.log(error);
            if (callback) {
                callback(null);
            }
        });
    }

    /**
     * 从黑名单列表里解除联系人。
     * @param {number} index
     */
    ContactsController.prototype.unblockContact = function(index) {
        var contact = blockTable.getCurrentContact(index);
        g.dialog.showConfirm('解除阻止', '您确认要将“<b>' + contact.getPriorityName() + '</b>”移出“黑名单”并添加为“我的联系人”吗？', function(yesOrNo) {
            if (yesOrNo) {
                cube.contact.removeBlockList(contact, function(id, blockList) {
                    // 更新黑名单
                    blockTable.update(blockList);
                    // 添加到 Zone
                    that.addContactToZone(g.app.contactZone, id, '');
                });
            }
        });
    }

    /**
     * 显示指定页。
     * @param {number} newPagination 
     * @returns 
     */
    ContactsController.prototype.showPage = function(newPagination) {
        currentTable.showPage(newPagination);
    }

    /**
     * 切换到上一页。
     */
    ContactsController.prototype.prevPage = function() {
        currentTable.prevPage();
    }

    /**
     * 切换到下一页。
     */
    ContactsController.prototype.nextPage = function() {
        currentTable.nextPage();
    }

    /**
     * 更新数据。
     */
    ContactsController.prototype.update = function() {
        contactsTable.update(contactList);
        groupsTable.update(groupList);
        pendingTable.update(pendingList);
    }

    /**
     * 移除群组成员。
     * @param {number} groupId 
     * @param {number} memberId 
     * @param {funciton} handle 
     */
    ContactsController.prototype.removeGroupMember = function(groupId, memberId, handle) {
        cube.contact.getGroup(groupId, function(group) {
            g.app.getContact(memberId, function(member) {
                var memName = member.getName();
                g.dialog.showConfirm('移除群成员', '您确定要把“' + memName + '”移除群组吗？', function(ok) {
                    if (ok) {
                        group.removeMembers([ memberId ], function(group, list, operator) {
                            g.dialog.launchToast(Toast.Success, '已移除成员“' + memName + '”');
                            if (handle) {
                                handle(group, list, operator);
                            }

                            // 刷新对话框
                            g.app.groupDetails.refresh();
                        }, function(error) {
                            g.dialog.launchToast(Toast.Warning, '移除群成员失败: ' + error.code);
                        });
                    }
                });
            });
        });
    }

    g.ContactsController = ContactsController;

 })(window);

 (function(g) {
    'use strict';

    /**
     * 会议时间线。
     * @param {*} el 
     */
    var ConferenceTimeline = function(el) {
        this.container = el;
        this.timelineEl = el.find('.timeline');
    }

    ConferenceTimeline.prototype.update = function(list) {
        // 清空时间线元素
        this.timelineEl.empty();

        if (list.length > 0) {
            this.container.find('.no-conference').css('display', 'none');

            var now = Date.now();

            for (var i = 0; i < list.length; ++i) {
                var conf = list[i];

                var date = new Date(conf.scheduleTime);
                var expire = new Date(conf.expireTime);

                var iconClass = null;
                var btnGroup = [];

                if (now >= conf.scheduleTime && now <= conf.expireTime) {
                    // 正在进行的会议
                    iconClass = 'bg-red';
                    btnGroup.push('<button class="btn btn-success btn-sm" onclick="javascript:;">进入会议</button>');
                    if (conf.getFounder().getId() == app.getSelf().getId()) {
                        // 本人是会议创建人，可结束会议
                        btnGroup.push('<button class="btn btn-danger btn-sm">结束会议</button>');
                    }
                }
                else if (now > conf.expireTime) {
                    // 已结束的会议
                    iconClass = 'bg-green';
                    btnGroup.push('<button class="btn btn-default btn-sm" onclick="javascript:;">查看会议记录</button>');
                }
                else {
                    // 尚未开始的会议
                    iconClass = 'bg-blue';
                    btnGroup.push('<button class="btn btn-success btn-sm" onclick="javascript:;">进入会议</button>');
                    if (conf.getFounder().getId() == app.getSelf().getId()) {
                        // 本人是会议创建人，可取消会议
                        btnGroup.push('<button class="btn btn-danger btn-sm" onclick="javascript:;">取消会议</button>');
                    }
                }

                var lockIcon = conf.hasPassword() ? '<i class="fas fa-lock" title="会议已设置密码"></i>' : '<i class="fas fa-unlock" title="会议无密码"></i>';

                var invitees = conf.getInvitees();
                invitees.unshift(conf.getFounder());
                var htmlInvitee = [];
                invitees.forEach(function(value, index) {
                    var contact = app.queryContact(value.id);

                    // 状态
                    var state = null;
                    if (index == 0) {
                        state = [
                            '<span class="badge badge-info"><i class="fas fa-user-cog"></i></span>'
                        ];
                    }
                    else {
                        if (value.acceptionTime > 0) {
                            if (value.accepted) {
                                state = [
                                    '<span class="badge badge-success"><i class="fas fa-check-circle"></i></span>'
                                ];
                            }
                            else {
                                state = [
                                    '<span class="badge badge-danger"><i class="fas fa-ban"></i></span>'
                                ];
                            }
                        }
                        else {
                            state = [
                                '<span class="badge badge-info"><i class="fas fa-question-circle"></i></span>'
                            ];
                        }
                    }

                    var html = null;
                    if (null != contact) {
                        html = [
                            '<div class="participant" data="', contact.getId(), '">',
                                '<div class="avatar"><img src="images/', contact.getContext().avatar, '"></div>',
                                '<div class="name"><div>', contact.getName(), '</div></div>',
                                state.join(''),
                            '</div>'
                        ];
                    }
                    else {
                        html = [
                            '<div class="participant" data="', value.id, '">',
                                '<div class="avatar"><img src="', 'images/favicon.png', '"></div>',
                                '<div class="name"><div>', value.displayName, '</div></div>',
                                state.join(''),
                            '</div>'
                        ];
                    }

                    htmlInvitee.push(html.join(''));
                });

                var html = [
                    '<div class="time-label">',
                        '<span class="bg-blue">', (date.getMonth() + 1), '月', date.getDate(), '日</span>',
                    '</div>',
                    '<div>',
                        '<i class="fas fa-users ', iconClass, '"></i>',
                        '<div class="timeline-item">',
                            '<span class="time">', lockIcon, '&nbsp;&nbsp;<i class="fas fa-clock"></i> ',
                                    g.formatNumber(date.getHours()), ':', g.formatNumber(date.getMinutes()), ' - ',
                                    g.formatNumber(expire.getHours()), ':', g.formatNumber(expire.getMinutes()),
                            '</span>',
                            '<h3 class="timeline-header">', conf.subject, '</h3>',
                            '<div class="timeline-body">',
                                '<p>', conf.summary.length == 0 ? '<i class="text-muted" style="font-size:12px;">无会议描述信息</i>' : conf.summary, '</p>',
                                '<div class="invitees">', htmlInvitee.join(''), '</div>',
                            '</div>',
                            '<div class="timeline-footer">',
                                btnGroup.join(''),
                            '</div>',
                        '</div>',
                    '</div>'
                ];

                this.timelineEl.append($(html.join('')));
            }

            this.timelineEl.append($('<div><i class="fas fa-clock bg-gray"></i></div>'));
        }
        else {
            this.container.find('.no-conference').css('display', 'table');
        }
    }

    g.ConferenceTimeline = ConferenceTimeline;

 })(window);

 (function(g) {
    'use strict'

    var cube = null;

    var timelineAll = null;
    var timelineActive = null;
    var timelineScheme = null;
    var timelineClosed = null;

    var newConferenceDialog = null;

    function alignTime(minutes) {
        if (minutes <= 15) {
            return 15;
        }
        else if (minutes > 15 && minutes <= 30) {
            return 30;
        }
        else if (minutes > 30 && minutes <= 45) {
            return 45;
        }
        else {
            return 0;
        }
    }

    function onNewConference(e) {
        var el = newConferenceDialog;
        el.find('input[name="conf-subject"]').val('');
        el.find('input[name="conf-pwd"]').val('');
        el.find('textarea[name="conf-summary"]').val('');

        var date = new Date();
        var fix = alignTime(date.getMinutes());
        date.setMinutes(fix);
        if (fix == 0) {
            date.setHours(date.getHours() + 1);
        }
        var newMins = date.getMinutes() + 30;
        if (newMins >= 60) {
            date.setHours(date.getHours() + 1);
            date.setMinutes(0);
        }
        else {
            date.setMinutes(newMins);
        }
        el.find('input[name="conf-schedule"]').val(g.datetimePickerToString(date));

        el.find('div.participant').each(function() {
            $(this).remove();
        });

        el.find('.overlay').css('visibility', 'hidden');
        el.modal('show');
    }

    function onAppendParticipant(e) {
        g.app.selectContactsDialog.show(function(result) {
            var el = newConferenceDialog.find('#conf-participant');
            result.forEach(function(value, index) {
                var html = [
                    '<div class="participant" data="', value.getId(), '">',
                        '<div class="avatar">',
                            '<img src="images/', value.getContext().avatar, '" />',
                        '</div>',
                        '<div class="name">',
                            '<div>', value.getPriorityName(), '</div>',
                        '</div>',
                        '<a href="javascript:app.confCtrl.removeParticipantInNewDialog(', value.getId(), ');"><span class="badge badge-danger">&times;</span></a>',
                    '</div>'
                ];
                el.append($(html.join('')));
            });
        }, getAppendedParticipants());
    }

    function getAppendedParticipants() {
        var list = [];
        newConferenceDialog.find('div.participant').each(function() {
            var id = $(this).attr('data');
            list.push(parseInt(id));
        });
        return list;
    }

    /**
     * 确认新建会议。
     * @returns 
     */
    function onNewConfirm() {
        // 主题
        var el = newConferenceDialog.find('input[name="conf-subject"]');
        var subject = el.val().trim();
        if (subject.length < 3) {
            g.validate(el, '请填写会议主题，会议主题不能少于3个字符。');
            return;
        }

        // 密码
        el = newConferenceDialog.find('input[name="conf-pwd"]');
        var password = el.val().trim();

        // 摘要
        el = newConferenceDialog.find('textarea[name="conf-summary"]');
        var summary = el.val().trim();

        // 计划时间
        el = newConferenceDialog.find('input[name="conf-schedule"]');
        var value = el.val().trim();
        if (value.length <= 10) {
            g.validate(el);
            return;
        }
        var schedule = g.datetimePickerToDate(value);
        var scheduleTime = schedule.getTime();

        // 结束时间，用时长计算
        el = newConferenceDialog.find('select[name="conf-duration"]');
        el = el.find(':selected');
        var duration = parseInt(el.attr('data'));
        var expireTime = scheduleTime + (duration * 60 * 60 * 1000);

        // 邀请
        var idList = getAppendedParticipants();
        var invitationList = [];
        idList.forEach(function(value) {
            var contact = app.queryContact(value);
            invitationList.push(new Invitation(contact.getId(), contact.getName(), contact.getPriorityName()));
        });

        newConferenceDialog.find('.overlay').css('visibility', 'visible');

        // 创建会议
        cube.cs.createConference(subject, password, summary, scheduleTime, expireTime, invitationList, function(conference) {
            newConferenceDialog.modal('hide');
            g.dialog.showAlert('会议“<b>' + conference.subject + '</b>”已创建，计划开始时间是<b>' + g.formatFullTime(conference.scheduleTime) + '</b>。');

            // 刷新时间轴
            setTimeout(function() {
                app.confCtrl.ready();
            }, 1000);
        }, function(error) {
            newConferenceDialog.modal('hide');
            g.dialog.showAlert('创建会议失败，请稍后再试！错误码：' + error.code);
        });
    }


    /**
     * 会议控制器。
     * @param {CubeEngine} cubeEngine 
     */
    var ConferenceController = function(cubeEngine) {
        cube = cubeEngine;
        this.init();
    }

    ConferenceController.prototype.init = function() {
        timelineAll = new ConferenceTimeline($('#conf-timeline-all'));
        timelineActive = new ConferenceTimeline($('#conf-timeline-active'));
        timelineScheme = new ConferenceTimeline($('#conf-timeline-scheme'));
        timelineClosed = new ConferenceTimeline($('#conf-timeline-closed'));

        // 新建会议按钮
        $('button[data-toggle="new-conference"]').on('click', onNewConference);

        // 新建会议对话框
        newConferenceDialog = $('#new_conference_dialog');
        newConferenceDialog.find('#datetimepicker-schedule').datetimepicker({
            locale: 'zh-cn',
            stepping: 5
        });
        newConferenceDialog.find('#conf-participant button').on('click', onAppendParticipant);
        newConferenceDialog.find('button[data-target="confirm"]').on('click', onNewConfirm);
    }

    ConferenceController.prototype.ready = function() {
        var now = Date.now();
        var ending = now;
        var beginning = ending - (30 * 24 * 60 * 60 * 1000);
        cube.cs.listConferences(beginning, ending, function(list, beginning, ending) {

            timelineAll.update(list);

            var activeList = [];
            var schemeList = [];
            var closedList = [];

            list.forEach(function(value) {
                if (now < value.scheduleTime) {
                    schemeList.push(value);
                }
                else if (now >= value.scheduleTime && now <= value.expireTime) {
                    activeList.push(value);
                }
                else if (now > value.expireTime) {
                    closedList.push(value);
                }
            });

            timelineActive.update(activeList);
            timelineScheme.update(schemeList);
            timelineClosed.update(closedList);
        }, function(error) {
            console.log(error);
        });
    }

    ConferenceController.prototype.removeParticipantInNewDialog = function(id) {
        var el = newConferenceDialog.find('#conf-participant').find('div[data="' + id + '"]');
        el.remove();
    }

    ConferenceController.prototype.fireNewConference = function() {
        onNewConference();
    }

    g.ConferenceController = ConferenceController;

 })(window);

/**
 * 用于选择联系人的对话框。
 */
(function(g) {

    var that = null;

    var cube = null;

    var el = null;

    var callback = null;

    var disabledList = [];

    var confirmed = false;

    function onDialogClosed() {
        if (callback) {
            var list = [];

            if (confirmed) {
                el.find('.selected-table').find('input[type="checkbox"]').each(function(index, element) {
                    list.push(app.queryContact(parseInt(element.getAttribute('data'))));
                });
            }

            callback(list);
        }

        el.find('.selected-table').empty();
    }

    function onListCheckboxChange() {
        var el = $(this);
        var contact = app.queryContact(parseInt(el.attr('data')));

        if (el[0].checked) {
            that.append(contact);
        }
        else {
            that.remove(contact);
        }
    }

    function onSelectedCheckboxChange() {
        var el = $(this);
        var contact = app.queryContact(parseInt(el.attr('data')));
        if (!el[0].checked) {
            that.remove(contact);
        }
    }

    function onConfirmClick() {
        confirmed = true;
        el.modal('hide');
    }


    /**
     * 选择联系人对话框。
     * @param {Cube} cubeEngine 
     */
    var SelectContactsDialog = function(cubeEngine) {
        that = this;
        cube = cubeEngine;
        el = $('#select_contacts_dialog');
        el.on('hidden.bs.modal', onDialogClosed);
        el.find('button[data-target="confirm"]').on('click', onConfirmClick);
    }

    /**
     * 
     * @param {*} handlerCallback 
     * @param {*} disabledList 
     */
    SelectContactsDialog.prototype.show = function(handlerCallback, disabledList) {
        callback = handlerCallback;
        confirmed = false;

        var conEl = el.find('#select-contact-tabs-default div');
        conEl.empty();

        var list = app.getMyContacts();
        for (var i = 0; i < list.length; ++i) {
            var contact = list[i];
            var id = contact.getId();
            var avatar = contact.getContext().avatar;
            var name = contact.getPriorityName();

            var disabled = disabledList.indexOf(id) >= 0;

            var html = [
                '<div class="form-group"><div class="custom-control custom-checkbox select-group-member">',
                    '<input class="custom-control-input" type="checkbox" id="contact_', i, '" data="', id, '" ', disabled ? 'disabled="disabled"' : '', ' />',
                    '<label class="custom-control-label" for="contact_', i, '">',
                        '<img src="images/', avatar, '" />',
                        '<span>', name, '</span>',
                    '</label>',
                '</div></div>'
            ];

            conEl.append($(html.join('')));
        }

        el.modal('show');

        // 绑定事件
        conEl.find('input[type="checkbox"]').change(onListCheckboxChange);
    }

    SelectContactsDialog.prototype.append = function(contact) {
        var id = contact.getId();
        var html = [
            '<tr id="selected_tr_', id, '">',
                '<td class="text-center pl-3" width="40">',
                    '<div class="custom-control custom-checkbox">',
                        '<input class="custom-control-input" type="checkbox" id="selected_', id, '" data="', id, '" checked="">',
                        '<label for="selected_', id, '" class="custom-control-label">&nbsp;</label>',
                    '</div>',
                '</td>',
                '<td width="50">', '<img src="images/', contact.getContext().avatar, '" class="avatar" />', '</td>',
                '<td>', contact.getPriorityName(), '</td>',
            '</tr>'
        ];

        var tr = $(html.join(''));
        el.find('.selected-table').append(tr);

        // 绑定事件
        tr.find('input[type="checkbox"]').change(onSelectedCheckboxChange);
    }

    SelectContactsDialog.prototype.remove = function(contact) {
        el.find('.selected-table').find('#selected_tr_' + contact.getId()).remove();
    }

    g.SelectContactsDialog = SelectContactsDialog;

 })(window);

/**
 * 搜索对话框。
 */
(function(g) {
    'use strict';

    var SearchDialog = function() {
        var that = this;
        this.el = $('#search_dialog');

        this.overlay = this.el.find('.item-overlay');

        this.input = this.el.find('input[data-target="search-input"]');
        this.input.on('input', function() {
            that.onInputChanged();
        });

        this.resultEl = this.el.find('div[data-target="search-result"]');

        this.submitTimer = 0;
    }

    SearchDialog.prototype.show = function() {
        this.overlay.css('display', 'none');
        this.input.val('');
        this.resultEl.empty();
        this.el.modal('show');
    }

    SearchDialog.prototype.onInputChanged = function() {
        var that = this;
        var value = that.input.val().trim();
        if (value.length == 0) {
            if (that.submitTimer > 0) {
                clearTimeout(that.submitTimer);
                that.submitTimer = 0;
            }

            that.overlay.css('display', 'none');
            that.resultEl.empty();
            return;
        }

        if (that.submitTimer > 0) {
            clearTimeout(that.submitTimer);
        }
        that.submitTimer = setTimeout(function() {
            clearTimeout(that.submitTimer);
            that.submitTimer = 0;

            that.overlay.css('display', 'flex');
            that.resultEl.empty();

            // 搜索
            value = that.input.val().trim();
            if (value.length == 0) {
                that.overlay.css('display', 'none');
            }
            else {
                that.search(value);
            }
            console.log('Search keyword: "' + value + '"');
        }, 1000);
    }

    /**
     * 搜索。
     * @param {string} keyword 
     */
    SearchDialog.prototype.search = function(keyword) {
        var that = this;

        // 搜索联系人或者群组
        g.cube().contact.search(keyword, function(result) {
            if (result.contactList.length == 0 && result.groupList.length == 0) {
                that.resultEl.html('<div class="no-result">没有找到匹配的结果</div>');
            }
            else {
                result.contactList.forEach(function(contact) {
                    that.appendContact(contact);
                });

                that.resultEl.append($('<hr/>'))

                result.groupList.forEach(function(group) {
                    that.appendGroup(group);
                });
            }

            that.overlay.css('display', 'none');
        }, function() {
            that.overlay.css('display', 'none');
            that.resultEl.html('<div class="no-result">发生错误，请稍候再试</div>');
        });
    }

    SearchDialog.prototype.appendContact = function(contact) {
        var avatar = contact.getContext().avatar;

        var html = [
            '<div class="row align-items-center" data="', contact.getId(), '">',
                '<div class="col-2"><img src="images/', avatar, '" class="avatar"></div>',
                '<div class="col-7">',
                    '<span><a href="javascript:app.contactDetails.show(', contact.getId(), ');">', contact.getName(), '</a></span>',
                    '&nbsp;<span class="text-muted">(', contact.getId(), ')</span>',
                '</div>',
                '<div class="col-3" data-target="action">',
                '</div>',
            '</div>'
        ];
        var rowEl = $(html.join(''));

        this.resultEl.append(rowEl);

        g.cube().contact.containsContactInZone(g.app.contactZone, contact, function(contained, zoneName, contactId) {
            var action = null;

            if (contained) {
                action = '<span class="text-muted">已添加</span>';
            }
            else {
                action = '<button class="btn btn-sm btn-default" onclick="app.searchDialog.fireAddContactToZone(\''
                            + zoneName + '\', ' + contactId + ')">添加联系人</button>'
            }

            rowEl.find('div[data-target="action"]').html(action);
        });
    }

    SearchDialog.prototype.appendGroup = function(group) {
        var avatar = 'group-avatar.png';

        var html = [
            '<div class="row align-items-center" data="', group.getId(), '">',
                '<div class="col-2"><img src="images/', avatar, '" class="avatar"></div>',
                '<div class="col-7">',
                    '<span><a href="javascript:;">', group.getName(), '</a></span>',
                    '&nbsp;<span class="text-muted">(', group.getId(), ')</span>',
                '</div>',
                '<div class="col-3" data-target="action">',
                '</div>',
            '</div>'
        ];

        var rowEl = $(html.join(''));

        this.resultEl.append(rowEl);

        g.cube().contact.getGroup(group.getId(), function(group) {

        });
    }

    SearchDialog.prototype.fireAddContactToZone = function(zoneName, contactId) {
        var that = this;
        g.dialog.showPrompt('添加联系人', '附言', function(ok, value) {
            if (ok) {
                g.app.contactsCtrl.addContactToZone(zoneName, contactId, value, function(contact) {
                    if (null != contact) {
                        var el = that.resultEl.find('div[data="' + contactId + '"]');
                        el.find('div[data-target="action"]').html('<span class="text-muted">已添加</span>');
                    }
                });
            }
        }, '我是“' + g.app.account.name + '”。');
    }

    g.SearchDialog = SearchDialog;
    
 })(window);

/**
 * 事件监听器。
 */
(function(g) {

    var cube = null;
    var sidebarLogEl = null;
    var that = null;

    var AppEventCenter = function() {
        that = this;
        sidebarLogEl = $('aside.control-sidebar').find('#app-details-log');
    }

    AppEventCenter.prototype.start = function(cubeEngine) {
        cube = cubeEngine;

        // 监听网络状态
        cube.on('network', function(event) {
            if (event.name == 'failed') {
                g.dialog.launchToast(Toast.Error, '网络错误：' + event.error.code, true);
            }
            else if (event.name == 'connected') {
                g.dialog.launchToast(Toast.Info, '已连接到服务器', true);
                that.appendLog('Network', 'Ready');
            }
        });

        // 联系人登录相关事件
        cube.contact.on(ContactEvent.SignIn, function(event) {
            that.appendLog(event.name, event.data.id);
        });
        cube.contact.on(ContactEvent.SignOut, function(event) {
            that.appendLog(event.name, event.data.id);
        });
        cube.contact.on(ContactEvent.Comeback, function(event) {
            that.appendLog(event.name, event.data.id);
        });

        // 群组相关事件
        // 群组数据更新
        cube.contact.on(ContactEvent.GroupUpdated, function(event) {
            that.appendLog(event.name, event.data.name);
            that.onGroupUpdated(event.data);
        });
        cube.contact.on(ContactEvent.GroupCreated, function(event) {
            that.appendLog(event.name, event.data.name);
            that.onGroupCreated(event.data);
        });
        cube.contact.on(ContactEvent.GroupDissolved, function(event) {
            that.appendLog(event.name, event.data.name);
            that.onGroupDissolved(event.data);
        });
        cube.contact.on(ContactEvent.GroupMemberAdded, function(event) {
            that.appendLog(event.name, event.data.group.getName());
            that.onGroupMemberAdded(event.data.group);
        });
        cube.contact.on(ContactEvent.GroupMemberRemoved, function(event) {
            that.appendLog(event.name, event.data.group.getName());
            that.onGroupMemberRemoved(event.data.group);
        });

        // 消息相关事件
        cube.messaging.on(MessagingEvent.Notify, function(event) {
            var log = [
                event.data.getType(), ' - ',
                event.data.getSender().getName(), ' -> ',
                event.data.isFromGroup() ? event.data.getSourceGroup().getName() : event.data.getReceiver().getName()
            ];
            that.appendLog(event.name, log.join(''));
        });
        cube.messaging.on(MessagingEvent.Sent, function(event) {
            var log = [
                event.data.getType(), ' - ',
                event.data.getSender().getName(), ' -> ',
                event.data.isFromGroup() ? event.data.getSourceGroup().getName() : event.data.getReceiver().getName()
            ];
            that.appendLog(event.name, log.join(''));
        });
        cube.messaging.on(MessagingEvent.Recall, function(event) {
            console.log(event.data);
            // var log = [
            //     event.data.getType(), ' - ',
            //     event.data.getSender().getName(), ' -> ',
            //     event.data.isFromGroup() ? event.data.getSourceGroup().getName() : event.data.getReceiver().getName()
            // ];
            // that.appendLog(event.name, log.join(''));
        });
        // 消息被发送端阻止
        cube.messaging.on(MessagingEvent.SendBlocked, function(event) {
            var log = [
                event.data.getType(), ' - ',
                event.data.getSender().getName(), ' -> ',
                event.data.isFromGroup() ? event.data.getSourceGroup().getName() : event.data.getReceiver().getName()
            ];
            that.appendLog(event.name, log.join(''));
        });
        // 消息被接收端阻止
        cube.messaging.on(MessagingEvent.ReceiveBlocked, function(event) {
            var log = [
                event.data.getType(), ' - ',
                event.data.getSender().getName(), ' -> ',
                event.data.isFromGroup() ? event.data.getSourceGroup().getName() : event.data.getReceiver().getName()
            ];
            that.appendLog(event.name, log.join(''));
        });
    }

    /**
     * 添加到日志。
     * @param {*} event 
     * @param {*} desc 
     */
    AppEventCenter.prototype.appendLog = function(event, desc) {
        var date = new Date();

        var html = [
            '<div class="row align-items-center">',
                '<div class="col-3">',
                    g.formatNumber(date.getHours()), ':', g.formatNumber(date.getMinutes()), ':', g.formatNumber(date.getSeconds()),
                '</div>',
                '<div class="col-4"><b>',
                    event,
                '</b></div>',
                '<div class="col-5">',
                    desc,
                '</div>',
            '</div>'
        ];

        sidebarLogEl.append($(html.join('')));
    }

    AppEventCenter.prototype.onGroupUpdated = function(group) {
        // 更新消息界面
        g.app.messagingCtrl.updateGroup(group);
        // 更新联系人界面
        g.app.contactsCtrl.updateGroup(group);
    }

    AppEventCenter.prototype.onGroupCreated = function(group) {
        // 添加到联系人界面的表格
        g.app.contactsCtrl.updateGroup(group);

        // Toast 提示
        g.dialog.launchToast(Toast.Info,
            group.isOwner() ? '群组“' + group.getName() + '”已创建。' : 
                '“' + group.getOwner().getName() + '”邀请你加入群组“' + group.getName() + '” 。',
            true);
    }

    AppEventCenter.prototype.onGroupDissolved = function(group) {
        // 从联系人群组界面移除群组
        g.app.contactsCtrl.removeGroup(group);

        // 更新消息面板
        g.app.messagePanel.updatePanel(group.getId(), group);

        // Toast 提示
        g.dialog.launchToast(Toast.Info,
            '群组 “' + group.getName() + '” 已解散。',
            true);
    }

    AppEventCenter.prototype.onGroupMemberAdded = function(group) {
        g.app.messagePanel.updatePanel(group.getId(), group);
    }

    AppEventCenter.prototype.onGroupMemberRemoved = function(group) {
        g.app.messagePanel.updatePanel(group.getId(), group);
    }

    g.AppEventCenter = AppEventCenter;

})(window);
