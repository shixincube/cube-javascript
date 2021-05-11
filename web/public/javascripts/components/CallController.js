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

(function(g) {
    
    var cube = null;

    var that = null;

    var selectMediaDeviceEl = null;
    var selectMediaDeviceCallback = null;
    var selectVideoDevice = false;
    var selectVideoData = [];
    var confirmedIndex = -1;

    var working = false;

    var voiceCall = false;
    var groupCall = false;

    var volume = 1.0;

    var inviteeTimer = 0;   // 被邀请定时器

    function onNewCall(event) {
        var record = event.data;
        var caller = record.getCaller();
        if (null == caller) {
            return;
        }

        // 显示有新通话邀请
        if (record.callerMediaConstraint.videoEnabled) {
            // 主叫使用视频呼叫
            voiceCall = false;
            working = true;
            g.app.videoChatPanel.openNewCallToast(caller);
        }
        else {
            // 主叫使用语音呼叫
            voiceCall = true;
            working = true;
            g.app.voiceCallPanel.openNewCallToast(caller);
        }
    }

    function onInvited(event) {
        var commField = event.data;
        if (null == commField.group) {
            return;
        }

        if (working) {
            g.dialog.launchToast(Toast.Warning, '收到来自“' + commField.group.getName() + '”通话邀请');
            return;
        }

        if (commField.mediaConstraint.videoEnabled) {
            g.app.videoGroupChatPanel.openInviteToast(commField.group);
        }
        else {
            g.app.voiceGroupCallPanel.openInviteToast(commField.group);
        }

        inviteeTimer = setTimeout(function() {
            that.rejectInvitation();
        }, 30000);
    }

    function onArrived(event) {
        // 更新布局
        g.app.getContact(event.data.contact.getId(), function(contact) {
            if (voiceCall) {
                // TODO
            }
            else {
                g.app.videoGroupChatPanel.appendContact(contact);
            }
        });

        g.app.messagePanel.refreshStateBar();
    }

    function onLeft(event) {
        g.app.getContact(event.data.contact.getId(), function(contact) {
            if (voiceCall) {
                // TODO
            }
            else {
                g.app.videoGroupChatPanel.removeContact(contact);
            }
        });

        g.app.messagePanel.refreshStateBar();
    }

    function onFollowed(event) {
        var endpoint = event.data;
        if (voiceCall) {
            // TODO
        }
        else {
            g.app.videoGroupChatPanel.unmark(endpoint.contact);
        }
    }

    function onUnfollowed(event) {
    }

    function onInProgress(event) {
        console.log('#onInProgress');
    }

    function onRinging(event) {
        if (groupCall) {
            if (voiceCall) {
                g.app.voiceGroupCallPanel.tipWaitForAnswer(event.data);
            }
            else {
                g.app.videoGroupChatPanel.tipWaitForAnswer(event.data);
            }
        }
        else {
            if (voiceCall) {
                g.app.voiceCallPanel.tipWaitForAnswer(event.data.getCallee());
            }
            else {
                g.app.videoChatPanel.tipWaitForAnswer(event.data.getCallee());
            }
        }
    }

    function onConnected(event) {
        if (groupCall) {
            if (voiceCall) {
                g.app.voiceGroupCallPanel.tipConnected(event.data);
            }
            else {
                g.app.videoGroupChatPanel.tipConnected(event.data);
            }

            // 更新消息面板的状态栏
            g.app.messagePanel.refreshStateBar();
        }
        else {
            if (voiceCall) {
                g.app.voiceCallPanel.tipConnected(event.data);
            }
            else {
                g.app.videoChatPanel.tipConnected(event.data);
            }
        }
    }

    function onMediaConnected(event) {
        console.log('#onMediaConnected');
    }

    function onMediaDisconnected(event) {
        console.log('#onMediaDisconnected');
    }

    function onBye(event) {
        var record = event.data;
        working = false;

        // console.log('DEBUG - ' + record.getCaller().getId() + ' -> ' + record.getCallee().getId());

        if (groupCall) {
            if (voiceCall) {
                g.app.voiceGroupCallPanel.close();

                g.dialog.launchToast(Toast.Info, '群组语音通话已结束');
            }
            else {
                g.app.videoGroupChatPanel.close();

                g.dialog.launchToast(Toast.Info, '群组视频通话已结束');
            }

            g.app.messagePanel.refreshStateBar();

            if (inviteeTimer > 0) {
                clearTimeout(inviteeTimer);
                inviteeTimer = 0;
            }
        }
        else {
            if (voiceCall) {
                g.app.voiceCallPanel.close();

                if (record.isCaller()) {
                    var recordMessage = new CallRecordMessage(record);
                    cube.messaging.sendTo(record.getCallee(), recordMessage);
                }
            }
            else {
                g.app.videoChatPanel.close();
    
                if (record.isCaller()) {
                    var recordMessage = new CallRecordMessage(record);
                    cube.messaging.sendTo(record.getCallee(), recordMessage);
                }
            }

            var duration = record.getDuration();
            var log = duration > 1000 ? '通话结束 - ' + g.formatClockTick(parseInt(duration / 1000)) : '通话结束';
            console.log(log);

            g.dialog.launchToast(Toast.Info, log);
        }
    }

    function onBusy(event) {
        var record = event.data;
        working = false;

        var log = null;
        if (record.isCaller()) {
            log = '被叫忙，拒绝通话';
        }
        else {
            log = '已拒绝通话邀请';
        }
        console.log(log);
        g.dialog.launchToast(Toast.Info, log);

        if (voiceCall) {
            g.app.voiceCallPanel.close();
            g.app.voiceCallPanel.closeNewCallToast();
        }
        else {
            g.app.videoChatPanel.close();
            g.app.videoChatPanel.closeNewCallToast();
        }
    }

    function onTimeout(event) {
        if (groupCall) {
            // TODO
        }
        else {
            if (voiceCall) {
                g.app.voiceCallPanel.close();
                g.app.voiceCallPanel.closeNewCallToast();
            }
            else {
                g.app.videoChatPanel.close();
                g.app.videoChatPanel.closeNewCallToast();
            }
    
            if (event.data.isCaller()) {
                g.dialog.launchToast(Toast.Info, '对方无应答');
            }
        }
    }

    function onFailed(event) {
        var error = event.data;
        working = false;
        console.log('onFailed - ' + error);

        if (error.code == CallState.MediaPermissionDenied) {
            if (voiceCall) {
                g.dialog.launchToast(Toast.Warning, '未能获得麦克风使用权限');
            }
            else {
                g.dialog.launchToast(Toast.Warning, '未能获得摄像头/麦克风使用权限');
            }
        }
        else if (error.code == CallState.BeCallerBlocked) {
            // 对方在自己的黑名单里
            g.dialog.showAlert('你已经把“' + error.data.field.callee.getName() + '”添加到黑名单里，不能邀请他通话！');
        }
        else if (error.code == CallState.BeCalleeBlocked) {
            // 自己在对方的黑名单里
            g.dialog.showAlert('“' + error.data.field.callee.getName() + '”已经阻止了你的通话邀请！');
        }
        else {
            g.dialog.launchToast(Toast.Warning, '通话失败，故障码：' + error.code);
            that.hangupCall();
        }

        setTimeout(function() {
            if (groupCall) {
                console.log('#onFailed: ' + error.code);
            }
            else {
                if (voiceCall) {
                    g.app.voiceCallPanel.close();
                    g.app.voiceCallPanel.closeNewCallToast();
                }
                else {
                    g.app.videoChatPanel.close();
                    g.app.videoChatPanel.closeNewCallToast();
                }
            }
        }, 500);
    }

    /**
     * 通话控制器。
     * @param {Cube} cubeEngine 
     */
    var CallController = function(cubeEngine) {
        that = this;

        cube = cubeEngine;

        cube.mpComm.on(CommEvent.NewCall, onNewCall);
        cube.mpComm.on(CommEvent.Invited, onInvited);
        cube.mpComm.on(CommEvent.InProgress, onInProgress);
        cube.mpComm.on(CommEvent.Ringing, onRinging);
        cube.mpComm.on(CommEvent.Connected, onConnected);
        cube.mpComm.on(CommEvent.Bye, onBye);
        cube.mpComm.on(CommEvent.Arrived, onArrived);
        cube.mpComm.on(CommEvent.Left, onLeft);
        cube.mpComm.on(CommEvent.Followed, onFollowed);
        cube.mpComm.on(CommEvent.Unfollowed, onUnfollowed);
        cube.mpComm.on(CommEvent.Busy, onBusy);
        cube.mpComm.on(CommEvent.Timeout, onTimeout);   // 过程性事件
        cube.mpComm.on(CommEvent.Failed, onFailed);
        cube.mpComm.on(CommEvent.MediaConnected, onMediaConnected);
        cube.mpComm.on(CommEvent.MediaDisconnected, onMediaDisconnected);
    }

    /**
     * 显示选择设备对话框。
     * @param {Array} list 
     * @param {function} callback 
     */
    CallController.prototype.showSelectMediaDevice = function(list, callback) {
        // 记录 Callback
        selectMediaDeviceCallback = callback;

        confirmedIndex = -1;

        if (list[0].isVideoInput()) {
            selectVideoDevice = true;
        }
        else {
            selectVideoDevice = false;
        }

        if (null == selectMediaDeviceEl) {
            var el = $('#select_media_device');

            el.find('button[data-target="cancel"]').click(function() {
                for (var i = 0; i < selectVideoData.length; ++i) {
                    var data = selectVideoData[i];
                    if (undefined === data.stream) {
                        // 摄像头没有完成初始化
                        return;
                    }
                }

                confirmedIndex = -1;

                selectMediaDeviceEl.modal('hide');
            });

            el.find('button[data-target="confirm"]').click(function() {
                for (var i = 0; i < selectVideoData.length; ++i) {
                    var data = selectVideoData[i];
                    if (undefined === data.stream) {
                        // 摄像头没有完成初始化
                        return;
                    }
                }

                var queryString = selectVideoDevice ? 'input:radio[name="VideoDevice"]:checked' : 'input:radio[name="AudioDevice"]:checked';
                var data = selectMediaDeviceEl.find(queryString).attr('data');
                confirmedIndex = parseInt(data);

                selectMediaDeviceEl.modal('hide');
            });

            el.on('hide.bs.modal', function() {
                if (selectVideoData.length > 0) {
                    for (var i = 0; i < selectVideoData.length; ++i) {
                        var value = selectVideoData[i];
                        // 停止采集流
                        MediaDeviceTool.stopStream(value.stream, value.videoEl);
                    }
                    selectVideoData.splice(0, selectVideoData.length);
                }

                if (confirmedIndex >= 0) {
                    setTimeout(function() {
                        selectMediaDeviceCallback(true, confirmedIndex);
                    }, 1000);
                }
                else {
                    setTimeout(function() {
                        selectMediaDeviceCallback(false);
                    }, 500);
                }
            });

            selectMediaDeviceEl = el;
        }

        if (selectVideoDevice) {
            // 调整大小
            var el = selectMediaDeviceEl.find('.modal-dialog');
            if (!el.hasClass('modal-lg')) {
                el.addClass('modal-lg');
            }
            // 隐藏音频设备选择
            selectMediaDeviceEl.find('div[data-target="audio"]').css('display', 'none');

            var videoEl = selectMediaDeviceEl.find('div[data-target="video"]');
            videoEl.css('display', 'flex');
            // 隐藏选项
            videoEl.find('.col-6').css('display', 'none');

            list.forEach(function(value, index) {
                var item = videoEl.find('div[data-target="video-' + index + '"]');
                item.find('label').text(value.label);

                selectVideoData.push({
                    device: value
                });

                // 将摄像机数据加载到视频标签
                MediaDeviceTool.loadVideoDeviceStream(item.find('video')[0], value, false, function(videoEl, deviceDesc, stream) {
                    for (var n = 0; n < selectVideoData.length; ++n) {
                        var d = selectVideoData[n];
                        if (d.device == deviceDesc) {
                            selectVideoData[n] = {
                                videoEl: videoEl,
                                device: deviceDesc,
                                stream: stream
                            };
                            break;
                        }
                    }
                }, function(error) {
                    console.log(error);
                });

                item.css('display', 'block');
            });
        }
        else {
            // 调整大小
            selectMediaDeviceEl.find('.modal-dialog').removeClass('modal-lg');
            // 隐藏视频选择
            selectMediaDeviceEl.find('div[data-target="video"]').css('display', 'none');

            var audioEl = selectMediaDeviceEl.find('div[data-target="audio"]');
            audioEl.css('display', 'block');
            // 隐藏选项
            audioEl.find('.custom-radio').css('display', 'none');

            for (var i = 0; i < list.length; ++i) {
                var value = list[i];
                var item = audioEl.find('div[data-target="audio-' + i + '"]');
                item.find('label').text(value.label);
                item.css('display', 'block');
            }
        }

        selectMediaDeviceEl.modal('show');
    }

    /**
     * 邀请指定联系人通话。
     * @param {Contact} contact 
     * @param {boolean} [video] 
     */
    CallController.prototype.callContact = function(contact, video) {
        groupCall = false;

        cube.contact.queryBlockList(function(list) {
            if (list.indexOf(contact.getId()) >= 0) {
                g.dialog.showAlert('你已经把“' + contact.getName() + '”添加到黑名单里，不能邀请他通话！');
                return;
            }

            if (video) {
                g.app.videoChatPanel.open(contact);
            }
            else {
                g.app.voiceCallPanel.open(contact);
            }
        });
    }

    /**
     * 发起群组通话
     * @param {Group} group 
     * @param {boolean} video 
     */
    CallController.prototype.launchGroupCall = function(group, video) {
        if (group.getState() != GroupState.Normal) {
            g.dialog.showAlert('群组“' + group.getName() + '”已不存在！');
            return;
        }

        groupCall = true;
        voiceCall = !video;

        if (video) {
            g.app.videoGroupChatPanel.open(group);
        }
        else {
            g.app.voiceGroupCallPanel.open(group);
        }
    }

    /**
     * 发起通话请求。
     * @param {Contact|Group} target 
     * @param {boolean} videoEnabled 
     * @param {MediaDeviceDescription} device
     * @param {function} [callback]
     */
    CallController.prototype.makeCall = function(target, videoEnabled, device, callback) {
        if (working) {
            return false;
        }

        working = true;
        voiceCall = !videoEnabled;

        // 媒体约束
        var mediaConstraint = new MediaConstraint(videoEnabled, true);

        if (target instanceof Contact) {
            if (videoEnabled) {
                // 设置媒体容器
                cube.mpComm.setRemoteVideoElement(g.app.videoChatPanel.remoteVideo);
                cube.mpComm.setLocalVideoElement(g.app.videoChatPanel.localVideo);

                if (device) {
                    mediaConstraint.setVideoDevice(device);
                }
            }
            else {
                // 设置媒体容器
                cube.mpComm.setRemoteVideoElement(g.app.voiceCallPanel.remoteVideo);
                cube.mpComm.setLocalVideoElement(g.app.voiceCallPanel.localVideo);

                if (device) {
                    mediaConstraint.setAudioDevice(device);
                }
            }

            // 发起通话
            return cube.mpComm.makeCall(target, mediaConstraint, callback);
        }
        else if (target instanceof Group) {
            if (videoEnabled) {
                mediaConstraint.setVideoDimension(VideoDimension.VGA_IDEAL);

                cube.mpComm.setLocalVideoElement(g.app.videoGroupChatPanel.localVideo);

                if (device) {
                    mediaConstraint.setVideoDevice(device);
                }
            }
            else {
                cube.mpComm.setLocalVideoElement(g.app.voiceGroupCallPanel.localVideo);

                if (device) {
                    mediaConstraint.setAudioDevice(device);
                }
            }

            // 发起通话
            return cube.mpComm.makeCall(target, mediaConstraint, callback);
        }
        else {
            return false;
        }
    }

    /**
     * 应答通话请求。
     */
    CallController.prototype.answerCall = function() {
        if (!working) {
            return false;
        }

        if (voiceCall) {
            g.app.voiceCallPanel.closeNewCallToast();

            // 设置媒体容器
            cube.mpComm.setRemoteVideoElement(g.app.voiceCallPanel.remoteVideo);
            cube.mpComm.setLocalVideoElement(g.app.voiceCallPanel.localVideo);

            // 只使用音频通道
            var mediaConstraint = new MediaConstraint(false, true);
            if (cube.mpComm.answerCall(mediaConstraint)) {
                g.app.voiceCallPanel.showAnswer(cube.mpComm.getActiveRecord().getCaller());
                return true;
            }
        }
        else {
            g.app.videoChatPanel.closeNewCallToast();

            // 设置媒体容器
            cube.mpComm.setRemoteVideoElement(g.app.videoChatPanel.remoteVideo);
            cube.mpComm.setLocalVideoElement(g.app.videoChatPanel.localVideo);

            // 只使用音频通道
            var mediaConstraint = new MediaConstraint(true, true);
            if (cube.mpComm.answerCall(mediaConstraint)) {
                g.app.videoChatPanel.showAnswer(cube.mpComm.getActiveRecord().getCaller());
                return true;
            }
        }

        return false;
    }

    /**
     * 挂断通话或拒绝通话请求。
     */
    CallController.prototype.hangupCall = function() {
        if (!working) {
            return false;
        }

        working = false;

        if (!cube.mpComm.hangupCall()) {
            console.log('CallController : 终止通话时发生错误。');
        }

        if (groupCall) {
            if (voiceCall) {
                g.app.voiceGroupCallPanel.close();
            }
            else {
                g.app.videoGroupChatPanel.close();
            }
        }
        else {
            if (voiceCall) {
                g.app.voiceCallPanel.close();
                g.app.voiceCallPanel.closeNewCallToast();
            }
            else {
                g.app.videoChatPanel.close();
                g.app.videoChatPanel.closeNewCallToast();
            }
        }

        return true;
    }

    /**
     * 接受当前群组通话邀请。
     */
    CallController.prototype.acceptInvitation = function() {
        if (inviteeTimer > 0) {
            clearTimeout(inviteeTimer);
            inviteeTimer = 0;
        }

        var commField = cube.mpComm.getActiveRecord().field;

        if (commField.mediaConstraint.videoEnabled) {
            g.app.videoGroupChatPanel.closeInviteToast();
            g.app.videoGroupChatPanel.open(commField.group);
        }
        else {
            g.app.voiceGroupCallPanel.closeInviteToast();
            g.app.voiceGroupCallPanel.open(commField.group);
        }
    }

    /**
     * 拒绝当前群组通话邀请。
     */
    CallController.prototype.rejectInvitation = function() {
        if (inviteeTimer > 0) {
            clearTimeout(inviteeTimer);
            inviteeTimer = 0;
        }

        var commField = cube.mpComm.getActiveRecord().field;

        if (commField.mediaConstraint.videoEnabled) {
            g.app.videoGroupChatPanel.closeInviteToast();
        }
        else {
            g.app.voiceGroupCallPanel.closeInviteToast();
        }
    }

    /**
     * 是否开启了摄像机。
     * @returns {boolean}
     */
    CallController.prototype.isCameraOpened = function() {
        var field = g.cube().mpComm.getActiveField();
        if (null == field) {
            return false;
        }

        var rtcDevice = field.getRTCDevice();
        if (null == rtcDevice) {
            return false;
        }

        return rtcDevice.outboundVideoEnabled();
    }

    /**
     * 开关摄像机设备。
     */
    CallController.prototype.toggleCamera = function() {
        var field = cube.mpComm.getActiveField();
        if (null == field) {
            console.debug('CallController - #toggleCamera() field is null');
            return true;
        }

        var rtcDevice = field.getRTCDevice();
        if (null == rtcDevice) {
            console.debug('CallController - #toggleCamera() rtcDevice is null');
            return true;
        }

        if (rtcDevice.outboundVideoEnabled()) {
            rtcDevice.enableOutboundVideo(false);
        }
        else {
            rtcDevice.enableOutboundVideo(true);
        }
        return rtcDevice.outboundVideoEnabled();
    }

    /**
     * 麦克风是否已开启。
     * @returns {boolean}
     */
    CallController.prototype.isMicrophoneOpened = function() {
        var field = g.cube().mpComm.getActiveField();
        if (null == field) {
            return false;
        }

        var rtcDevice = field.getRTCDevice();
        if (null == rtcDevice) {
            return false;
        }

        return rtcDevice.outboundAudioEnabled();
    }

    /**
     * 开关麦克风设备。
     */
    CallController.prototype.toggleMicrophone = function() {
        var field = cube.mpComm.getActiveField();
        if (null == field) {
            console.debug('CallController - #toggleMicrophone() field is null');
            return true;
        }

        var rtcDevice = field.getRTCDevice();
        if (null == rtcDevice) {
            console.debug('CallController - #toggleMicrophone() rtcDevice is null');
            return true;
        }

        if (rtcDevice.outboundAudioEnabled()) {
            rtcDevice.enableOutboundAudio(false);
        }
        else {
            rtcDevice.enableOutboundAudio(true);
        }
        return rtcDevice.outboundAudioEnabled();
    }

    /**
     * 扬声器是否未静音。
     * @returns {boolean}
     */
    CallController.prototype.isUnmuted = function() {
        var field = g.cube().mpComm.getActiveField();
        if (null == field) {
            return false;
        }

        var rtcDevice = field.getRTCDevice();
        if (null == rtcDevice) {
            return false;
        }

        var vol = rtcDevice.getVolume();
        return (vol > 0);
    }

    /**
     * 开关扬声器设备。
     */
    CallController.prototype.toggleLoudspeaker = function() {
        var field = cube.mpComm.getActiveField();
        if (null == field) {
            console.debug('CallController - #toggleLoudspeaker() field is null');
            return true;
        }

        var rtcDevice = field.getRTCDevice();
        if (null == rtcDevice) {
            console.debug('CallController - #toggleLoudspeaker() rtcDevice is null');
            return true;
        }

        var vol = rtcDevice.getVolume();
        console.debug('CallController - #toggleLoudspeaker() volume is ' + vol);
        if (vol > 0) {
            volume = vol;
            rtcDevice.setVolume(0);
            return false;
        }
        else {
            rtcDevice.setVolume(volume);
            return true;
        }
    }

    g.CallController = CallController;

})(window);
