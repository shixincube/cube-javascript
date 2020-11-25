/**
 * This source file is part of Cell.
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

var App = Class({
    ctor: function() {
        this.console = new Console();
        this.cube = null;

        this.selectFileDom = null;
        this.fileEl = null;
        this.fileName = null;

        this.callDom = null;
    },

    init: function() {
        var self = this;
        this.console.start();
        this.console.register({ name: "start"
            , shortName: "start"
            , desc: "启动 CubeEngine 实例。"
            , usage: "start <self-id>"
            , exec: function(console, name, args) {
                self.startCube(args);
                console.println("");
            }
        });
        this.console.register({ name: "send"
            , shortName: "send"
            , desc: "发送消息给指定目标。"
            , usage: "send <contact-id> <content>"
            , exec: function(console, name, args) {
                self.sendMessage(args);
                console.println("");
            }
        });
        this.console.register({ name: "selfile"
            , shortName: "selfile"
            , desc: "显示选择文件面板。"
            , usage: "selfile"
            , exec: function(console, name, args) {
                self.selectFile(args);
                console.println("");
            }
        });
        this.console.register({ name: "call"
            , shortName: "call"
            , desc: "启动音视频通话。"
            , usage: "call <target-id>"
            , exec: function(console, name, args) {
                self.newCall(args);
                console.println("");
            }
        });
    },

    showConsole: function() {
        this.console.open();
    },

    bindEvent: function() {
        var that = this;
        
        var messaging = this.cube.getMessagingService();

        messaging.attachWithName(MessagingEvent.Sent, function(event) {
            that.console.log('消息已发送 ' + event.data.from + ' -> ' + event.data.to);
        });
        messaging.attachWithName(MessagingEvent.Sending, function(msg) {
            if (msg instanceof FileMessage) {
                that.console.log('正在发送 ' + msg.getFileName() + ' - ' + msg.getPosition() + '/' + msg.getFileSize());
            }
        });
        messaging.attachWithName(MessagingEvent.Notify, function(event) {
            var msg = event.data;
            that.console.log('收到来自 ' + msg.from + ' 的消息：' + msg.payload.content);
        });

        var fileStorage = this.cube.getFileStorage();

        fileStorage.attachWithName(FileStorageEvent.Uploading, function(state) {
            that.console.log('文件正在上传：' + state.getData().fileName + ' - ' + state.getData().position
                 + '/' + state.getData().fileSize);
        });
        fileStorage.attachWithName(FileStorageEvent.UploadCompleted, function(state) {
            that.console.log('文件上传完成：' + state.getData().fileName);
            that.selectFileDom.style.display = 'none';
            that.console.open();
        });

        fileStorage.attachWithName(FileStorageEvent.FileUpdated, function(state) {
            if (confirm('是否下载文件：' + state.getData().getFileName())) {
                fileStorage.downloadFile(state.getData());
            }
        });
    },

    extendGroup: function() {
        var groupPlugin = Class(Plugin, {
            ctor: function() {

            },

            onEvent: function(name, data) {
                return data;
            }
        });
    },

    startCube: function(args) {
        if (args.length != 1) {
            this.console.println('请设置自己的联系人 ID');
            return;
        }

        if (null == this.cube) {
            this.cube = new CubeEngine();
            window.cube = cube;
            this.bindEvent();
            // this.extendGroup();
        }

        var that = this;
        var config = {
            address: '127.0.0.1',
            domain: 'shixincube.com',
            appKey: 'shixin-cubeteam-opensource-appkey',
            pipelineReady: true     // 等待通道就绪
        };
        this.cube.start(config, function() {
            that.console.println('Cube Engine 启动成功');
            that.cube.getContactService().signIn(args[0]);
        }, function() {
            that.console.println('Cube Engine 启动失败');
        });
    },

    sendMessage: function(args) {
        if (args.length != 2) {
            this.console.println('参数错误');
            return;
        }

        var ms = this.cube.getMessagingService();
        ms.start();

        var cid = parseInt(args[0]);
        var content = args[1];

        var that = this;
        this.cube.getContactService().getContact(cid, function(contact) {
            var msg = ms.sendToContact(contact, new Message({ "content" : content }));
            if (null != msg) {
                that.console.info('向 ' + cid + ' 发送消息 "' + content + '"');
            }
            else {
                that.console.warn('发送消息失败');
            }
        });
    },

    selectFile: function(args) {
        if (null == this.cube) {
            this.console.warn('未启动 Cube Engine');
            return;
        }

        var that = this;

        var fileStorage = this.cube.getFileStorage();
        fileStorage.start();

        if (null == this.selectFileDom) {
            this.selectFileDom = document.createElement('div');
            this.selectFileDom.id = 'select_file';
            var content = ['<div><label for="upload">选择一个文件：</label>',
                '<input type="file" id="upload" name="upload" accept="*.*">',
                '</div>'
            ];
            this.selectFileDom.innerHTML = content.join('');
            document.body.appendChild(this.selectFileDom);

            this.fileEl = document.getElementById('upload');
            this.fileEl.onchange = function(e) {
                var file = this.files[0];
                if (undefined === file) {
                    that.selectFileDom.style.display = 'none';
                    that.console.open();
                    return;
                }

                that.fileName = file.name;

                fileStorage.uploadFile(file);
            };
        }
        else {
            this.fileEl.value = '';
            this.selectFileDom.style.display = 'block';
        }

        this.console.close();
    },

    callTipsElem: null,
    callingTimer: 0,
    callTarget: 0,

    callEventCallback: function(state) {
        console.log('[Event] ' + state);
        var tips = null;

        if (state.getName() == MultipointCommEvent.InProgress) {
            tips = '正在呼叫: ' + state.getData().getId();
        }
        else if (state.getName() == MultipointCommEvent.Ringing) {
            tips = '对方振铃: ' + state.getData().getId();
        }
        else if (state.getName() == MultipointCommEvent.Bye) {
            tips = '收到 Bye: ' + state.getData().getPeer().getId();
            clearInterval(this.callingTimer);
        }
        else if (state.getName() == MultipointCommEvent.CallTimeout) {
            tips = '呼叫超时: ' + state.getData().getId();
            clearInterval(this.callingTimer);
        }
        else if (state.getName() == MultipointCommEvent.NewCall) {
            var that = this;
            var promise = new Promise(function(resolve, reject) {
                tips = '收到来自 "' + state.getData().getCaller().getId() + '" 的通话邀请';
                that.callTipsElem.innerText = tips;
                resolve(state.getData());
            });
            promise.then(function(record) {
                if (confirm('是否应答来自 "' + record.getCaller().getId() + '" 的呼叫？')) {
                    var mediaConstraint = new MediaConstraint(true, false);
                    that.cube.getMultipointComm().answerCall(mediaConstraint);
                }
            }).catch(function() {
            });
        }
        else {
            tips = '[Event] ' + state;
        }

        this.callTipsElem.innerText = (null != tips) ? tips : '';
    },

    newCall: function(args) {
        if (args.length == 0) {
            this.console.println('参数错误');
            return;
        }

        var that = this;

        this.callTarget = parseInt(args[0]);

        if (null == this.callDom) {
            this.callDom = document.createElement('div');
            this.callDom.setAttribute('class', 'call');
        }

        var comm = this.cube.getMultipointComm();
        if (!comm.hasStarted()) {
            comm.start();
            comm.attach(function(state) {
                that.callEventCallback(state);
            });
        }

        var html = ['<div class="tips"><span id="tips_view">通话目标：', this.callTarget, '</span>&nbsp;<span id="tips_mark"></span></div>',
                    '<div class="local" id="local_view">', '</div>',
                    '<div class="remote" id="remote_view">', '</div>',
                    '<div class="toolbar">',
                        '<button class="btn" onclick="javascript:app.onClickMakeCall(event);">Make Call</button>',
                        '<button class="btn" onclick="javascript:app.onClickAnswerCall(event);">Answer Call</button>',
                        '<button class="btn" onclick="javascript:app.onClickTerminateCall(event);">Terminate Call</button>',
                        '<button class="btn" onclick="javascript:app.onClickCloseCall(event);">Close</button>',
                    '</div>'];
        this.callDom.innerHTML = html.join('');

        document.body.appendChild(this.callDom);

        this.callTipsElem = document.getElementById('tips_view');

        var localView = document.getElementById('local_view');
        localView.appendChild(comm.getLocalVideoElement());

        var remoteView = document.getElementById('remote_view');
        remoteView.appendChild(comm.getRemoteVideoElement());
    },

    onClickMakeCall: function(e) {
        var comm = this.cube.getMultipointComm();

        var count = 0;

        var that = this;
        this.cube.getContactService().getContact(this.callTarget, function(contact) {
            var mediaConstraint = new MediaConstraint(true, false);
            comm.makeCall(contact, mediaConstraint, function() {
                console.log('Call ' + contact.getId());
                that.callTipsElem.innerText = '已呼叫 ' + contact.getId();
                that.callingTimer = setInterval(function() {
                    var el = document.getElementById('tips_mark');
                    el.innerText = '(' + (++count) + 's)';
                }, 1000);
            }, function(error) {
                console.log(error);
                clearInterval(that.callingTimer);
                that.callTipsElem.innerText = '主叫发生错误: ' + error;
            });
        }, function(error) {
            console.log('获取联系人失败: ' + error);
        });
    },

    onClickAnswerCall: function(e) {
        var mediaConstraint = new MediaConstraint(true, false);
        this.cube.getMultipointComm().answerCall(mediaConstraint);
    },

    onClickTerminateCall: function(e) {
        this.cube.getMultipointComm().terminateCall();
    },

    onClickCloseCall: function() {
        this.callDom.remove();
        clearInterval(this.callingTimer);
    }
});
