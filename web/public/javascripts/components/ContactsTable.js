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