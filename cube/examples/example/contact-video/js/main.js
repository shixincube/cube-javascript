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

function makeCall() {
    // 设置视频标签元素到 Cube
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

function answerCall() {
    let mediaConstraint = new MediaConstraint(true, true);
    cube.mpComm.answerCall(mediaConstraint, function(record) {
        stateLabel.innerHTML = '应答 ' + record.getPeer().getId();
    }, function(error) {
        stateLabel.innerHTML = '应答错误:' + error;
    });
}

function hangupCall() {
    cube.mpComm.hangupCall();
}

function muteLocalVideo() {
    let field = cube.mpComm.getActiveField();
    if (null == field) {
        console.log('没有找到活跃 Field');
        return;
    }

    let rtcDevice = field.getRTCDevice();
    
}

function onInProgress() {
    stateLabel.innerHTML = '正在处理呼叫...';
}

function onRinging(record) {
    stateLabel.innerHTML = '对方振铃...';

    let count = 0;
    timer = setInterval(function() {
        stateLabel.innerHTML = '对方振铃，等待接通 (' + (++count) + ')';
    }, 1000);
}

function onNewCall(record) {
    stateLabel.innerHTML = '收到来自 ' + record.getCaller().getId() + ' 通话邀请';
    hangupCallButton.removeAttribute('disabled');
    answerCallButton.removeAttribute('disabled');

    setTimeout(function() {
        if (confirm('是否接听来自 ' + record.getCaller().getId() + ' 的通话？')) {
            answerCall();
        }
    }, 100);
}

function onConnected(record) {
    clearInterval(timer);

    stateLabel.innerHTML = '已经接通 ' + record.getPeer().getId();
}

function onBye(record) {
    clearInterval(timer);

    stateLabel.innerHTML = '通话结束';
    hangupCallButton.setAttribute('disabled', 'disabled');
    answerCallButton.setAttribute('disabled', 'disabled');

    let parentNode = myVideo.parentNode;
    let newNode = document.createElement('video');
    parentNode.replaceChild(newNode, myVideo);
    myVideo = newNode;

    parentNode = peerVideo.parentNode;
    newNode = document.createElement('video');
    parentNode.replaceChild(newNode, peerVideo);
    peerVideo = newNode;
}

function onTimeout(record) {
    clearInterval(timer);

    stateLabel.innerHTML = '<span class="warning">呼叫超时</span>';
    hangupCallButton.setAttribute('disabled', 'disabled');
    answerCallButton.setAttribute('disabled', 'disabled');
}

function onCallFailed(error) {
    stateLabel.innerHTML = '发生错误:' + error;
}
