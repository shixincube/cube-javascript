// utils.js

(function(g) {

    var OneDay = 24 * 60 * 60 * 1000;
    var TwoDays = OneDay + OneDay;
    var AWeek = 7 * OneDay;

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
})(window);
