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
    'use strict'

    var tableEl = null;
    var noFileBg = null;
    var surfaceA = null;
    var surfaceB = null;
    var surface = null;

    var clipboardList = [];

    function makeSharingTagRow(sharingTag) {
        var id = sharingTag.id;
        var fileLabel = sharingTag.fileLabel;
        var password = (null != sharingTag.password) ? sharingTag.password : '<i>无</i>';

        return [
            '<tr ondblclick="app.fileSharingPanel.showTraceDialog(\'', sharingTag.code, '\')">',
                '<td>',
                    '<div class="icheck-primary">',
                        '<input type="checkbox" data-type="sharing" id="', id, '">',
                        '<label for="', id, '"></label>',
                    '</dv>',
                '</td>',
                '<td class="file-icon">', g.helper.matchFileIcon(fileLabel), '</td>',
                '<td class="file-name ellipsis" title="', fileLabel.getFileName(), '">', fileLabel.getFileName(), '</td>',
                '<td class="file-size">', g.formatSize(fileLabel.getFileSize()), '</td>',
                '<td class="file-lastmodifed">', g.formatYMDHMS(fileLabel.getLastModified()), '</td>',
                '<td class="sharing-url">',
                    '<div class="input-group input-group-sm">',
                        '<input id="url_', id, '" type="text" class="form-control" value="', sharingTag.getURL(), '" readonly />',
                        '<span class="input-group-append">',
                            '<button id="clippy_', id, '" type="button" class="btn btn-default btn-flat" title="复制分享链接到剪贴板" data-clipboard-target="#url_', id, '"><i class="fas fa-clipboard"></i></button>',
                        '</span>',
                    '</div>',
                '</td>',
                '<td class="sharing-expire">', g.formatYMDHM(sharingTag.expiryDate), '</td>',
                '<td class="sharing-password">', password, '</td>',
            '</tr>'
        ];
    }

    /**
     * 文件分享表格。
     * @param {jQuery} el 
     */
    var FileSharingTable = function(el) {
        tableEl = el;
        noFileBg = $('#table_sharing_nodata');
        surfaceA = el.find('tbody[data-target="surface-a"]');
        surfaceB = el.find('tbody[data-target="surface-b"]');
        surface = surfaceA;
    }

    /**
     * 更新表格数据。
     * @param {Array} list 数据列表。
     */
    FileSharingTable.prototype.updatePage = function(list) {
        // 清理剪贴板操作按钮
        clipboardList.forEach(function(clipboard) {
            clipboard.destroy();
        });
        clipboardList.splice(0, clipboardList.length);

        if (list.length == 0) {
            surface[0].innerHTML = '';
            noFileBg.css('display', 'block');
            return;
        }

        var html = [];

        list.forEach(function(sharingTag) {
            html = html.concat(makeSharingTagRow(sharingTag));
        });

        if (html.length > 0) {
            noFileBg.css('display', 'none');
        }

        surface[0].innerHTML = html.join('');

        setTimeout(function() {
            list.forEach(function(sharingTag) {
                var clipboard = new ClipboardJS('#clippy_' + sharingTag.id);
                clipboardList.push(clipboard);
            });
        }, 1000);
    }

    g.FileSharingTable = FileSharingTable;

 })(window);
