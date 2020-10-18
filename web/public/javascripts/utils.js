// utils.js

(function(g) {

    var OneDay = 24 * 60 * 60 * 1000;
    var TwoDays = OneDay + OneDay;

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
            var d = now - value;
            var date = new Date(value);
            if (d < OneDay) {
                result.push(formatNumber(date.getHours()));
                result.push(':');
                result.push(formatNumber(date.getMinutes()));
            }
            else if (d < TwoDays) {
                result.push('昨天');
            }
            else {
                result.push(formatNumber(date.getMonth + 1));
                result.push('-');
                result.push(formatNumber(date.getDate));
            }
        }
        else {
            var d = new Date(value);
            result.push(formatNumber(d.getHours()));
            result.push(':');
            result.push(formatNumber(d.getMinutes()));
        }
        
        return result.join('');
    }
})(window);
