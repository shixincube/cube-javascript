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
    var panelEl = null;

    var loadTimer = 0;
    var lastTimestamp = 0;

    var timelineChart = null;

    function FileDashboard(el) {
        that = this;
        panelEl = (undefined === el) ? $('.files-dashboard-panel') : el;
        timelineChart = echarts.init(document.getElementById('file_sharing_timeline_chart'));
    }

    FileDashboard.prototype.show = function() {
        if (0 != loadTimer) {
            clearTimeout(loadTimer);
            loadTimer = 0;
        }

        var now = Date.now();
        if (now - lastTimestamp > 60000) {
            if (g.cube().fs.isReady()) {
                this.reload();
            }
            else {
                loadTimer = setTimeout(function() {
                    that.show();
                }, 1000);
            }
        }

        panelEl.css('display', 'block');
    }

    FileDashboard.prototype.hide = function() {
        if (0 != loadTimer) {
            clearTimeout(loadTimer);
            loadTimer = 0;
        }

        panelEl.css('display', 'none');
    }

    /**
     * 重新加载数据。
     */
    FileDashboard.prototype.reload = function() {
        g.dialog.showLoading();

        var countRecordReport = null;

        var completion = function() {
            if (null != countRecordReport) {
                panelEl.find('span[data-target="total-sharing"]').text(g.helper.thousands(countRecordReport.totalSharingTag));
                panelEl.find('span[data-target="total-view"]').text(g.helper.thousands(countRecordReport.totalEventView));
                panelEl.find('span[data-target="total-download"]').text(g.helper.thousands(countRecordReport.totalEventExtract));
                panelEl.find('span[data-target="total-copy"]').text(g.helper.thousands(countRecordReport.totalEventShare));
            }

            lastTimestamp = Date.now();
            g.dialog.hideLoading();
        }

        g.cube().fs.getSharingReport(SharingReport.CountRecord, function(report) {
            countRecordReport = report;
            completion();
        }, function(error) {
            g.dialog.toast('读取报告出错：' + error.code);
        });
    }

    g.FileDashboard = FileDashboard;

})(window);
