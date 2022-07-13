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

    g.helper = g.helper || {};

    /**
     * 根据文件类型匹配文件图标。
     * @param {FileLabel} fileLabel 
     * @returns {string}
     */
    g.helper.matchFileIcon = function(fileLabel) {
        var type = fileLabel.getFileType();
        if (type == 'png' || type == 'jpeg' || type == 'gif' || type == 'jpg' || type == 'bmp') {
            return '<i class="ci ci-file-image"></i>';
        }
        else if (type == 'xls' || type == 'xlsx') {
            return '<i class="ci ci-file-excel"></i>';
        }
        else if (type == 'ppt' || type == 'pptx') {
            return '<i class="ci ci-file-powerpoint"></i>';
        }
        else if (type == 'doc' || type == 'docx') {
            return '<i class="ci ci-file-word"></i>';
        }
        else if (type == 'mp3' || type == 'ogg' || type == 'wav') {
            return '<i class="ci ci-file-music"></i>';
        }
        else if (type == 'pdf') {
            return '<i class="ci ci-file-pdf"></i>';
        }
        else if (type == 'rar') {
            return '<i class="ci ci-file-rar"></i>';
        }
        else if (type == 'zip' || type == 'gz') {
            return '<i class="ci ci-file-zip"></i>';
        }
        else if (type == 'txt' || type == 'log') {
            return '<i class="ci ci-file-text"></i>';
        }
        else if (type == 'mp4' || type == 'mkv' || type == 'avi' || type == 'ts') {
            return '<i class="ci ci-file-video"></i>';
        }
        else if (type == 'psd') {
            return '<i class="ci ci-file-psd"></i>';
        }
        else if (type == 'exe' || type == 'dll') {
            return '<i class="ci ci-file-windows"></i>';
        }
        else if (type == 'apk') {
            return '<i class="ci ci-file-apk"></i>';
        }
        else if (type == 'dmg') {
            return '<i class="ci ci-file-dmg"></i>';
        }
        else if (type == 'ipa') {
            return '<i class="ci ci-file-ipa"></i>';
        }
        else {
            return '<i class="fa fa-file-alt ci-fa-file"></i>';    //'<i class="ci ci-file-unknown"></i>';
        }
    }

    var deviceReg = {
        iPhone: /iPhone/,
        iPad: /iPad/,
        Android: /Android/,
        Windows: /Windows/,
        Mac: /Macintosh/
    };

    g.helper.parseUserAgent = function(userAgent) {
        const data = {
            browserName: '',    // 浏览器名称
            browserVersion: '', // 浏览器版本
            osName: '',         // 操作系统名称
            osVersion: '',      // 操作系统版本
            coreName: '',       // 内核名称
            coreVersion: '',    // 内核版本
            deviceName: ''      // 设备名称
        };

        if (/Trident/.test(userAgent)) {
            data.coreName = 'Trident';
            data.coreVersion = userAgent.split('Trident/')[1].split(';')[0];
        }
        else if (/Firefox/.test(userAgent)) {
            data.coreName = 'Firefox';
            data.coreVersion = userAgent.split('Firefox/')[1];
            data.browserName = data.coreName;
            data.browserVersion = data.coreVersion;
        }

        if (/MetaSr/.test(userAgent)) {
            // 搜狗
            data.browserName = 'Sougou';
            data.browserVersion = userAgent.split('MetaSr')[1].split(' ')[1];
        }
        else if (/QQBrowser/.test(userAgent)) {
            // QQ浏览器
            data.browserName = 'QQBrowser';
            data.browserVersion = userAgent.split('QQBrowser/')[1].split(';')[0];
        }
        else if (/MSIE/.test(userAgent)) {
            data.browserName = 'MSIE';
            data.browserVersion = userAgent.split('MSIE ')[1].split(' ')[1];
        }
        else if (/Edge/.test(userAgent)) {
            data.browserName = 'Edge';
            data.browserVersion = userAgent.split('Edge/')[1];
        }
        else if (/Presto/.test(userAgent)) {
            data.browserName = 'Opera';
            data.browserVersion = userAgent.split('Version/')[1];
        }
        else if (/Version\/([\d.]+).*Safari/.test(userAgent)) {
            data.browserName = 'Safari';
            data.browserVersion = userAgent.split('Version/')[1].split(' ')[0]
        }
        else if (/Chrome/.test(userAgent)) {
            data.browserName = 'Chrome';
            data.browserVersion = userAgent.split('Chrome/')[1].split(' ')[0];
        }

        if (data.coreName.length == 0) {
            if (/Chrome/.test(userAgent)) {
                data.coreName = 'Chrome';
                data.coreVersion = userAgent.split('Chrome/')[1].split(' ')[0];
            }
        }

        for (var key in deviceReg) {
            if (deviceReg[key].test(userAgent)) {
                data.osName = key;

                if (key === 'Windows'){
                    data.osVersion = userAgent.split('Windows NT ')[1].split(';')[0];
                    if (data.osVersion.indexOf(')') > 0) {
                        data.osVersion = userAgent.split('Windows NT ')[1].split(')')[0];
                    }
                } else if (key === 'Mac') {
                    data.osVersion = userAgent.split('Mac OS X ')[1].split(';')[0];
                } else if (key === 'iPhone') {
                    data.osVersion = userAgent.split('iPhone OS ')[1].split(' ')[0];
                } else if (key === 'iPad') {
                    data.osVersion = userAgent.split('iPad; CPU OS ')[1].split(' ')[0];
                } else if (key === 'Android') {
                    data.osVersion = userAgent.split('Android ')[1].split(';')[0];
                    data.deviceName = userAgent.split('(Linux; Android ')[1].split('; ')[1].split(' Build')[0];
                }
            }
        }

        return data;
    }

    /*
    var uaTestData = [
        'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/535.1 (KHTML, like Gecko) Chrome/14.0.835.163 Safari/535.1',
        'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:6.0) Gecko/20100101 Firefox/6.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:102.0) Gecko/20100101 Firefox/102.0',
        'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/534.50 (KHTML, like Gecko) Version/5.1 Safari/534.50',
        'Opera/9.80 (Windows NT 6.1; U; zh-cn) Presto/2.9.168 Version/11.50',
        'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Win64; x64; Trident/5.0; .NET CLR 2.0.50727; SLCC2; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; InfoPath.3; .NET4.0C; Tablet PC 2.0; .NET4.0E)',
        'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; WOW64; Trident/4.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; .NET4.0C; InfoPath.3)',
        // 搜狗
        'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.1; WOW64; Trident/5.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; InfoPath.3; .NET4.0C; .NET4.0E; SE 2.X MetaSr 1.0)',
        'Mozilla/5.0 (Windows; U; Windows NT 6.1; en-US) AppleWebKit/534.3 (KHTML, like Gecko) Chrome/6.0.472.33 Safari/534.3 SE 2.X MetaSr 1.0',
        // QQ
        'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/535.1 (KHTML, like Gecko) Chrome/13.0.782.41 Safari/535.1 QQBrowser/6.9.11079.201',
        'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.1; WOW64; Trident/5.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; InfoPath.3; .NET4.0C; .NET4.0E) QQBrowser/6.9.11079.201'
    ];
    uaTestData.forEach(function(ua) {
        console.log(g.helper.parseUserAgent(ua));
    });*/

})(window);
