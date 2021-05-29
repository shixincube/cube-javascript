/**
 * This file is part of Cube.
 * https://shixincube.com
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

'use strict';

// 获取 Cube 实例
const cube = window.cube();

// 监听事件
cube.contact.on(ContactEvent.SignIn, onSignIn);

const btnLogin = document.querySelector('button#login');
const btnLogout = document.querySelector('button#logout');

const selGroups = document.querySelector('select#groupList');
const selMembers = document.querySelector('select#memberList');

const btnCreate = document.querySelector('button#create');
const btnDissolve = document.querySelector('button#dissolve');
const btnAddMember = document.querySelector('button#addMember');
const btnRemoveMember = document.querySelector('button#removeMember');

const btnUpdateNotice = document.querySelector('button#updateNotice');

btnLogin.onclick = login;
btnLogout.onclick = logout;
btnCreate.onclick = createGroup;
btnDissolve.onclick = dissolveGroup;
btnAddMember.onclick = addMember;
btnRemoveMember.onclick = removeMember;
btnUpdateNotice.onclick = updateNotice;

selGroups.onclick = onGroupsSelectClick;

// 
function login() {
    var elContactId = document.querySelector('input#contactId');
    if (elContactId.value.length < 4) {
        alert('请输入至少4位数字的登录联系人的 ID');
        return;
    }

    // 引擎配置
    var config = {
        "address": "127.0.0.1",
        "domain" : "shixincube.com",
        "appKey" : "shixin-cubeteam-opensource-appkey"
    };

    // 调用 start 启动引擎
    cube.start(config, function() {
        var name = document.querySelector('input#contactName');

        // 调用 siginIn 函数签入联系人
        cube.signIn(parseInt(elContactId.value), name.value);

        btnLogin.setAttribute('disabled', 'disabled');
        btnLogout.removeAttribute('disabled');
    }, function() {
        alert('启动魔方引擎失败');
    });
}

function logout() {
    cube.signOut();
    cube.stop();

    btnLogout.setAttribute('disabled', 'disabled');
    btnLogin.removeAttribute('disabled');

    selGroups.innerText = '';
    refreshGroupInfo();
}

function createGroup() {
    var groupName = prompt('请输入群名称');
    if (null == groupName) {
        return;
    }
    if (groupName.length < 2) {
        alert('群名称至少需要2个字符');
        setTimeout(function() {
            createGroup();
        }, 1);
        return;
    }

    dialog('contacts', 'show', function(ok) {
        if (ok) {
            var list = querySelectedContacts();
            if (list.length == 0) {
                alert('至少选择一个联系人');
                return false;
            }

            // 调用 createGroup 创建群组
            cube.contact.createGroup(groupName, list, function(group) {
                // 群组创建成功，更新列表
                refreshGroupList();
            }, function(error) {
                alert('创建群组失败: ' + error.code);
            });
        }

        resetContactsDialog();
    });
}

function dissolveGroup() {
    var groupId = getSelectedGroupId();
    if (groupId <= 0) {
        alert('请选择一个群组');
        return;
    }

    cube.contact.getGroup(groupId, function(group) {
        if (!confirm('确定要解散 "' + group.getName() + '" 群组吗？')) {
            return;
        }

        // 调用 dissolveGroup 解散群组
        cube.contact.dissolveGroup(group, function(group) {
            refreshGroupList();
            refreshGroupInfo();
        });
    });
}

function addMember() {

}

function removeMember() {

}

function updateNotice() {
    var groupId = getSelectedGroupId();
    if (groupId <= 0) {
        alert('请选择一个群组');
        return;
    }

    var notice = prompt('请填写群公告内容');
    if (null == notice) {
        return;
    }

    cube.contact.getGroup(groupId, function(group) {
        // 使用群组附录的 updateNotice 方法更新公告
        group.getAppendix().updateNotice(notice, function() {
            document.querySelector('textarea#groupNotice').value = notice;
        });
    });
}

function refreshGroupList() {
    selGroups.innerText = '';

    // 查找自己所在的群组
    cube.contact.queryGroups(function(list) {
        list.forEach(function(group) {
            // 添加数据到 select 标签
            var option = document.createElement('option');
            option.value = group.getId();
            option.innerText = group.getName() + ' - ' + group.getId();
            selGroups.append(option);
        });
    });
}

function refreshGroupInfo(group) {
    selMembers.innerText = '';

    if (group) {
        document.querySelector('input#groupId').value = group.getId();
        document.querySelector('input#groupName').value = group.getName();
        document.querySelector('input#creationTime').value = formatTime(group.getCreationTime());
        document.querySelector('textarea#groupNotice').value = group.getAppendix().getNotice();

        group.getMembers().forEach(function(member) {
            var option = document.createElement('option');
            option.value = member.getId();
            option.innerText = getContactName(member.getId()) + ' - ' + member.getId();
            selMembers.append(option);
        });
    }
    else {
        document.querySelector('input#groupId').value = '';
        document.querySelector('input#groupName').value = '';
        document.querySelector('input#creationTime').value = '';
        document.querySelector('textarea#groupNotice').value = '';
    }
}

function onSignIn() {
    refreshGroupList();
}

function onGroupsSelectClick() {
    var groupId = getSelectedGroupId();

    // 调用 getGroup 获取群组实例
    cube.contact.getGroup(groupId, function(group) {
        refreshGroupInfo(group);
    }, function(error) {
        console.log(error);
    });
}


function getSelectedGroupId() {
    if (selGroups.options.length == 0) {
        return 0;
    }

    if (selGroups.selectedIndex < 0) {
        return -1;
    }

    var selectedOption = selGroups.options[selGroups.selectedIndex];
    return parseInt(selectedOption.value);
}

function querySelectedContacts() {
    var result = [];

    var el = document.querySelector('div#contacts');
    var inputList = el.getElementsByTagName('input');
    for (var i = 0; i < inputList.length; ++i) {
        var checkbox = inputList[i];
        if (checkbox.checked) {
            result.push(parseInt(checkbox.value));
        }
    }

    return result;
}

function resetContactsDialog() {
    var el = document.querySelector('div#contacts');
    var inputList = el.getElementsByTagName('input');
    for (var i = 0; i < inputList.length; ++i) {
        var checkbox = inputList[i];
        checkbox.checked = false;
    }
}
