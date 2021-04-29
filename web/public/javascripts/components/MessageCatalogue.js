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
                    '<div class="item-state">',
                    '</div>',
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
     * @param {number} id 
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

    /**
     * 恢复上一次的描述时信。
     * @param {*} target 
     * @param {*} desc 
     */
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

    /**
     * 更新消息气泡。
     * @param {*} id 
     * @param {*} badge 
     */
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
     * 更新状态。
     * @param {number} id 
     * @param {string} state 指定状态：'video', 'voice', 'none' 。
     */
    MessageCatalogue.prototype.updateState = function(id, state) {
        var item = this.getItem(id);
        if (null == item) {
            return;
        }

        var stateEl = item.el.find('.item-state');
        if (state == 'video') {
            stateEl.html('<div><i class="fas fa-video"></i></div>');
        }
        else if (state == 'voice' || state == 'audio') {
            stateEl.html('<div><i class="fas fa-phone-alt"></i></div>');
        }
        else {
            stateEl.html('');
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

        el.find('.item-state').on('mouseenter', function() {
            el.find('.top-action').css('visibility', 'visible');
        });
        el.find('.item-top').on('mouseleave', function() {
            el.find('.top-action').css('visibility', 'hidden');
        });
    }

    g.MessageCatalogue = MessageCatalogue;

})(window);
