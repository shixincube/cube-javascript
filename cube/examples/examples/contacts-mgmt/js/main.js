/**
 * This file is part of Cube.
 * https://shixincube.com
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020-2023 Cube Team.
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

const btnStart = document.querySelector('button#start');
const btnStop = document.querySelector('button#stop');

const selContacts = document.querySelector('select#contacts');
const selFirends = document.querySelector('select#firends');
const selTeammates = document.querySelector('select#teammates');

const btnLoadFriends = document.querySelector('button#loadFriends');
const btnAddFriend = document.querySelector('button#addFriend');
const btnRemoveFriend = document.querySelector('button#removeFriend');

const btnLoadTeammates = document.querySelector('button#loadTeammates');
const btnAddTeammate = document.querySelector('button#addTeammate');
const btnRemoveTeammate = document.querySelector('button#removeTeammate');

btnStart.onclick = start;
btnStop.onclick = stop;
btnLoadFriends.onclick = loadFriends;
btnAddFriend.onclick = addFrined;
btnRemoveFriend.onclick = removeFriend;
btnLoadTeammates.onclick = loadTeammates;
btnAddTeammate.onclick = addTeammate;
btnRemoveTeammate.onclick = removeTeammate;


// 启动程序
function start() {
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

        btnStart.setAttribute('disabled', 'disabled');
        btnStop.removeAttribute('disabled');
    }, function() {
        alert('启动魔方引擎失败');
    });
}

// 停止程序
function stop() {
    cube.signOut();
    cube.stop();

    btnStop.setAttribute('disabled', 'disabled');
    btnStart.removeAttribute('disabled');

    selContacts.innerText = '';
    selFirends.innerText = '';
    selTeammates.innerText = '';
}

// 加载 friends 区数据
function loadFriends() {
    selFirends.innerText = '';

    // 使用 getContactZone() 获取名为 'friends' 的分区数据
    cube.contact.getContactZone('friends', function(contactZone) {
        // 遍历 contactZone.contacts 的联系人 ID
        contactZone.contacts.forEach(function(contactId) {
            // 调用 getContact 获取联系人
            cube.contact.getContact(contactId, function(contact) {
                // 添加数据到 select 标签里
                var option = document.createElement('option');
                option.value = contact.getId();
                option.innerText = contact.getId() + ' - ' + contact.getName();
                selFirends.append(option);
            });
        });
    }, function(error) {
        console.log(error);
    });
}

// 添加 friends 区数据
function addFrined() {
    if (selContacts.options.length == 0) {
        return;
    }

    if (selContacts.selectedIndex < 0) {
        alert('请选择一个候选联系人');
        return;
    }

    var contactId = parseInt(selContacts.options[selContacts.selectedIndex].value);
    // 调用 addContactToZone 将联系人添加到 friends 区
    cube.contact.addContactToZone('friends', contactId, '这是示例演示', function(zoneName, contactId) {
        // 操作成功
        // 刷新界面数据
        setTimeout(function() {
            loadFriends();
        }, 1);
    }, function(error) {
        // 操作失败
        console.log(error);
    });
}

// 移除 friends 区数据
function removeFriend() {
    if (selFirends.options.length == 0) {
        return;
    }

    if (selFirends.selectedIndex < 0) {
        alert('请选择一个在 "friends" 的联系人');
        return;
    }

    var contactId = parseInt(selFirends.options[selFirends.selectedIndex].value);
    // 调用 removeContactFromZone 将联系人从 friends 区删除
    cube.contact.removeContactFromZone('friends', contactId, function(zoneName, contactId) {
        // 操作成功
        // 刷新界面数据
        setTimeout(function() {
            loadFriends();
        }, 1);
    }, function(error) {
        // 操作失败
        console.log(error);
    });
}

// 加载 teammates 区数据
function loadTeammates() {
    selTeammates.innerText = '';

    // 使用 getContactZone() 获取名为 'teammates' 的分区数据
    cube.contact.getContactZone('teammates', function(contactZone) {
        // 遍历 contactZone.contacts 的联系人 ID
        contactZone.contacts.forEach(function(contactId) {
            // 调用 getContact 获取联系人
            cube.contact.getContact(contactId, function(contact) {
                // 添加数据到 select 标签里
                var option = document.createElement('option');
                option.value = contact.getId();
                option.innerText = contact.getId() + ' - ' + contact.getName();
                selTeammates.append(option);
            });
        });
    }, function(error) {
        console.log(error);
    });
}

// 添加 teammates 区数据
function addTeammate() {
    if (selContacts.options.length == 0) {
        return;
    }

    if (selContacts.selectedIndex < 0) {
        alert('请选择一个候选联系人');
        return;
    }

    var contactId = parseInt(selContacts.options[selContacts.selectedIndex].value);
    // 调用 addContactToZone 将联系人添加到 teammates 区
    cube.contact.addContactToZone('teammates', contactId, '这是示例演示', function(zoneName, contactId) {
        // 操作成功
        // 刷新界面数据
        setTimeout(function() {
            loadTeammates();
        }, 1);
    }, function(error) {
        // 操作失败
        console.log(error);
    });
}

// 移除 teammates 区数据
function removeTeammate() {
    if (selTeammates.options.length == 0) {
        return;
    }

    if (selTeammates.selectedIndex < 0) {
        alert('请选择一个在 "teammates" 的联系人');
        return;
    }

    var contactId = parseInt(selTeammates.options[selTeammates.selectedIndex].value);
    // 调用 removeContactFromZone 将联系人从 teammates 区删除
    cube.contact.removeContactFromZone('teammates', contactId, function(zoneName, contactId) {
        // 操作成功
        // 刷新界面数据
        setTimeout(function() {
            loadTeammates();
        }, 1);
    }, function(error) {
        // 操作失败
        console.log(error);
    });
}

// 当账号签入时被回调
function onSignIn() {
    // 从服务器加载联系人数据
    loadContacts(cube, function(list) {
        list.forEach(function(contact) {
            var option = document.createElement('option');
            option.value = contact.getId();
            option.innerText = contact.getId() + ' - ' + contact.getName();
            selContacts.append(option);
        });
    });
}
