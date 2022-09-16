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

/**
 * 服务器配置信息。
 */
(function (g, $) {

    /**
     * 服务器地址。
     * 请修改为您的服务器地址。
     */
    var address = '192.168.0.105';

    /**
     * 服务器端口。
     * 填写 0 表示使用默认端口。
     */
    var port = 0;

    /**
     * REST 接口的 HTTP 链接。
     */
    var httpURL = 'http://' + address + ':7777';

    /**
     * REST 接口的 HTTPS 链接。
     */
    var httpsURL = 'https://' + address + ':8140';

    g.server = {
        address: address,

        port: 0,

        http: httpURL,

        https: httpsURL,

        url: httpURL
    };

    function getURL() {
        if (document.location.protocol == 'https:') {
            return httpsURL;
        }
        else {
            return httpURL;
        }
    };

    g.server.url = getURL();

    $.server = g.server;

})(window, jQuery);
