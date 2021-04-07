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

    var that = null;

    var currentGroup = null;
    var currentGroupRemark = null;
    var currentGroupNotice = null;

    var currentContact = null;

    var sidebarEl = null;
    var groupSidebarEl = null;
    var contactSidebarEl = null;

    // var imageFileListEl = null;

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
            }, function(error) {
                dialog.launchToast(Toast.Error, '修改群组公告失败：' + error.code);
                textGroupNotice.val(currentGroupNotice);
            });
        }
    }

    function onNoticeBlur() {
        onNoticeButtonClick();
    }

    function onMemberNameKeyup(event) {
        if (event.keyCode == 13) {
            onMemberNameModified($(this));
        }
    }

    function onMemberNameBlur(event) {
        onMemberNameModified($(this));
    }

    function onMemberNameModified(thisEl) { 
        var newText = thisEl.val();
        var preText = thisEl.attr('predata');
        var memberId = thisEl.attr('data-target');

        if (newText == preText || newText.length < 3) {
            g.app.messageSidebar.recoverMemberName(memberId, thisEl.parent(), preText);
            return;
        }

        // 更新群组成员的备注
        currentGroup.getAppendix().updateMemberRemark(memberId, newText, function() {
            dialog.launchToast(Toast.Success, '已修改群组成员备注');
        }, function(error) {
            dialog.launchToast(Toast.Error, '备注群组成员失败：' + error.code);
        });

        // 恢复 UI 显示
        g.app.messageSidebar.recoverMemberName(memberId, thisEl.parent(), newText);
    }


    /**
     * 消息面板侧边栏。
     */
    var MessageSidebar = function(el) {
        that = this;

        sidebarEl = el;
        groupSidebarEl = sidebarEl.find('.for-group');
        contactSidebarEl = sidebarEl.find('.for-contact');

        // imageFileListEl = sidebarEl.find('.image-file-list');

        inputGroupRemark= groupSidebarEl.find('input[data-target="group-remark"]');
        inputGroupRemark.attr('disabled', 'disabled');
        inputGroupRemark.blur(onGroupRemarkBlur);

        btnGroupRemark = groupSidebarEl.find('button[data-target="remark"]');
        btnGroupRemark.click(onGroupRemarkButtonClick);

        textGroupNotice = groupSidebarEl.find('textarea[data-target="group-notice"]');
        textGroupNotice.attr('disabled', 'disabled');
        textGroupNotice.blur(onNoticeBlur);
        groupSidebarEl.find('button[data-target="notice"]').click(onNoticeButtonClick);

        memberListEl = groupSidebarEl.find('.group-member-list');
    }

    /**
     * 更新数据。
     * @param {Group|Contact} entity 
     */
    MessageSidebar.prototype.update = function(entity) {
        if (entity instanceof Group) {
            this.updateGroup(entity);
            if (groupSidebarEl.hasClass('no-display')) {
                groupSidebarEl.removeClass('no-display');
            }
            if (!contactSidebarEl.hasClass('no-display')) {
                contactSidebarEl.addClass('no-display');
            }
        }
        else {
            this.updateContact(entity);
            if (contactSidebarEl.hasClass('no-display')) {
                contactSidebarEl.removeClass('no-display');
            }
            if (!groupSidebarEl.hasClass('no-display')) {
                groupSidebarEl.addClass('no-display');
            }
        }
    }

    /**
     * 更新联系人数据。
     * @param {Contact} contact 
     */
    MessageSidebar.prototype.updateContact = function(contact) {
        currentContact = contact;
    }

    /**
     * 更新群组数据。
     * @param {Group} group 
     */
    MessageSidebar.prototype.updateGroup = function(group) {
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

        group.getMembers().forEach(function(element) {
            g.app.getContact(element.getId(), function(contact) {
                var operate = [ '<button class="btn btn-sm btn-default btn-flat"' ,
                    ' onclick="javascript:app.messageSidebar.fireUpdateMemberRemark(', contact.getId(), ');"><i class="fas fa-edit"></i></button>' ];
                var html = [
                    '<div class="group-member-cell" data-target="', contact.getId(), '" ondblclick="javascript:app.messagingCtrl.toggle(', contact.getId(), ');">',
                        '<div class="member-avatar"><img class="img-size-32 img-round-rect" src="images/', contact.getContext().avatar, '" /></div>',
                        '<div class="member-name">',
                            group.getAppendix().hasMemberRemark(contact) ? group.getAppendix().getMemberRemark(contact) : contact.getPriorityName(),
                        '</div>',
                        '<div class="member-operate">',
                            group.isOwner() ? operate.join('') :
                                (contact.getId() == g.app.account.id ? operate.join('') : ''),
                        '</div>',
                    '</div>'
                ];
                memberListEl.append($(html.join('')));
            });
        });

        // 检索群组的图片
        window.cube().fs.getRoot(group, function(root) {
            root.searchFile({
                "type": ['jpg', 'png', 'gif', 'bmp'],
                "begin": 0,
                "end": 20,
                "inverseOrder": true
            }, function(filter, list) {
                list.forEach(function(item) {
                    that.appendImage(item.file);
                });
            }, function(error) {
                console.log('MessageSidebar #searchFile() : ' + error.code);
            });
        }, function(error) {
            console.log('MessageSidebar #getRoot() : ' + error.code);
        });
    }

    MessageSidebar.prototype.appendImage = function(fileLabel) {
        var html = [
            '<div class="file-cell">',
                '<div class="file-type">',
                    '<div class="file-thumb"></div>',
                '</div>',
                '<div class="file-info">',
                    '<div data-target="date">2021年1月3日</div>',
                    '<div data-target="size">902 KB</div>',
                '</div>',
            '</div>'
        ];
    }

    MessageSidebar.prototype.fireUpdateMemberRemark = function(id) {
        var el = sidebarEl.find('div[data-target="' + id + '"]');

        var btn = el.find('button');
        btn.attr('disabled', 'disabled');

        var width = parseInt(el.width());
        el = el.find('.member-name');
        var name = el.text();
        el.empty();

        width -= 44 + 40 + 16;
        var html = ['<input class="form-control form-control-sm" type="text" style="width:', width, 'px;" predata="', name, '" data-target="'
            , id, '" />'];
        el.html(html.join(''));

        var inputEl = el.find('input');
        inputEl.blur(onMemberNameBlur);
        inputEl.keyup(onMemberNameKeyup);
        inputEl.focus();
    }

    MessageSidebar.prototype.recoverMemberName = function(memberId, el, text) {
        el.empty();
        el.text(text);

        var cellEl = sidebarEl.find('div[data-target="' + memberId + '"]');
        cellEl.find('.member-operate').find('button').removeAttr('disabled');
    }

    g.MessageSidebar = MessageSidebar;

})(window);
