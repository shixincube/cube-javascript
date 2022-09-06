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
        return currentPage[index].contact;
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
            var name = null;
            var avatar = null;
            var action = null;

            if (entity instanceof ContactZoneParticipant) {
                name = entity.getName();
                if (null != entity.contact) {
                    avatar = g.helper.getAvatarImage(entity.contact.getContext().avatar);
                    if (entity.isInviter()) {
                        // 本人发出的邀请
                        if (entity.state == ContactZoneParticipantState.Pending) {
                            action = [
                                '<span class="text-muted">等待对方同意</span>'
                            ];
                        }
                        else if (entity.state == ContactZoneParticipantState.Reject) {
                            action = [
                                '<span class="text-danger">对方拒绝邀请</span>'
                            ];
                        }
                        else {
                            action = [];
                        }
                    }
                    else {
                        // 其他人发来的
                        if (entity.state == ContactZoneParticipantState.Pending) {
                            action = [
                                '<button class="btn btn-primary btn-sm" onclick="app.contactsCtrl.acceptPendingContact(', i, ');"><i class="fas fa-user-check"></i> 添加联系人</button>',
                                '&nbsp;&nbsp;',
                                '<button class="btn btn-secondary btn-sm" onclick="app.contactsCtrl.rejectPendingContact(', i, ');"><i class="fas fa-user-minus"></i> 拒绝邀请</button>'
                            ];
                        }
                        else if (entity.state == ContactZoneParticipantState.Reject) {
                            action = [
                                '<span class="text-muted">已拒绝</span>'
                            ];
                        }
                        else {
                            action = [];
                        }
                    }
                }
                else {
                    avatar = 'images/group-avatar.png';
                    action = [];
                }
            }
            else {
                name = entity.getName();
                avatar = (entity instanceof Group) ? 'images/group-avatar.png' : g.helper.getAvatarImage(entity.getContext().avatar);
                action = [
                    '<a class="btn btn-primary btn-sm" href="javascript:app.contactsCtrl.acceptPendingContact(', i, ');"><i class="fas fa-user-check"></i> 添加联系人</a>'
                ];
            }

            var html = [
                '<tr data-target="', i, '">',
                    '<td>', (page - 1) * 10 + (i + 1), '</td>',
                    '<td><img class="table-avatar" src="', avatar, '" /></td>',
                    '<td>', name, '</td>',
                    '<td class="text-muted">', entity.getId(), '</td>',
                    '<td>', entity.postscript, '</td>',
                    '<td class="text-center">', action.join(''), '</td>',
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
 