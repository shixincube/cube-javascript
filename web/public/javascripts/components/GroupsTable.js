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

    var curPage = 0;

    var GroupsTable = function(el) {
        that = this;
        container = el;
        tableEl = el.find('.table');
        tbodyEl = tableEl.find('tbody');
        pagingEl = el.find('.pagination');
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

    GroupsTable.prototype.reset = function() {
        curPage = 0;
    }

    GroupsTable.prototype.showPage = function(page, contacts) {
        if (page == curPage) {
            return;
        }

        if (curPage > 0) {
            pagingEl.find('.page-' + curPage).removeClass('active');
        }
        pagingEl.find('.page-' + page).addClass('active');
        // 更新页码
        curPage = page;

        tbodyEl.empty();

        for (var i = 0; i < contacts.length; ++i) {
            var contact = contacts[i];
            var ctx = contact.getContext();
            var appendix = contact.getAppendix();
            var html = [
                '<tr data-target="', i, '">',
                    '<td>', (page - 1) * 10 + (i + 1), '</td>',
                    '<td><img class="table-avatar" src="', ctx.avatar, '" /></td>',
                    '<td>', contact.getName(), '</td>',
                    '<td class="text-muted">', appendix.hasRemarkName() ? appendix.getRemarkName() : '', '</td>',
                    '<td>', contact.getId(), '</td>',
                    '<td>', ctx.region, '</td>',
                    '<td>', ctx.department, '</td>',
                    '<td class="text-right">',
                        '<a class="btn btn-primary btn-sm" href="javascript:app.contactsCtrl.goToMessaging(', i, ');"><i class="fas fa-comments"></i> 发消息</a>',
                        '<a class="btn btn-info btn-sm" href="javascript:app.contactsCtrl.editRemark(', i, ');" style="margin-left:8px;"><i class="fas fa-pencil-alt"></i> 备注</a>',
                    '</td>',
                '</tr>'
            ];
            tbodyEl.append($(html.join('')));
        }
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