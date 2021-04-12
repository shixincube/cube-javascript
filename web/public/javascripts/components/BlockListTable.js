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
            return;
        }

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
