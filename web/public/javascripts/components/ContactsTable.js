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

    var container = null;
    var tableEl = null;
    var tbodyEl = null;

    var ContactsTable = function(el) {
        container = el;
        tableEl = el.find('.table');
        tbodyEl = tableEl.find('tbody');
    }

    ContactsTable.prototype.appendContact = function(contact) {
        var html = [
            '<tr>',
                '<td></td>',
                '<td><img class="table-avatar" src="" /></td>',
                '<td></td>',
                '<td class="text-muted"></td>',
                '<td></td>',
                '<td></td>',
                '<td></td>',
                '<td class="text-right">',
                    '<a class="btn btn-primary btn-sm" href="javascript:app.contactsCtrl.goToChat(0);"><i class="fas fa-comments"></i> 发消息</a>',
                    '<a class="btn btn-info btn-sm" href="javascript:app.contactsCtrl.editContact(0);"><i class="fas fa-pencil-alt"></i> 备注</a>',
                '</td>',
            '</tr>'
        ];

        // tbodyEl
    }

    g.ContactsTable = ContactsTable;

 })(window);