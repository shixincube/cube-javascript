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

// 日志内容显示区域
const logTextarea = document.querySelector('textarea');

// 操作按钮
const startCubeButton = document.querySelector('button#start');
const stopCubeButton = document.querySelector('button#stop');
const signInCubeButton = document.querySelector('button#signin');
const signOutCubeButton = document.querySelector('button#signout');

const contactIdInput = document.querySelector('input#contactId');

startCubeButton.onclick = startCube;
stopCubeButton.onclick = stopCube;

// 启动魔方引擎
function startCube() {
    println('启动引擎...');

    startCubeButton.setAttribute('disabled', 'disabled');

    // 填写引擎需要的参数
    let config = {
        "address": "127.0.0.1",
        "domain": "shixincube.com",
        "appKey": "shixin-cubeteam-opensource-appkey"
    };

    // 调用 start 启动引擎
    cube.start(config, function() {
        println('启动 Cube 成功');

        stopCubeButton.removeAttribute('disabled');
        // contactIdInput.setAttribute('readonly', 'readonly');
        // contactNameInput.setAttribute('readonly', 'readonly');

        // if (contactNameInput.value.length == 0) {
        //     contactNameInput.value = '时信魔方-' + contactIdInput.value;
        // }
    }, function() {
        println('启动 Cube 失败');

        startCubeButton.removeAttribute('disabled');
    });
}

// 停止魔方引擎
function stopCube() {
    println('停止引擎...');

    cube.stop();

    startCubeButton.removeAttribute('disabled');
    stopCubeButton.setAttribute('disabled', 'disabled');
}

// 打印一行文档到日志显示区域
function println(text) {
    var value = logTextarea.value;
    if (value.length > 0) {
        logTextarea.value = value + '\n' + text;
    }
    else {
        logTextarea.value = text;
    }

    var offset = parseInt(logTextarea.scrollHeight);
    logTextarea.scrollTop = offset;
}
