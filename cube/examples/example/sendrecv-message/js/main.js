/**
 * This file is part of Cube.
 * https://shixincube.com
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

const startCubeButton = document.querySelector('button#start');
const stopCubeButton = document.querySelector('button#stop');
const sendButton = document.querySelector('button#send');

startCubeButton.onclick = startCube;
stopCubeButton.onclick = stopCube;
sendButton.onclick = sendMessage;

const contactIdInput = document.querySelector('input#contactId');
const contactNameInput = document.querySelector('input#contactName');
const messagesTextarea = document.querySelector('section#messages textarea');
const messsageTagetInput = document.querySelector('input#messsageTaget');
const messsageInput = document.querySelector('input#messsageInput');

// 获取 Cube 实例
const cube = window.cube();

// 监听消息已发送事件
cube.messaging.on(MessagingEvent.Sent, onSent);
// 监听接收到消息事件
cube.messaging.on(MessagingEvent.Notify, onNotify);

function startCube() {
    if (contactIdInput.value.length < 3) {
        stateLabel.innerHTML = '<span class="warning">请输入账号 ID</span>';
        return;
    }

    let config = {
        "address": "127.0.0.1",
        "domain": "shixincube.com",
        "appKey": "shixin-cubeteam-opensource-appkey"
    };
    // 获取 Cube 实例，并启动
    cube.start(config, function() {
        stateLabel.innerHTML = '启动 Cube 成功';

        startCubeButton.setAttribute('disabled', 'disabled');
        stopCubeButton.removeAttribute('disabled');
        sendButton.removeAttribute('disabled');
        contactIdInput.setAttribute('readonly', 'readonly');
        contactNameInput.setAttribute('readonly', 'readonly');

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
    sendButton.setAttribute('disabled', 'disabled');
    contactIdInput.removeAttribute('readonly');
    contactNameInput.removeAttribute('readonly');

    messagesTextarea.value = '';
}

function sendMessage() {
    let target = messsageTagetInput.value;
    if (target.length == 0) {
        stateLabel.innerHTML = '<span class="warning">请指定“发送目标”</span>';
        return;
    }

    let content = messsageInput.value;
    if (content.length == 0) {
        stateLabel.innerHTML = '<span class="warning">请输入需要发送的内容</span>';
        return;
    }

    // 创建 Message 实例
    let message = new Message({ content: content });
    // 发送消息给目标联系人
    cube.messaging.sendToContact(target, message);

    stateLabel.innerHTML = '正在发送消息……';

    messsageInput.value = '';
}

function onSent(event) {
    let message = event.getData();
    let text = [message.from, ' -> ', message.to, ' (', formatDate(message.getRemoteTimestamp()), '): ',
        message.getPayload().content, '\n'];
    
    messagesTextarea.value += text.join('');

    messagesTextarea.scrollTop = messagesTextarea.scrollHeight;

    stateLabel.innerHTML = '消息已发送';
}

function onNotify(event) {
    let message = event.getData();

    let text = [message.from, ' -> ', message.to, ' (', formatDate(message.getRemoteTimestamp()), '): ',
        message.getPayload().content, '\n'];
    
    messagesTextarea.value += text.join('');

    messagesTextarea.scrollTop = messagesTextarea.scrollHeight;

    stateLabel.innerHTML = '消息已接收';
}

function formatDate(timestamp) {
    let date = new Date(timestamp);
    let text = [date.getMonth() + 1, '-', date.getDate(), ' ', date.getHours(), ':', date.getMinutes(), ':', date.getSeconds()];
    return text.join('');
}

messsageInput.onkeyup = function(event) {
    if (event.keyCode == 13) {
        sendMessage();
    }
}
