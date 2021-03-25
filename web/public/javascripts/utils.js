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

    var OneHourInSeconds = 60 * 60;
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
        if (length == 2 || undefined === length) {
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

    g.formatNumber = formatNumber;

    /**
     * 格式化时钟计数。
     * @param {number} seconds 
     */
    g.formatClockTick = function(seconds) {
        if (seconds < 60) {
            return '00:00:' + formatNumber(seconds);
        }
        else if (seconds >= 60 && seconds < OneHourInSeconds) {
            var minutes = parseInt(Math.floor(seconds / 60));
            var seconds = parseInt(seconds % 60);
            return [ '00:', formatNumber(minutes), ':', formatNumber(seconds) ].join('');
        }
        else {
            var hours = parseInt(Math.floor(seconds / OneHourInSeconds));
            var hmod = parseInt(seconds % OneHourInSeconds);
            var minutes = parseInt(Math.floor(hmod / 60));
            var seconds = parseInt(hmod % 60);
            return [ formatNumber(hours), ':', formatNumber(minutes), ':', formatNumber(seconds) ].join('');
        }
    }

    /**
     * 将时间戳格式化为 YYYY-MM-DD HH:MM:SS 形式。
     * @param {number} value 
     */
    g.formatYMDHMS = function(value) {
        var result = [];
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
        result.push(':');
        result.push(formatNumber(date.getSeconds(), 2));
        return result.join('');
    }

    /**
     * 将时间戳格式化为短字符串形式。
     * @param {number} value 
     */
    g.formatShortTime = function(value) {
        var result = [];
        var now = Date.now();
        if (now > value) {
            // 今日零点
            var today = new Date(new Date().setHours(0, 0, 0, 0));
            var zeroHour = today.getTime();
            // 昨日零点
            var yesterdayZeroHour = zeroHour - OneDay + 1;
            // 前天零点
            var beforeYesterdayZeroHour = yesterdayZeroHour - OneDay;

            var date = new Date(value);
            if (value >= beforeYesterdayZeroHour && value < yesterdayZeroHour) {
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
                if (date.getFullYear() != today.getFullYear()) {
                    result.push(date.getFullYear());
                    result.push('-');
                }
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

    /**
     * 将时间戳格式化为完整字符串形式。
     * @param {number} value 
     */
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

    /**
     * 格式化字节空间大小。
     * @param {number} size 
     */
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

    /**
     * 获取 URL 查询串参数。
     * @param {string} variable 
     */
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

    /**
     * 读取指定名称的 Cookie 的值。
     * @param {string} cname 
     * @returns 
     */
    g.readCookie = function(cname) {
        var name = cname + "=";
        var decodedCookie = decodeURIComponent(document.cookie);
        var ca = decodedCookie.split(';');
        for(var i = 0; i <ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }

    /**
     * 递归当前目录的所有父目录。
     * @param {Array} list
     * @param {Directory} dir
     */
    g.recurseParent = function(list, dir) {
        list.unshift(dir);

        if (null == dir.getParent()) {
            return;
        }

        return g.recurseParent(list, dir.getParent());
    }

    /**
     * 提示输入项需要验证。
     * @param {*} el 
     * @param {*} text 
     */
    g.validate = function(el, text) {
        el.addClass('input-invalid');
        var tipEl = null;

        if (text) {
            tipEl = $('<span class="text-danger input-invalid-tip"><i class="fas fas-info-circle"></i> ' + text + '</span>');
            el.parent().append(tipEl);
        }

        setTimeout(function() {
            el.removeClass('input-invalid');
            if (null != tipEl) {
                tipEl.remove();
            }
        }, 3000);
    }

    g.datetimePickerToDate = function(string) {
        var buf = string.split(' ');

        var seg = buf[0].split('/');
        var date = new Date();
        date.setFullYear(parseInt(seg[0]));
        date.setMonth(parseInt(seg[1]) - 1);
        date.setDate(parseInt(seg[2]));

        seg = buf[1].split(':');
        date.setHours(parseInt(seg[0]));
        date.setMinutes(parseInt(seg[1]));
        date.setSeconds(0);
        date.setMilliseconds(0);
        return date;
    }

    g.datetimePickerToString = function(date) {
        var buf = [
            date.getFullYear(),
            '/',
            date.getMonth() + 1,
            '/',
            date.getDate(),
            ' ',
            date.getHours(),
            ':',
            date.getMinutes()
        ];
        return buf.join('');
    }
})(window);
