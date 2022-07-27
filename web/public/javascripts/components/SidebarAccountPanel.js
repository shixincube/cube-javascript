/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020-2022 Cube Team.
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
    'use strict';

    /**
     * 侧边栏账号面板。
     * @param {jQuery} el 
     */
    var SidebarAccountPanel = function(el) {
        this.el = el;
        var that = this;
        this.el.find('a[data-target="name"]').on('click', function() {
            that.showDetail();
        });
    };

    SidebarAccountPanel.prototype.updateAvatar = function(avatar) {
        this.el.find('img[data-target="avatar"]').attr('src', g.helper.getAvatarImage(avatar));
    }

    SidebarAccountPanel.prototype.updateName = function(name) {
        this.el.find('a[data-target="name"]').text(name);
    }

    SidebarAccountPanel.prototype.showDetail = function() {
        // Nothing
    }

    g.SidebarAccountPanel = SidebarAccountPanel;

})(window);
