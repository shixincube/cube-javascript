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

(function(g) {
    'use strict'

    var currentGroup = null;

    var sidebarEl = null;

    var btnGroupRemark = null;

    function onGroupRemarkClick() {
        var el = sidebarEl.find('#sidebar_group_remark');
        if (el.prop('disabled')) {
            el.removeAttr('disabled');
        }
        else {
            var text = el.val().trim();
            el.attr('disabled', 'disabled');
            window.cube().contact.remarkGroup(currentGroup, text, function() {
                dialog.launchToast(Toast.Success, '已备注群组');
            }, function(error) {
                dialog.launchToast(Toast.Error, '修改群组备注失败：' + error.code);
            })
        }
    }

    var MessageSidebar = function(el) {
        sidebarEl = el;
        sidebarEl.find('#sidebar_group_remark').attr('disabled', 'disabled');

        btnGroupRemark = el.find('button[data-target="remark"]');
        btnGroupRemark.click(onGroupRemarkClick);
    }

    MessageSidebar.prototype.update = function(group) {
        currentGroup = group;

        sidebarEl.find('#sidebar_group_name').val(group.getName());

        // 读取群组的附录，从附录里读取群组的备注
        window.cube().contact.getAppendix(group, function(appendix) {
            sidebarEl.find('#sidebar_group_remark').val(appendix.getRemark());
        }, function(error) {
            console.log(error.toString());
        });
    }

    g.MessageSidebar = MessageSidebar;

})(window);
