/**
 * This file is part of Cube.
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

const deviceSelect = document.querySelector('select#deviceList');
const startCubeButton = document.querySelector('button#start');
const stopCubeButton = document.querySelector('button#stop');
const cameraVideo = document.querySelector('video#cameraVideo');
const stateLabel = document.querySelector('div#stateLabel');

deviceSelect.onchange = selectDevice;
startCubeButton.onclick = start;
stopCubeButton.onclick = stop;

var videoStream = null;

const videoDevices = {};

// 获取 Cube 实例
const cube = window.cube();


function checkDevice() {
    MediaDeviceTool.enumDevices(function(devices) {
        var html = [];
        devices.forEach(function(desc) {
            if (desc.isVideo()) {
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

function selectDevice(event) {
    this.options[this.selectedIndex].innerHTML;
}

function start() {
    let config = {
        "address": "127.0.0.1",
        "domain": "shixincube.com",
        "appKey": "shixin-cubeteam-opensource-appkey",
        "unconnected": true
    };
    // 获取 Cube 实例，并启动
    cube.start(config, function() {
        stateLabel.innerHTML = '启动 Cube 成功';

        startCubeButton.setAttribute('disabled', 'disabled');
        stopCubeButton.removeAttribute('disabled');
    }, function() {
        stateLabel.innerHTML = '启动 Cube 失败';
    });

    var option = deviceSelect.options[deviceSelect.selectedIndex];
    var videoDevice = videoDevices[option.getAttribute('id')];

    MediaDeviceTool.getUserMedia({
        video: {
            width: { exact: 640 },
            height: { exact: 480 },
            deviceId: videoDevice.getDeviceId(),
            groupId: videoDevice.getGroupId()
        }
    }, function(stream) {
        videoStream = stream;
        MediaDeviceTool.bindVideoStream(cameraVideo, stream);
    }, function(error) {

    });
}

function stop() {
    cube.stop();

    startCubeButton.removeAttribute('disabled');
    stopCubeButton.setAttribute('disabled', 'disabled');

    MediaDeviceTool.stopStream(videoStream, cameraVideo);
}

window.onload = checkDevice;
