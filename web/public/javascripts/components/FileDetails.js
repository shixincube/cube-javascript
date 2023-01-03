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

    var that = null;
    var dialogEl = null;

    var currentFileLabel = null;

    /**
     * 文件详情对话框。
     * @param {jQuery} el 
     */
    var FileDetails = function(el) {
        that = this;
        dialogEl = el;

        el.find('button[data-target="file-download"]').click(function() {
            g.app.filePanel.downloadFile(currentFileLabel.getFileCode());
            that.close();
        });

        el.find('button[data-target="file-share"]').click(function() {
            g.app.filePanel.openCreateSharingTagDialog(currentFileLabel.getFileCode());
            that.close();
        });

        el.find('button[data-target="file-delete"]').click(function() {
            g.app.filePanel.promptDeleteFile(currentFileLabel.getFileName(), currentFileLabel.getFileCode());
            that.close();
        });
    }

    /**
     * 打开文件详情对话框。
     * @param {FileLabel} fileLabel 文件标签。
     * @param {Directory} [directory] 文件所在的目录。
     */
    FileDetails.prototype.open = function(fileLabel, directory) {
        currentFileLabel = fileLabel;

        dialogEl.find('h3[data-target="file-name"]').text(fileLabel.getFileName());
        dialogEl.find('h5[data-target="file-type"]').text(fileLabel.getFileType().toUpperCase());
        dialogEl.find('h5[data-target="file-size"]').text(g.formatSize(fileLabel.getFileSize()));
        dialogEl.find('h5[data-target="file-date"]').text(g.formatYMDHMS(fileLabel.getLastModified()));

        dialogEl.find('.file-type-avatar').prop('src', g.helper.matchFileAvatar(fileLabel));

        if (directory) {
            var path = [];
            g.recurseParent(path, directory);
            var dirList = [];
            if (path.length == 1) {
                dirList.push('/');
            }
            else {
                path.forEach(function(dir) {
                    if (!dir.isRoot()) {
                        dirList.push(dir.getName() + ' &gt; ');
                    }
                });
            }
            dialogEl.find('h5[data-target="file-path"]').html(dirList.join(''));
        }
        else {
            dialogEl.find('h5[data-target="file-path"]').text('--');
        }

        dialogEl.modal('show');
    }

    /**
     * 关闭对话框。
     */
    FileDetails.prototype.close = function() {
        dialogEl.modal('hide');
    }

    g.FileDetails = FileDetails;

})(window);
