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

const stateLabel = document.querySelector('span#state');

const startCubeButton = document.querySelector('button#start');
const stopCubeButton = document.querySelector('button#stop');
const loadButton = document.querySelector('button#load');

const contactIdInput = document.querySelector('input#contactId');

startCubeButton.onclick = startCube;
stopCubeButton.onclick = stopCube;
loadButton.onclick = loadFile;
loadButton.setAttribute('disabled', 'disabled');

var player = videojs('videopPlayer', {
    bigPlayButton : false,
    textTrackDisplay : false,
    posterImage: true,
    errorDisplay : false,
    controlBar : false
}, function() {
    
});


function startCube() {
    if (contactIdInput.value.length < 3) {
        stateLabel.innerHTML = '<span class="warning">请输入账号 ID</span>';
        return;
    }

    var config = {
        "address": "127.0.0.1",
        "domain": "shixincube.com",
        "appKey": "shixin-cubeteam-opensource-appkey"
    };

    // 启动魔方引擎
    cube.start(config, function() {
        stateLabel.innerHTML = '启动 Cube 成功';

        startCubeButton.setAttribute('disabled', 'disabled');
        stopCubeButton.removeAttribute('disabled');
        contactIdInput.setAttribute('disabled', 'disabled');

        // 启动文件存储模块
        cube.fs.start();

        // 签入账号
        cube.signIn(contactIdInput.value);

        loadButton.removeAttribute('disabled');
    }, function() {
        stateLabel.innerHTML = '启动 Cube 失败';
    });
}

function stopCube() {
    cube.stop();

    startCubeButton.removeAttribute('disabled');
    stopCubeButton.setAttribute('disabled', 'disabled');
    contactIdInput.removeAttribute('disabled');

    stateLabel.innerHTML = '已停止 Cube';
}

function loadFile() {
   cube.fs.launchFileSelector(function(file) {
        cube.fs.findFile(file, function(fileLabel) {
            // 找到文件
            stateLabel.innerHTML = '文件已存在';
            playMedia(fileLabel);
        }, function(error) {
            // 未找到文件
            stateLabel.innerHTML = '上传文件：' + file.name;
            cube.fs.uploadFile(file, function(anchor) {
                '正在上传文件：' + anchor.position + '/' + anchor.fileSize;
            }, function(label) {
                stateLabel.innerHTML = '上传完成';
                playMedia(label);
            }, function(error) {
                stateLabel.innerHTML = '上传文件失败：' + error.toString();
            });
        });
   }, 'video/mp4');
}

function playMedia(fileLabel) {
    cube.fp.getMediaSource(fileLabel, function(url) {
        //var videoEl = document.querySelector('video#videoPlayer');
        alert(url);
    }, function(error) {
        console.error(error.toString());
    });
}
