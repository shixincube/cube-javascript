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

    var that = null;

    var catalogEl = null;
    var sharingEl = null;
    var transEl = null;
    var performanceEl = null;

    var btnAllFiles = null;
    var btnImageFiles = null;
    var btnDocFiles = null;
    var btnRecyclebin = null;

    var btnUploading = null;
    var btnDownloading = null;
    var btnComplete = null;

    var btnSharing = null;
    var btnSharingExpired = null;

    var activeBtn = null;

    var transPanelEl = null;
    var transPanel = null;

    var uploadingMap = new OrderMap();
    var downloadingArray = [];
    var numCompleted = 0;

    /**
     * 我的文件主界面的引导目录。
     * @param {jQuery} catalog 主目录元素。
     * @param {jQuery} trans 传输列表元素。
     * @param {jQuery} sharing 文件分享列表元素。
     * @param {jQuery} performance
     */
    var FileCatalogue = function(catalog, sharing, trans, performance) {
        catalogEl = catalog;
        sharingEl = sharing;
        transEl = trans;
        performanceEl = performance;

        btnAllFiles = catalogEl.find('#btn_all_files');
        btnImageFiles = catalogEl.find('#btn_image_files');
        btnDocFiles = catalogEl.find('#btn_doc_files');
        btnRecyclebin = catalogEl.find('#btn_recyclebin');

        btnSharing = sharingEl.find('#btn_sharing');
        btnSharingExpired = sharingEl.find('#btn_sharing_expired');

        btnUploading = transEl.find('#btn_trans_upload');
        btnDownloading = transEl.find('#btn_trans_download');
        btnComplete = transEl.find('#btn_trans_complete');

        activeBtn = btnAllFiles;

        transPanelEl = $('.file-trans-panel');
        transPanel = new FileTransferPanel();

        that = this;
    }

    /**
     * 初始化控件数据。
     */
    FileCatalogue.prototype.prepare = function() {
        g.app.filePanel.showRoot();

        btnAllFiles.click(function() {
            that.select($(this).attr('id'));
        });
        btnImageFiles.click(function() {
            that.select($(this).attr('id'));
        });
        btnDocFiles.click(function() {
            that.select($(this).attr('id'));
        });
        btnRecyclebin.click(function() {
            that.select($(this).attr('id'));
        });

        btnUploading.popover({
            html: true,
            placement: 'right',
            trigger: 'click',
            content: transPanelEl
        }).on('show.bs.popover', function() {
            that.showUpload();
        }).on('shown.bs.popover', function() {
            transPanelEl.parent().parent().css('maxWidth', '800px');
        });

        btnDownloading.popover({
            html: true,
            placement: 'right',
            trigger: 'click',
            content: transPanelEl
        }).on('show.bs.popover', function() {
            that.showDownload();
        }).on('shown.bs.popover', function() {
            transPanelEl.parent().parent().css('maxWidth', '800px');
        });

        btnComplete.click(function() {
            //dialog.launchToast(Toast.Warning, '开发中……');
        });

        btnSharing.click(function() {
            that.select($(this).attr('id'));
        });
        btnSharingExpired.click(function() {
            that.select($(this).attr('id'));
        });

        // 刷新存储空间数据显示
        this.refreshSpaceSize();
    }

    FileCatalogue.prototype.refreshSpaceSize = function() {
        if (g.cube().fs.getMaxFileSpaceSize() == 0) {
            setTimeout(function() {
                that.refreshSpaceSize();
            }, 5000);
            return;
        }

        var dataText = [
            g.formatSize(g.cube().fs.getFileSpaceSize()),
            ' / ',
            g.formatSize(g.cube().fs.getMaxFileSpaceSize())
        ];

        performanceEl.find('.file-space-desc').text(dataText.join(''));

        var progress = g.cube().fs.getFileSpaceSize() / g.cube().fs.getMaxFileSpaceSize() * 100.0;
        performanceEl.find('.progress-bar').width(progress + '%');

        dataText = [
            '已用空间：', g.formatSize(g.cube().fs.getFileSpaceSize()),
            '，',
            '可用空间：', g.formatSize(g.cube().fs.getMaxFileSpaceSize())
        ];
        performanceEl.find('.file-space-size').attr('title', dataText.join(''));
    }

    /**
     * 选择指定目录ID对应的数据进行显示。
     * @param {string} id 目录ID 。
     */
    FileCatalogue.prototype.select = function(id) {
        if (activeBtn.attr('id') == id) {
            return;
        }

        activeBtn.removeClass('active');

        if (btnAllFiles.attr('id') == id) {
            activeBtn = btnAllFiles;
            g.app.filePanel.showRoot();
            g.app.fileSharingPanel.hide();
        }
        else if (btnImageFiles.attr('id') == id) {
            activeBtn = btnImageFiles;
            g.app.filePanel.showImages();
            g.app.fileSharingPanel.hide();
        }
        else if (btnDocFiles.attr('id') == id) {
            activeBtn = btnDocFiles;
            g.app.filePanel.showDocuments();
            g.app.fileSharingPanel.hide();
        }
        else if (btnRecyclebin.attr('id') == id) {
            activeBtn = btnRecyclebin;
            g.app.filePanel.showRecyclebin();
            g.app.fileSharingPanel.hide();
        }
        else if (btnSharing.attr('id') == id) {
            activeBtn = btnSharing;
            g.app.fileSharingPanel.showSharingPanel();
            g.app.filePanel.hide();
        }
        else if (btnSharingExpired.attr('id') == id) {
            activeBtn = btnSharingExpired;
            g.app.fileSharingPanel.showExpiresPanel();
            g.app.filePanel.hide();
        }

        activeBtn.addClass('active');

        // 更新面板
        g.app.filePanel.setTitle(activeBtn.attr('title'));
    }

    /**
     * Upload List
     */
    FileCatalogue.prototype.showUpload = function() {
        btnDownloading.popover('hide');
        transPanel.show(btnUploading);
    }

    /**
     * Download List
     */
    FileCatalogue.prototype.showDownload = function() {
        btnUploading.popover('hide');
        transPanel.show(btnDownloading);
    }

    FileCatalogue.prototype.onFileUpload = function(fileAnchor) {
        uploadingMap.put(fileAnchor.getFileName(), fileAnchor);
        btnUploading.find('.badge').text(uploadingMap.size());

        transPanel.fireUploadStart(fileAnchor);
    }

    FileCatalogue.prototype.onFileUploading = function(fileAnchor) {
        transPanel.fireUploading(fileAnchor);
    }

    FileCatalogue.prototype.onFileUploaded = function(folder, fileLabel) {
        ++numCompleted;
        btnComplete.find('.badge').text(numCompleted);

        uploadingMap.remove(fileLabel.getFileName());
        if (uploadingMap.size() > 0) {
            btnUploading.find('.badge').text(uploadingMap.size());
        }
        else {
            btnUploading.find('.badge').text('');
        }

        transPanel.fireUploadEnd(folder, fileLabel);
    }

    FileCatalogue.prototype.onFileDownload = function(fileCode) {
        if (!downloadingArray.contains(fileCode)) {
            downloadingArray.push(fileCode);
        }
        btnDownloading.find('.badge').text(downloadingArray.length);
    }

    FileCatalogue.prototype.onFileDownloaded = function(fileLabel) {
        ++numCompleted;
        btnComplete.find('.badge').text(numCompleted);

        var fileCode = (typeof fileLabel == 'string') ? fileLabel : fileLabel.getFileCode();
        downloadingArray.remove(fileCode);
        if (downloadingArray.length > 0) {
            btnDownloading.find('.badge').text(downloadingArray.length);
        }
        else {
            btnDownloading.find('.badge').text('');
        }
    }

    g.FileCatalogue = FileCatalogue;

})(window);
