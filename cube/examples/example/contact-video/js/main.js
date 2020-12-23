/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020 Shixin Cube Team.
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

const stateLabel = document.querySelector('span#state');

const peerIdInput = document.querySelector('input#peerId');
const myIdInput = document.querySelector('input#myId');

const startButton = document.querySelector('button#start');
const stopButton = document.querySelector('button#stop');

startButton.onclick = start;
stopButton.onclick = stop;

var peerVideo = document.querySelector('video#peerVideo');
var myVideo = document.querySelector('video#myVideo');

const peerVideoButton = document.querySelector('button#peerVideoCtrl');
const peerAudioButton = document.querySelector('button#peerAudioCtrl');
const myVideoButton = document.querySelector('button#myVideoCtrl');
const myAudioButton = document.querySelector('button#myAudioCtrl');

peerVideoButton.onclick = switchRemoteVideo;
peerAudioButton.onclick = switchRemoteAudio;
myVideoButton.onclick = switchLocalVideo;
myAudioButton.onclick = switchLocalAudio;

const makeCallButton = document.querySelector('button#makeCall');
const answerCallButton = document.querySelector('button#answerCall');
const hangupCallButton = document.querySelector('button#hangupCall');

makeCallButton.onclick = makeCall;
answerCallButton.onclick = answerCall;
hangupCallButton.onclick = hangupCall;

let timer = 0;

// 获取 Cube 实例
const cube = window.cube();

function start() {
    if (myIdInput.value.length < 3) {
        stateLabel.innerHTML = '<span class="warning">请输入“我的 ID”</span>';
        return;
    }

    let config = {
        "address": "127.0.0.1",
        "domain": "shixincube.com",
        "appKey": "shixin-cubeteam-opensource-appkey"
    };
    // 启动 Cube
    cube.start(config, function() {
        stateLabel.innerHTML = '启动 Cube 成功';

        // 启动多方通讯模块
        cube.mpComm.start();

        // 签入账号
        cube.signIn(myIdInput.value);

        startButton.setAttribute('disabled', 'disabled');
        stopButton.removeAttribute('disabled');
        makeCallButton.removeAttribute('disabled');
    }, function() {
        stateLabel.innerHTML = '启动 Cube 失败';
    });

    // 监听通话相关事件
    cube.mpComm.on(CallEvent.InProgress, onInProgress);
    cube.mpComm.on(CallEvent.Ringing, onRinging);
    cube.mpComm.on(CallEvent.NewCall, onNewCall);
    cube.mpComm.on(CallEvent.Connected, onConnected);
    cube.mpComm.on(CallEvent.Bye, onBye);
    cube.mpComm.on(CallEvent.Timeout, onTimeout);
    cube.mpComm.on(CallEvent.CallFailed, onCallFailed);
}

function stop() {
    cube.stop();

    startButton.removeAttribute('disabled');
    stopButton.setAttribute('disabled', 'disabled');
    makeCallButton.setAttribute('disabled', 'disabled');
    answerCallButton.setAttribute('disabled', 'disabled');
    hangupCallButton.setAttribute('disabled', 'disabled');
}

// 呼叫联系人
function makeCall() {
    // 设置视频标签元素
    cube.mpComm.setRemoteVideoElement(peerVideo);
    cube.mpComm.setLocalVideoElement(myVideo);

    if (peerIdInput.value.length < 3) {
        stateLabel.innerHTML = '<span class="warning">请输入“对端 ID”</span>';
        return;
    }

    cube.contact.getContact(peerIdInput.value, function(contact) {
        let mediaConstraint = new MediaConstraint(true, true);

        cube.mpComm.makeCall(contact, mediaConstraint, function() {
            stateLabel.innerHTML = '呼叫 ' + contact.getId();
            hangupCallButton.removeAttribute('disabled');
        }, function(error) {
            stateLabel.innerHTML = '发生呼叫错误 ' + error;
        });
    });
}

// 应答来电
function answerCall() {
    // 设置视频标签元素
    cube.mpComm.setRemoteVideoElement(peerVideo);
    cube.mpComm.setLocalVideoElement(myVideo);

    let mediaConstraint = new MediaConstraint(true, true);
    cube.mpComm.answerCall(mediaConstraint, function(record) {
        stateLabel.innerHTML = '应答 ' + record.getPeer().getId();
    }, function(error) {
        stateLabel.innerHTML = '应答错误:' + error;
    });
}

// 挂断通话
function hangupCall() {
    cube.mpComm.hangupCall();
}

function onInProgress() {
    stateLabel.innerHTML = '正在处理呼叫...';
}

function onRinging() {
    stateLabel.innerHTML = '对方振铃...';

    let count = 0;
    timer = setInterval(function() {
        stateLabel.innerHTML = '对方振铃，等待接通 (' + (++count) + ')';
    }, 1000);
}

