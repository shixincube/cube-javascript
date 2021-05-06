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

    var dialogEl = null;

    var currentList = null;
    var preselected = null;

    var maxSelected = -1;
    var selectCountList = [];

    var btnConfirm = null;
    var confirmCallback = null;

    /**
     * 在指定列表里查找是否有指定联系人。
     * @param {Contact|number} contact 
     * @param {Array} list 
     */
    function findContact(contact, list) {
        var cid = (typeof contact === 'number') ? contact : contact.getId();
        for (var i = 0; i < list.length; ++i) {
            var c = list[i];
            if (c.getId() == cid) {
                return c;
            }
        }
        return null;
    }

    function fireConfirm() {
        if (null == confirmCallback) {
            return;
        }

        var result = [];

        var tbody = dialogEl.find('tbody');
        tbody.find('input[type="checkbox"]:checked').each(function(i, item) {
            var id = parseInt($(item).attr('data'));
            var contact = findContact(id, preselected);
            if (null == contact) {
                // 是新选择联系人，记录 ID
                result.push(id);
            }
        });

        // 回调，参数为新选择的联系人
        var res = confirmCallback(result);
        if (undefined === res || res) {
            dialogEl.modal('hide');
            confirmCallback = null;
        }
    }


    /**
     * 联系人列表对话框。
     */
    var ContactListDialog = function() {
        dialogEl = $('#contact_list_dialog');
        btnConfirm = dialogEl.find('button[data-target="confirm"]');

        btnConfirm.click(fireConfirm);
    }

    /**
     * 显示联系人列表对话框。
     * @param {Array} list 联系人列表。
     * @param {Array} selectedList 已经被选中的联系人列表。
     * @param {function} confirmHandle 确认事件回调。参数：({@linkcode list}:{@linkcode Array}) 。
     * @param {string} [title] 对话框标题。
     * @param {string} [prompt] 提示内容。
     * @param {number} [maxSelectedNum] 最大选择数量。
     */
    ContactListDialog.prototype.show = function(list, selectedList, confirmHandle, title, prompt, maxSelectedNum) {
        currentList = list;
        preselected = selectedList;

        if (undefined !== maxSelectedNum) {
            maxSelected = maxSelectedNum;
            selectCountList = [];
        }
        else {
            maxSelected = -1;
        }

        if (title) {
            dialogEl.find('.modal-title').text(title);
        }
        else {
            dialogEl.find('.modal-title').text('联系人列表');
        }

        if (prompt) {
            dialogEl.find('.tip').text(prompt);
        }
        else {
            dialogEl.find('.tip').text('请选择联系人');
        }

        if (confirmHandle) {
            confirmCallback = confirmHandle;
        }

        var tbody = dialogEl.find('tbody');
        tbody.empty();

        var html = [];

        for (var i = 0; i < list.length; ++i) {
            var contact = list[i];
            var selected = (null != findContact(contact, selectedList));
            var row = [
                '<tr onclick="app.contactListDialog.toggleChecked(', contact.getId(), ')">',
                    '<td>',
                        '<div class="custom-control custom-checkbox">',
                            '<input class="custom-control-input" type="checkbox" data="', contact.getId(), '" id="list_contact_', contact.getId(), '"',
                                selected ? ' checked="checked" disabled="disabled"' : '', '>',
                            '</input>',
                            '<label class="custom-control-label" for="list_contact_', contact.getId(), '">', '</label>',
                        '</div>',
                    '</td>',
                    '<td><img class="table-avatar" src="images/', contact.getContext().avatar, '" /></td>',
                    '<td>', contact.getName(), '</td>',
                    '<td>', contact.getId(), '</td>',
                    '<td>', contact.getContext().region, '</td>',
                    '<td>', contact.getContext().department, '</td>',
                '</tr>'
            ];

            html = html.concat(row);
        }

        tbody.append(html.join(''));

        // tbody
        dialogEl.modal('show');
    }

    /**
     * 隐藏联系人列表对话框。
     */
    ContactListDialog.prototype.hide = function() {
        dialogEl.modal('hide');
        confirmCallback = null;
    }

    /**
     * 开关当前行的选择状态。
     * @param {*} id 
     */
    ContactListDialog.prototype.toggleChecked = function(id) {
        var el = dialogEl.find('input[data="' + id +'"]');
        if (el.prop('checked')) {
            el.prop('checked', false);
        }
        else {
            el.prop('checked', true);
        }

        // if (maxSelected > 0) {
        //     setTimeout(function() {
        //         if (el.prop('checked')) {
        //             ++selectCount;
        //             if (selectCount > maxSelected) {
        //                 el.prop('checked', false);
        //                 --selectCount;
        //             }
        //         }
        //         else {
        //             --selectCount;
        //             if (selectCount < 0) {
        //                 selectCount = 0;
        //             }
        //         }
        //     }, 10);
        // }
    }

    g.ContactListDialog = ContactListDialog;

})(window);
