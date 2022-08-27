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

(function(g) {
    'use strict';

    var dialogEl = null;
    var rootEl = null;

    var selectedEl = null;
    var selectedDirId = 0;

    function makeFolderLevel(directory) {
        var html = [
            '<li class="nav-item">',
                '<a href="javascript:app.folderTreeDialog.selectFolder(', directory.getId(), ');" id="', directory.getId(), '" class="nav-link">',
                    '<i class="fas fa-folder nav-icon"></i>',
                    '<p>', directory.getName(), '</p>',
                '</a>',
            '</li>'
        ];
        return $(html.join(''));
    }

    function FolderTreeDialog() {
        dialogEl = $('#modal_folder_tree');
        rootEl = dialogEl.find('.folder-root');
    }

    FolderTreeDialog.prototype.open = function(root) {
        root.listDirectories(function(dir, list) {
            list.forEach(function(item) {
                var el = makeFolderLevel(item);
                rootEl.append(el);
            });
        }, function(error) {

        });

        dialogEl.modal('show');
    }

    FolderTreeDialog.prototype.selectFolder = function(id) {
        if (null != selectedEl) {
            selectedEl.removeClass('active');
        }

        selectedDirId = id;
        selectedEl = dialogEl.find('#' + id);
        if (!selectedEl.hasClass('active')) {
            selectedEl.addClass('active');
        }
    }

    g.FolderTreeDialog = FolderTreeDialog;

})(window);
