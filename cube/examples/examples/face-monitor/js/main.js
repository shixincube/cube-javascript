/**
 * This file is part of Cube.
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

const deviceSelect = document.querySelector('select#deviceList');
const startButton = document.querySelector('button#start');
const stopButton = document.querySelector('button#stop');
const maskButton = document.querySelector('button#mask');
const stateLight = document.querySelector('div#stateLight');
const videoContainer = document.querySelector('.video-container');
const cameraVideo = document.querySelector('video#cameraVideo');
const logLabel = document.querySelector('div#logLabel');

// 当前界面里显示的日志行数
var logLines= 0;

startButton.onclick = start;
stopButton.onclick = stop;
maskButton.onclick = switchMask;

stopButton.setAttribute('disabled', 'disabled');
maskButton.setAttribute('disabled', 'disabled');
stateLight.style.backgroundColor = '#058B00';

var videoStream = null;

const videoDevices = {};

// 获取 Cube 实例
const cube = window.cube();

// 获取 Face Monitor 模块
const monitor = cube.getModule('FaceMonitor');

monitor.on(FaceMonitorEvent.Ready, onReady);
monitor.on(FaceMonitorEvent.Load, onLoad);
monitor.on(FaceMonitorEvent.Loaded, onLoaded);
monitor.on(FaceMonitorEvent.Touched, onTouched);

function checkDevice() {
    MediaDeviceTool.enumDevices(function(devices) {
        var html = [];
        devices.forEach(function(desc) {
            if (desc.isVideoInput()) {
                videoDevices[desc.getDeviceId()] = desc;

                var c = ['<option id="', desc.getDeviceId(), '">', desc.getLabel(), '</option>'];
                html.push(c.join(''));
            }
        });
        if (html.length > 0) {
            deviceSelect.innerHTML = html.join('');
        }
        else {
            deviceSelect.innerHTML = '<option>未检测到可用设备</option>';
        }
    });
}

function start() {
    // 设置界面元素
    monitor.setup(videoContainer, cameraVideo);

    var option = deviceSelect.options[deviceSelect.selectedIndex];
    var videoDevice = videoDevices[option.getAttribute('id')];

    if (undefined === videoDevice) {
        alert('没有检测到摄像头设备');
        return;
    }

    let config = {
        "address": "127.0.0.1",
        "domain": "shixincube.com",
        "appKey": "shixin-cubeteam-opensource-appkey",
        "unconnected": true
    };
    // 获取 Cube 实例，并启动
    cube.start(config, function() {
        appendLog('启动 Cube 成功');

        // 启动监视器模块
        monitor.start();

        startButton.setAttribute('disabled', 'disabled');
        stopButton.removeAttribute('disabled');
        maskButton.removeAttribute('disabled');
    }, function() {
        appendLog('启动 Cube 失败');
    });

    MediaDeviceTool.getUserMedia({
        video: {
            width: { exact: 640 },
            deviceId: videoDevice.getDeviceId(),
            groupId: videoDevice.getGroupId()
        }
    }, function(stream) {
        videoStream = stream;
        MediaDeviceTool.bindVideoStream(cameraVideo, stream);
    }, function(error) {
        appendLog('获取视频数据失败 ' + error);
    });
}

function stop() {
    cube.stop();

    startButton.removeAttribute('disabled');
    stopButton.setAttribute('disabled', 'disabled');
    maskButton.setAttribute('disabled', 'disabled');
    stateLight.style.backgroundColor = '#058B00';

    MediaDeviceTool.stopStream(videoStream, cameraVideo);
}

function switchMask() {
    if (monitor.isMaskDisplayed()) {
        maskButton.innerHTML = '显示遮罩';
        monitor.hideMask();
    }
    else {
        maskButton.innerHTML = '隐藏遮罩';
        monitor.showMask();
    }
}

function appendLog(text) {
    var p = document.createElement('p');
    p.innerHTML = '&gt; ' + text;
    logLabel.appendChild(p);
    ++logLines;

    // 控制日志行数
    if (logLines > 100) {
        var first = logLabel.children[0];
        logLabel.removeChild(first);
        --logLines;
    }

    var offset = parseInt(logLabel.scrollHeight);
    logLabel.scrollTop = offset;
}

function onReady(event) {
    appendLog('Face monitor is ready');
}

function onLoad(event) {
    appendLog('Face monitor load module');
}

function onLoaded(event) {
    appendLog('Face monitor data loaded');
}

function onTouched(event) {
    appendLog(event.data.toString());

    // 如果手遮挡脸部则切换指示灯颜色
    if (event.data.touched) {
        stateLight.style.backgroundColor = '#D70022';
    }
    else {
        stateLight.style.backgroundColor = '#058B00';
    }
}

window.onload = checkDevice;
