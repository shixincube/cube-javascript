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
    'use strict'

    var lastGroup = null;
    var lastTimestamp = 0;

    var elGroupName = null;

    var btnModify = null;
    var btnAddMember = null;
    var btnQuit = null;
    var btnDissolve = null;

    var fireModify = function() {
        g.dialog.showPrompt('修改群组名称', '请输入新的群组名', function(ok, text) {
            if (ok) {
                if (text.length >= 3) {
                    g.app.messagingCtrl.modifyGroupName(lastGroup, text, function(group) {
                        // 修改对话框里的群组名
                        elGroupName.text(group.getName());
                        // 更新消息界面
                        g.app.messagingCtrl.updateGroup(group);
                    });
                }
                else {
                    g.dialog.showAlert('输入的群组名称不能少于3个字符。');
                    return false;
                }
            }
        });
    }

    var fireAddMember = function() {
        var contactList = g.app.getMyContacts();
        var members = lastGroup.getMembers();
        g.app.contactListDialog.show(contactList, members, function(list) {
            if (contactList.length == members.length + 1) {
                // 当前账号的联系人都已经是群组成员
                return true;
            }

            if (list.length == 0) {
                g.dialog.showAlert('没有选择联系人');
                return false;
            }

            lastGroup.addMembers(list, function() {
                g.app.groupDetails.refresh();
            }, function(error) {
                g.dialog.launchToast(Toast.Error, '添加群组成员失败: ' + error.code);
            });

            return true;
        });
    }

    var fireQuit = function() {

    }

    var fireDissolve = function() {

    }

    var GroupDetails = function(el) {
        this.el = el;

        elGroupName = el.find('.widget-user-username');

        btnModify = $('#group_details_modify');
        btnModify.click(fireModify);

        btnAddMember = $('#group_details_add');
        btnAddMember.click(fireAddMember);

        btnQuit = $('#group_details_quit');
        btnQuit.click(fireQuit);

        btnDissolve = $('#group_details_dissolve');
        btnDissolve.click(fireDissolve);
    }

    GroupDetails.prototype.show = function(group) {
        if (null != lastGroup && lastGroup.getId() == group.getId() && group.getLastActiveTime() == lastTimestamp) {
            this.el.modal('show');
            return;
        }

        lastGroup = group;
        lastTimestamp = group.getLastActiveTime();

        var el = this.el;

        elGroupName.text(group.getName());

        // 设置数据
        btnModify.attr('data', group.getId());
        btnAddMember.attr('data', group.getId());
        btnQuit.attr('data', group.getId());
        btnDissolve.attr('data', group.getId());

        var table = el.find('.table');
        table.find('tbody').remove();
        table.append(this.createGroupDetailsTable(group));
        el.modal('show');
    }

    /**
     * 刷新当前群组信息。
     */
    GroupDetails.prototype.refresh = function() {
        if (null == lastGroup) {
            return;
        }

        var el = this.el;
        var table = el.find('.table');
        table.find('tbody').remove();
        table.append(this.createGroupDetailsTable(lastGroup));
        el.modal('show');
    }

    /**
     * @private
     * @param {Group} group 
     */
    GroupDetails.prototype.createGroupDetailsTable = function(group) {
        var detailMemberTable = $('<tbody></tbody>');

        var removeable = group.isOwner(g.app.getSelf());

        var clickEvent = [
            'app.messagingCtrl.removeGroupMember(', 
                'parseInt($(this).attr(\'data-group\')),',
                'parseInt($(this).attr(\'data-member\'))',
            ');'
        ];
        clickEvent = clickEvent.join('');

        var members = group.getMembers();
        for (var i = 0; i < members.length; ++i) {
            var member = members[i];

            var operation = (member.equals(g.app.getSelf()) || group.isOwner(member)) ? [ '' ]
                : [ '<button class="btn btn-danger btn-xs', (removeable ? '' : ' disabled'), '" onclick="', clickEvent, '"',
                    ' data-member="', member.getId(), '"',
                    ' data-group="', group.getId(), '"',
                    ' data-original-title="从本群中移除" data-placement="top" data-toggle="tooltip"><i class="fas fa-minus"></i></button>'];
            operation = operation.join('');

            var contact = g.app.queryContact(member.getId());
            var html = [
                '<tr>',
                    '<td>', (i + 1), '</td>',
                    '<td><img class="table-avatar" src="', contact.getContext().avatar, '" /></td>',
                    '<td>', contact.getName(), '</td>',
                    '<td>', contact.getId(), '</td>',
                    '<td>', contact.getContext().region, '</td>',
                    '<td>', contact.getContext().department, '</td>',
                    '<td>', operation, '</td>',
                '</tr>'];
    
            var elMem = $(html.join(''));
            detailMemberTable.append(elMem);
        }
    
        return detailMemberTable;
    }

    g.GroupDetails = GroupDetails;

})(window);
