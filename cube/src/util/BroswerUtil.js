/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020-2021 Shixin Cube Team.
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

/**
 * 浏览器辅助函数。
 */
export const BroswerUtil = {

    browserName: null,

    browserVersion: null,

    system: null,

    /**
     * @returns {string} 返回浏览器名称。
     */
    getBrowserName: function() {
        if (null == BroswerUtil.browserName) {
            BroswerUtil.parseBrowser();
        }
        return BroswerUtil.browserName;
    },

    /**
     * @returns {string} 返回浏览器版本信息。
     */
    getBrowserVersion: function () {
        if (null == BroswerUtil.browserVersion) {
            BroswerUtil.parseBrowser();
        }
        return BroswerUtil.browserVersion;
    },

    /**
     * @returns {string} 返回系统名称。
     */
    getSystem: function() {
        if (null == BroswerUtil.system) {
            BroswerUtil.parseSystem();
        }
        return BroswerUtil.system;
    },

    /**
     * 分析浏览器信息。
     */
    parseBrowser: function() {
        var agent = navigator.userAgent.toLowerCase();
        var name = "";
        var version = "";
        var verNum = "";
        // IE
        if (agent.indexOf("msie") > 0) {
            var regStr_ie = /msie [\d.]+;/gi;
            name = "IE";
            version = "" + agent.match(regStr_ie);
        }
        // Firefox
        else if (agent.indexOf("firefox") > 0) {
            var regStr_ff = /firefox\/[\d.]+/gi;
            name = "Firefox";
            version = "" + agent.match(regStr_ff);
        }
        // Chrome
        else if (agent.indexOf("chrome") > 0) {
            var regStr_chrome = /chrome\/[\d.]+/gi;
            name = "Chrome";
            version = "" + agent.match(regStr_chrome);
        }
        // Safari
        else if (agent.indexOf("safari") > 0 && agent.indexOf("chrome") < 0) {
            var regStr_saf = /version\/[\d.]+/gi;
            name = "Safari";
            version = "" + agent.match(regStr_saf);
        }
        // Opera
        else if (agent.indexOf("opera") >= 0) {
            var regStr_opera = /version\/[\d.]+/gi;
            name = "Opera";
            version = "" + agent.match(regStr_opera);
        }
        else {
            var browser = navigator.appName;
            if (browser == "Netscape") {
                let bversion = agent.split(";");
                let trimVersion = bversion[7].replace(/[ ]/g, "");
                var rvStr = trimVersion.match(/[\d\.]/g).toString();
                var rv = rvStr.replace(/[,]/g, "");
                version = rv;
                name = "IE";
            }
        }

        verNum = version.replace(/[^0-9.]/ig, "");
        BroswerUtil.browserVersion = verNum;
        BroswerUtil.browserName = name;
    },

    /**
     * 分析操作系统信息。
     */
    parseSystem: function() {
        var system = {
            win: false,
            mac: false,
            x11: false,
            iphone: false,
            ipoad: false,
            ipad: false,
            ios: false,
            android: false,
            nokiaN: false,
            winMobile: false,
            wii: false,
            ps: false
        };
        var ua = navigator.userAgent;
        // 检测平台
        var p = navigator.platform;
        system.win = p.indexOf('Window') == 0;
        system.mac = p.indexOf('Mac') == 0;
        system.x11 = (p.indexOf('X11') == 0 || p.indexOf('Linux') == 0);
        // 检测 Windows 操作系统
        if (system.win) {
            if (/Win(?:dows )?([^do]{2})\s?(\d+\.\d+)?/.test(ua)) {
                if (RegExp['$1'] == 'NT') {
                    switch (RegExp['$2']) {
                        case '5.0':
                            system.win = '2000';
                            break;
                        case '5.1':
                            system.win = 'XP';
                            break;
                        case '6.0':
                            system.win = 'Vista';
                            break;
                        case '6.1':
                            system.win = '7';
                            break;
                        case '6.2':
                            system.win = '8';
                            break;
                        case '10':
                        case '10.0':
                            system.win = '10';
                            break;
                        default:
                            system.win = 'NT';
                            break;
                    }
                }
                else if (RegExp['$1'] == '9x') {
                    system.win = 'ME';
                }
                else {
                    system.win = RegExp['$1'];
                }
            }
        }
        else if (system.mac) {
            if (ua.indexOf('Chrome') > 0 && /Mac OS X (\d+\_\d+)?/.test(ua)) {
                system.mac = RegExp['$1'].trim();
                system.mac = system.mac.replace('_', '.');
            }
            else if (ua.indexOf('Firefox') > 0 && /Mac OS X (\d+\.\d+)?/.test(ua)) {
                system.mac = RegExp['$1'].trim();
            }
        }

        // 移动设备
        system.iphone = ua.indexOf('iPhone') > -1;
        system.ipod = ua.indexOf('iPod') > -1;
        system.ipad = ua.indexOf('iPad') > -1;
        system.nokiaN = ua.indexOf('nokiaN') > -1;

        // Windows mobile
        if (system.win == 'CE') {
            system.winMobile = system.win;
        }
        else if (system.win == 'Ph') {
            if (/Windows Phone OS (\d+.\d)/i.test(ua)) {
                system.win = 'Phone';
                system.winMobile = parseFloat(RegExp['$1']);
            }
        }

        // 检测 iOS 版本
        if (system.mac && ua.indexOf('Mobile') > -1) {
            if (/CPU (?:iPhone )?OS (\d+_\d+)/i.test(ua)) {
                system.ios = parseFloat(RegExp['$1'].replace('_', '.'));
            }
            else {
                system.ios = 2;    // 不能真正检测出来，所以只能猜测
            }
        }
        // 检测 Android 版本
        if (/Android (\d+\.\d+)/i.test(ua)) {
            system.android = parseFloat(RegExp['$1']);
        }
        // 游戏系统
        system.wii = ua.indexOf('Wii') > -1;
        system.ps = /PlayStation/i.test(ua);

        if (system.win) {
            BroswerUtil.system = 'Windows ' + system.win;
        }
        else if (system.mac) {
            BroswerUtil.system = 'Mac OS X ' + system.mac;
        }
        else if (system.x11) {
            BroswerUtil.system = 'Linux';
        }
        else {
            BroswerUtil.system = '';
        }
    }
};
