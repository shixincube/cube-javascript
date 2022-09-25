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

    g.helper.chartColors = [
        '#37A2DA',
        '#32C5E9',
        '#67E0E3',
        '#9FE6B8',
        '#FFDB5C',
        '#ff9f7f',
        '#fb7293',
        '#E062AE',
        '#E690D1',
        '#e7bcf3',
        '#9d96f5',
        '#8378EA',
        '#96BFFF'
    ];

    g.helper.chartReversalColors = [];

    /**
     * 千分数字。
     * @param {number|string} value 
     * @returns 
     */
    g.helper.thousands = function(value) {
        var str = value.toString();
        var reg = str.indexOf(".") > -1 ? /(\d)(?=(\d{3})+\.)/g : /(\d)(?=(?:\d{3})+$)/g;
        return str.replace(reg, "$1,");
    }

    /**
     * 获取图像访问地址。
     * 
     * @param {string} avatar 
     */
    g.helper.getAvatarImage = function(avatar) {
        if (avatar.startsWith('avatar')) {
            return 'avatars/' + avatar + (avatar.endsWith('png') ? '' : '.png');
        }
        else {
            return 'avatars/default.png'
        }
    }

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

    /**
     * 匹配文件头像。
     * @param {FileLabel} fileLabel 
     */
    g.helper.matchFileAvatar = function(fileLabel) {
        var type = fileLabel.getFileType();
        if (type == 'png' || type == 'jpeg' || type == 'gif' || type == 'jpg' || type == 'bmp') {
            return 'images/icon/file-avatar-image.png';
        }
        else if (type == 'xls' || type == 'xlsx') {
            return 'images/icon/file-avatar-excel.png';
        }
        else if (type == 'ppt' || type == 'pptx') {
            return 'images/icon/file-avatar-powerpoint.png';
        }
        else if (type == 'doc' || type == 'docx') {
            return 'images/icon/file-avatar-word.png';
        }
        else if (type == 'mp3' || type == 'ogg' || type == 'wav') {
            return 'images/icon/file-avatar-music.png';
        }
        else if (type == 'pdf') {
            return 'images/icon/file-avatar-pdf.png';
        }
        else if (type == 'rar') {
            return 'images/icon/file-avatar-rar.png';
        }
        else if (type == 'zip' || type == 'gz') {
            return 'images/icon/file-avatar-zip.png';
        }
        else if (type == 'txt' || type == 'log') {
            return 'images/icon/file-avatar-txt.png';
        }
        else if (type == 'mp4' || type == 'mkv' || type == 'avi' || type == 'ts') {
            return 'images/icon/file-avatar-video.png';
        }
        else if (type == 'psd') {
            return 'images/icon/file-avatar-psd.png';
        }
        else if (type == 'exe' || type == 'dll') {
            return 'images/icon/file-avatar-windows.png';
        }
        else if (type == 'apk') {
            return 'images/icon/file-avatar-apk.png';
        }
        else if (type == 'dmg') {
            return 'images/icon/file-avatar-dmg.png';
        }
        else {
            return 'images/icon/file-avatar-unknown.png';
        }
    }

    /**
     * 提取文件的文件名，即移除文件的扩展名。
     * @param {*} filename 
     */
    g.helper.extractFilename = function(filename) {
        var index = filename.lastIndexOf('.');
        if (index > 0) {
            return filename.substring(0, index);
        }

        return filename;
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

        if (/WeChat/.test(userAgent)) {
            data.browserName = 'WeChat';
            var v = userAgent.split('MicroMessenger/');
            if (v.length > 1) {
                data.browserVersion = v[1].split(' ')[0];
            }
            else {
                data.browserVersion = userAgent.split('Version/')[1].split(' ')[0];
            }
        }
        else if (/MicroMessenger/.test(userAgent)) {
            data.browserName = 'WeChat';
            var v = userAgent.split('MicroMessenger/');
            if (v.length > 1) {
                data.browserVersion = v[1].split(' ')[0];
            }
            else {
                data.browserVersion = userAgent.split('Version/')[1].split(' ')[0];
            }
        }
        else if (/MetaSr/.test(userAgent)) {
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
            data.browserVersion = userAgent.split('Version/')[1].split(' ')[0];
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
                    if (data.osVersion.indexOf(')') > 0) {
                        data.osVersion = userAgent.split('Mac OS X ')[1].split(')')[0];
                        data.osVersion = data.osVersion.replaceAll('_', '.');
                    }
                } else if (key === 'iPhone') {
                    data.osVersion = userAgent.split('iPhone OS ')[1].split(' ')[0];
                    data.osVersion = data.osVersion.replaceAll('_', '.');
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


    /*var uaTestData = [
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
        'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.1; WOW64; Trident/5.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; InfoPath.3; .NET4.0C; .NET4.0E) QQBrowser/6.9.11079.201',

        // Mac Chrome
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36',
        'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Mobile Safari/537.36',

        // WeChat
        'Mozilla/5.0 (Linux; Android 12; Mi 10 Build/SKQ1.211006.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/86.0.4240.99 XWEB/4263 MMWEBSDK/20220505 Mobile Safari/537.36 MMWEBID/8522 MicroMessenger/8.0.23.2160(0x28001757) WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64'
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.26(0x18001a2f) NetType/WIFI Language/zh_CN'
    ];
    uaTestData.forEach(function(ua) {
        console.log(g.helper.parseUserAgent(ua));
    });*/

    for (var i = g.helper.chartColors.length - 1; i >= 0; --i) {
        g.helper.chartReversalColors.push(g.helper.chartColors[i]);
    }

})(window);
