/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020-2022 Cube Team.
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
        var avatar = g.helper.getAvatarImage(contact.getContext().avatar);

        var html = [
            '<div class="row align-items-center" data="', contact.getId(), '">',
                '<div class="col-2"><img src="', avatar, '" class="avatar"></div>',
                '<div class="col-7">',
                    '<span><a href="javascript:app.contactDetails.show(', contact.getId(), ');">', contact.getName(), '</a></span>',
                    '&nbsp;<span class="text-muted">(', contact.getId(), ')</span>',
                '</div>',
                '<div class="col-3" data-target="action">','</div>',
            '</div>'
        ];
        var rowEl = $(html.join(''));

        this.resultEl.append(rowEl);

        const current = contact;

        if (current.getId() == app.account.id) {
            rowEl.find('div[data-target="action"]').html('<span></span>');
        }
        else {
            g.cube().contact.getDefaultContactZone(function(zone) {
                var action = null;
                if (zone.contains(current)) {
                    action = '<span class="text-muted">已添加</span>';
                }
                else {
                    action = '<button class="btn btn-sm btn-default" onclick="app.searchDialog.fireAddContactToZone(\''
                                + zone.getName() + '\',' + current.getId() + ')">添加联系人</button>';
                }
                rowEl.find('div[data-target="action"]').html(action);
            }, function(error) {
                console.log('Contact zone error: ' + error.code);
            });
        }
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
        }, '您好，我是“' + g.app.account.name + '”。');
    }

    g.SearchDialog = SearchDialog;
    
 })(window);
