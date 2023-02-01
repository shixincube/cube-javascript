/**
 * This file is part of Cube.
 * https://shixincube.com
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

// 获取 Cube 实例
const cube = window.cube();
var rootDir = null;

const stateLabel = document.querySelector('span#state');

const startCubeButton = document.querySelector('button#start');
const stopCubeButton = document.querySelector('button#stop');

const contactIdInput = document.querySelector('input#contactId');

startCubeButton.onclick = startCube;
stopCubeButton.onclick = stopCube;

const refreshButton = document.querySelector('button#refresh');
const uploadButton = document.querySelector('button#upload');
const myRoot = document.querySelector('select#myRoot');

refreshButton.onclick = refreshDir;
uploadButton.onclick = uploadFile;

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

    // 当文件存储服务就绪后加载根目录文件信息
    cube.fs.attachWithName(FileStorageEvent.Ready, function() {
        refreshDir();
    });

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

    fillFileInfo(null);
    myRoot.innerHTML = '';
}

function refreshDir() {
    fillFileInfo(null);

    cube.fs.getSelfRoot(function(directory) {
        rootDir = directory;

        myRoot.innerHTML = '';

        // 列出所有文件
        directory.listFiles(0, 49, function(dir, list, begin, end) {
            if (list.length == 0) {
                alert('没有找到文件');
                return;
            }

            list.forEach(function(fileLabel) {
                var option = document.createElement('option');

                var text = [
                    '[F] ', fileLabel.getFileName()
                ];

                option.text = text.join('');
                option.value = fileLabel.getFileCode();
                option.onclick = onFileClick;
                myRoot.options.add(option);
            });
        }, function(error) {
            console.log(error);
        });
    }, function(error) {
        console.log(error);
        stateLabel.innerHTML = '发生错误：' + error;
    });
}

function uploadFile() {
    if (null == rootDir) {
        alert('尚未启动魔方引擎');
        return;
    }

    rootDir.uploadFileWithSelector(function(anchor) {
        stateLabel.innerHTML = '开始上传：' + anchor.getFileName();
    }, function(anchor) {
        stateLabel.innerHTML = '正在上传：' + anchor.position + '/' + anchor.fileSize;
    }, function(dir, fileLabel) {
        stateLabel.innerHTML = '上传成功：' + fileLabel.getFileName();
        setTimeout(function() {
            refreshDir();
        }, 10);
    }, function(error) {
        console.log(error);
        stateLabel.innerHTML = '发生错误：' + error;
    });
}

function fillFileInfo(fileLabel) {
    if (null != fileLabel) {
        document.querySelector('input#fileCode').value = fileLabel.getFileCode();
        document.querySelector('input#fileName').value = fileLabel.getFileName();
        document.querySelector('input#fileSize').value = fileLabel.getFileSize();
        document.querySelector('input#lastModified').value = formatTime(fileLabel.getLastModified());
        document.querySelector('input#fileType').value = fileLabel.getFileType();
    }
    else {
        document.querySelector('input#fileCode').value = '';
        document.querySelector('input#fileName').value = '';
        document.querySelector('input#fileSize').value = '';
        document.querySelector('input#lastModified').value = '';
        document.querySelector('input#fileType').value = '';
    }
}

function onFileClick(e) {
    var event = e || window.event || arguments.callee.caller.arguments[0];
    var fileCode = event.target.value;
    cube.fs.getFileLabel(fileCode, function(fileLabel) {
        fillFileInfo(fileLabel);
    }, function(error) {
        console.log(error);
    });
}
