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

const startCubeButton = document.querySelector('button#start');
const stopCubeButton = document.querySelector('button#stop');
const sendTextButton = document.querySelector('button#sendText');
const sendImageButton = document.querySelector('button#sendImage');

startCubeButton.onclick = startCube;
stopCubeButton.onclick = stopCube;
sendTextButton.onclick = sendText;
sendImageButton.onclick = sendImage;

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
    messagesTextarea.value = '';
    if (contactIdInput.value.length < 3) {
        stateLabel.innerHTML = '请输入当前账号的 ID';
        return;
    }

    // 向消息模块注册插件
    cube.messaging.register(new MessageTypePlugin());

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
        sendTextButton.removeAttribute('disabled');
        sendImageButton.removeAttribute('disabled');
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
    sendTextButton.setAttribute('disabled', 'disabled');
    sendImageButton.setAttribute('disabled', 'disabled');
    contactIdInput.removeAttribute('readonly');
    contactNameInput.removeAttribute('readonly');
}

function sendText() {
    let target = messsageTagetInput.value;
    if (target.length == 0) {
        stateLabel.innerHTML = '请指定“发送目标”';
        return;
    }

    let text = messsageInput.value;
    if (text.length == 0) {
        stateLabel.innerHTML = '请输入需要发送的文本';
        return;
    }

    // 创建 TextMessage 实例
    let message = new TextMessage(text);
    // 发送消息给联系人
    cube.messaging.sendToContact(target, message);

    stateLabel.innerHTML = '正在发送文本消息……';

    messsageInput.value = '';
}

function sendImage() {
    let target = messsageTagetInput.value;
    if (target.length == 0) {
        stateLabel.innerHTML = '请指定“发送目标”';
        return;
    }

    // 使用 Cube 提供的辅助方法选择图片文件
    cube.launchFileSelector(function(event) {
        let file = event.target.files[0];
        let message = new ImageMessage(file);
        cube.messaging.sendToContact(target, message);

        stateLabel.innerHTML = '正在发送图片消息……';
    }, 'image/*');
}

function onSent(event) {
    let message = event.getData();
    if (undefined === message.getType()) {
        stateLabel.innerHTML = '不支持的消息类型';
        return;
    }

    let text = ['[', message.getType(), '] ', message.from, '->', message.to, ' (', formatDate(message.getRemoteTimestamp()), '): '];

    if (message.getType() == 'text') {
        text.push(message.getText());
    }
    else if (message.getType() == 'image') {
        text.push(message.getAttachment().getFileName());
        // 图片消息已发送，为图片生成缩略图
        cube.fileProcessor.makeThumb(message.getAttachment().getFileCode(), function(thumb) {
            // 将生成的缩略图更新到消息
            cube.messaging.updateAttachment(message, thumb);
        });
    }
    else {
        text.push(JSON.stringify(message.getPayload()));
    }

    text.push('\n');
    
    messagesTextarea.value += text.join('');

    messagesTextarea.scrollTop = messagesTextarea.scrollHeight;

    stateLabel.innerHTML = '消息已发送';
}

function onNotify(event) {
    let message = event.getData();
    if (undefined === message.getType()) {
        stateLabel.innerHTML = '不支持的消息类型';
        return;
    }

    let text = ['[', message.getType(), '] ', message.from, '->', message.to, ' (', formatDate(message.getRemoteTimestamp()), '): '];

    if (message.getType() == 'text') {
        text.push(message.getText());
    }
    else if (message.getType() == 'image') {
        text.push(message.getAttachment().getFileName());
    }
    else {
        text.push(JSON.stringify(message.getPayload()));
    }

    text.push('\n');
    
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
        sendText();
    }
}
