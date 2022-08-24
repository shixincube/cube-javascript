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

    var that = null;

    var tableEl = null;
    var noFileBg = null;
    var surfaceA = null;
    var surfaceB = null;
    var surface = null;

    var clipboardList = [];

    function makeSharingTagRow(sharingTag, valid) {
        var id = sharingTag.id;
        var fileLabel = sharingTag.fileLabel;
        var password = (null != sharingTag.password) ? sharingTag.password : '<i>无</i>';
        var sharingURL = [ '[文件] ', fileLabel.getFileName(), '\r\n', sharingTag.getURL(), '\r\n',
                            '【来自司派讯盒的文件分享链接】' ].join('');

        var html = [
            '<tr ondblclick="app.fileSharingPanel.showTraceDialog(\'', sharingTag.code, '\')">',
                '<td>',
                    '<div class="icheck-primary">',
                        '<input type="checkbox" data-type="sharing" id="', id, '">',
                        '<label for="', id, '"></label>',
                    '</div>',
                '</td>',
                '<td class="file-icon">', g.helper.matchFileIcon(fileLabel), '</td>',
                '<td class="file-name ellipsis" title="', fileLabel.getFileName(), '">', fileLabel.getFileName(), '</td>',
                '<td class="file-size">', g.formatSize(fileLabel.getFileSize()), '</td>',
                '<td class="sharing-url">',
                    '<div class="input-group input-group-sm">',
                        '<input id="url_', id, '" type="text" class="form-control" value="', sharingTag.getURL(), '" readonly />',
                        '<span class="input-group-append">',
                            '<button id="clippy_', id, '" type="button" class="btn btn-default btn-flat" title="复制分享链接到剪贴板" data-clipboard-text="', sharingURL, '"><i class="fas fa-clipboard"></i></button>',
                            '<button id="qrcode_', id, '" type="button" class="btn btn-default btn-flat" data-toggle="tooltip" data-placement="bottom" data-html="true" title="'
                                , '<img class=\'file-sharing-qrcode-img\' src=\'', sharingTag.getQRCodeURL(), '\'/>'
                                , '"><i class="fas fa-qrcode"></i></button>',
                        '</span>',
                    '</div>',
                '</td>',
                '<td class="sharing-expire" title="', sharingTag.expiryDate > 0 ? g.formatYMDHM(sharingTag.expiryDate) : '永久有效', '">',
                    sharingTag.expiryDate > 0 ? g.formatYMD(sharingTag.expiryDate) : '<i>永久有效</i>',
                '</td>',
                '<td class="sharing-password">', password, '</td>',
                '<td class="sharing-preview">',
                    '<div class="custom-control custom-checkbox">',
                        '<input class="custom-control-input" type="checkbox" ', sharingTag.preview ? 'checked' : '', ' id="preview_', id, '" disabled />',
                        '<label class="custom-control-label" for="preview_', id, '"></label>',
                    '</div>',
                '</td>',
                '<td class="sharing-download">',
                    '<div class="custom-control custom-checkbox">',
                        '<input class="custom-control-input" type="checkbox" ', sharingTag.download ? 'checked' : '', ' id="download_', id, '" disabled />',
                        '<label class="custom-control-label" for="download_', id, '"></label>',
                    '</div>',
                '</td>',
                '<td class="sharing-operate">',
                    '<button type="button" title="查看分享记录" class="btn btn-info btn-sm" onclick="app.fileSharingPanel.showTraceDialog(\'', sharingTag.code, '\');">',
                        '<i class="fas fa-share-square"></i>',
                    '</button>'
        ];

        if (valid) {
            html.push('<button type="button" title="取消分享" class="btn btn-danger btn-sm" onclick="app.fileSharingPanel.promptCancelSharing(\'');
            html.push(sharingTag.code);
            html.push('\');">');
            html.push('<i class="fas fa-times-circle"></i>');
            html.push('</button>');
        }

        html.push('</td></tr>');

        return html;
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
        that = this;
    }

    /**
     * 更新表格数据。
     * @param {Array} list 数据列表。
     * @param {boolean} valid 是否是有效的分享标签。
     */
    FileSharingTable.prototype.updatePage = function(list, valid) {
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
            html = html.concat(makeSharingTagRow(sharingTag, valid));
        });

        if (html.length > 0) {
            noFileBg.css('display', 'none');
        }

        surface[0].innerHTML = html.join('');

        setTimeout(function() {
            list.forEach(function(sharingTag) {
                var clipboard = new ClipboardJS('#clippy_' + sharingTag.id);
                clipboard.on('success', that.fireClipboard);
                clipboardList.push(clipboard);

                $('#qrcode_' + sharingTag.id).tooltip();
            });
        }, 1000);
    }

    FileSharingTable.prototype.fireClipboard = function() {
        g.dialog.toast('链接地址已复制到剪贴板', Toast.Success);
    }

    g.FileSharingTable = FileSharingTable;

 })(window);
