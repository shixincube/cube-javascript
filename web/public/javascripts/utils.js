/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020 Shixin Cube Team.
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

    var OneDay = 24 * 60 * 60 * 1000;
    var TwoDays = OneDay + OneDay;
    var AWeek = 7 * OneDay;

    var KB = 1024;
    var MB = 1024 * KB;
    var GB = 1024 * MB;
    var TB = 1024 * GB;

    g.AWeek = AWeek;

    var WeekDay = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

    function formatNumber(num, length) {
        if (length == 2) {
            if (num < 10) {
                return '0' + num;
            }
        }
        else if (length == 3) {
            if (num < 10) {
                return '00' + num;
            }
            else if (num < 100) {
                return '0' + num;
            }
        }
        else if (length == 4) {
            if (num < 10) {
                return '000' + num;
            }
            else if (num < 100) {
                return '00' + num;
            }
            else if (num < 1000) {
                return '0' + num;
            }
        }

        return '' + num;
    }

    g.formatShortTime = function(value) {
        var result = [];
        var now = Date.now();
        if (now > value) {
            // 今日零点
            var zeroHour = new Date(new Date().setHours(0, 0, 0, 0));
            zeroHour = zeroHour.getTime();
            // 昨日零点
            var yesterdayZeroHour = zeroHour - OneDay + 1;
            var date = new Date(value);
            if (value < yesterdayZeroHour) {
                result.push('前天');
            }
            else if (value >= yesterdayZeroHour && value < zeroHour) {
                result.push('昨天');
            }
            else if (value >= zeroHour) {
                result.push(formatNumber(date.getHours(), 2));
                result.push(':');
                result.push(formatNumber(date.getMinutes(), 2));
            }
            else {
                result.push(formatNumber(date.getMonth() + 1, 2));
                result.push('-');
                result.push(formatNumber(date.getDate(), 2));
            }
        }
        else {
            var date = new Date(value);
            result.push(formatNumber(date.getHours(), 2));
            result.push(':');
            result.push(formatNumber(date.getMinutes(), 2));
        }

        return result.join('');
    }

    g.formatFullTime = function(value) {
        var result = [];
        var now = Date.now();
        if (now > value) {
            // 今日零点
            var zeroHour = new Date(new Date().setHours(0, 0, 0, 0));
            zeroHour = zeroHour.getTime();
            // 昨日零点
            var yesterdayZeroHour = zeroHour - OneDay + 1;
            var date = new Date(value);
            if (value >= yesterdayZeroHour && value < zeroHour) {
                result.push('昨天 ');
                result.push(formatNumber(date.getHours(), 2));
                result.push(':');
                result.push(formatNumber(date.getMinutes(), 2));
            }
            else if (value >= zeroHour) {
                result.push('今天 ');
                result.push(formatNumber(date.getHours(), 2));
                result.push(':');
                result.push(formatNumber(date.getMinutes(), 2));
            }
            else {
                result.push(date.getFullYear());
                result.push('-');
                result.push(formatNumber(date.getMonth() + 1, 2));
                result.push('-');
                result.push(formatNumber(date.getDate(), 2));
                result.push(' ');
                result.push(formatNumber(date.getHours(), 2));
                result.push(':');
                result.push(formatNumber(date.getMinutes(), 2));
            }
        }
        else {
            var date = new Date(value);
            result.push(date.getFullYear());
            result.push('-');
            result.push(formatNumber(date.getMonth() + 1, 2));
            result.push('-');
            result.push(formatNumber(date.getDate(), 2));
            result.push(' ');
            result.push(formatNumber(date.getHours(), 2));
            result.push(':');
            result.push(formatNumber(date.getMinutes(), 2));
        }

        result.push(' <span class="week-day">(');
        result.push(WeekDay[date.getDay()]);
        result.push(')</span>');

        return result.join('');
    }

    g.formatSize = function(size) {
        if (size < KB) {
            return size + ' B';
        }
        else if (size >= KB && size < MB) {
            return ((size / KB).toFixed(2)) + ' KB';
        }
        else if (size >= MB && size < GB) {
            return ((size / MB).toFixed(2)) + ' MB';
        }
        else if (size >= GB && size < TB) {
            return ((size / GB).toFixed(2)) + ' GB';
        }
        else {
            return size;
        }
    }

    g.getQueryString = function(variable) {
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i = 0; i < vars.length; ++i) {
            var pair = vars[i].split("=");
            if (pair[0] == variable) {
                return pair[1];
            }
        }
        return null;
    }
})(window);
