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

// 监听事件
cube.contact.on(ContactEvent.SignIn, onSignIn);

const btnStart = document.querySelector('button#start');
const btnStop = document.querySelector('button#stop');
const selContacts = document.querySelector('select#contacts');

btnStart.onclick = start;
btnStop.onclick = stop;


// 启动程序
function start() {

    var config = {
        "address": "127.0.0.1",
        "domain" : "shixincube.com",
        "appKey" : "shixin-cubeteam-opensource-appkey"
    };

    // 调用 start 启动引擎
    cube.start(config, function() {
        var id = document.querySelector('input#contactId');
        var name = document.querySelector('input#contactName');
        // 调用 siginIn 函数签入联系人
        cube.signIn(id, name);
    }, function() {

    });
}

// 停止程序
function stop() {
    cube.stop();

    selContacts.innerHTML = '';
}


function onSignIn() {
    // 从服务器加载联系人数据
    loadContacts(cube, function(list) {
        list.forEach(function(contact) {
            var node = document.createElement('option');
            node.setAttribute('value', contact.getId());
            node.innerHTML(contact.getId() + ' - ' + contact.getName());
            selContacts.appendChild(node);
        });
    });
}
