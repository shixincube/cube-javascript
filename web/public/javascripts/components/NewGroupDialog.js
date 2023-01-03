/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020-2023 Cube Team.
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
 * 新建群组对话框。
 */
(function(g) {
    'use strict';

    var contacts = null;

    var dialogEl = null;
    var elMyContacts = null;
    var elGroupName = null;

    var btnConfirm = null;

    /**
     * 新建群组对话框。
     * @param {jQuery} el 
     */
    var NewGroupDialog = function(el) {
        dialogEl = el;
        elMyContacts = el.find('div[data-target="my-contacts"]');
        elGroupName = el.find('input[data-target="group-name"]');

        btnConfirm = el.find('button[data-target="confirm"]');
        btnConfirm.click(function() {
            var groupName = elGroupName.val().trim();
            if (groupName.length == 0) {
                groupName = g.app.getSelf().getName() + '创建的群组';
            }

            var members = [];
            elMyContacts.find('input[type="checkbox"]:checked').each(function(index, item) {
                members.push(parseInt($(item).attr('data')));
            });

            if (members.length == 0) {
                g.dialog.showAlert('请选择群组成员。', null, '我知道了');
                return;
            }

            window.cube().contact.createGroup(groupName, members, function(group) {
                // 添加到消息目录
                g.app.messageCatalog.appendItem(group);

                dialogEl.modal('hide');
            }, function(error) {
                g.dialog.launchToast(Toast.Error, '创建群组失败: ' + error.code);
            });
        });
    }

    /**
     * 显示对话框。
     * @param {Array} selectedList
     */
    NewGroupDialog.prototype.show = function(selectedList) {
        contacts = g.app.getMyContacts();

        elGroupName.val('');
        elMyContacts.empty();

        for (var i = 0; i < contacts.length; ++i) {
            var contact = contacts[i];
            var id = contact.getId();
            var avatar = g.helper.getAvatarImage(contact.getContext().avatar);
            var name = contact.getPriorityName();

            var checked = undefined !== selectedList && selectedList.indexOf(id) >= 0;

            var html = [
                '<div class="col-6"><div class="form-group"><div class="custom-control custom-checkbox select-group-member">',
                    '<input class="custom-control-input" type="checkbox"', checked ? ' checked="checked"' : '', ' id="group_member_', i, '" data="', id, '" />',
                    '<label class="custom-control-label" for="group_member_', i, '">',
                        '<img src="', avatar, '" />',
                        '<span>', name, '</span>',
                    '</label>',
                '</div></div></div>'
            ];

            elMyContacts.append($(html.join('')));
        }

        dialogEl.modal('show');
    }

    g.NewGroupDialog = NewGroupDialog;

})(window);
