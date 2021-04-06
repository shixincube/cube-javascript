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
            for (var i = 0; i < this.items.length; ++i) {
                var curItem = this.items[i];
                var itemIndex = this.topItems.indexOf(curItem);
                if (itemIndex >= 0) {
                    continue;
                }

                curItem.el.before(el);
                break;
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
        else if (target instanceof Contact) {
            id = target.getId();
        }
        else if (target instanceof Group) {
            id = target.getId();
        }
        else {
            console.log('[App] MessageCatalogue#updateItem 输入参数错误');
            return false;
        }

        var item = this.getItem(id);
        if (null == item) {
            if (!this.appendItem(target)) {
                return false;
            }

            item = this.getItem(id);
        }

        var el = item.el;

        if (null != desc) {
            item.lastDesc = item.desc;

            if (typeof desc === 'string') {
                item.desc = desc;
            }
            else if (desc instanceof TextMessage) {
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

            el.find('.product-description').text(item.desc);
        }
        else {
            el.find('.product-description').text('　');
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

        el.remove();
        // 将节点添加到首位
        this.el.prepend(el);

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



    MessageCatalogue.prototype.restoreLastDesc = function(target) {
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

        item.el.find('.product-description').text(item.lastDesc);
        item.desc = item.lastDesc;
        item.lastDesc = '　';
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
    'use strict';

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
            }
            editor.create();
            editor.disable();
            this.inputEditor = editor;

            $('#message-editor').find('.w-e-text').keypress(function(event) {
                that.onEditorKeypress(event);
            });
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

        // 详情按钮
        el.find('button[data-target="details"]').on('click', function(e) {
            that.onDetailsClick(e);
        });

        // 新建群组
        this.btnNewGroup = el.find('button[data-target="new-group"]');
        this.btnNewGroup.on('click', function(e) {
            g.app.newGroupDialog.show();
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
     * @returns {object} 返回当前面板。
     */
    MessagePanel.prototype.getCurrentPanel = function() {
        return this.current;
    }

    /**
     * @param {number} id 指定面板 ID 。
     * @returns {object}
     */
    MessagePanel.prototype.getPanel = function(id) {
        return this.panels[id.toString()];
    }

    /**
     * 更新面板数据。
     * @param {number} id 
     * @param {Contact|Group} entity 
     */
    MessagePanel.prototype.updatePanel = function(id, entity) {
        var panel = this.panels[id.toString()];
        if (undefined === panel) {
            var el = $('<div class="direct-chat-messages"></div>');
            panel = {
                id: id,
                el: el,
                entity: entity,
                messageIds: [],
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
            var el = $('<div class="direct-chat-messages"></div>');
            panel = {
                id: id,
                el: el,
                entity: entity,
                messageIds: [],
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

            this.btnSend.removeAttr('disabled');
            this.btnSendFile.removeAttr('disabled');
        }
        else {
            // 生成草稿
            var text = activeEditor ? this.inputEditor.txt.text() : this.elInput.val().trim();
            if (text.length > 0) {
                // 保存草稿
                if (window.cube().messaging.saveDraft(this.current.entity, new TextMessage(text))) {
                    g.app.messageCatalog.updateItem(this.current.id, '[草稿] ' + text, null, null);
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
            if (!this.btnVideoCall[0].hasAttribute('disabled')) {
                this.btnVideoCall.attr('disabled', 'disabled');
            }
            if (!this.btnVoiceCall[0].hasAttribute('disabled')) {
                this.btnVoiceCall.attr('disabled', 'disabled');
            }

            this.elTitle.text(entity.getName());
        }
        else {
            this.btnVideoCall.removeAttr('disabled');
            this.btnVoiceCall.removeAttr('disabled');

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
            g.app.messageCatalog.restoreLastDesc(panel.id);
            if (activeEditor) {
                that.inputEditor.txt.html('<p>' + draft.getMessage().getText() + '</p>');
            }
            else {
                that.elInput.val(draft.getMessage().getText());
            }
        });
    }

    /**
     * 清空指定面板。
     * @param {number} id 指定面板 ID 。
     */
    MessagePanel.prototype.clearPanel = function(id) {
        var panel = this.panels[id.toString()];
        if (undefined != panel) {
            panel.el.remove();

            if (this.current == panel) {
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
     */
    MessagePanel.prototype.appendMessage = function(target, sender, message) {
        var panelId = target.getId();

        var panel = this.panels[panelId.toString()];
        if (undefined === panel) {
            var el = $('<div class="direct-chat-messages"></div>');
            panel = {
                id: panelId,
                el: el,
                entity: target,
                messageIds: [],
                unreadCount: 0,
                groupable: (target instanceof Group)
            };
            this.panels[panelId.toString()] = panel;
        }

        var id = message.getId();
        var time = message.getRemoteTimestamp();

        var index = panel.messageIds.indexOf(id);
        if (index >= 0) {
            return;
        }
        // 更新消息 ID 列表
        panel.messageIds.push(id);

        // 更新未读数量
        if (!message.isRead()) {
            panel.unreadCount += 1;
        }

        var right = '';
        var nfloat = 'float-left';
        var tfloat = 'float-right';

        if (sender.getId() == g.app.getSelf().getId()) {
            right = 'right';
            nfloat = 'float-right';
            tfloat = 'float-left';
        }

        var text = null;
        var attachment = null;

        if (message instanceof TextMessage) {
            text = message.getText();
        }
        else if (message instanceof ImageMessage || message instanceof FileMessage) {
            attachment = message.getAttachment();
        }
        else if (message instanceof CallRecordMessage) {
            var icon = message.getConstraint().video ? '<i class="fas fa-video"></i>' : '<i class="fas fa-phone"></i>';
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
        else {
            return;
        }

        if (null != attachment) {
            var action = null;
            var fileDesc = null;

            if (attachment.isImageType()) {
                action = ['javascript:dialog.showImage(\'', attachment.getFileCode(), '\');'];

                fileDesc = ['<table class="file-label" border="0" cellspacing="4" cellpodding="0">',
                    '<tr>',
                        '<td>',
                            '<img class="thumb" src="', attachment.getDefaultThumbURL(), '" onclick="', action.join(''), '" ',
                                'alt="', attachment.getFileName(), '"', ' />',
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

        var html = ['<div id="', id, '" class="direct-chat-msg ', right, '"><div class="direct-chat-infos clearfix">',
            '<span class="direct-chat-name ', nfloat, panel.groupable ? '' : ' no-display', '">',
                sender.getPriorityName(),
            '</span><span class="direct-chat-timestamp ', tfloat, '">',
                formatFullTime(time),
            '</span></div>',
            '<img src="images/', sender.getContext().avatar, '" class="direct-chat-img">',
            '<div data-id="', id, '" data-owner="', right.length > 0, '" class="direct-chat-text">', text, '</div></div>'
        ];

        var parentEl = panel.el;
        parentEl.append($(html.join('')));

        // 滚动条控制
        var offset = parseInt(this.elContent.prop('scrollHeight'));
        this.elContent.scrollTop(offset);
    }

    /**
     * 插入注解内容到消息面板。
     * @param {Contact|Group} target 面板对应的数据实体。
     * @param {string} note 注解内容。
     */
    MessagePanel.prototype.appendNote = function(target, note) {
        var panelId = target.getId();

        var panel = this.panels[panelId.toString()];
        if (undefined === panel) {
            var el = $('<div class="direct-chat-messages"></div>');
            panel = {
                id: panelId,
                el: el,
                entity: target,
                messageIds: [],
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

    /**
     * 当触发发送消息事件时回调。
     * @param {*} e 
     */
    MessagePanel.prototype.onSend = function(e) {
        var text = activeEditor ? this.inputEditor.txt.text() : this.elInput.val();
        if (text.length == 0) {
            return;
        }

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
    }

    /**
     * 当触发点击详情是回调。
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
     * 当消息输入框内容变化时回调。
     * @param {string} html 
     */
    MessagePanel.prototype.onEditorChange = function(html) {
        // var text = html.replace(/<[^<>]+>/g, "");
        // var content = html.replaceAll('<br/>', '');
        // if (content.endsWith('</p>')) {
        //     content = content.substr(0, content.length - 4) + '<br/></p>';
        // }
        // console.log(content);
        // this.inputEditor.txt.html(content + '<br/>');
    }

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

    MessagePanel.prototype.makeAtPanel = function(group) {
        var list = group.getMembers();
        var num = 2;

        this.atElList = [];
        this.atPanel.empty();

        var dom = null;
        var parentId = $('#message-editor').find('.w-e-text').attr('id');
        var cursor = getCurrentCursorPosition(parentId);
        var dom = cursor.node;

        if (dom == null) {
            return;
        }

        var left = parseInt(dom.offsetLeft) + parseInt(dom.offsetParent.offsetLeft);
        var top = parseInt(dom.offsetTop) + parseInt(dom.offsetParent.offsetTop);

        left += (cursor.charCount * 10);

        if (num <= 5) {
            this.atPanel.css('height', ((num * 32) + 2) + 'px');
            top -= ((num * 32) + 4);
        }
        else {
            this.atPanel.css('height', '162px');
            top -= 170;
        }

        for (var i = 0; i < num; ++i) {
            var member = list[i];

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

    MessagePanel.prototype.selectAtItem = function() {
        if (!that.current.groupable) {
            return;
        }

        var id = parseInt(that.atPanel.find('.active').attr('data'));
        var member = that.current.entity.getMemberById(id);
        var atContent = '<p class="at" data="' + id + '">@' + that.current.entity.getMemberName(member) + '</p>';
        that.inputEditor.txt.append('&nbsp;');
        that.inputEditor.txt.append(atContent);
        that.inputEditor.txt.append('&nbsp;');
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
            that.atPanel.blur();
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


    function isChildOf(node, parentId) {
        while (node !== null) {
            if (node.id === parentId) {
                return true;
            }
            node = node.parentNode;
        }

        return false;
    }

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

    // 获取元素的纵坐标 
    function getTop(e) {
        var offset = e.offsetTop;
        if (e.offsetParent != null)
            offset += getTop(e.offsetParent);
        return offset;
    }

    // 获取元素的横坐标 
    function getLeft(e) {
        var offset = e.offsetLeft;
        if (e.offsetParent != null)
            offset += getLeft(e.offsetParent);
        return offset;
    }

    g.MessagePanel = MessagePanel;

})(window);

(function(g) {
    'use strict'

    var that = null;

    var currentGroup = null;
    var currentGroupRemark = null;
    var currentGroupNotice = null;

    var sidebarEl = null;

    var imageFileListEl = null;

    var inputGroupRemark = null;
    var btnGroupRemark = null;

    var textGroupNotice = null;

    var memberListEl = null;

    function onGroupRemarkButtonClick() {
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
        onGroupRemarkButtonClick();
    }

    function onNoticeButtonClick() {
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
        onNoticeButtonClick();
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

    var MessageSidebar = function(el) {
        that = this;

        sidebarEl = el;
        imageFileListEl = sidebarEl.find('.image-file-list');

        inputGroupRemark= sidebarEl.find('input[data-target="group-remark"]');
        inputGroupRemark.attr('disabled', 'disabled');
        inputGroupRemark.blur(onGroupRemarkBlur);

        btnGroupRemark = sidebarEl.find('button[data-target="remark"]');
        btnGroupRemark.click(onGroupRemarkButtonClick);

        textGroupNotice = sidebarEl.find('textarea[data-target="group-notice"]');
        textGroupNotice.attr('disabled', 'disabled');
        textGroupNotice.blur(onNoticeBlur);
        sidebarEl.find('button[data-target="notice"]').click(onNoticeButtonClick);

        memberListEl = sidebarEl.find('.group-member-list');
    }

    /**
     * 使用群组数据更新数据。
     * @param {Group} group 
     */
    MessageSidebar.prototype.update = function(group) {
        currentGroup = group;

        sidebarEl.find('input[data-target="group-name"]').val(group.getName());

        if (!currentGroup.isOwner()) {
            sidebarEl.find('.group-notice-btn-group').css('display', 'none');
        }
        else {
            sidebarEl.find('.group-notice-btn-group').css('display', 'block');
        }

        // 读取群组的附录，从附录里读取群组的备注
        window.cube().contact.getAppendix(group, function(appendix) {
            inputGroupRemark.val(appendix.getRemark());
            textGroupNotice.val(appendix.getNotice());
        }, function(error) {
            console.log(error.toString());
        });

        // 加载成员列表
        memberListEl.empty();

        group.getMembers().forEach(function(element) {
            g.app.getContact(element.getId(), function(contact) {
                var operate = [ '<button class="btn btn-sm btn-default btn-flat"' ,
                    ' onclick="javascript:app.messageSidebar.fireUpdateMemberRemark(', contact.getId(), ');"><i class="fas fa-edit"></i></button>' ];
                var html = [
                    '<div class="group-member-cell" data-target="', contact.getId(), '" ondblclick="javascript:app.messagingCtrl.toggle(', contact.getId(), ');">',
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

        // 检索群组的图片
        window.cube().fs.getRoot(group, function(root) {
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
        });
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
        this.el = el;
        that = this;

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
                that.btnCam.empty();
                that.btnCam.append($('<i class="ci ci-btn ci-camera-opened"></i>'));
            }
            else {
                // 摄像头已停用
                that.btnCam.empty();
                that.btnCam.append($('<i class="ci ci-btn ci-camera-closed"></i>'));
            }
        });
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

        this.el.draggable({ disabled: true });
    }

    /**
     * 发起通话。
     * @param {Contact} target 
     */
    VideoChatPanel.prototype.showMakeCall = function(target) {
        console.log('发起视频连线 ' + target.getId());

        if (g.app.callCtrl.makeCall(target, true)) {
            this.elRemoteLabel.text(target.getName());
            this.elLocalLabel.text('我');

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
     * 发起应答。
     * @param {Contact} caller 
     */
    VideoChatPanel.prototype.showAnswerCall = function(caller) {
        console.log('应答视频通话 ' + caller.getId());

        this.elRemoteLabel.text(caller.getName());
        this.elLocalLabel.text('我');

        this.el.modal({
            keyboard: false,
            backdrop: false
        });
    }

    /**
     * 关闭窗口。
     */
    VideoChatPanel.prototype.close = function() {
        this.el.modal('hide');
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

        this.btnCam.removeAttr('disabled');
        this.btnMic.removeAttr('disabled');
        this.btnVol.removeAttr('disabled');

        callingTimer = setInterval(function() {
            that.headerTip.text(g.formatClockTick(++callingElapsed));
        }, 1000);
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
     * @param {Contact} contact 
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
            currentContact = g.app.queryContact(contactId);
            if (null == currentContact) {
                g.cube().contact.getContact(contactId, function(contact) {
                    currentContact = contact;
                    handler(currentContact);
                });
            }
            else {
                handler(currentContact);
            }
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
    'use strict'

    var lastGroup = null;
    var lastTimestamp = 0;

    var elGroupName = null;

    var btnModify = null;
    var btnAddMember = null;
    var btnQuit = null;
    var btnDissolve = null;

    var fireModify = function() {
        g.dialog.showPrompt('修改群组名称', '请输入新的群组名', function(ok, text) {
            if (ok) {
                if (text.length >= 3) {
                    g.app.messagingCtrl.modifyGroupName(lastGroup, text, function(group) {
                        // 修改对话框里的群组名
                        elGroupName.text(group.getName());
                        // 更新消息界面
                        g.app.messagingCtrl.updateGroup(group);
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
            'app.messagingCtrl.removeGroupMember(', 
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
     */
    NewGroupDialog.prototype.show = function() {
        contacts = g.app.getMyContacts();

        elGroupName.val('');
        elMyContacts.empty();

        for (var i = 0; i < contacts.length; ++i) {
            var contact = contacts[i];
            var id = contact.getId();
            var avatar = contact.getContext().avatar;
            var name = contact.getPriorityName();

            var html = [
                '<div class="col-6"><div class="form-group"><div class="custom-control custom-checkbox select-group-member">',
                    '<input class="custom-control-input" type="checkbox" id="group_member_', i, '" data="', id, '" />',
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
    'use strict'

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
     * @param {jQuery} el 
     */
    var ContactListDialog = function(el) {
        dialogEl = el;
        btnConfirm = el.find('button[data-target="confirm"]');

        btnConfirm.click(fireConfirm);
    }

    /**
     * 显示联系人列表对话框。
     * @param {Array} list 联系人列表。
     * @param {Array} selectedList 已经被选中的联系人列表。
     * @param {function} confirmHandle 确认事件回调。
     */
    ContactListDialog.prototype.show = function(list, selectedList, confirmHandle) {
        currentList = list;
        preselected = selectedList;

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
                '<tr>',
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

    g.ContactListDialog = ContactListDialog;

})(window);

(function(g) {
    'use strict';

    var that = null;

    var cube = null;

    var elSelectFile = null;

    var colCatalog = null;
    var colContent = null;
    var colSidebar = null;

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

        // 监听消息已发送事件
        cube.messaging.on(MessagingEvent.Sent, function(event) {
            var message = event.data;
            g.app.messagePanel.appendMessage(g.app.messagePanel.current.entity, g.app.getSelf(), message);
            if (message.isFromGroup()) {
                g.app.messageCatalog.updateItem(message.getSource(), message, message.getRemoteTimestamp());
            }
            else {
                g.app.messageCatalog.updateItem(message.getTo(), message, message.getRemoteTimestamp());
            }
        });

        // 监听接收消息事件
        cube.messaging.on(MessagingEvent.Notify, function(event) {
            var message = event.data;
            // 触发 UI 事件
            that.onNewMessage(message);
        });
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

        var time = Date.now() - g.AWeek;
        var count = 0;

        var handler = function(message) {
            // 判断自己是否是该消息的发件人
            if (cube.messaging.isSender(message)) {
                g.app.messagePanel.appendMessage(message.getReceiver(), message.getSender(), message);
            }
            else {
                g.app.messagePanel.appendMessage(message.getSender(), message.getSender(), message);
            }

            --count;
            if (completed && count == 0) {
                completed();
            }
        }

        cube.messaging.queryMessageWithContact(contact, time, function(id, time, list) {
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
        var time = Date.now() - g.AWeek;
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
                        g.app.messagePanel.appendMessage(group, sender, msg);
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

        cube.messaging.queryMessageWithGroup(group, time, function(groupId, time, list) {
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
    }

    /**
     * 更新群组在 UI 里的信息。
     * @param {Group} group 
     */
    MessagingController.prototype.updateGroup = function(group) {
        g.app.messagePanel.updatePanel(group.getId(), group);
        g.app.messageCatalog.updateItem(group, null, null, group.getName());
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
            message = new TextMessage(content);
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
                g.app.getContact(id, handle);
                that.hideSidebar();
            }
            else {
                handle(group);
                g.app.messageSidebar.update(group);
                that.showSidebar();
            }
        });
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
     * 打开语音通话界面。
     * @param {Contact} target 通话对象。
     */
    MessagingController.prototype.openVoiceCall = function(target) {
        g.app.voiceCallPanel.showMakeCall(target);
    }

    /**
     * 打开视频通话界面。
     * @param {Contact} target 通话对象。
     */
    MessagingController.prototype.openVideoChat = function(target) {
        g.app.videoChatPanel.showMakeCall(target);
    }

    /**
     * 从 Cube 收到新消息时回调该方法。
     * @param {Message} message 收到的消息。
     */
    MessagingController.prototype.onNewMessage = function(message) {
        // 判断消息是否来自群组
        if (message.isFromGroup()) {
            // 更新消息面板
            g.app.messagePanel.appendMessage(message.getSourceGroup(), message.getSender(), message);

            // 更新消息目录
            g.app.messageCatalog.updateItem(message.getSource(), message, message.getRemoteTimestamp());

            that.updateUnread(group.getId(), message);
        }
        else {
            // 消息来自联系人

            if (g.app.account.id == message.getFrom()) {
                // 从“我”的其他终端发送的消息
                // 更新消息面板
                g.app.messagePanel.appendMessage(message.getReceiver(), message.getSender(), message);
                // 更新消息目录
                g.app.messageCatalog.updateItem(message.getTo(), message, message.getRemoteTimestamp());

                that.updateUnread(message.getTo(), message);
            }
            else {
                // 更新消息面板
                g.app.messagePanel.appendMessage(message.getSender(), message.getSender(), message);
                // 更新消息目录
                g.app.messageCatalog.updateItem(message.getFrom(), message, message.getRemoteTimestamp());

                that.updateUnread(message.getFrom(), message);
            }
        }
    }

    MessagingController.prototype.updateUnread = function(id, message) {
        var panel = g.app.messagePanel.getCurrentPanel();
        if (null == panel) {
            return;
        }

        if (message.isRead()) {
            return;
        }

        if (panel.id == id) {
            // 将新消息标记为已读
            cube.messaging.markRead(message);
        }
        else {
            panel = g.app.messagePanel.getPanel(id);
            if (panel.unreadCount > 0) {
                g.app.messageCatalog.updateBadge(id, panel.unreadCount);
            }
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
     * 移除群组成员。
     * @param {number} groupId 
     * @param {number} memberId 
     * @param {funciton} handle 
     */
    MessagingController.prototype.removeGroupMember = function(groupId, memberId, handle) {
        var group = getGroup(groupId);
        var member = getContact(memberId);
        var memName = null;
        if (null != member) {
            memName = member.getName();
        }
        else {
            memName = memberId;
        }

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
    }

    /**
     * 从界面上移除群组。
     * @param {Group} group 
     */
    MessagingController.prototype.removeGroup = function(group) {
        g.app.messageCatalog.removeItem(group);
        g.app.messagePanel.clearPanel(group.getId());
        this.hideSidebar();
    }

    /**
     * 从界面上移除联系人。
     * @param {Group} group 
     */
     MessagingController.prototype.removeContact = function(contact) {
        g.app.messageCatalog.removeItem(contact);
        g.app.messagePanel.clearPanel(contact.getId());
    }

    g.MessagingController = MessagingController;

})(window);

(function(g) {
    'use strict'

    var cube = null;

    var that = null;

    var working = false;

    var voiceCall = false;

    var volume = 0.7;

    function onInProgress(target) {
    }

    function onRinging(event) {
        if (voiceCall) {
            g.app.voiceCallPanel.tipWaitForAnswer(event.data.getCallee());
        }
        else {
            g.app.videoChatPanel.tipWaitForAnswer(event.data.getCallee());
        }
    }

    function onConnected(event) {
        if (voiceCall) {
            g.app.voiceCallPanel.tipConnected();
        }
        else {
            g.app.videoChatPanel.tipConnected();
        }
    }

    function onMediaConnected(event) {

    }

    function onMediaDisconnected(event) {
        
    }

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

    function onBye(event) {
        var record = event.data;
        working = false;

        // console.log('DEBUG - ' + record.getCaller().getId() + ' -> ' + record.getCallee().getId());

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
        else {
            g.dialog.launchToast(Toast.Warning, '通话失败，故障码：' + error.code);
        }

        setTimeout(function() {
            if (voiceCall) {
                g.app.voiceCallPanel.close();
                g.app.voiceCallPanel.closeNewCallToast();
            }
            else {
                g.app.videoChatPanel.close();
                g.app.videoChatPanel.closeNewCallToast();
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
    }

    /**
     * 发起通话请求。
     * @param {Contact} target 
     * @param {boolean} videoEnabled 
     */
    CallController.prototype.makeCall = function(target, videoEnabled) {
        if (working) {
            return false;
        }

        working = true;

        if (videoEnabled) {
            voiceCall = false;

            // 设置媒体容器
            cube.mpComm.setRemoteVideoElement(g.app.videoChatPanel.remoteVideo);
            cube.mpComm.setLocalVideoElement(g.app.videoChatPanel.localVideo);
        }
        else {
            voiceCall = true;

            // 设置媒体容器
            cube.mpComm.setRemoteVideoElement(g.app.voiceCallPanel.remoteVideo);
            cube.mpComm.setLocalVideoElement(g.app.voiceCallPanel.localVideo);
        }

        // 媒体约束
        var mediaConstraint = new MediaConstraint(videoEnabled, true);
        // 发起通话
        return cube.mpComm.makeCall(target, mediaConstraint);
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
                g.app.voiceCallPanel.showAnswerCall(cube.mpComm.getActiveRecord().getCaller());
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
                g.app.videoChatPanel.showAnswerCall(cube.mpComm.getActiveRecord().getCaller());
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

        if (cube.mpComm.hangupCall()) {
            if (voiceCall) {
                g.app.voiceCallPanel.close();
                g.app.voiceCallPanel.closeNewCallToast();
            }
            else {
                g.app.videoChatPanel.close();
                g.app.videoChatPanel.closeNewCallToast();
            }
        }
        else {
            console.error('终止通话时发生错误。');

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
    'use strict';

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
    'use strict';

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
    'use strict';

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

            /*
            var html = [
                '<tr data-target="', i, '">',
                    '<td>', (page - 1) * 10 + (i + 1), '</td>',
                    '<td><img class="table-avatar" src="', avatar, '" /></td>',
                    '<td>', entity.getName(), '</td>',
                    '<td class="text-muted">', appendix.hasRemark() ? appendix.getRemark() : '', '</td>',
                    '<td>', entity.getId(), '</td>',
                    '<td>', appendix.getNotice(), '</td>',
                    '<td class="members">', '</td>',
                    '<td class="text-right">',
                        '<a class="btn btn-primary btn-sm" href="javascript:app.contactsCtrl.goToMessaging(', i, ');"><i class="fas fa-comments"></i> 发消息</a>',
                        '<a class="btn btn-info btn-sm" href="javascript:app.contactsCtrl.editRemark(', i, ');" style="margin-left:8px;"><i class="fas fa-pencil-alt"></i> 备注</a>',
                    '</td>',
                '</tr>'
            ];
            tbodyEl.append($(html.join('')));
            */

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
        else {
            currentTable = pendingTable;
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
        app.toggle('messaging', 'tab_messaging');

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
     * @param {function} callback
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

 (function(g) {
    'use strict';

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
    'use strict';

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
        cube.contact.on(ContactEvent.GroupUpdated, function(event) {
            that.appendLog(event.name, event.data.name);
        });
        cube.contact.on(ContactEvent.GroupCreated, function(event) {
            that.appendLog(event.name, event.data.name);
            that.onGroupCreated(event.data);
        });
        cube.contact.on(ContactEvent.GroupDissolved, function(event) {
            that.appendLog(event.name, event.data.name);
            that.onGroupDissolved(event.data);
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
            '<div class="row">',
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

    g.AppEventCenter = AppEventCenter;

})(window);
