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

    var popover = null;

    var panelEl = null;
    var tableEl = null;

    // 1- 上传页面，2 - 下载页面，3 - 传输完成，0 - 未加载
    var currentPage = 0;

    var uploadFileAnchorList = [];
    var downloadFileAnchorList = [];

    var fileLabelMap = new OrderMap();

    var makeTableRowWithFileAnchor = function(fileAnchor) {
        var progress = Math.round(fileAnchor.position / fileAnchor.fileSize * 100);
        if (progress == 100) {
            progress = '<span class="text-success" title="已完成"><i class="far fa-check-circle"></i></span>';
        }
        else {
            if (fileAnchor.pending) {
                progress = '<span class="text-warning" title="队列中"><i class="fas fa-ellipsis-h"></i></span>';
            }
            else {
                progress = progress + '%';
            }
        }

        var endTime = '--';
        if (fileAnchor.endTime > 0) {
            endTime = g.formatYMDHMS(fileAnchor.endTime);
        }

        var rate = '--';
        if (null != fileAnchor.fileCode) {
            var fileLabel = fileLabelMap.get(fileAnchor.fileCode);
            if (null != fileLabel && 0 != fileLabel.averageSpeed) {
                rate = g.formatSize(fileLabel.averageSpeed) + '/s';
            }
        }

        return [
            '<tr data-sn="', fileAnchor.sn, '">',
                '<td class="text-center">', progress, '</td>',
                '<td>', g.formatYMDHMS(fileAnchor.timestamp), '</td>',
                '<td class="file-end-time">', endTime, '</td>',
                '<td>', fileAnchor.fileName, '</td>',
                '<td>', g.formatSize(fileAnchor.fileSize), '</td>',
                '<td class="speed-rate">', rate, '</td>',
            '</tr>'
        ];
    }

    var refreshTableRow = function(fileAnchorOrLabel) {
        if (fileAnchorOrLabel instanceof FileAnchor) {
            var fileAnchor = fileAnchorOrLabel;

            var progress = Math.round(fileAnchor.position / fileAnchor.fileSize * 100);
            if (progress == 100) {
                progress = '<span class="text-success" title="已上传"><i class="far fa-check-circle"></i></span>';
            }
            else {
                if (fileAnchor.pending) {
                    progress = '<span class="text-warning" title="队列中"><i class="fas fa-ellipsis-h"></i></span>';
                }
                else {
                    progress = progress + '%';
                }
            }

            var row = tableEl.find('tr[data-sn="' + fileAnchor.sn + '"]');
            var cols = row.find('td');
            // 进度
            cols.eq(0).html(progress);

            // 结束时间
            if (fileAnchor.endTime > 0) {
                var endTime = g.formatYMDHMS(fileAnchor.endTime);
                cols.eq(2).html(endTime);
            }

            // 平均速率
            var rate = fileAnchor.position / ((Date.now() - fileAnchor.timestamp) / 1000.0);
            cols.eq(5).html(g.formatSize(rate) + '/s');
        }
        else {
            var fileLabel = fileAnchorOrLabel;

            if (0 != fileLabel.averageSpeed) {
                var row = tableEl.find('tr[data-sn="' + fileLabel.sn + '"]');
                row.find('.speed-rate').html(g.formatSize(fileLabel.averageSpeed) + '/s');
            }
        }
    }


    var FileTransferPanel = function() {
        panelEl = $('.file-trans-panel');
        tableEl = panelEl.find('tbody[data-target="surface"]');

        panelEl.find('a[data-widget="close"]').click(function() {
            popover.popover('hide');
            currentPage = 0;
        });
    }

    FileTransferPanel.prototype.showUploadTable = function(activePopover) {
        currentPage = 1;

        popover = activePopover;
        panelEl.css('display', 'block');
        panelEl.find('.list-title').text('上传列表');

        if (uploadFileAnchorList.length > 0) {
            panelEl.find('.no-data').css('display', 'none');
            panelEl.find('.file-content').css('display', 'block');
            this.updateUpload();
        }
        else {
            panelEl.find('.no-data').css('display', 'block');
            panelEl.find('.file-content').css('display', 'none');
        }
    }

    FileTransferPanel.prototype.showDownloadTable = function(activePopover) {
        currentPage = 2;

        popover = activePopover;
        panelEl.css('display', 'block');
        panelEl.find('.list-title').text('下载列表');

        if (downloadFileAnchorList.length > 0) {
            panelEl.find('.no-data').css('display', 'none');
            panelEl.find('.file-content').css('display', 'block');
            this.updateDownload();
        }
        else {
            panelEl.find('.no-data').css('display', 'block');
            panelEl.find('.file-content').css('display', 'none');
        }
    }

    FileTransferPanel.prototype.hide = function() {
        currentPage = 0;
    }

    FileTransferPanel.prototype.numUploadHistory = function() {
        return uploadFileAnchorList.length;
    }

    FileTransferPanel.prototype.numDownloadHistory = function() {
        return downloadFileAnchorList.length;
    }

    /**
     * 更新上传记录表格。
     */
    FileTransferPanel.prototype.updateUpload = function() {
        tableEl.html('');

        uploadFileAnchorList.forEach(function(fileAnchor) {
            tableEl.append($(makeTableRowWithFileAnchor(fileAnchor).join('')));
        });
    }

    /**
     * 更新下载记录表格。
     */
    FileTransferPanel.prototype.updateDownload = function() {
        tableEl.html('');

        downloadFileAnchorList.forEach(function(fileAnchor) {
            tableEl.append($(makeTableRowWithFileAnchor(fileAnchor).join('')));
        });
    }

    /**
     * Fire file pending
     * @param {FileAnchor} fileAnchor 
     */
    FileTransferPanel.prototype.fireUploadPending = function(fileAnchor) {
        uploadFileAnchorList.push(fileAnchor);

        if (currentPage == 1) {
            if (uploadFileAnchorList.length > 0) {
                panelEl.find('.no-data').css('display', 'none');
                panelEl.find('.file-content').css('display', 'block');
                this.updateUpload();
            }
        }
    }

    /**
     * Fire Upload Start Event
     * @param {FileAnchor} fileAnchor 
     */
    FileTransferPanel.prototype.fireUploadStart = function(fileAnchor) {
        if (currentPage == 1) {
            refreshTableRow(fileAnchor);
        }
    }

    /**
     * Fire Uploading Event
     * @param {FileAnchor} fileAnchor 
     */
    FileTransferPanel.prototype.fireUploading = function(fileAnchor) {
        if (currentPage == 1) {
            refreshTableRow(fileAnchor);
        }
    }

    /**
     * Fire Upload End Event
     * @param {Directory} folder 
     * @param {FileLabel} fileLabel 
     */
    FileTransferPanel.prototype.fireUploadEnd = function(folder, fileLabel) {
        fileLabelMap.put(fileLabel.fileCode, fileLabel);

        if (currentPage == 1) {
            refreshTableRow(fileLabel);
        }
    }

    /**
     * Fire Download Start Event
     * @param {FileLabel} fileLabel 
     */
    FileTransferPanel.prototype.fireDownloadStart = function(fileLabel, fileAnchor) {
        downloadFileAnchorList.push(fileAnchor);

        if (currentPage == 2) {
            if (downloadFileAnchorList.length > 0) {
                panelEl.find('.no-data').css('display', 'none');
                panelEl.find('.file-content').css('display', 'block');
                this.updateDownload();
            }
        }
    }

    /**
     * Fire Downloading Event
     * @param {FileLabel} fileLabel 
     * @param {FileAnchor} fileAnchor 
     */
    FileTransferPanel.prototype.fireDownloading = function(fileLabel, fileAnchor) {
        if (currentPage == 2) {
            refreshTableRow(fileAnchor);
        }
    }

    /**
     * Fire Download End Event
     * @param {FileLabel} fileLabel 
     */
    FileTransferPanel.prototype.fireDownloadEnd = function(fileLabel, fileAnchor) {
        fileLabelMap.put(fileLabel.fileCode, fileLabel);

        if (currentPage == 2) {
            refreshTableRow(fileLabel);
        }
    }

    g.FileTransferPanel = FileTransferPanel;

})(window);
