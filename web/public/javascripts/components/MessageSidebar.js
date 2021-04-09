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
    var currentContactRemark = null;

    var sidebarEl = null;
    var groupSidebarEl = null;
    var contactSidebarEl = null;

    // var imageFileListEl = null;

    var inputGroupRemark = null;
    var btnGroupRemark = null;

    var textGroupNotice = null;

    var memberListEl = null;

    var inputContactRemark = null;
    var btnContactRemark = null;

    function onGroupRemarkClick() {
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
        onGroupRemarkClick();
    }

    function onNoticeClick() {
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
        onNoticeClick();
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

    function onAddMemberClick(e) {
        var list = g.app.contactsCtrl.getContacts();
        var members = currentGroup.getMembers();
        var result = [];
        var contains = false;
        for (var i = 0; i < list.length; ++i) {
            var contact = list[i];
            contains = false;
            for (var j = 0; j < members.length; ++j) {
                var member = members[j];
                if (member.id == contact.id) {
                    contains = true;
                    break;
                }
            }

            if (!contains) {
                result.push(contact);
            }
        }

        g.app.contactListDialog.show(result, [], function(list) {
            if (list.length > 0) {
                currentGroup.addMembers(list, function(group) {
                    that.updateGroup(group);
                }, function(error) {
                    g.dialog.launchToast(Toast.Error, '邀请入群操作失败 - ' + error.code);
                });
            }
        }, '邀请入群');
    }

    function onRemoveMemberClick(e) {
        if (!currentGroup.isOwner()) {
            g.dialog.launchToast(Toast.Info, '您不能移除该群组成员。');
            return;
        }

        var members = currentGroup.getMembers().concat();
        if (members.length == 2) {
            g.dialog.launchToast(Toast.Warning, '群里仅有两名成员，没有可移除的成员。');
            return;
        }

        for (var i = 0; i < members.length; ++i) {
            var member = members[i];
            if (member.id == g.app.account.id) {
                members.splice(i, 1);
                break;
            }
        }

        g.app.contactListDialog.show(members, [], function(list) {
            if (list.length > 0) {
                currentGroup.removeMembers(list, function(group) {
                    that.updateGroup(group);
                }, function(error) {
                    g.dialog.launchToast(Toast.Error, '移除成员操作失败 - ' + error.code);
                });
            }
        }, '移除成员');
    }


    function onContactRemarkClick() {
        if (inputContactRemark.prop('disabled')) {
            currentContactRemark = inputContactRemark.val().trim();
            inputContactRemark.removeAttr('disabled');
            inputContactRemark.focus();
        }
        else {
            var text = inputContactRemark.val().trim();
            inputContactRemark.attr('disabled', 'disabled');
            if (currentContactRemark == text) {
                return;
            }

            window.cube().contact.remarkContactName(currentContact, text, function() {
                dialog.launchToast(Toast.Success, '已备注联系人');
            }, function(error) {
                dialog.launchToast(Toast.Error, '修改联系人备注失败：' + error.code);
                inputContactRemark.val(currentContactRemark);
            });
        }
    }

    function onContactRemarkBlur() {
        onContactRemarkClick();
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

        // 群组界面

        inputGroupRemark= groupSidebarEl.find('input[data-target="group-remark"]');
        inputGroupRemark.attr('disabled', 'disabled');
        inputGroupRemark.blur(onGroupRemarkBlur);

        btnGroupRemark = groupSidebarEl.find('button[data-target="remark"]');
        btnGroupRemark.click(onGroupRemarkClick);

        textGroupNotice = groupSidebarEl.find('textarea[data-target="group-notice"]');
        textGroupNotice.attr('disabled', 'disabled');
        textGroupNotice.blur(onNoticeBlur);
        groupSidebarEl.find('button[data-target="notice"]').click(onNoticeClick);

        groupSidebarEl.find('button[data-target="add-member"]').click(onAddMemberClick);
        groupSidebarEl.find('button[data-target="remove-member"]').click(onRemoveMemberClick);
        memberListEl = groupSidebarEl.find('.group-member-list');

        // 联系人界面

        inputContactRemark = contactSidebarEl.find('input[data-target="contact-remark"]');
        inputContactRemark.attr('disabled', 'disabled');
        inputContactRemark.blur(onContactRemarkBlur);

        btnContactRemark = contactSidebarEl.find('button[data-target="remark"]');
        btnContactRemark.click(onContactRemarkClick);
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

        contactSidebarEl.find('input[data-target="contact-name"]').val(contact.getName());

        inputContactRemark.val(contact.getAppendix().hasRemarkName() ? contact.getAppendix().getRemarkName() : '');
    }

    /**
     * 更新群组数据。
     * @param {Group} group 
     */
    MessageSidebar.prototype.updateGroup = function(group) {
        currentGroup = group;

        groupSidebarEl.find('input[data-target="group-name"]').val(group.getName());

        if (!currentGroup.isOwner()) {
            groupSidebarEl.find('.group-notice-btn-group').css('display', 'none');
        }
        else {
            groupSidebarEl.find('.group-notice-btn-group').css('display', 'block');
        }

        // 读取群组的附录，从附录里读取群组的备注
        // window.cube().contact.getAppendix(group, function(appendix) {
        //     inputGroupRemark.val(appendix.getRemark());
        //     textGroupNotice.val(appendix.getNotice());
        // }, function(error) {
        //     console.log(error.toString());
        // });

        inputGroupRemark.val(group.getAppendix().getRemark());
        textGroupNotice.val(group.getAppendix().getNotice());

        // 加载成员列表
        memberListEl.empty();

        group.getMembers().forEach(function(element) {
            g.app.getContact(element.getId(), function(contact) {
                // 更新本地数据
                group.modifyMember(contact);

                var operate = [ '<button class="btn btn-sm btn-default btn-flat"' ,
                    ' onclick="javascript:app.messageSidebar.fireUpdateMemberRemark(', contact.getId(), ');"><i class="fas fa-edit"></i></button>' ];
                var html = [
                    '<div class="group-member-cell" data-target="', contact.getId(), '" ondblclick="javascript:app.contactDetails.show(', contact.getId(), ');">',
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
        /*window.cube().fs.getRoot(group, function(root) {
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
        });*/
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
