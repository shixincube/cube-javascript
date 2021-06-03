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

// 当前通话群的 ID
var groupId = 0;

// 刷新状态信息的定时器
var statsTimer = 0;

// 监听 SignIn 事件
cube.contact.on(ContactEvent.SignIn, onSignIn);

// 监听通话相关事件
cube.mpComm.on(CommEvent.InProgress, onInProgress);
cube.mpComm.on(CommEvent.Ringing, onRinging);
cube.mpComm.on(CommEvent.Connected, onConnected);
cube.mpComm.on(CommEvent.Bye, onBye);

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
        // 启动多方通讯模块
        cube.mpComm.start();

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
    stopRefreshStats();

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

        // 设置媒体元素
        cube.mpComm.setLocalVideoElement(document.querySelector('video#local'));
        cube.mpComm.setRemoteVideoElement(document.querySelector('video#remote'));

        // 创建媒体约束，使用音频，禁用视频
        var mediaConstraint = new MediaConstraint(false, true);
        // 设置设备
        mediaConstraint.setAudioDevice(device);

        cube.contact.getGroup(groupId, function(group) {
            cube.mpComm.makeCall(group, mediaConstraint, function(activeCall) {
                println('已成功发起群通话');
                btnInitiate.setAttribute('disabled', 'disabled');
                btnJoin.setAttribute('disabled', 'disabled');
            }, function(error) {
                println('发起群通话失败: ' + error.toString());
            });
        });
    });
}

function join() {
    cube.contact.getGroup(groupId, function(group) {
        cube.mpComm.isCalling(group, function(calling) {
            if (!calling) {
                alert('当前群组没有正在进行的语音通话');
                return;
            }

            initiate();
        });
    });
}

function quit() {
    stopRefreshStats();

    cube.mpComm.hangupCall(function() {
        btnInitiate.removeAttribute('disabled');
        btnJoin.removeAttribute('disabled');
    }, function(error) {
    });
}

function switchMic() {
    // var stats = [
    //     {
    //         type: "outbound-rtp",
    //         id: "a6ce028c",
    //         timestamp: 1622686045004,
    //         kind: "audio",
    //         mediaType: "audio",
    //         ssrc: 160462922,
    //         bytesSent: 4049238,
    //         packetsSent: 23406,
    //         nackCount: 0,
    //         remoteId: "81d78073"
    //     }
    // ];
    // showRTCStats(document.querySelector('div#outboundStats'), stats);
    // showRTCStats(document.querySelector('div#inboundStats'), stats);
}

function startRefreshStats() {
    var field = cube.mpComm.getActiveField();
    if (null == field) {
        return;
    }

    if (statsTimer == 0) {
        statsTimer = setInterval(function() {
            field.snapshootStatsReport(function(field, stats) {
                showRTCStats(document.querySelector('div#outboundStats'), stats);
            }, function(field, stats) {

            });
        }, 1000);
    }
}

function stopRefreshStats() {
    if (statsTimer > 0) {
        clearInterval(statsTimer);
        statsTimer = 0;
    }
}


function onSignIn(event) {
    println('[事件] 已签入 "' + event.data.getName() + '"');

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
            cube.contact.createGroup(groupName, getAllContactsId(), function(group) {
                println('已创建新群组 "' + group.getName() + '" - ' + group.getId());
                groupId = group.getId();
                document.querySelector('input#groupName').value = group.getName();
            });
        }
        else {
            println('已加载新群组 "' + currentGroup.getName() + '" - ' + currentGroup.getId());
            groupId = currentGroup.getId();
            document.querySelector('input#groupName').value = currentGroup.getName();
        }
    });
}

function onInProgress(event) {
    println('[事件] 正在处理通话请求: ' + event.data.id);
}

function onRinging(event) {
    println('[事件] 已连通服务器: ' + event.data.field.id);
}

function onConnected(event) {
    println('[事件] 已建立通话链路: ' + event.data.field.id);

    startRefreshStats();
}

function onBye(event) {
    println('[事件] 通话结束: ' + event.data.field.id);
}

function println(text) {
    var content = [ textareaLogs.value, '\n', formatTime(Date.now()), ' ', text ];

    textareaLogs.value = content.join('');

    var offset = parseInt(textareaLogs.scrollHeight);
    textareaLogs.scrollTop = offset;
}
