/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020-2023 Cube Team.
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

    /**
     * 生成文件夹的行界面。
     * @param {Directory|TrashDirectory} folder 
     */
    function makeFolderRow(folder) {
        var id = folder.getId();
        var name = folder.getName();
        var time = folder.getLastModified();
        if (folder instanceof TrashDirectory) {
            name = name + ' （于 ' + g.formatYMDHMS(folder.getTrashTimestamp()) + '）';
        }

        var html = [
            '<tr ondblclick="app.filePanel.changeDirectory(\'', id, '\')" id="ftr_', id, '">',
                '<td onclick="app.filePanel.toggleSelect(\'', id, '\')">', '<div class="icheck-primary">',
                    '<input type="checkbox" data-type="folder" id="', id, '">',
                        '<label for="', id, '"></label></div></td>',
                '<td class="file-icon"><i class="ci ci-file-directory"></i></td>',
                '<td class="file-name"><a href="javascript:app.filePanel.changeDirectory(\'', id, '\');">', name, '</a></td>',
                '<td class="file-size">--</td>',
                '<td class="file-lastmodifed">', g.formatYMDHMS(time), '</td>',
                '<td class="file-completion">--</td>',
                '<td class="file-operate">'
        ];

        if (!(folder instanceof TrashDirectory)) {
            html = html.concat([
                '<button onclick="javascript:app.filePanel.renameDirectory(', id, ');"',
                    ' type="button" class="btn btn-primary btn-sm" title="重命名"><i class="fas fa-edit"></i></button>'
            ]);
        }

        html = html.concat([
            '<button onclick="javascript:app.filePanel.promptDeleteDirectory(', id, ');"',
                ' type="button" class="btn btn-danger btn-sm" title="删除"><i class="far fa-trash-alt"></i></button>'
        ]);

        html.push('</td></tr>');

        return html;
    }

    /**
     * 生成文件的行界面。
     * @param {*} fileLabel 
     */
    function makeFileRow(fileLabel) {
        var id = fileLabel.getId();
        var name = fileLabel.getFileName();
        if (fileLabel instanceof TrashFile) {
            name = name + ' （于 ' + g.formatYMDHMS(fileLabel.getTrashTimestamp()) + '）';
        }

        var html = [
            '<tr ondblclick="app.filePanel.openFileDetails(\'', fileLabel.getFileCode(), '\')" id="ftr_', id, '">',
                '<td onclick="app.filePanel.toggleSelect(\'', id, '\')">', '<div class="icheck-primary">',
                    '<input type="checkbox" data-type="file" id="', id, '">',
                        '<label for="', id, '"></label></div></td>',
                '<td class="file-icon">', matchFileIcon(fileLabel), '</td>',
                '<td class="file-name" title="', name, '"><a href="javascript:app.filePanel.openFile(\'', fileLabel.getFileCode(), '\');">', name, '</a></td>',
                '<td class="file-size">', g.formatSize(fileLabel.getFileSize()), '</td>',
                '<td class="file-lastmodifed">', g.formatYMDHMS(fileLabel.getLastModified()), '</td>',
                '<td class="file-completion">', g.formatYMDHMS(fileLabel.getCompletionTime()), '</td>',
                '<td class="file-operate">'
        ];

        if (fileLabel instanceof TrashFile) {
            html = html.concat([
                '<button ', 'onclick="app.filePanel.promptDeleteFile(\'', fileLabel.getFileName(), '\',\'', fileLabel.getFileCode(), '\')"',
                    ' type="button" class="btn btn-danger btn-sm" title="删除文件" data-target="recycle-file"><i class="far fa-trash-alt"></i></button>'
            ]);
        }
        else {
            html = html.concat([
                '<button ', 'onclick="app.filePanel.downloadFile(\'', fileLabel.getFileCode(), '\')"',
                        ' type="button" class="btn btn-primary btn-sm" title="下载"><i class="fas fa-download"></i></button>',
                    '<button ', 'onclick="app.filePanel.openCreateSharingTagDialog(\'', fileLabel.getFileCode(), '\')"',
                        ' type="button" class="btn btn-info btn-sm" title="分享" data-target="share-file"><i class="fas fa-share-alt"></i></button>',
                '<div class="btn-group">',
                    '<button type="button" class="btn btn-secondary btn-sm dropdown-toggle dropdown-icon" data-toggle="dropdown" title="更多操作">','</button>',
                    '<div class="dropdown-menu">',
                        '<a class="dropdown-item text-sm" href="javascript:app.filePanel.promptSendFile(\'', fileLabel.getFileName(), '\',\'', fileLabel.getFileCode(), '\');">',
                            '<i class="far fa-paper-plane"></i>&nbsp;&nbsp;发送文件</a>',
                        '<a class="dropdown-item text-sm" href="javascript:app.filePanel.renameFile(\'', fileLabel.getFileName(), '\',\'', fileLabel.getFileCode(), '\');">',
                            '<i class="far fa-edit"></i>&nbsp;&nbsp;重命名</a>',
                        '<a class="dropdown-item text-sm" href="javascript:app.filePanel.promptMoveFile(\'', fileLabel.getFileName(), '\',\'', fileLabel.getFileCode(), '\');">',
                            '<i class="far fa-folder"></i>&nbsp;&nbsp;移动文件</a>',
                        '<a class="dropdown-item text-sm" href="javascript:app.filePanel.promptDeleteFile(\'', fileLabel.getFileName(), '\',\'', fileLabel.getFileCode(), '\');">', 
                            '<span class="text-danger"><i class="far fa-trash-alt"></i>&nbsp;&nbsp;删除文件<span></a>',
                    '</div>',
                '</div>'
            ]);
        }

        html.push('</td></tr>');

        return html;
    }

    /**
     * 生成搜索结构的行界面。
     * @param {*} item 
     */
    function makeSearchItemRow(item) {
        var fileLabel = item.file;
        var directory = item.directory;
        var dirName = directory.getName();
        if (dirName == 'root') {
            dirName = '/';
        }

        if (fileLabel) {
            var id = fileLabel.getId();
            return [
                '<tr id="ftr_', id, '">',
                    '<td onclick="app.filePanel.toggleSelect(\'', id, '\')"><div class="icheck-primary">',
                        '<input type="checkbox" data-type="file" id="', id, '">',
                            '<label for="', id, '"></label></div></td>',
                    '<td class="file-icon">', matchFileIcon(fileLabel), '</td>',
                    '<td class="file-name"><a href="javascript:app.filePanel.openFile(\'', fileLabel.getFileCode(), '\',\'',
                        directory.getId() , '\');">',
                            fileLabel.getFileName(), '</a>', '<span class="desc">所在目录: ', dirName, '</span>',
                    '</td>',
                    '<td class="file-size">', g.formatSize(fileLabel.getFileSize()), '</td>',
                    '<td class="file-lastmodifed">', g.formatYMDHMS(fileLabel.getLastModified()), '</td>',
                    '<td class="file-completion">', g.formatYMDHMS(fileLabel.getCompletionTime()), '</td>',
                    '<td class="file-operate">',
                        '<button ', 'onclick="app.filePanel.downloadFile(\'', fileLabel.getFileCode(), '\')"',
                            ' type="button" class="btn btn-primary btn-sm" title="下载"><i class="fas fa-download"></i></button>',
                        '<button ', 'onclick="app.filePanel.openCreateSharingTagDialog(\'', fileLabel.getFileCode(), '\')"',
                            ' type="button" class="btn btn-info btn-sm" title="分享" data-target="share-file"><i class="fas fa-share-alt"></i></button>',
                        '<button ', 'onclick="app.filePanel.promptDeleteFile(\'', fileLabel.getFileName(), '\', \'', fileLabel.getFileCode(), '\')"',
                            ' type="button" class="btn btn-danger btn-sm" title="删除" data-target="recycle-file"><i class="far fa-trash-alt"></i></button>',
                    '</td>',
                '</tr>'
            ];
        }
        else {
            var id = directory.getId();
            var name = directory.getName();
            var time = directory.getLastModified();

            var parents = [];
            var parent = directory.getParent();
            while (null != parent) {
                parents.push(parent);
                parent = parent.getParent();
            }
            var pathDesc = [ '路径：/' ];
            for (var i = parents.length - 1; i >= 0; --i) {
                var dir = parents[i];
                if (dir.getName() == 'root') {
                    continue;
                }

                pathDesc.push(dir.getName());
                pathDesc.push('/');
            }

            return [
                '<tr ondblclick="app.filePanel.changeDirectory(\'', id, '\')" id="ftr_', id, '">',
                    '<td onclick="app.filePanel.toggleSelect(\'', id, '\')">', '<div class="icheck-primary">',
                        '<input type="checkbox" data-type="folder" id="', id, '">',
                            '<label for="', id, '"></label></div></td>',
                    '<td class="file-icon"><i class="ci ci-file-directory"></i></td>',
                    '<td class="file-name"><a href="javascript:app.filePanel.changeDirectory(\'', id, '\');">', name, '</a>',
                        '<span class="desc">', pathDesc.join(''), '</span>',
                    '</td>',
                    '<td class="file-size">--</td>',
                    '<td class="file-lastmodifed">', g.formatYMDHMS(time), '</td>',
                    '<td class="file-completion">--</td>',
                    '<td class="file-operate">',
                        '<button onclick="javascript:app.filePanel.renameDirectory(', id, ');"',
                            ' type="button" class="btn btn-primary btn-sm" title="重命名"><i class="fas fa-edit"></i></button>',
                        '<button onclick="javascript:app.filePanel.promptDeleteDirectory(', id, ');"',
                            ' type="button" class="btn btn-danger btn-sm" title="删除"><i class="far fa-trash-alt"></i></button>',
                    '</td>',
                '</tr>'
            ];
        }
    }

    /**
     * 根据文件类型匹配文件图标。
     * @param {FileLabel} fileLabel 
     * @returns {string}
     */
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
        else if (type == 'exe' || type == 'dll') {
            return '<i class="ci ci-file-windows"></i>';
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
            return '<i class="fa fa-file-alt ci-fa-file"></i>';    //'<i class="ci ci-file-unknown"></i>';
        }
    }


    /**
     * 文件表格。
     * @param {jQuery} el 
     */
    var FileTable = function(el) {
        tableEl = el;
        noFileBg = $('#table_files_nofile');
        surfaceA = el.find('tbody[data-target="surface-a"]');
        surfaceB = el.find('tbody[data-target="surface-b"]');
        surface = surfaceA;
    }

    /**
     * 更新表格数据。
     * @param {Array} list 数据列表。
     */
    FileTable.prototype.updatePage = function(list) {
        if (list.length == 0) {
            surface[0].innerHTML = '';
            noFileBg.css('display', 'block');
            return;
        }

        var html = [];

        list.forEach(function(element) {
            var rowHtml = null;
            if (element instanceof FileLabel || element instanceof TrashFile) {
                rowHtml = makeFileRow(element);
            }
            else if (element instanceof SearchItem) {
                rowHtml = makeSearchItemRow(element);
            }
            else {
                rowHtml = makeFolderRow(element);
            }

            html = html.concat(rowHtml);
        });

        if (html.length > 0) {
            noFileBg.css('display', 'none');
        }

        surface[0].innerHTML = html.join('');
    }

    /**
     * 切换选择指定 ID 的行。
     * @param {string} id 指定 ID 。
     */
    FileTable.prototype.toggleSelect = function(id) {
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

    /**
     * 取消已选择的行。
     * @param {string} id 指定行 ID 。
     */
    FileTable.prototype.unselect = function(id) {
        var el = tableEl.find('#' + id);
        if (el.prop('checked')) {
            el.prop('checked', false);
            tableEl.find('#ftr_' + id).removeClass('table-primary');
        }
    }

    /**
     * 在表格首行插入文件夹样式的行。
     * @param {Directory} dir 指定目录。
     */
    FileTable.prototype.insertFolder = function(dir) {
        var rowHtml = makeFolderRow(dir);
        surface.prepend($(rowHtml.join('')));
    }

    /**
     * 更新文件夹数据。
     * @param {Directory} dir 指定目录。
     */
    FileTable.prototype.updateFolder = function(dir) {
        var row = tableEl.find('#ftr_' + dir.getId());
        var nameCol = row.find('.file-name');
        var html = [
            '<a href="javascript:app.filePanel.changeDirectory(', dir.getId(), ');">',
                dir.getName()
            , '</a>'
        ];
        nameCol.html(html.join(''));
    }

    /**
     * 更新文件数据。
     * @param {FileLabel} fileLabel 指定文件。
     */
    FileTable.prototype.updateFile = function(fileLabel) {
        var row = tableEl.find('#ftr_' + fileLabel.getId());
        var nameCol = row.find('.file-name');
        var html = [
            '<a href="javascript:app.filePanel.openFile(\'', fileLabel.getFileCode(), '\');">', fileLabel.getFileName(), '</a>'
        ];
        nameCol.html(html.join(''));
        nameCol.attr('title', fileLabel.getFileName());
    }

    g.FileTable = FileTable;

})(window);
