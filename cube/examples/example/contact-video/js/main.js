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

const peerVideo = document.querySelector('video#peerVideo');
const myVideo = document.querySelector('video#myVideo');

const peerVideoButton = document.querySelector('button#peerVideoCtrl');
const peerAudioButton = document.querySelector('button#peerAudioCtrl');
const myVideoButton = document.querySelector('button#myVideoCtrl');
const myAudioButton = document.querySelector('button#myAudioCtrl');

const makeCallButton = document.querySelector('button#makeCall');
const answerCallButton = document.querySelector('button#answerCall');
const hangupCallButton = document.querySelector('button#hangupCall');

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
    }, function() {
        stateLabel.innerHTML = '启动 Cube 失败';
    });

    // 设置视频标签元素到 Cube
    cube.mpComm.setRemoteVideoElement(peerVideo);
    cube.mpComm.setLocalVideoElement(myVideo);
}

function stop() {
    cube.stop();
}
