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
    var dialogEl = null;
    var tbody = null;

    var paginationEl = null;

    var currentPage = {
        page: 0,
        total: 0,
        numEachPage: 15
    };

    /**
     * 
     * @param {number} sign 
     * @param {VisitTrace} trace 
     * @returns 
     */
    function makeTableRow(sign, trace) {
        var ua = g.helper.parseUserAgent(trace.userAgent);
        //var eventSN = (null != trace.eventParam) ? trace.eventParam.sn || 0 : 0;

        return [
            '<tr>',
                '<td>', sign, '</td>',
                '<td>',
                    g.formatYMDHMS(trace.time),
                '</td>',
                '<td>',
                    trace.address,
                '</td>',
                '<td>',
                    ua.osName + ' / ' + ua.osVersion,
                '</td>',
                '<td>',
                    ua.browserName + ' / ' + ua.browserVersion,
                '</td>',
                '<td>',
                    parseEvent(trace.event),
                '</td>',
                '<td>',
                    parsePlatform(trace.platform),
                '</td>',
            '</tr>'
        ];
    }

    function parseEvent(event) {
        if (event == 'View') {
            return '查看';
        }
        else if (event == 'Extract') {
            return '下载';
        }
        else {
            return event;
        }
    }

    function parsePlatform(platform) {
        if (platform == VisitTrace.PlatformBrowser) {
            return '浏览器';
        }
        else if (platform == VisitTrace.PlatformAppletWeChat) {
            return '微信小程序';
        }
        else {
            return '未知';
        }
    }

    /**
     * 访问痕迹清单。
     * @param {jQuery} el 
     */
    var VisitTraceListDialog = function(el) {
        dialogEl = el;
        tbody = el.find('.trace-tb');
        that = this;
        paginationEl = el.find('.pagination');

        dialogEl.on('hidden.bs.modal', function(e) {
            // paginationEl.find('.page-goto').each(function(index) {
            //     $(this).remove();
            // });
            paginationEl.find('.page-goto').remove();
        });
    }

    VisitTraceListDialog.prototype.open = function(sharingCode) {
        dialogEl.modal('show');
        dialogEl.find('.overlay').css('visibility', 'visible');

        // 防止界面超时
        var timer = setTimeout(function() {
            g.dialog.toast('数据超时');
            that.close();
        }, 10 * 1000);

        var begin = currentPage.page * currentPage.numEachPage;
        var end = begin + currentPage.numEachPage - 1;
        g.engine.fs.listVisitTraces(sharingCode, begin, end, function(list, total) {
            clearTimeout(timer);
            dialogEl.find('.overlay').css('visibility', 'hidden');

            currentPage.total = total;

            that.updateTable(list);
            that.updatePagination();
        }, function(error) {
            clearTimeout(timer);
            g.dialog.toast('加载数据出错：' + error.code);
            that.close();
        });
    }

    VisitTraceListDialog.prototype.close = function() {
        dialogEl.find('.overlay').css('visibility', 'hidden');
        dialogEl.modal('hide');
    }

    VisitTraceListDialog.prototype.updateTable = function(list) {
        var html = [];

        var sn = currentPage.page * currentPage.numEachPage + 1;
        list.forEach(function(trace) {
            var row = makeTableRow(sn, trace);
            html = html.concat(row);
            ++sn;
        });

        tbody[0].innerHTML = html.join('');
    }

    VisitTraceListDialog.prototype.updatePagination = function() {
        var total = currentPage.total;
        var prev = paginationEl.find('.page-prev');

        var num = Math.floor(total / currentPage.numEachPage);
        var mod = total % currentPage.numEachPage;
        if (mod != 0) {
            num += 1;
        }

        var html = [];
        for (var i = 0; i < num; ++i) {
            html.push('<li class="page-item page-goto');
            if (i == currentPage.page) {
                html.push(' page-active');
            }
            html.push('"><a class="page-link" href="#">');
            html.push((i + 1));
            html.push('</a></li>');
        }

        prev.after($(html.join('')));
    }

    g.VisitTraceListDialog = VisitTraceListDialog;

})(window);
