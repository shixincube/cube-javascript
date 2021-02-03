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

    var dialogEl = null;

    var currentList = null;
    var preselected = null;

    var btnConfirm = null;
    var confirmCallback = null;

    function findMember(contact, list) {
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
            var contact = findMember(id, preselected);
            if (null == contact) {
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
     * @param {*} el 
     */
    var ContactListDialog = function(el) {
        dialogEl = el;
        btnConfirm = el.find('button[data-target="confirm"]');

        btnConfirm.click(fireConfirm);
    }

    ContactListDialog.prototype.show = function(list, selectedList, confirmHandle) {
        currentList = list;
        preselected = selectedList;

        if (confirmHandle) {
            confirmCallback = confirmHandle;
        }

        var tbody = dialogEl.find('tbody');
        tbody.empty();

        var html = [];

        for (var i = 0; i < list.length; ++i) {
            var contact = list[i];
            var selected = (null != findMember(contact, selectedList));
            var row = [
                '<tr>',
                    '<td>',
                        '<div class="custom-control custom-checkbox">',
                            '<input class="custom-control-input" type="checkbox" data="', contact.getId(), '" id="list_contact_', contact.getId(), '"',
                                selected ? ' checked="checked" disabled="disabled"' : '', '>',
                            '</input>',
                            '<label class="custom-control-label" for="list_contact_', contact.getId(), '">', '</label>',
                        '</div>',
                    '</td>',
                    '<td><img class="table-avatar" src="', contact.getContext().avatar, '" /></td>',
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

    ContactListDialog.prototype.hide = function() {
        dialogEl.modal('hide');
        confirmCallback = null;
    }

    g.ContactListDialog = ContactListDialog;

})(window);
