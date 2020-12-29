/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020 Shixin Cube Team.
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
    'use strict'

    var contacts = null;

    var NewGroupDialog = function(el) {
        this.el = el;
        this.elMyContacts = el.find('div[data-target="my-contacts"]');
        this.elGroupName = el.find('input[data-target="group-name"]');
    }

    NewGroupDialog.prototype.show = function() {
        contacts = g.app.getMyContacts();

        this.elMyContacts.empty();

        for (var i = 0; i < contacts.length; ++i) {
            var contact = contacts[i];
            var id = contact.getId();
            var avatar = contact.getContext().avatar;
            var name = contact.getName();

            var html = [
                '<div class="col-6"><div class="form-group"><div class="custom-control custom-checkbox select-group-member">',
                    '<input class="custom-control-input" type="checkbox" id="group_member_', i, '" data="', id, '" />',
                    '<label class="custom-control-label" for="group_member_', i, '">',
                        '<img src="', avatar, '" />',
                        '<span>', name, '</span>',
                    '</label>',
                '</div></div></div>'
            ];

            this.elMyContacts.append($(html.join('')));
        }

        this.el.modal('show');
    }

    g.NewGroupDialog = NewGroupDialog;

})(window);
