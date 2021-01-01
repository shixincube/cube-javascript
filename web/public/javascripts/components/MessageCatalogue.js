/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020 Shixin Cube Team.
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
    'use strict'

    var MessageCatalogue = function(el) {
        this.el = el;
        this.items = [];
        this.lastItem = null;
    };

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
     * 追加菜单项
     * @param {Contact|Group|Account} value 
     */
    MessageCatalogue.prototype.appendItem = function(value) {
        var index = this.items.length;
        var id = 0;
        var el = null;
        var thumb = 'images/group-avatar.png';
        var label = null;
        var desc = null;
        var badge = null;

        if (value instanceof Group) {
            id = value.getId();
            label = value.getName();
            desc = ' ';
            badge = formatShortTime(value.getLastActiveTime());
        }
        else if (value instanceof Contact) {
            id = value.getId();
            label = value.getName();
            desc = ' ';
            badge = '';
        }
        else {
            id = value.id;
            thumb = value.avatar;
            label = value.name;
            desc = ' ';
            badge = '';
        }

        if (null == label) {
            return;
        }

        var item = this.getItem(id);
        if (null != item) {
            return;
        }

        item = {
            index: index,
            id: id,
            el: el,
            thumb: thumb,
            label: label,
            desc: desc,
            badge: badge,
            time: 0
        };

        this.items.push(item);

        var html = [
            '<li id="mc_item_', index, '" class="item pl-2 pr-2" data="', id, '">',
                '<div class="product-img"><img class="img-size-50 img-round-rect" src="', thumb ,'"/></div>',
                '<div class="product-info ellipsis">',
                    '<span class="product-title ellipsis">',
                        '<span class="title">', label, '</span>',
                        '<span class="badge badge-light float-right">', badge, '</span>',
                    '</span>',
                    '<span class="product-description">', desc, '</span>',
                '</div>',
            '</li>'];

        var el = $(html.join(''));

        item.el = el;

        this.el.append(el);

        // 绑定事件
        this.bindEvent(el);
    }

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
            console.log('[App] MessageCatalogue#updateItem() 输入参数错误');
            return false;
        }

        var item = this.getItem(id);
        if (null == item) {
            return false;
        }

        var el = item.el;

        if (null != desc) {
            if (typeof desc === 'string') {
                el.find('.product-description').text(desc);
            }
            else if (desc instanceof TextMessage) {
                el.find('.product-description').text(desc.getText());
            }
            else if (desc instanceof FileMessage) {
                var msg = desc;
                if (msg.hasAttachment()) {
                    el.find('.product-description').text('[文件] ' + msg.getFileName());
                }
                else {
                    el.find('.product-description').text('[文件]');
                }
            }
            else if (desc instanceof File) {
                el.find('.product-description').text('[文件] ' + desc.name);
            }
            else {
                return false;
            }
        }

        // 更新时间
        item.time = time;

        el.find('.badge').text(formatShortTime(time));

        if (label) {
            el.find('.title').text(label);
        }

        el.remove();
        this.el.prepend(el);

        // 绑定事件
        this.bindEvent(el);

        return true;
    }

    MessageCatalogue.prototype.refreshOrder = function() {
        this.items.sort(function(a, b) {
            return b.time - a.time;
        });

        this.el.empty();
        var that = this;
        this.items.forEach(function(item) {
            that.el.append(item.el);
            that.bindEvent(item.el);
        });
    }

    MessageCatalogue.prototype.onItemClick = function(id) {
        if (null != this.lastItem) {
            if (this.lastItem.id == id) {
                // 同一个 item 元素
                return;
            }

            this.lastItem.el.removeClass('catalog-active');
        }

        var current = this.getItem(id);

        current.el.addClass('catalog-active');

        this.lastItem = current;

        // 切换消息面板
        g.app.messagingCtrl.toggle(this.lastItem.id);
    }

    MessageCatalogue.prototype.onItemDoubleClick = function(id) {
        var entity = g.app.queryContact(id);
        if (entity instanceof Contact) {
            g.app.contactDetails.show(entity);
        }
    }

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
    }

    g.MessageCatalogue = MessageCatalogue;

})(window);
