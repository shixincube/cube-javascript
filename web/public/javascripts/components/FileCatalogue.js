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

    var catalogEl = null;
    var transEl = null;
    var sharingEl = null;

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

    var uploadingMap = new OrderMap();
    var downloadingMap = new OrderMap();
    var numCompleted = 0;

    /**
     * 我的文件主界面的引导目录。
     * @param {jQuery} catalog 主目录元素。
     * @param {jQuery} trans 传输列表元素。
     * @param {jQuery} sharing 文件分享列表元素。
     */
    var FileCatalogue = function(catalog, trans, sharing) {
        catalogEl = catalog;
        transEl = trans;
        sharingEl = sharing;

        btnAllFiles = catalogEl.find('#btn_all_files');
        btnImageFiles = catalogEl.find('#btn_image_files');
        btnDocFiles = catalogEl.find('#btn_doc_files');
        btnRecyclebin = catalogEl.find('#btn_recyclebin');

        btnUploading = transEl.find('#btn_trans_upload');
        btnDownloading = transEl.find('#btn_trans_download');
        btnComplete = transEl.find('#btn_trans_complete');

        btnSharing = sharingEl.find('#btn_sharing');
        btnSharingExpired = sharingEl.find('#btn_sharing_expired');

        activeBtn = btnAllFiles;

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

        btnUploading.click(function() {
            //dialog.launchToast(Toast.Warning, '开发中……');
        });
        btnDownloading.click(function() {
            //dialog.launchToast(Toast.Warning, '开发中……');
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

    FileCatalogue.prototype.onFileUpload = function(file) {
        uploadingMap.put(file.name, file);
        btnUploading.find('.badge').text(uploadingMap.size());
    }

    FileCatalogue.prototype.onFileUploading = function(fileAnchor) {
    }

    FileCatalogue.prototype.onFileUploaded = function(fileLabel) {
        ++numCompleted;
        btnComplete.find('.badge').text(numCompleted);

        uploadingMap.remove(fileLabel.getFileName());
        if (uploadingMap.size() > 0) {
            btnUploading.find('.badge').text(uploadingMap.size());
        }
        else {
            btnUploading.find('.badge').text('');
        }
    }

    g.FileCatalogue = FileCatalogue;

})(window);
