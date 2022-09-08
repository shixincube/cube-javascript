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

    var popover = null;

    var panelEl = null;
    var tableEl = null;

    // 1- 上传页面，2 - 下载页面，3 - 传输完成，0 - 未加载
    var currentPage = 0;

    var uploadFileAnchorList = [];
    var downloadFileLabelList = [];

    var fileLabelMap = new OrderMap();

    var makeTableRowWithFileAnchor = function(fileAnchor) {
        var progress = Math.round(fileAnchor.position / fileAnchor.fileSize * 100);
        if (progress == 100) {
            progress = '<span class="text-success" title="已上传"><i class="far fa-check-circle"></i></span>';
        }
        else {
            progress = progress + '%';
        }

        var endTime = '--';
        if (fileAnchor.endTime > 0) {
            endTime = g.formatYMDHMS(fileAnchor.endTime);
        }

        var rate = '--';
        if (null != fileAnchor.fileCode) {
            var fileLabel = fileLabelMap.get(fileAnchor.fileCode);
            if (null != fileLabel) {
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
                progress = progress + '%';
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
        }
        else {
            var fileLabel = fileAnchorOrLabel;

            var row = tableEl.find('tr[data-sn="' + fileLabel.sn + '"]');
            row.find('.speed-rate').html(g.formatSize(fileLabel.averageSpeed) + '/s');
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

        if (uploadFileAnchorList.length > 0) {
            panelEl.find('.no-data').css('display', 'none');
            panelEl.find('.file-content').css('display', 'block');
            this.updateUpload();
        }
    }

    FileTransferPanel.prototype.showDownloadTable = function(activePopover) {
        currentPage = 2;

        popover = activePopover;
        panelEl.css('display', 'block');

        if (downloadFileLabelList.length > 0) {
            panelEl.find('.no-data').css('display', 'none');
            panelEl.find('.file-content').css('display', 'block');
            this.updateDownload();
        }
    }

    FileTransferPanel.prototype.hide = function() {
        currentPage = 0;

        panelEl.find('.no-data').css('display', 'block');
        panelEl.find('.file-content').css('display', 'none');
    }

    FileTransferPanel.prototype.numUploadHistory = function() {
        return uploadFileAnchorList.length;
    }

    FileTransferPanel.prototype.numDownloadHistory = function() {
        return downloadFileLabelList.length;
    }

    FileTransferPanel.prototype.updateUpload = function() {
        tableEl.html('');

        uploadFileAnchorList.forEach(function(fileAnchor) {
            tableEl.append($(makeTableRowWithFileAnchor(fileAnchor).join('')));
        });
    }

    FileTransferPanel.prototype.updateDownload = function() {
        tableEl.html('');
    }

    FileTransferPanel.prototype.fireUploadStart = function(fileAnchor) {
        uploadFileAnchorList.push(fileAnchor);

        if (currentPage == 1) {
            if (uploadFileAnchorList.length > 0) {
                panelEl.find('.no-data').css('display', 'none');
                panelEl.find('.file-content').css('display', 'block');
                this.updateUpload();
            }
        }
    }

    FileTransferPanel.prototype.fireUploading = function(fileAnchor) {
        if (currentPage == 1) {
            refreshTableRow(fileAnchor);
        }
    }

    FileTransferPanel.prototype.fireUploadEnd = function(folder, fileLabel) {
        fileLabelMap.put(fileLabel.fileCode, fileLabel);

        if (currentPage == 1) {
            refreshTableRow(fileLabel);
        }
    }

    FileTransferPanel.prototype.fireDownloadStart = function(fileCode) {
        g.cube().fs.getFileLabel(fileCode, function(fileLabel) {
            
        }, function(error) {

        });
    }

    FileTransferPanel.prototype.fireDownloadEnd = function(fileLabel) {

    }

    g.FileTransferPanel = FileTransferPanel;

})(window);
