/**
 * This file is part of Cube.
 * https://shixincube.com
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

'use strict';


// 获取 Cube 实例
const cube = window.cube();

// 当前通话群的 ID
var groupId = 0;

// 监听 SignIn 事件
cube.contact.on(ContactEvent.SignIn, onSignIn);

const selContactId = document.querySelector('select#contactId');
const inputContactName = document.querySelector('input#contactName');

const btnLogin = document.querySelector('button#login');
const btnLogout = document.querySelector('button#logout');
const bntStartVideoCall = document.querySelector('button#startVideoCall');
const bntStopVideoCall = document.querySelector('button#stopVideoCall');
const btnInvite = document.querySelector('button#invite');
const btnSwitchCamera = document.querySelector('button#switchCamera');
const btnSwitchMic = document.querySelector('button#switchMic');

selContactId.onchange = onContactIdChange;
btnLogin.onclick = login;
btnLogout.onclick = logout;

window.onunload = logout;

function login() {
    var selectedOption = selContactId.options[selContactId.selectedIndex];
    var contactId = parseInt(selectedOption.value);

    // 引擎配置
    var config = {
        "address": "127.0.0.1",
        "domain" : "shixincube.com",
        "appKey" : "shixin-cubeteam-opensource-appkey"
    };

    // 调用 start 启动引擎
    cube.start(config, function() {
        // 启动多方通讯模块
        cube.mpComm.start();

        // 调用 siginIn 函数签入联系人
        cube.signIn(contactId, inputContactName.value);

        btnLogin.setAttribute('disabled', 'disabled');
        btnLogout.removeAttribute('disabled');
        bntStartVideoCall.removeAttribute('disabled');
        bntStopVideoCall.removeAttribute('disabled');
        btnInvite.removeAttribute('disabled');
        btnSwitchCamera.removeAttribute('disabled');
        btnSwitchMic.removeAttribute('disabled');
        selContactId.setAttribute('disabled', 'disabled');
    }, function() {
        alert('启动魔方引擎失败');
    });
}

function logout() {
    cube.stop();

    btnLogin.removeAttribute('disabled');
    btnLogout.setAttribute('disabled', 'disabled');
    bntStartVideoCall.setAttribute('disabled', 'disabled');
    bntStopVideoCall.setAttribute('disabled', 'disabled');
    btnInvite.setAttribute('disabled', 'disabled');
    btnSwitchCamera.setAttribute('disabled', 'disabled');
    btnSwitchMic.setAttribute('disabled', 'disabled');
    selContactId.removeAttribute('disabled');
}


function startVideoCall() {

}

function stopVideoCall() {

}


function onContactIdChange() {
    var selectedOption = selContactId.options[selContactId.selectedIndex];
    inputContactName.value = getContactName(parseInt(selectedOption.value));
}

/**
 * SignIn 事件。
 */
function onSignIn(event) {
    println('[事件] 已签入 "' + event.data.getName() + '"');

    var groupName = '群组视频通话演示群';
    var currentGroup = null;

    // 查询与该账号有关的所有群组
    cube.contact.queryGroups(function(list) {
        // 查找是否有名称匹配的群组
        for (var i = 0; i < list.length; ++i) {
            var group = list[i];
            if (group.getName() == groupName) {
                currentGroup = group;
                break;
            }
        }

        if (null == currentGroup) {
            // 创建新群组
            cube.contact.createGroup(groupName, getAllContactsId(), function(group) {
                println('已创建新群组 "' + group.getName() + '" - ' + group.getId());
                groupId = group.getId();
                document.querySelector('input#groupName').value = group.getName();
            });
        }
        else {
            // 已经有这个群组，不需要创建
            println('已加载新群组 "' + currentGroup.getName() + '" - ' + currentGroup.getId());
            groupId = currentGroup.getId();
            document.querySelector('input#groupName').value = currentGroup.getName();
        }
    });
}

/**
 * 在控制台打印日志。
 */
function println(text) {
    console.log(formatTime(Date.now()) + ' ' + text);
}