function onNewCall(event) {
    // 当前的通话记录
    let record = event.getData();
    stateLabel.innerHTML = '收到来自 ' + record.getCaller().getId() + ' 通话邀请';
    hangupCallButton.removeAttribute('disabled');
    answerCallButton.removeAttribute('disabled');

    setTimeout(function() {
        if (confirm('是否接听来自 ' + record.getCaller().getId() + ' 的通话？')) {
            answerCall();
        }
    }, 100);
}

function onConnected(event) {
    let record = event.getData();

    clearInterval(timer);

    stateLabel.innerHTML = '已经接通 ' + record.getPeer().getId();
    enableCtrlButtons(true);
}

function onBye() {
    clearInterval(timer);

    stateLabel.innerHTML = '通话结束';
    hangupCallButton.setAttribute('disabled', 'disabled');
    answerCallButton.setAttribute('disabled', 'disabled');

    enableCtrlButtons(false);

    let parentNode = myVideo.parentNode;
    let newNode = document.createElement('video');
    parentNode.replaceChild(newNode, myVideo);
    myVideo = newNode;

    parentNode = peerVideo.parentNode;
    newNode = document.createElement('video');
    parentNode.replaceChild(newNode, peerVideo);
    peerVideo = newNode;
}

function onTimeout() {
    clearInterval(timer);

    stateLabel.innerHTML = '<span class="warning">呼叫/应答超时</span>';
    hangupCallButton.setAttribute('disabled', 'disabled');
    answerCallButton.setAttribute('disabled', 'disabled');
}

function onCallFailed(error) {
    stateLabel.innerHTML = '发生错误:' + error;
}


function enableCtrlButtons(enabled) {
    if (enabled) {
        peerVideoButton.removeAttribute('disabled');
        peerAudioButton.removeAttribute('disabled');
        myVideoButton.removeAttribute('disabled');
        myAudioButton.removeAttribute('disabled');
    }
    else {
        peerVideoButton.setAttribute('disabled', 'disabled');
        peerAudioButton.setAttribute('disabled', 'disabled');
        myVideoButton.setAttribute('disabled', 'disabled');
        myAudioButton.setAttribute('disabled', 'disabled');
    }
}

function switchLocalVideo() {
    let field = cube.mpComm.getActiveField();
    if (null == field) {
        console.log('没有找到活跃 Field');
        return;
    }

    let rtcDevice = field.getRTCDevice();
    if (null == rtcDevice) {
        console.log('当前状态不能操作');
        return;
    }

    if (rtcDevice.outboundVideoEnabled()) {
        myVideoButton.innerHTML = '打开视频';
        rtcDevice.enableOutboundVideo(false);
    }
    else {
        myVideoButton.innerHTML = '关闭视频';
        rtcDevice.enableOutboundVideo(true);
    }
}

function switchLocalAudio() {
    let field = cube.mpComm.getActiveField();
    if (null == field) {
        console.log('没有找到活跃 Field');
        return;
    }

    let rtcDevice = field.getRTCDevice();
    if (null == rtcDevice) {
        console.log('当前状态不能操作');
        return;
    }

    if (rtcDevice.outboundAudioEnabled()) {
        myAudioButton.innerHTML = '打开音频';
        rtcDevice.enableOutboundAudio(false);
    }
    else {
        myAudioButton.innerHTML = '关闭音频';
        rtcDevice.enableOutboundAudio(true);
    }
}

function switchRemoteVideo() {
    let field = cube.mpComm.getActiveField();
    if (null == field) {
        console.log('没有找到活跃 Field');
        return;
    }

    let rtcDevice = field.getRTCDevice();
    if (null == rtcDevice) {
        console.log('当前状态不能操作');
        return;
    }

    if (rtcDevice.inboundVideoEnabled()) {
        peerVideoButton.innerHTML = '打开视频';
        rtcDevice.enableInboundVideo(false);
    }
    else {
        peerVideoButton.innerHTML = '关闭视频';
        rtcDevice.enableInboundVideo(true);
    }
}

function switchRemoteAudio() {
    let field = cube.mpComm.getActiveField();
    if (null == field) {
        console.log('没有找到活跃 Field');
        return;
    }

    let rtcDevice = field.getRTCDevice();
    if (null == rtcDevice) {
        console.log('当前状态不能操作');
        return;
    }

    if (rtcDevice.inboundAudioEnabled()) {
        peerAudioButton.innerHTML = '打开音频';
        rtcDevice.enableInboundAudio(false);
    }
    else {
        peerAudioButton.innerHTML = '关闭音频';
        rtcDevice.enableInboundAudio(true);
    }
}
