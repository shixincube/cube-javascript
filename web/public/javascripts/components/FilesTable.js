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
    var surface = null;
    var surfaceA = null;
    var surfaceB = null;

    var curFolder = null;
    var curBeginIndex = 0;
    var curEndIndex = 0;

    function makeFolderRow(folder, extended) {
        var id = folder.getId();
        var name = folder.getName();
        var time = folder.getLastModified();
        if (extended) {
            name = name + ' （于 ' + g.formatYMDHMS(folder.getTrashTimestamp()) + '）';
        }

        return [
            '<tr onclick="app.filesPanel.select(\'', id, '\')"',
                    ' ondblclick="app.filesPanel.changeDirectory(\'', id, '\')" id="ftr_', id, '">',
                '<td><div class="icheck-primary">',
                    '<input type="checkbox" data-type="folder" id="', id, '">',
                        '<label for="', id, '"></label></div></td>',
                '<td class="file-icon"><i class="ci ci-file-directory"></i></td>',
                '<td class="file-name"><a href="javascript:app.filesPanel.changeDirectory(\'', id, '\');">', name, '</a></td>',
                '<td class="file-size">--</td>',
                '<td class="file-lastmodifed">', g.formatYMDHMS(time), '</td>',
            '</tr>'
        ];
    }

    function makeFileRow(fileLabel, extended) {
        var name = fileLabel.getFileName();
        if (extended) {
            name = name + ' （于 ' + g.formatYMDHMS(fileLabel.getTrashTimestamp()) + '）';
        }

        return [
            '<tr onclick="app.filesPanel.select(\'', fileLabel.getFileCode(), '\')" id="ftr_', fileLabel.getFileCode(), '">',
                '<td><div class="icheck-primary">',
                    '<input type="checkbox" data-type="file" id="', fileLabel.getFileCode(), '">',
                        '<label for="', fileLabel.getFileCode(), '"></label></div></td>',
                '<td class="file-icon">', matchFileIcon(fileLabel), '</td>',
                '<td class="file-name"><a href="javascript:app.filesPanel.openFile(\'', fileLabel.getFileCode(), '\');">', name, '</a></td>',
                '<td class="file-size">', g.formatSize(fileLabel.getFileSize()), '</td>',
                '<td class="file-lastmodifed">', g.formatYMDHMS(fileLabel.getLastModified()), '</td>',
            '</tr>'
        ];
    }

    function makeSearchItemRow(item) {
        var fileLabel = item.file;
        var directory = item.directory;
        var dirName = directory.getName();
        if (dirName == 'root') {
            dirName = '/';
        }

        return [
            '<tr onclick="app.filesPanel.select(\'', fileLabel.getFileCode(), '\')" id="ftr_', fileLabel.getFileCode(), '">',
                '<td><div class="icheck-primary">',
                    '<input type="checkbox" data-type="file" id="', fileLabel.getFileCode(), '">',
                        '<label for="', fileLabel.getFileCode(), '"></label></div></td>',
                '<td class="file-icon">', matchFileIcon(fileLabel), '</td>',
                '<td class="file-name"><a href="javascript:app.filesPanel.openFile(\'', fileLabel.getFileCode(), '\');">',
                    fileLabel.getFileName(), '</a>', '<span class="desc">目录: ', dirName, '</span>',
                '</td>',
                '<td class="file-size">', g.formatSize(fileLabel.getFileSize()), '</td>',
                '<td class="file-lastmodifed">', g.formatYMDHMS(fileLabel.getLastModified()), '</td>',
            '</tr>'
        ];
    }

    function matchFileIcon(fileLabel) {
        var type = fileLabel.getFileType();
        if (type == 'png' || type == 'jpeg' || type == 'gif' || type == 'jpg' || type == 'bmp') {
            return '<i class="ci ci-file-image"></i>';
        }
        else if (type == 'xls' || type == 'xlsx') {
            return '<i class="ci ci-file-excel"></i>';
        }
        else if (type == 'ppt' || type == 'pptx') {
            return '<i class="ci ci-file-powerpoint"></i>';
        }
        else if (type == 'doc' || type == 'docx') {
            return '<i class="ci ci-file-word"></i>';
        }
        else if (type == 'mp3' || type == 'ogg' || type == 'wav') {
            return '<i class="ci ci-file-music"></i>';
        }
        else if (type == 'pdf') {
            return '<i class="ci ci-file-pdf"></i>';
        }
        else if (type == 'rar') {
            return '<i class="ci ci-file-rar"></i>';
        }
        else if (type == 'zip' || type == 'gz') {
            return '<i class="ci ci-file-zip"></i>';
        }
        else if (type == 'txt' || type == 'log') {
            return '<i class="ci ci-file-text"></i>';
        }
        else if (type == 'mp4' || type == 'mkv' || type == 'avi' || type == 'ts') {
            return '<i class="ci ci-file-video"></i>';
        }
        else if (type == 'psd') {
            return '<i class="ci ci-file-psd"></i>';
        }
        else if (type == 'apk') {
            return '<i class="ci ci-file-apk"></i>';
        }
        else if (type == 'dmg') {
            return '<i class="ci ci-file-dmg"></i>';
        }
        else if (type == 'ipa') {
            return '<i class="ci ci-file-ipa"></i>';
        }
        else {
            return '<i class="fa fa-file ci-fa-file"></i>';    //'<i class="ci ci-file-unknown"></i>';
        }
    }

    var FilesTable = function(el) {
        tableEl = el;
        noFileBg = $('#table_files_nofile');
        surfaceA = el.find('tbody[data-target="surface-a"]');
        surfaceB = el.find('tbody[data-target="surface-b"]');
        surface = surfaceA;
    }

    /**
     * 更新表格数据。
     * @param {Directory} dir 
     * @param {number} begin 
     * @param {number} end 
     * @param {Array} list 
     * @param {boolean} [extended] 
     */
    FilesTable.prototype.updatePage = function(dir, begin, end, list, extended) {
        curFolder = dir;
        curBeginIndex = begin;
        curEndIndex = end;

        if (list.length == 0) {
            surface[0].innerHTML = '';
            noFileBg.css('display', 'block');
            return;
        }

        var html = [];

        list.forEach(function(element) {
            var rowHtml = null;
            if (element instanceof FileLabel) {
                rowHtml = makeFileRow(element, extended);
            }
            else if (element instanceof SearchItem) {
                rowHtml = makeSearchItemRow(element, extended);
            }
            else {
                rowHtml = makeFolderRow(element, extended);
            }

            html = html.concat(rowHtml);
        });

        if (html.length > 0) {
            noFileBg.css('display', 'none');
        }

        surface[0].innerHTML = html.join('');
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

    FilesTable.prototype.insertFolder = function(dir) {
        var rowHtml = makeFolderRow(dir);
        surface.prepend($(rowHtml.join('')));
    }

    g.FilesTable = FilesTable;

})(window);
