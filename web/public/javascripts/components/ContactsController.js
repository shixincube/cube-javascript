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

    var cube = null;

    var contactList = [];

    var contactsTable = null;
    var groupTable = null;

    var currentTable = null;

    var currentPage = null;
    var pagination = 1;
    var pageSize = 10;
    var maxPagination = 0;

    var delayTimer = 0;

    var btnRefresh = null;

    var ContactsController = function(cubeEngine) {
        that = this;
        cube = cubeEngine;
        contactsTable = new g.ContactsTable($('div[data-target="contacts-table"]'));
        btnRefresh = $('.contacts-card').find('button[data-target="refresh"]');
        btnRefresh.on('click', function() {
            that.update();
        });

        currentTable = contactsTable;
    }

    /**
     * 添加联系人数据。
     * @param {*} contact 
     */
    ContactsController.prototype.addContact = function(contact) {
        contactList.push(contact);

        if (delayTimer > 0) {
            clearTimeout(delayTimer);
        }
        delayTimer = setTimeout(function() {
            clearTimeout(delayTimer);
            delayTimer = 0;
            that.update();
        }, 1000);
    }

    /**
     * 跳转到消息界面。
     * @param {number} index 
     */
    ContactsController.prototype.goToMessaging = function(index) {
        var contact = currentPage[index];
        if (undefined === contact) {
            return;
        }

        // 切换到消息面板
        app.toggle('messaging', 'tab_messaging');
        setTimeout(function() {
            app.messagingCtrl.toggle(contact.getId());
        }, 100);
    }

    /**
     * 编辑联系人备注。
     * @param {*} index 
     */
    ContactsController.prototype.editRemark = function(index) {
        var contact = currentPage[index];
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

    /**
     * 显示指定页。
     * @param {number} newPagination 
     * @returns 
     */
    ContactsController.prototype.showPage = function(newPagination) {
        if (pagination == newPagination) {
            return;
        }

        if (newPagination < 1 || newPagination > maxPagination) {
            return;
        }

        pagination = newPagination;
        currentPage = [];
        for (var i = (pagination - 1) * pageSize; i < contactList.length && currentPage.length < pageSize; ++i) {
            currentPage.push(contactList[i]);
        }

        // 更新表格
        contactsTable.showPage(pagination, currentPage);
    }

    /**
     * 切换到上一页。
     */
    ContactsController.prototype.prevPage = function() {
        if (pagination == 1) {
            return;
        }

        var page = pagination - 1;
        this.showPage(page);
        pagination -= 1;
    }

    /**
     * 切换到下一页。
     */
    ContactsController.prototype.nextPage = function() {
        if (pagination == maxPagination) {
            return;
        }

        var page = pagination + 1;
        this.showPage(page);
        pagination += 1;
    }

    /**
     * 更新数据。
     */
    ContactsController.prototype.update = function() {
        contactList.sort(function(a, b) {
            return a.getName().localeCompare(b.getName());
        });

        currentPage = [];
        for (var i = 0; i < pageSize && i < contactList.length; ++i) {
            currentPage.push(contactList[i]);
        }
        // 第一页
        pagination = 1;

        // 分页
        maxPagination = Math.ceil(contactList.length / pageSize);
        contactsTable.paging(maxPagination);

        // 显示指定页
        contactsTable.reset();
        contactsTable.showPage(pagination, currentPage);
    }

    g.ContactsController = ContactsController;

 })(window);
