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

    var viewTop10Chart = null;
    var downloadTop10Chart = null;

    var historyChart = null;
    var ipHistoryChart = null;
    var osHistoryChart = null;
    var swHistoryChart = null;

    var fileTypeValidChart = null;
    var fileTypeExpiredChart = null;

    function makeBarChartOption(labels, values) {
        return {
            grid: {
                left: '15%',
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
                    rotate: 45
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

    function refreshViewTop10Chart(report) {
        if (null == viewTop10Chart) {
            viewTop10Chart = echarts.init(document.getElementById('sharing_view_top10'));
        }

        var option = makeBarChartOption(['File 1', 'File 2', 'File 3', 'File 4', 'File 5', 'File 6', 'File 7', 'File 8', 'File 9', 'File 10'],
            [220, 200, 150, 103, 80, 76, 32, 12, 7, 3]);
        viewTop10Chart.setOption(option);
    }

    function refreshDownloadTop10Chart(report) {
        if (null == downloadTop10Chart) {
            downloadTop10Chart = echarts.init(document.getElementById('sharing_download_top10'));
        }

        var option = makeBarChartOption(['File 1', 'File 2', 'File 3', 'File 4', 'File 5', 'File 6', 'File 7', 'File 8', 'File 9', 'File 10'],
            [130, 111, 98, 91, 90, 76, 68, 67, 50, 10]);
        downloadTop10Chart.setOption(option);
    }

    function refreshHistoryChart(report) {
        if (null == historyChart) {
            historyChart = echarts.init(document.getElementById('sharing_timeline_chart'));

        }

        var option = {
            tooltip: {
                trigger: 'axis'
                /*formatter: function(params) {
                  var text = '--'
                  if (params && params.length) {
                    text = params[0].data[0] // 提示框顶部的日期标题
                    params.forEach(item => {
                      const dotHtml = item.marker // 提示框示例的小圆圈,可以在这里修改
                      text += `</br>${dotHtml}${item.seriesName} : ${item.data[1] ? item.data[1] : '-'}`
                    })
                  }
                  return text
                }*/
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
                    saveAsImage: {}
                }
            },
            xAxis: {
                type: 'time', // type 为 time 时,不要传 xAxis.data 的值,x轴坐标的数据会根据传入的时间自动展示
                boundaryGap: false, // false横坐标两边不需要留白
                axisLabel: { // 坐标轴标签样式设置
                    formatter: function(value, index) {
                        const date = new Date(value);
                        const texts = [date.getFullYear(), (date.getMonth() + 1), date.getDate()];
                        return texts.join('-');
                        //return echarts.format.formatTime('yyyy-MM-dd', value);
                    }
                }
            },
            yAxis: {
                type: 'value',
                name: '人次'
            },
            series: []
        };

        const data = [
            {
              type: 'view',
              name: '浏览事件',
              data: [
                ['2020-10-1', 450],
                ['2020-10-2', 350],
                ['2020-10-3', 290],
                ['2020-10-4', 380],
                ['2020-10-5', 540],
                ['2020-10-6', null],
                ['2020-10-7', null],
                ['2020-10-8', 430],
                ['2020-10-9', 330],
                ['2020-10-10', 280],
                ['2020-10-11', 340],
                ['2020-10-12', 455],
                ['2020-10-13', 330],
              ]
            },
            {
              type: 'download',
              name: '下载事件',
              data: [
                ['2020-10-1', 50],
                ['2020-10-2', 150],
                ['2020-10-3', 100],
                ['2020-10-4', 140],
                ['2020-10-5', 141],
                ['2020-10-6', 66],
                ['2020-10-7', 78],
                ['2020-10-8', 67],
                ['2020-10-9', 55],
                ['2020-10-10', 80],
                ['2020-10-11', 40],
                ['2020-10-12', 120],
                ['2020-10-13', 130],
              ]
            },
            {
              type: 'copy',
              name: '复制链接',
              data: [
                ['2020-10-1', 234],
                ['2020-10-2', 254],
                ['2020-10-3', 260],
                ['2020-10-4', 270],
                ['2020-10-5', 250],
                ['2020-10-6', 277],
                ['2020-10-7', 289],
                ['2020-10-8', 240],
                ['2020-10-9', 230],
                ['2020-10-10', 222],
                ['2020-10-11', 244],
                ['2020-10-12', 254],
                ['2020-10-13', 279],
              ]
            }
        ];

        const series = []
        const legendData = []
        data.forEach(item => {
        const obj = {
            name: item.name,
            type: 'line',
            data: item.data
        }
        legendData.push(item.name);
        series.push(obj);
        })
        option.legend.data = legendData;
        option.series = series;

        historyChart.setOption(option, true);
    }

    function refreshIPHistoryChart(report) {
        if (null == ipHistoryChart) {
            ipHistoryChart = echarts.init(document.getElementById('sharing_ip_history_chart'));
        }

        var data = [
            { value: 1048, name: '北京' },
            { value: 735, name: '上海' },
            { value: 580, name: '广州' },
            { value: 484, name: '成都' },
            { value: 300, name: '昆明' }
        ];

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

        var data = [
            { value: 908, name: 'Windows' },
            { value: 782, name: 'iPhone' },
            { value: 223, name: 'Mac' },
            { value: 101, name: 'Android' },
            { value: 27, name: 'Linux' }
        ];

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

        var data = [
            { value: 898, name: 'Chrome' },
            { value: 201, name: 'Firefox' },
            { value: 87, name: 'Safari' },
            { value: 66, name: 'Edge' }
        ];

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

    function onResize() {
        if (null != viewTop10Chart) {
            viewTop10Chart.resize();
        }
        if (null != downloadTop10Chart) {
            downloadTop10Chart.resize();
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
        g.dialog.showLoading('正在加载仪表数据');

        var countRecordReport = null;

        var completion = function() {
            if (null != countRecordReport) {
                panelEl.find('span[data-target="total-sharing"]').text(g.helper.thousands(countRecordReport.totalSharingTag));
                panelEl.find('span[data-target="total-view"]').text(g.helper.thousands(countRecordReport.totalEventView));
                panelEl.find('span[data-target="total-download"]').text(g.helper.thousands(countRecordReport.totalEventExtract));
                panelEl.find('span[data-target="total-copy"]').text(g.helper.thousands(countRecordReport.totalEventShare));
            }

            refreshViewTop10Chart();
            refreshDownloadTop10Chart();

            setTimeout(function() {
                refreshHistoryChart();
                refreshIPHistoryChart();
                refreshOSHistoryChart();
                refreshSWHistoryChart();
            }, 500);

            setImmediate(function() {
                refreshFileTypeValidChart();
                refreshFileTypeExpiredChart();
            }, 1000);

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
