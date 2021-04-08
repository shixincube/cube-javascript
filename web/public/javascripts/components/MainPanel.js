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
 * 主面板。
 */
(function(g) {
    'use strict';

    var that = null;

    var MainPanel = function() {
        that = this;

        var body = $('body');
        var pushmenu = body.find('a[data-widget="pushmenu"]');
        pushmenu.on('click', function() {
            that.toggleMainSidebar();
        });
    }

    MainPanel.prototype.prepare = function() {
        // 加载侧边栏是否展开配置
        var value = g.app.loadConfig('sidebarCollapse');
        if (null != value && undefined !== value) {
            var body = $('body');
            if (value) {
                if (!body.hasClass('sidebar-collapse')) {
                    body.addClass('sidebar-collapse');
                }
            }
            else {
                body.removeClass('sidebar-collapse');
            }
        }
    }

    MainPanel.prototype.toggleMainSidebar = function() {
        var body = $('body');
        // 需要取 false 值
        var collapse = !body.hasClass('sidebar-collapse');
        g.app.saveConfig('sidebarCollapse', collapse);
    }

    g.MainPanel = MainPanel;

})(window);
