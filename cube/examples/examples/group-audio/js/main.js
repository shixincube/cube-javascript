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

cube.contact.on(ContactEvent.SignIn, onSignIn);

const btnLogin = document.querySelector('button#login');
const btnLogout = document.querySelector('button#logout');
const btnInitiate = document.querySelector('button#initiate');
const btnJoin = document.querySelector('button#join');
const btnQuit = document.querySelector('button#quit');
const btnSwitchMic = document.querySelector('button#switchMic');

const selContactId = document.querySelector('select#contactId');
const inputContactName = document.querySelector('input#contactName');
const textareaLogs = document.querySelector('textarea#logs');

btnLogin.onclick = login;
btnLogout.onclick = logout;
btnInitiate.onclick = initiate;
btnJoin.onclick = join;
btnQuit.onclick = quit;
btnSwitchMic.onclick = switchMic;
selContactId.onclick = selectLoginContact;

textareaLogs.value = '请选择联系人并点击“登录”按钮';

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
        // 调用 siginIn 函数签入联系人
        cube.signIn(contactId, inputContactName.value);

        btnLogin.setAttribute('disabled', 'disabled');
        btnLogout.removeAttribute('disabled');
        btnInitiate.removeAttribute('disabled');
        btnJoin.removeAttribute('disabled');
        btnQuit.removeAttribute('disabled');
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
    btnInitiate.setAttribute('disabled', 'disabled');
    btnJoin.setAttribute('disabled', 'disabled');
    btnQuit.setAttribute('disabled', 'disabled');
    btnSwitchMic.setAttribute('disabled', 'disabled');
    selContactId.removeAttribute('disabled');

    textareaLogs.value = '请选择联系人并点击“登录”按钮';
}

function selectLoginContact() {
    var selectedOption = selContactId.options[selContactId.selectedIndex];
    inputContactName.value = getContactName(parseInt(selectedOption.value));
}

function initiate() {
    selectMediaDevice('audio', function(device) {
        if (undefined === device) {
            alert('没有找到可用的麦克风设备');
            return;
        }

        if (null == device) {
            // 没有选择设备
            return;
        }

        
    });
}

function join() {

}

function quit() {

}

function switchMic() {

}


function onSignIn(event) {
    println('已签入 "' + event.data.getName() + '"');

    var groupName = '群组语音通话演示群';
    var currentGroup = null;

    cube.contact.queryGroups(function(list) {
        for (var i = 0; i < list.length; ++i) {
            var group = list[i];
            if (group.getName() == groupName) {
                currentGroup = group;
                break;
            }
        }

        if (null == currentGroup) {
            // 创建新群组
        }
    });
}

function println(text) {
    var content = [ textareaLogs.value, '\n', formatTime(Date.now()), ' ', text ];

    textareaLogs.value = content.join('');

    var offset = parseInt(textareaLogs.scrollHeight);
    textareaLogs.scrollTop = offset;
}
