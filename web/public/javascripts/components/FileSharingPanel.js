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

    const numPerPage = 15;

    var parentEl = null;
    var table = null;

    var selectedValid = true;

    var infoLoaded = 0;
    var infoTotal = 0;

    var btnPrev = null;
    var btnNext = null;

    var sharingPage = {
        page: 0,
        loaded: 0
    };

    var expiredSharingPage = {
        page: 0,
        loaded: 0
    };

    /**
     * 我分享的文件内容界面。
     * @param {jQuery} el 界面元素。
     */
    var FileSharingPanel = function(el) {
        parentEl = el;
        table = new FileSharingTable(el.find('.sharing-table'));

        that = this;
        this.initUI();
    }

    FileSharingPanel.prototype.initUI = function() {
        parentEl.removeClass('files-hidden');
        parentEl.css('display', 'none');

        infoLoaded = parentEl.find('.info-loaded');
        infoTotal = parentEl.find('.info-total');

        btnPrev = parentEl.find('button[data-target="prev"]');
        btnPrev.attr('disabled', 'disabled');
        btnNext = parentEl.find('button[data-target="next"]');
        btnNext.attr('disabled', 'disabled');

        btnPrev.click(function() {
            that.prevPage();
        });
        btnNext.click(function() {
            that.nextPage();
        });
    }

    FileSharingPanel.prototype.showSharingPanel = function() {
        this.selectedValid = true;

        parentEl.css('display', 'block');

        var begin = sharingPage.page * numPerPage;
        var end = begin + numPerPage - 1;
        g.cube().fs.listSharingTags(begin, end, true, function(list, total, beginIndex, endIndex, valid) {
            table.updatePage(list);

            sharingPage.loaded = list.length;
            infoLoaded.text(list.length);
            infoTotal.text(total);
        }, function(error) {
            g.dialog.launchToast(Toast.Error, '获取分享列表失败：' + error.code);
        });
    }

    FileSharingPanel.prototype.showExpiresPanel = function() {
        this.selectedValid = false;

        parentEl.css('display', 'block');

        var begin = expiredSharingPage.page * numPerPage;
        var end = begin + numPerPage - 1;
        g.cube().fs.listSharingTags(begin, end, false, function(list, total, beginIndex, endIndex, valid) {
            table.updatePage(list);

            expiredSharingPage.loaded = list.length;
            infoLoaded.text(list.length);
            infoTotal.text(total);
        }, function(error) {
            g.dialog.launchToast(Toast.Error, '获取分享列表失败：' + error.code);
        });
    }

    /**
     * 隐藏文件数据面板。
     */
     FileSharingPanel.prototype.hide = function() {
        parentEl.css('display', 'none');
    }

    FileSharingPanel.prototype.showTraceDialog = function(sharingCode) {
        app.visitTraceDialog.open(sharingCode);
    }

    FileSharingPanel.prototype.prevPage = function() {

    }

    FileSharingPanel.prototype.nextPage = function() {

    }

    g.FileSharingPanel = FileSharingPanel;

})(window);
