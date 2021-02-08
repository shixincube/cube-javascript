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
    var currentGroupRemark = null;
    var currentGroupNotice = null;

    var sidebarEl = null;

    var inputGroupRemark = null;
    var btnGroupRemark = null;

    var textGroupNotice = null;

    var memberListEl = null;

    function onGroupRemarkButtonClick() {
        if (inputGroupRemark.prop('disabled')) {
            currentGroupRemark = inputGroupRemark.val().trim();
            inputGroupRemark.removeAttr('disabled');
            inputGroupRemark.focus();
        }
        else {
            var text = inputGroupRemark.val().trim();
            inputGroupRemark.attr('disabled', 'disabled');
            if (currentGroupRemark == text) {
                return;
            }

            window.cube().contact.remarkGroup(currentGroup, text, function() {
                dialog.launchToast(Toast.Success, '已备注群组');
            }, function(error) {
                dialog.launchToast(Toast.Error, '修改群组备注失败：' + error.code);
                inputGroupRemark.val(currentGroupRemark);
            });
        }
    }

    function onGroupRemarkBlur() {
        onGroupRemarkButtonClick();
    }

    function onNoticeButtonClick() {
        if (textGroupNotice.prop('disabled')) {
            currentGroupNotice = textGroupNotice.val().trim();
            textGroupNotice.removeAttr('disabled');
            textGroupNotice.focus();
        }
        else {
            var text = textGroupNotice.val().trim();
            textGroupNotice.attr('disabled', 'disabled');
            if (currentGroupNotice == text) {
                return;
            }

            // 更新群组公告
            currentGroup.getAppendix().updateNotice(text, function() {
                dialog.launchToast(Toast.Success, '已修改群组公告');
            }, function() {
                dialog.launchToast(Toast.Error, '修改群组公告失败：' + error.code);
                textGroupNotice.val(currentGroupNotice);
            });
        }
    }

    function onNoticeBlur() {
        onNoticeButtonClick();
    }

    var MessageSidebar = function(el) {
        sidebarEl = el;

        inputGroupRemark= sidebarEl.find('input[data-target="group-remark"]');
        inputGroupRemark.attr('disabled', 'disabled');
        inputGroupRemark.blur(onGroupRemarkBlur);

        btnGroupRemark = sidebarEl.find('button[data-target="remark"]');
        btnGroupRemark.click(onGroupRemarkButtonClick);

        textGroupNotice = sidebarEl.find('textarea[data-target="group-notice"]');
        textGroupNotice.attr('disabled', 'disabled');
        textGroupNotice.blur(onNoticeBlur);
        sidebarEl.find('button[data-target="notice"]').click(onNoticeButtonClick);

        memberListEl = sidebarEl.find('.group-member-list');
    }

    MessageSidebar.prototype.update = function(group) {
        currentGroup = group;

        sidebarEl.find('input[data-target="group-name"]').val(group.getName());

        if (!currentGroup.isOwner()) {
            sidebarEl.find('.group-notice-btn-group').css('display', 'none');
        }
        else {
            sidebarEl.find('.group-notice-btn-group').css('display', 'block');
        }

        // 读取群组的附录，从附录里读取群组的备注
        window.cube().contact.getAppendix(group, function(appendix) {
            inputGroupRemark.val(appendix.getRemark());
            textGroupNotice.val(appendix.getNotice());
        }, function(error) {
            console.log(error.toString());
        });

        // 加载成员列表
        memberListEl.empty();
        
    }

    g.MessageSidebar = MessageSidebar;

})(window);
