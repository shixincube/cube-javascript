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
    var groupList = [];
    var pendingList = [];

    var tabEl = null;

    var contactsTable = null;
    var groupsTable = null;
    var pendingTable = null;
    var blockTable = null;

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
        else if (e.target.id == 'contacts-tabs-pending-tab') {
            currentTable = pendingTable;
        }
        else {
            currentTable = blockTable;
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

        blockTable = new BlockListTable($('div[data-target="block-table"]'));

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

        // 更新阻止清单
        cube.contact.queryBlockList(function(list) {
            blockTable.update(list);
        });
    }

    /**
     * 返回联系人列表。
     * @returns {Array}
     */
    ContactsController.prototype.getContacts = function() {
        return contactList;
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
        app.toggle('messaging');

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
     * 加入黑名单。
     * @param {number} index 
     */
    ContactsController.prototype.blockContact = function(index) {
        var contact = contactsTable.getCurrentContact(index);
        g.dialog.showConfirm('阻止联系人', '您确认要将“<b>' + contact.getPriorityName() + '</b>”加入“黑名单”吗？', function(yesOrNo) {
            if (yesOrNo) {
                cube.contact.addBlockList(contact.getId(), function(id, blockList) {
                    // 从数据中删除
                    that.removeContact(contact);
                    // 更新黑名单
                    blockTable.update(blockList);
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
     * @param {function} [callback]
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
     * 从黑名单列表里解除联系人。
     * @param {number} index
     */
    ContactsController.prototype.unblockContact = function(index) {
        var contact = blockTable.getCurrentContact(index);
        g.dialog.showConfirm('解除阻止', '您确认要将“<b>' + contact.getPriorityName() + '</b>”移出“黑名单”并添加为“我的联系人”吗？', function(yesOrNo) {
            if (yesOrNo) {
                cube.contact.removeBlockList(contact, function(id, blockList) {
                    // 更新黑名单
                    blockTable.update(blockList);
                    // 添加到 Zone
                    that.addContactToZone(g.app.contactZone, id, '');
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

    /**
     * 移除群组成员。
     * @param {number} groupId 
     * @param {number} memberId 
     * @param {funciton} handle 
     */
    ContactsController.prototype.removeGroupMember = function(groupId, memberId, handle) {
        cube.contact.getGroup(groupId, function(group) {
            g.app.getContact(memberId, function(member) {
                var memName = member.getName();
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
            });
        });
    }

    g.ContactsController = ContactsController;

 })(window);
