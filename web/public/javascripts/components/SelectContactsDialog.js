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

/**
 * 用于选择联系人的对话框。
 */
(function(g) {

    var that = null;

    var cube = null;

    var el = null;

    var callback = null;

    var disabledList = [];

    var confirmed = false;

    function onDialogClosed() {
        if (callback) {
            var list = [];

            if (confirmed) {
                el.find('.selected-table').find('input[type="checkbox"]').each(function(index, element) {
                    list.push(app.queryContact(parseInt(element.getAttribute('data'))));
                });
            }

            callback(list);
        }

        el.find('.selected-table').empty();
    }

    function onListCheckboxChange() {
        var el = $(this);
        var contact = app.queryContact(parseInt(el.attr('data')));

        if (el[0].checked) {
            that.append(contact);
        }
        else {
            that.remove(contact);
        }
    }

    function onSelectedCheckboxChange() {
        var el = $(this);
        var contact = app.queryContact(parseInt(el.attr('data')));
        if (!el[0].checked) {
            that.remove(contact);
        }
    }

    function onConfirmClick() {
        confirmed = true;
        el.modal('hide');
    }


    /**
     * 选择联系人对话框。
     * @param {Cube} cubeEngine 
     */
    var SelectContactsDialog = function(cubeEngine) {
        that = this;
        cube = cubeEngine;
        el = $('#select_contacts_dialog');
        el.on('hidden.bs.modal', onDialogClosed);
        el.find('button[data-target="confirm"]').on('click', onConfirmClick);
    }

    /**
     * 
     * @param {*} handlerCallback 
     * @param {*} disabledList 
     */
    SelectContactsDialog.prototype.show = function(handlerCallback, disabledList) {
        callback = handlerCallback;
        confirmed = false;

        var conEl = el.find('#select-contact-tabs-default div');
        conEl.empty();

        var list = app.getMyContacts();
        for (var i = 0; i < list.length; ++i) {
            var contact = list[i];
            var id = contact.getId();
            var avatar = contact.getContext().avatar;
            var name = contact.getPriorityName();

            var disabled = disabledList.indexOf(id) >= 0;

            var html = [
                '<div class="form-group"><div class="custom-control custom-checkbox select-group-member">',
                    '<input class="custom-control-input" type="checkbox" id="contact_', i, '" data="', id, '" ', disabled ? 'disabled="disabled"' : '', ' />',
                    '<label class="custom-control-label" for="contact_', i, '">',
                        '<img src="images/', avatar, '" />',
                        '<span>', name, '</span>',
                    '</label>',
                '</div></div>'
            ];

            conEl.append($(html.join('')));
        }

        el.modal('show');

        // 绑定事件
        conEl.find('input[type="checkbox"]').change(onListCheckboxChange);
    }

    SelectContactsDialog.prototype.append = function(contact) {
        var id = contact.getId();
        var html = [
            '<tr id="selected_tr_', id, '">',
                '<td class="text-center pl-3" width="40">',
                    '<div class="custom-control custom-checkbox">',
                        '<input class="custom-control-input" type="checkbox" id="selected_', id, '" data="', id, '" checked="">',
                        '<label for="selected_', id, '" class="custom-control-label">&nbsp;</label>',
                    '</div>',
                '</td>',
                '<td width="50">', '<img src="images/', contact.getContext().avatar, '" class="avatar" />', '</td>',
                '<td>', contact.getPriorityName(), '</td>',
            '</tr>'
        ];

        var tr = $(html.join(''));
        el.find('.selected-table').append(tr);

        // 绑定事件
        tr.find('input[type="checkbox"]').change(onSelectedCheckboxChange);
    }

    SelectContactsDialog.prototype.remove = function(contact) {
        el.find('.selected-table').find('#selected_tr_' + contact.getId()).remove();
    }

    g.SelectContactsDialog = SelectContactsDialog;

 })(window);
