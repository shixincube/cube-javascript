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
 * 事件监听器。
 */
(function(g) {
    'use strict';

    var cube = null;
    var sidebarLogEl = null;
    var that = null;

    var AppEventListener = function() {
        that = this;
        sidebarLogEl = $('aside.control-sidebar').find('#app-details-log');
    }

    AppEventListener.prototype.start = function(cubeEngine) {
        cube = cubeEngine;

        // 监听网络状态
        cube.on('network', function(event) {
            if (event.name == 'failed') {
                g.dialog.launchToast(Toast.Error, '网络错误：' + event.error.code);
            }
            else if (event.name == 'open') {
                g.dialog.launchToast(Toast.Info, '已连接到服务器');
                that.appendLog('Network', 'Ready');
            }
        });

        
    }

    AppEventListener.prototype.appendLog = function(event, text) {
        var date = new Date();

        var html = [
            '<div class="row">',
                '<div class="col-2">',
                    g.formatNumber(date.getHours()), ':', g.formatNumber(date.getMinutes()), ':', g.formatNumber(date.getSeconds()),
                '</div>',
                '<div class="col-3"><b>',
                    event,
                '</b></div>',
                '<div class="col-6">',
                    text,
                '</div>',
            '</div>'
        ];

        sidebarLogEl.append($(html.join('')));
    }

    g.AppEventListener = AppEventListener;

})(window);
