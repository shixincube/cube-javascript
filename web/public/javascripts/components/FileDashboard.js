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

    var countRecordReport = null;
    var historyReport = null;

    var viewTopNChart = null;
    var downloadTopNChart = null;

    var historyChartLoading = false;
    var historyChart = null;
    var ipHistoryChart = null;
    var osHistoryChart = null;
    var swHistoryChart = null;

    var visitorChart = null;

    var fileTypeValidChart = null;
    var fileTypeExpiredChart = null;

    function makeBarChartOption(labels, values) {
        return {
            grid: {
                left: '20%',
                right: '5%',
                top: '5%',
                bottom: '10%'
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                }
            },
            xAxis: {
                type: 'value'
            },
            yAxis: {
                type: 'category',
                inverse: true,
                axisLabel: {
                    interval: 0,
                    rotate: 30
                },
                data: labels
            },
            series: [{
                data: values,
                type: 'bar',
                barWidth: 20,
                itemStyle: {
                    normal: {
                        color: function(param) {
                            return g.helper.chartColors[param.dataIndex];
                        }
                    }
                }
            }]
        };
    }

    function refreshViewTopNChart(report) {
        if (null == viewTopNChart) {
            // 删除 overlay
            $('#sharing_view_top10').parent().next().remove();
            viewTopNChart = echarts.init(document.getElementById('sharing_view_top10'));
        }

        if (report.topViewRecords) {
            var categoryList = [];
            var valueList = [];
            report.topViewRecords.forEach(function(item) {
                var code = item.code;
                var total = item.total;
                var tag = report.getSharingTag(code);
                if (null == tag) {
                    return;
                }
                categoryList.push(tag.fileLabel.getFileName());
                valueList.push(total);
            });
            var option = makeBarChartOption(categoryList, valueList);
            viewTopNChart.setOption(option);
        }
    }

    function refreshDownloadTopNChart(report) {
        if (null == downloadTopNChart) {
            // 删除 overlay
            $('#sharing_download_top10').parent().next().remove();
            downloadTopNChart = echarts.init(document.getElementById('sharing_download_top10'));
        }

        if (report.topExtractRecords) {
            var categoryList = [];
            var valueList = [];
            report.topExtractRecords.forEach(function(item) {
                var code = item.code;
                var total = item.total;
                var tag = report.getSharingTag(code);
                if (null == tag) {
                    return;
                }
                categoryList.push(tag.fileLabel.getFileName());
                valueList.push(total);
            });

            var option = makeBarChartOption(categoryList, valueList);
            downloadTopNChart.setOption(option);
        }
        
    }

    function refreshHistoryChart(report, config) {
        if (null == historyChart) {
            historyChart = echarts.init(document.getElementById('sharing_timeline_chart'));
        }

        var monthGrade = false;
        if (config) {
            if ((config.duration > 3 && config.unit == CalendarUnit.MONTH)
                || (config.unit == CalendarUnit.YEAR)) {
                monthGrade = true;
            }
        }

        // 隐藏 Overlay
        $('#sharing_timeline_chart').parent().next().css('visibility', 'hidden');

        var option = {
            tooltip: {
                trigger: 'axis',
                formatter: function(params) {
                    var text = '--'
                    if (params && params.length) {
                        text = params[0].data[0]; // 提示框顶部的日期标题
                        if (monthGrade) {
                            text = text.substring(0, text.length - 3);
                        }
                        params.forEach(function(item) {
                            const dotHtml = item.marker; // 提示框示例的小圆圈,可以在这里修改
                            text += `</br>${dotHtml}${item.seriesName} : ${(undefined !== item.data[1]) ? item.data[1] : '-'}`;
                        });
                    }
                    return text;
                }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            legend: {
                data: []
            },
            toolbox: {
                feature: {
                    saveAsImage: {
                        name: '分享文档访问统计'
                    }
                }
            },
            xAxis: {
                type: monthGrade ? 'category' : 'time', // type 为 time 时，不要传 xAxis.data 的值，x轴坐标的数据会根据传入的时间自动展示
                boundaryGap: false, // false 横坐标两边不需要留白
                axisLabel: { // 坐标轴标签样式设置
                    formatter: function(value, index) {
                        if (monthGrade) {
                            return value.substring(0, value.length - 3);;
                        }

                        const date = new Date(value);
                        const texts = [date.getFullYear(), (date.getMonth() + 1), date.getDate()];
                        return texts.join('-');
                        //return echarts.format.formatTime('yyyy-MM-dd', value);
                    }
                }
            },
            yAxis: {
                type: 'value',
                name: '次'
            },
            series: []
        };

        const viewData = [];
        report.timelineView.forEach(function(item) {
            viewData.push([g.formatYMD(item.time), item.total]);
        });
        const extractData = [];
        report.timelineExtract.forEach(function(item) {
            extractData.push([g.formatYMD(item.time), item.total]);
        });
        const shareData = [];
        report.timelineShare.forEach(function(item) {
            shareData.push([g.formatYMD(item.time), item.total]);
        });

        const data = [{
              type: 'view',
              name: '浏览文件',
              data: viewData
            }, {
              type: 'download',
              name: '下载文件',
              data: extractData
            }, {
              type: 'copy',
              name: '复制链接',
              data: shareData
            }
        ];

        const series = []
        const legendData = []
        data.forEach(function(item) {
            const obj = {
                name: item.name,
                type: 'line',
                data: item.data
            }
            legendData.push(item.name);
            series.push(obj);
        });
        option.legend.data = legendData;
        option.series = series;

        historyChart.setOption(option, true);
    }

    function refreshIPHistoryChart(report) {
        if (null == ipHistoryChart) {
            ipHistoryChart = echarts.init(document.getElementById('sharing_ip_history_chart'));
        }

        const data = report.ipTotalStatistics;

        var option = {
            tooltip: {
                trigger: 'item'
            },
            legend: {
                orient: 'vertical',
                left: 'left'
            },
            series: [{
                type: 'pie',
                radius: ['35%', '75%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 10,
                    borderColor: '#fff',
                    borderWidth: 2
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: '24',
                        fontWeight: 'bold'
                    }
                    /*itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }*/
                },
                labelLine: {
                    show: true
                },
                data: data
            }]
        };

        ipHistoryChart.setOption(option);
    }

    function refreshOSHistoryChart(report) {
        if (null == osHistoryChart) {
            osHistoryChart = echarts.init(document.getElementById('sharing_os_history_chart'));
        }

        const data = report.osTotalStatistics;
        /*[
            { value: 908, name: 'Windows' },
            { value: 782, name: 'iPhone' },
            { value: 223, name: 'Mac' },
            { value: 101, name: 'Android' },
            { value: 27, name: 'Linux' }
        ];*/

        var option = {
            tooltip: {
                trigger: 'item'
            },
            legend: {
                orient: 'vertical',
                left: 'right'
            },
            series: [{
                type: 'pie',
                radius: '75%',
                data: data,
                emphasis: {
                    label: {
                        show: true,
                        fontSize: '18',
                        fontWeight: 'bold'
                    },
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }]
        };

        osHistoryChart.setOption(option);
    }

    function refreshSWHistoryChart(report) {
        if (null == swHistoryChart) {
            swHistoryChart = echarts.init(document.getElementById('sharing_sw_history_chart'));
        }

        const data = report.swTotalStatistics;
        /*[
            { value: 898, name: 'Chrome' },
            { value: 201, name: 'Firefox' },
            { value: 87, name: 'Safari' },
            { value: 66, name: 'Edge' }
        ];*/

        var option = {
            tooltip: {
                trigger: 'item'
            },
            legend: {
                orient: 'vertical',
                left: 'right'
            },
            series: [{
                type: 'pie',
                radius: '75%',
                data: data,
                emphasis: {
                    label: {
                        show: true,
                        fontSize: '18',
                        fontWeight: 'bold'
                    },
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }]
        };

        swHistoryChart.setOption(option);
    }

    function refreshFileTypeValidChart(report) {
        if (null == fileTypeValidChart) {
            $('.file-type-box').parent().next().remove();
            fileTypeValidChart = echarts.init(document.getElementById('sharing_file_type_valid'));
        }

        var category = ['PDF', 'PNG', 'JPG', 'DOC'];
        var data = [3, 7, 11, 29];

        var option = {
            polar: {
                radius: ['10%', '80%']
            },
            angleAxis: {
                max: 30,
                startAngle: 0
            },
            radiusAxis: {
                type: 'category',
                data: category
            },
            tooltip: {
                trigger: 'axis',
                axisPointer : {
                    type : 'shadow'
                }
            },
            series: {
                type: 'bar',
                data: data,
                coordinateSystem: 'polar',
                label: {
                    show: true,
                    position: 'middle',
                    formatter: '{b}  {c}'
                },
                itemStyle: {
                    normal: {
                        color: function(params) {
                            return g.helper.chartColors[params.dataIndex];
                        }
                    }
                }
            }
        };

        fileTypeValidChart.setOption(option);
    }

    function refreshFileTypeExpiredChart(report) {
        if (null == fileTypeExpiredChart) {
            fileTypeExpiredChart = echarts.init(document.getElementById('sharing_file_type_expired'));
        }

        var category = ['PPT', 'XLS', 'DOC', 'MP3'];
        var data = [10, 12, 26, 37];

        var option = {
            polar: {
                radius: ['10%', '80%']
            },
            angleAxis: {
                max: 40,
                startAngle: 0
            },
            radiusAxis: {
                type: 'category',
                data: category
            },
            tooltip: {
                trigger: 'axis',
                axisPointer : {
                    type : 'shadow'
                }
            },
            series: {
                type: 'bar',
                data: data,
                coordinateSystem: 'polar',
                label: {
                    show: true,
                    position: 'middle',
                    formatter: '{b}  {c}'
                },
                itemStyle: {
                    normal: {
                        color: function(params) {
                            return g.helper.chartReversalColors[params.dataIndex];
                        }
                    }
                }
            }
        };

        fileTypeExpiredChart.setOption(option);
    }

    function refreshVisitorChart(report, config) {
        if (null == visitorChart) {
            visitorChart = echarts.init(document.getElementById('sharing_visitor_chart'));
        }

        var monthGrade = false;
        if (config) {
            if ((config.duration > 3 && config.unit == CalendarUnit.MONTH)
                || (config.unit == CalendarUnit.YEAR)) {
                monthGrade = true;
            }
        }

        // 清空联系人数据
        var selected = true;
        var selectEl = $('.visitor-contact-select');
        selectEl.select2('destroy');
        selectEl.val(null);
        report.getVisitorList().forEach(function(item) {
            var newOption = new Option(item.getName(), item.getId(), selected, selected);
            selectEl.append(newOption);
            if (selected) {
                selected = false;
            }
        });
        selectEl.select2();
        // selectEl.trigger('change');

        // 隐藏 Overlay
        $('.visitor-chart-box').parent().next().css('visibility', 'hidden');

        var files = ['File 1', 'File 2', 'File 3', 'File 4', 'File 5'];
        var data = makeVisitorChartSeries(report);

        var option = {
            grid: {
                left: '5%',
                right: '5%',
                top: '5%',
                bottom: '10%'
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                }
            },
            toolbox: {
                show: true,
                orient: 'vertical',
                left: 'right',
                top: 'center',
                feature: {
                    mark: { show: true },
                    magicType: { show: true, type: ['line', 'bar', 'stack'] },
                    restore: { show: true },
                    saveAsImage: {
                        show: true,
                        name: '访客统计'
                    }
                }
            },
            xAxis: [{
                type: 'category',
                axisTick: { show: false },
                data: files
            }],
            yAxis: [{
                type: 'value'
            }],
            series: data
        };

        visitorChart.setOption(option);
    }

    function makeVisitorChartSeries() {
        const labelOption = {
            show: true,
            position: 'insideBottom',
            distance: 15,
            align: 'left',
            verticalAlign: 'middle',
            rotate: 90,
            formatter: '{c}  {name|{a}}',
            fontSize: 16,
            rich: {
                name: {}
            }
        };

        return [{
                name: '浏览',
                type: 'bar',
                barGap: 0,
                label: labelOption,
                emphasis: {
                    focus: 'series'
                },
                itemStyle: {
                    normal: {
                        color: function(param) {
                            return g.helper.chartColors[1];
                        }
                    }
                },
                data: [320, 332, 301, 334, 390]
            }, {
                name: '下载',
                type: 'bar',
                label: labelOption,
                emphasis: {
                    focus: 'series'
                },
                itemStyle: {
                    normal: {
                        color: function(param) {
                            return g.helper.chartColors[3];
                        }
                    }
                },
                data: [220, 182, 191, 234, 290]
            }, {
                name: '复制',
                type: 'bar',
                label: labelOption,
                emphasis: {
                    focus: 'series'
                },
                itemStyle: {
                    normal: {
                        color: function(param) {
                            return g.helper.chartColors[9];
                        }
                    }
                },
                data: [150, 232, 201, 154, 190]
            }
        ];
    }

    function parseDurationValue(durationDesc) {
        var config = {
            duration: 7,
            unit: CalendarUnit.DAY
        };

        if (durationDesc == '7d') {
            config.duration = 7;
            config.unit = CalendarUnit.DAY;
        }
        else if (durationDesc == '30d') {
            config.duration = 30;
            config.unit = CalendarUnit.DAY;
        }
        else if (durationDesc == '3m') {
            config.duration = 3;
            config.unit = CalendarUnit.MONTH;
        }
        else if (durationDesc == '6m') {
            config.duration = 6;
            config.unit = CalendarUnit.MONTH;
        }
        else if (durationDesc == '1y') {
            config.duration = 1;
            config.unit = CalendarUnit.YEAR;
        }

        return config;
    }

    function onHistoryDurationChange(durationDesc) {
        if (historyChartLoading) {
            return;
        }

        historyChartLoading = true;

        // 显示 Overlay
        $('#sharing_timeline_chart').parent().next().css('visibility', 'visible');

        // 解析 Duration 值
        var config = parseDurationValue(durationDesc);

        // 历史数据
        g.cube().fs.getSharingReport(SharingReport.HistoryEventRecord, function(historyReport) {
            refreshHistoryChart(historyReport, config);
            refreshIPHistoryChart(historyReport);
            refreshOSHistoryChart(historyReport);
            refreshSWHistoryChart(historyReport);

            historyChartLoading = false;
        }, function(error) {
            g.dialog.toast('读取报告出错：' + error.code);
            historyChartLoading = false;
        }, config);
    }

    function onResize() {
        if (null != viewTopNChart) {
            viewTopNChart.resize();
        }
        if (null != downloadTopNChart) {
            downloadTopNChart.resize();
        }
        if (null != historyChart) {
            historyChart.resize();
        }
        if (null != ipHistoryChart) {
            ipHistoryChart.resize();
        }
        if (null != osHistoryChart) {
            osHistoryChart.resize();
        }
        if (null != swHistoryChart) {
            swHistoryChart.resize();
        }
        if (null != visitorChart) {
            visitorChart.resize();
        }
        if (null != fileTypeValidChart) {
            fileTypeValidChart.resize();
        }
        if (null != fileTypeExpiredChart) {
            fileTypeExpiredChart.resize();
        }
    }


    function FileDashboard(el) {
        that = this;
        panelEl = (undefined === el) ? $('.files-dashboard-panel') : el;
        $(window).resize(function() {
            onResize();
        });

        $('.visit-timeline-select').select2().val('7d').trigger('change');
        $('.visit-timeline-select').on('change', function(e) {
            onHistoryDurationChange(e.currentTarget.value);
        });

        $('.visitor-timeline-select').select2().val('7d').trigger('change');
    }

    FileDashboard.prototype.show = function() {
        if (0 != loadTimer) {
            clearTimeout(loadTimer);
            loadTimer = 0;
        }

        var now = Date.now();
        if (now - lastTimestamp > 5 * 60 * 1000) {
            if (g.cube().fs.isReady()) {
                lastTimestamp = now;
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
        g.dialog.showLoading('正在加载仪表数据');

        var gotCountRecordReport = false;
        var gotHistoryReport = false;

        var completion = function() {
            if (gotCountRecordReport && null != countRecordReport) {
                panelEl.find('span[data-target="total-sharing"]').text(g.helper.thousands(countRecordReport.totalSharingTag));
                panelEl.find('span[data-target="total-view"]').text(g.helper.thousands(countRecordReport.totalEventView));
                panelEl.find('span[data-target="total-download"]').text(g.helper.thousands(countRecordReport.totalEventExtract));
                panelEl.find('span[data-target="total-copy"]').text(g.helper.thousands(countRecordReport.totalEventShare));

                refreshViewTopNChart(countRecordReport);
                refreshDownloadTopNChart(countRecordReport);

                countRecordReport = null;
            }
            else if (gotHistoryReport && null != historyReport) {
                refreshHistoryChart(historyReport);
                refreshIPHistoryChart(historyReport);
                refreshOSHistoryChart(historyReport);
                refreshSWHistoryChart(historyReport);

                historyReport = null;
            }

            if (gotCountRecordReport && gotHistoryReport) {
                g.dialog.hideLoading();
            }
        }

        // 计数记录
        g.cube().fs.getSharingReport([
            SharingReport.CountRecord,
            SharingReport.TopCountRecord
        ], function(report) {
            countRecordReport = report;
            gotCountRecordReport = true;
            completion();
        }, function(error) {
            g.dialog.toast('读取报告出错：' + error.code);
        });

        historyChartLoading = true;

        // 历史数据
        g.cube().fs.getSharingReport(SharingReport.HistoryEventRecord, function(report) {
            historyReport = report;
            gotHistoryReport = true;
            historyChartLoading = false;
            completion();
        }, function(error) {
            historyChartLoading = false;
            g.dialog.toast('读取报告出错：' + error.code);
        }, {
            duration: 7,
            unit: CalendarUnit.DAY
        });

        setTimeout(function() {
            // 访客数据
            g.cube().fs.getSharingReport(SharingReport.VisitorRecord, function(report) {
                refreshVisitorChart(report);
            }, function(error) {
                g.dialog.toast('读取报告出错：' + error.code);
            }, {
                duration: 7,
                unit: CalendarUnit.DAY
            });
        }, 1000);

        setTimeout(function() {
            refreshFileTypeValidChart();
            refreshFileTypeExpiredChart();
        }, 2000);
    }

    g.FileDashboard = FileDashboard;

})(window);
