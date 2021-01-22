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

    var tableEl = null;
    var noFileBg = null;
    var surfaceA = null;
    var surfaceB = null;

    var curDir = null;
    var curBeginIndex = 0;
    var curEndIndex = 0;

    var FilesTable = function(el) {
        tableEl = el;
        noFileBg = $('#table_files_nofile');
        surfaceA = el.find('tbody[data-target="surface-a"]');
        surfaceB = el.find('tbody[data-target="surface-b"]');
    }

    FilesTable.prototype.updatePage = function(dir, begin, end, list) {
        curDir = dir;
        curBeginIndex = begin;
        curEndIndex = end;

        if (list.length == 0) {
            noFileBg.css('display', 'block');
            return;
        }

        var html = [];

        list.forEach(function(element) {
            var rowHtml = null;
            if (element instanceof FileLabel) {
                rowHtml = [
                    '<tr onclick="app.filesPanel.select(\'', element.getId(), '\')" id="ftr_', element.getId(), '">',
                        '<td><div class="icheck-primary">',
                            '<input type="checkbox" value="" id="', element.getId(), '">',
                                '<label for="', element.getId(), '"></label></div></td>',
                        '<td class="file-icon"></td>',
                        '<td class="file-name">', element.getFileName(), '</td>',
                        '<td class="file-size">', g.formatSize(element.getFileSize()), '</td>',
                        '<td class="file-lastmodifed">', g.formatYMDHMS(element.getCompletedTime()), '</td>',
                    '</tr>'
                ];
            }
            else {
                rowHtml = [
                    '<tr onclick="app.filesPanel.select(\'', element.getId(), '\')"',
                            ' ondblclick="app.filesPanel.changeDir(\'', element.getId(), '\')" id="ftr_', element.getId(), '">',
                        '<td><div class="icheck-primary">',
                            '<input type="checkbox" value="" id="', element.getId(), '">',
                                '<label for="', element.getId(), '"></label></div></td>',
                        '<td class="file-icon"><i class="ci ci-file-directory"></i></td>',
                        '<td class="file-name">', element.getName(), '</td>',
                        '<td class="file-size">--</td>',
                        '<td class="file-lastmodifed">', g.formatYMDHMS(element.getLastModified()), '</td>',
                    '</tr>'
                ];
            }

            html = html.concat(rowHtml);
        });

        if (html.length > 0) {
            noFileBg.css('display', 'none');
        }

        surfaceA[0].innerHTML = html.join('');
    }

    FilesTable.prototype.select = function(id) {
        g.app.filesPanel.resetSelectAllButton();

        var el = tableEl.find('#' + id);
        if (el.prop('checked')) {
            el.prop('checked', false);
            tableEl.find('#ftr_' + id).removeClass('table-primary');
        }
        else {
            el.prop('checked', true);
            tableEl.find('#ftr_' + id).addClass('table-primary');
        }
    }

    FilesTable.prototype.changeDir = function(id) {
        var dir = curDir.getDirectory(id);

    }

    g.FilesTable = FilesTable;

})(window);
