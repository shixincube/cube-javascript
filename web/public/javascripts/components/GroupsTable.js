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
 