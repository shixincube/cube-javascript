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
        numEachPage: 15,
        totalPage: 0
    };

    // 是否正在加载数据
    var loading = false;

    var sharingCode = null;

    /**
     * 
     * @param {number} sign 
     * @param {VisitTrace} trace 
     * @returns 
     */
    function makeTableRow(sign, trace) {
        if (null != trace.userAgent) {
            var ua = g.helper.parseUserAgent(trace.userAgent);

            return [
                '<tr>',
                    '<td>', sign, '</td>',
                    '<td>',
                        g.formatYMDHMS(trace.time),
                    '</td>',
                    '<td data-target="', trace.contactId, '"><i class="text-muted text-xs">未知</i>','</td>',
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
        else if (null != trace.agent) {
            var agent = trace.agent;
            return [
                '<tr>',
                    '<td>', sign, '</td>',
                    '<td>',
                        g.formatYMDHMS(trace.time),
                    '</td>',
                    '<td data-target="', trace.contactId, '"><i class="text-muted text-xs">未知</i>','</td>',
                    '<td>',
                        trace.address,
                    '</td>',
                    '<td>',
                        agent.model + ' / ' + agent.osVersion,
                    '</td>',
                    '<td>',
                        agent.hostName + ' / ' + agent.hostVersion,
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
        else {
            return [
                '<tr>',
                    '<td>','</td>',
                    '<td>','</td>',
                    '<td>','</td>',
                    '<td>','</td>',
                    '<td>','</td>',
                    '<td>','</td>',
                    '<td>','</td>',
                    '<td>','</td>',
                '</tr>'
            ];
        }
    }

    function parseEvent(event) {
        if (event == 'View') {
            return '<span class="text-primary">查看</span>';
        }
        else if (event == 'Extract') {
            return '<span class="text-success">下载</span>';
        }
        else if (event == 'Share') {
            return '<span class="text-danger">分享</span>';
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

    VisitTraceListDialog.prototype.open = function(code) {
        // 赋值
        sharingCode = code;

        dialogEl.modal('show');
        dialogEl.find('.overlay').css('visibility', 'visible');

        // 防止界面超时
        var timer = setTimeout(function() {
            g.dialog.toast('数据超时');
            that.close();
            loading = false;
        }, 10 * 1000);

        loading = true;

        var begin = currentPage.page * currentPage.numEachPage;
        var end = begin + currentPage.numEachPage - 1;
        g.engine.fs.listVisitTraces(sharingCode, begin, end, function(list, total) {
            clearTimeout(timer);
            dialogEl.find('.overlay').css('visibility', 'hidden');

            currentPage.total = total;

            that.updateTable(list);
            that.updatePagination();

            loading = false;
        }, function(error) {
            loading = false;
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
        var contactIdList = [];

        var sn = currentPage.page * currentPage.numEachPage + 1;
        list.forEach(function(trace) {
            var row = makeTableRow(sn, trace);
            html = html.concat(row);
            ++sn;

            if (trace.contactId > 0 && !contactIdList.contains(trace.contactId)) {
                contactIdList.push(trace.contactId);
            }
        });

        tbody[0].innerHTML = html.join('');

        // 填写访问人名称
        contactIdList.forEach(function(id) {
            g.app.getContact(id, function(contact) {
                dialogEl.find('td[data-target="' + id + '"]').text(contact.getPriorityName());
            });
        });
    }

    VisitTraceListDialog.prototype.updatePagination = function() {
        var total = currentPage.total;
        var prev = paginationEl.find('.page-prev');

        var num = Math.floor(total / currentPage.numEachPage);
        var mod = total % currentPage.numEachPage;
        if (mod != 0) {
            num += 1;
        }
        currentPage.totalPage = num;

        var html = [];
        for (var i = 0; i < num; ++i) {
            var pn = i + 1;
            html.push('<li class="page-item page-goto');
            if (i == currentPage.page) {
                html.push(' page-active');
            }
            html.push('" data-target="');
            html.push(pn);
            html.push('">');
            html.push('<a class="page-link" href="javascript:app.visitTraceDialog.gotoPage(');
            html.push(pn);
            html.push(');">');
            html.push(pn);
            html.push('</a></li>');
        }

        prev.after($(html.join('')));
    }

    VisitTraceListDialog.prototype.gotoPage = function(pageNum) {
        var pageIndex = pageNum - 1;
        if (currentPage.page == pageIndex) {
            return;
        }

        if (loading) {
            return;
        }

        loading = true;

        var activeEl = paginationEl.find('.page-active');
        activeEl.removeClass('page-active');

        paginationEl.find('li[data-target="' + pageNum + '"]').addClass('page-active');

        // 更新页码
        currentPage.page = pageIndex;

        var begin = currentPage.page * currentPage.numEachPage;
        var end = begin + currentPage.numEachPage - 1;
        g.engine.fs.listVisitTraces(sharingCode, begin, end, function(list, total) {
            currentPage.total = total;
            that.updateTable(list);
            loading = false;
        }, function(error) {
            loading = false;
            g.dialog.toast('加载数据出错：' + error.code);
        });
    }

    VisitTraceListDialog.prototype.prevPage = function() {
        if (currentPage.page == 0) {
            return;
        }

        this.gotoPage(currentPage.page - 1 + 1);
    }

    VisitTraceListDialog.prototype.nextPage = function() {
        if (currentPage.page + 1 >= currentPage.totalPage) {
            return;
        }

        this.gotoPage(currentPage.page + 1 + 1);
    }

    g.VisitTraceListDialog = VisitTraceListDialog;

})(window);
