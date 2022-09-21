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

    var chartPanel = null;

    var pageNum = 0;
    var pageTotal = 0;

    var btnHotChart = null;

    var btnPrev = null;
    var btnNext = null;

    var btnSelectAll = null;

    var selectedValid = true;

    var validSharingPage = {
        page: 0,
        loaded: 0,
        total: 0
    };

    var invalidSharingPage = {
        page: 0,
        loaded: 0,
        total: 0
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

        chartPanel = $('#modal_trace_chart');

        pageNum = parentEl.find('.page-num');
        pageTotal = parentEl.find('.page-total');

        btnHotChart = parentEl.find('button[data-target="chart-hot"]');

        btnSelectAll = parentEl.find('.checkbox-toggle');

        btnPrev = parentEl.find('button[data-target="prev"]');
        btnPrev.attr('disabled', 'disabled');
        btnNext = parentEl.find('button[data-target="next"]');
        btnNext.attr('disabled', 'disabled');

        // 绑定按钮事件 - 开始

        btnHotChart.click(function() {
            chartPanel.modal('show');
        });

        // 全选按钮
        btnSelectAll.click(function () {
            var clicked = $(this).prop('checked');
            if (clicked) {
                $('.sharing-table input[type="checkbox"]').prop('checked', true);
            }
            else {
                $('.sharing-table input[type="checkbox"]').prop('checked', false);
            }
        });

        btnPrev.click(function() {
            that.prevPage();
        });
        btnNext.click(function() {
            that.nextPage();
        });

        // 绑定按钮事件 - 结束
    }

    FileSharingPanel.prototype.showSharingPanel = function() {
        g.dialog.showLoading('正在加载分享标签数据');

        selectedValid = true;

        parentEl.css('display', 'block');

        var begin = validSharingPage.page * numPerPage;
        var end = begin + numPerPage - 1;
        g.cube().fs.listSharingTags(begin, end, true, function(list, total, beginIndex, endIndex, valid) {
            g.dialog.hideLoading();

            table.updatePage(list, valid);

            validSharingPage.loaded = list.length;
            validSharingPage.total = total;
            that.updatePagination();
        }, function(error) {
            g.dialog.hideLoading();
            g.dialog.launchToast(Toast.Error, '获取分享列表失败：' + error.code);
        });
    }

    FileSharingPanel.prototype.showExpiresPanel = function() {
        g.dialog.showLoading('正在加载分享标签数据');

        selectedValid = false;

        parentEl.css('display', 'block');

        var begin = invalidSharingPage.page * numPerPage;
        var end = begin + numPerPage - 1;
        g.cube().fs.listSharingTags(begin, end, false, function(list, total, beginIndex, endIndex, valid) {
            g.dialog.hideLoading();

            table.updatePage(list, valid);

            invalidSharingPage.loaded = list.length;
            invalidSharingPage.total = total;
            that.updatePagination();
        }, function(error) {
            g.dialog.hideLoading();
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

    FileSharingPanel.prototype.promptCancelSharing = function(sharingCode) {
        g.cube().fs.getSharingTag(sharingCode, function(sharingTag) {
            // 提示
            var content = [
                '您确定要取消该分享码？<p>取消的分享不可恢复。</p>',
                '<p style="margin-left:1rem;">',
                    '<span class="text-muted ellipsis">文件名：', sharingTag.fileLabel.fileName, '</span><br/>',
                    '<span class="text-muted">有效期：', sharingTag.expiryDate > 0 ? g.formatYMDHM(sharingTag.expiryDate) : '永久有效', '</span><br/>',
                    '<span class="text-muted">访问码：', null == sharingTag.password ? '<i>无</i>' : sharingTag.password, '</span>',
                '</p>'
            ];
            g.dialog.showConfirm('取消分享', content.join(''), function(yesOrNo) {
                if (yesOrNo) {
                    g.dialog.showLoading('正在取消标签');

                    g.cube().fs.cancelSharingTag(sharingCode, function(sharingTag) {
                        g.dialog.hideLoading();

                        setTimeout(function() {
                            if (selectedValid) {
                                that.showSharingPanel();
                            }
                            else {
                                that.showExpiresPanel();
                            }
                        }, 100);
                    }, function(error) {
                        alert('访问出错: ' + error.code);
                    });
                }
            });
        }, function(error) {
            alert('访问出错: ' + error.code);
        });
    }

    FileSharingPanel.prototype.updatePagination = function() {
        var pageData = null;
        if (selectedValid) {
            pageData = validSharingPage;
        }
        else {
            pageData = invalidSharingPage;
        }

        // 总页数
        var totalPage = Math.ceil(pageData.total / numPerPage);
        var page = pageData.page + 1;

        pageNum.text(page);
        pageTotal.text(totalPage);

        if (page == 1 || totalPage == 1) {
            btnPrev.attr('disabled', 'disabled');
        }
        else {
            btnPrev.removeAttr('disabled');
        }

        if (page == totalPage || totalPage == 1) {
            btnNext.attr('disabled', 'disabled');
        }
        else {
            btnNext.removeAttr('disabled');
        }
    }

    FileSharingPanel.prototype.prevPage = function() {
        var pageData = null;
        if (selectedValid) {
            pageData = validSharingPage;
        }
        else {
            pageData = invalidSharingPage;
        }

        // 总页数
        var totalPage = Math.ceil(pageData.total / numPerPage);
        var page = pageData.page + 1;

        if (page == 1) {
            return;
        }

        // 上一页
        pageData.page -= 1;

        var begin = pageData.page * numPerPage;
        var end = begin + numPerPage - 1;
        g.cube().fs.listSharingTags(begin, end, selectedValid, function(list, total, beginIndex, endIndex, valid) {
            table.updatePage(list, valid);

            pageData.loaded = list.length;
            pageData.total = total;
            that.updatePagination();
        }, function(error) {
            g.dialog.launchToast(Toast.Error, '获取分享列表失败：' + error.code);
        });
    }

    FileSharingPanel.prototype.nextPage = function() {
        var pageData = null;
        if (selectedValid) {
            pageData = validSharingPage;
        }
        else {
            pageData = invalidSharingPage;
        }

        // 总页数
        var totalPage = Math.ceil(pageData.total / numPerPage);
        var page = pageData.page + 1;

        if (page == totalPage) {
            return;
        }

        // 下一页
        pageData.page += 1;

        var begin = pageData.page * numPerPage;
        var end = begin + numPerPage - 1;
        g.cube().fs.listSharingTags(begin, end, selectedValid, function(list, total, beginIndex, endIndex, valid) {
            table.updatePage(list, valid);

            pageData.loaded = list.length;
            pageData.total = total;
            that.updatePagination();
        }, function(error) {
            g.dialog.launchToast(Toast.Error, '获取分享列表失败：' + error.code);
        });
    }

    g.FileSharingPanel = FileSharingPanel;

})(window);
