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

const stateLabel = document.querySelector('span#state');

const startCubeButton = document.querySelector('button#start');
const stopCubeButton = document.querySelector('button#stop');

const getListButton = document.querySelector('button#get');
getListButton.setAttribute('disabled', 'disabled');

startCubeButton.onclick = startCube;
stopCubeButton.onclick = stopCube;
getListButton.onclick = getConversationList;

const contactIdInput = document.querySelector('input#contactId');
const contactNameInput = document.querySelector('input#contactName');
const conversationList = document.querySelector('select#conversationList');


// 获取 Cube 实例
const cube = window.cube();

// 监听事件
// 消息服务就绪
cube.messaging.on(MessagingEvent.Ready, onReady);


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
        contactNameInput.setAttribute('disabled', 'disabled');

        if (contactNameInput.value.length == 0) {
            contactNameInput.value = '时信魔方-' + contactIdInput.value;
        }

        // 启动消息模块
        cube.messaging.start();

        // 签入账号
        cube.signIn(contactIdInput.value, contactNameInput.value);
    }, function() {
        stateLabel.innerHTML = '启动 Cube 失败';
    });
}

function stopCube() {
    cube.stop();

    startCubeButton.removeAttribute('disabled');
    stopCubeButton.setAttribute('disabled', 'disabled');
    contactIdInput.removeAttribute('disabled');
    contactNameInput.removeAttribute('disabled');

    stateLabel.innerHTML = '已停止 Cube';
}

function getConversationList() {
    // 获取最近的会话列表
    cube.messaging.getRecentConversations(function(list) {
        if (null == list) {
            return;
        }

        conversationList.innerHTML = '';

        list.forEach(function(conversation) {
            var option = document.createElement('option');
            option.text = conversation.getName() + '[' + conversation.getState() + ']';
            option.value = conversation.getId();
            conversationList.options.add(option);
        });
    });
}

function onReady() {
    getListButton.removeAttribute('disabled');
}
