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

    var dialogEl = null;

    var btnEditName = null;

    var barActionAdd = null;
    var btnAdd = null;

    var barActionOperation = null;
    var btnMessaging = null;
    var btnBlock = null;

    var currentContact = null;

    var editName = function() {
        if (currentContact.getId() == g.app.getSelf().getId()) {
            dialog.showPrompt('修改我的昵称', '请输入新昵称：', function(ok, text) {
                if (ok) {
                    if (text.length < 3) {
                        g.dialog.launchToast(Toast.Warning, '昵称至少3个字符');
                        return false;
                    }

                    // 修改 Cube 的联系人
                    g.cube().contact.modifyContact(text, null, function(contact) {
                        if (contact.getName() != text) {
                            // 修改之后名字没有变化，新昵称里敏感词
                            g.dialog.launchToast(Toast.Warning, '不被允许使用的新昵称');
                            return;
                        }

                        $.ajax({
                            type: 'POST',
                            url: server.url + '/account/info/',
                            data: { "name": text, "token": g.token },
                            dataType: 'json',
                            success: function(response, status, xhr) {
                                if (null == response) {
                                    return;
                                }

                                // 更新上下文
                                contact.context = response;

                                g.app.updateContact(contact);
                                g.app.sidebarAccountPanel.updateName(contact.getName());

                                dialogEl.find('.widget-user-username').text(response.name);
                            },
                            error: function(xhr, error) {
                                console.log(error);
                            }
                        });
                    }, function(error) {
                        g.dialog.launchToast(Toast.Warning, '不允许修改昵称');
                        console.log(error);
                    });
                }
            });
        }
        else {
            dialog.showPrompt('修改联系人备注', '请输入“'+ currentContact.getName() +'”的备注名：', function(ok, text) {
                if (ok) {
                    // 修改联系人附录里的备注名
                    currentContact.getAppendix().updateRemarkName(text, function(appendix) {
                        dialog.launchToast(Toast.Success, '已修改联系人备注名');
                        dialogEl.find('.widget-user-username').text(appendix.hasRemarkName() ? appendix.getRemarkName() : currentContact.getName());
                        g.app.messagingCtrl.updateContact(currentContact);
                    }, function(error) {
                        dialog.launchToast(Toast.Success, '修改联系人备注名失败: ' + error.code);
                    });
                }
            }, currentContact.getAppendix().getRemarkName());
        }
    }


    var addContact = function(e) {
        
    }

    var gotoMessaging = function(e) {

    }

    var blockContact = function(e) {

    }


    /**
     * 联系人详情对话框。
     * @param {jQuery} el 
     */
    var ContactDetails = function(el) {
        dialogEl = el;
        btnEditName = el.find('button[data-target="edit-remarkname"]');
        btnEditName.click(editName);

        barActionAdd = el.find('.action-add-contact');
        btnAdd = barActionAdd.find('button[data-action="add"]');
        btnAdd.click(addContact);

        barActionOperation = el.find('.action-operation');
        btnMessaging = barActionOperation.find('button[data-action="messaging"]');
        btnMessaging.click(gotoMessaging);
        btnBlock = barActionOperation.find('button[data-action="block"]');
        btnBlock.click(blockContact);
    }

    /**
     * 显示对话框。
     * @param {Contact|number} contact 
     */
    ContactDetails.prototype.show = function(contact, readOnly) {
        barActionAdd.css('display', 'none');
        barActionOperation.css('display', 'none');

        var handler = function(contact) {
            var el = dialogEl;
            var name = contact.getAppendix().hasRemarkName() ? contact.getAppendix().getRemarkName() : contact.getName();
            el.find('.widget-user-username').text(name);
            el.find('.user-avatar').attr('src', g.helper.getAvatarImage(contact.getContext().avatar));
            el.find('.user-id').text(contact.getId());
            el.find('.user-region').text(contact.getContext().region);
            el.find('.user-department').text(contact.getContext().department);

            if (contact.getId() == g.app.getSelf().getId()) {
                btnEditName.css('visibility', 'visible');
                btnEditName.attr('title', '修改昵称');
                el.find('.widget-user-desc').text('');
            }
            else {
                // 判断是否是通讯录的好友
                g.cube().contact.getDefaultContactZone(function(zone) {
                    if (zone.contains(contact)) {
                        // 好友
                        btnEditName.css('visibility', 'visible');
                        btnEditName.attr('title', '修改备注');
                        el.find('.widget-user-desc').text(contact.getName());
                        barActionOperation.css('display', 'block');
                    }
                    else {
                        // 非好友
                        btnEditName.css('visibility', 'hidden');
                        el.find('.widget-user-desc').text('');
                        barActionAdd.css('display', 'block');
                    }
                }, function(error) {
                    g.dialog.toast('通讯录数据出错：' + error.code);
                });
            }

            el.modal('show');
        }

        if (contact instanceof Contact) {
            currentContact = contact;
            handler(currentContact);
        }
        else {
            var contactId = contact;

            g.app.getContact(contactId, function(contact) {
                currentContact = contact;
                if (null == currentContact) {
                    return;
                }

                handler(currentContact);
            });
        }
    }

    /**
     * 隐藏对话框。
     */
    ContactDetails.prototype.hide = function() {
        dialogEl.modal('hide');
    }

    g.ContactDetails = ContactDetails;

})(window);
