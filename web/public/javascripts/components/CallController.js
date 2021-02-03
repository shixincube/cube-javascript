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
    'use strict'

    var cube = null;

    var that = null;

    var working = false;

    var voiceCall = false;

    var volume = 0.7;

    function onInProgress(target) {
    }

    function onRinging(event) {
        if (voiceCall) {
            g.app.voiceCallPanel.tipWaitForAnswer(event.data.getCallee());
        }
        else {
            g.app.videoChatPanel.tipWaitForAnswer(event.data.getCallee());
        }
    }

    function onConnected(event) {
        if (voiceCall) {
            g.app.voiceCallPanel.tipConnected();
        }
        else {
            g.app.videoChatPanel.tipConnected();
        }
    }

    function onMediaConnected(event) {

    }

    function onMediaDisconnected(event) {
        
    }

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

    function onBye(event) {
        var record = event.data;
        working = false;

        // console.log('DEBUG - ' + record.getCaller().getId() + ' -> ' + record.getCallee().getId());

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

    function onCallFailed(event) {
        var error = event.data;
        working = false;
        console.log('onCallFailed - ' + error);

        if (error.code == CallState.MediaPermissionDenied) {
            if (voiceCall) {
                g.dialog.launchToast(Toast.Warning, '未能获得麦克风使用权限');
            }
            else {
                g.dialog.launchToast(Toast.Warning, '未能获得摄像头/麦克风使用权限');
            }
        }
        else {
            g.dialog.launchToast(Toast.Warning, '通话失败，故障码：' + error.code);
        }

        setTimeout(function() {
            if (voiceCall) {
                g.app.voiceCallPanel.close();
                g.app.voiceCallPanel.closeNewCallToast();
            }
            else {
                g.app.videoChatPanel.close();
                g.app.videoChatPanel.closeNewCallToast();
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

        cube.mpComm.on(CallEvent.InProgress, onInProgress);
        cube.mpComm.on(CallEvent.Ringing, onRinging);
        cube.mpComm.on(CallEvent.NewCall, onNewCall);
        cube.mpComm.on(CallEvent.Connected, onConnected);
        cube.mpComm.on(CallEvent.Bye, onBye);
        cube.mpComm.on(CallEvent.Busy, onBusy);
        cube.mpComm.on(CallEvent.Timeout, onTimeout);
        cube.mpComm.on(CallEvent.CallFailed, onCallFailed);
    }

    /**
     * 发起通话请求。
     * @param {Contact} target 
     * @param {boolean} videoEnabled 
     */
    CallController.prototype.makeCall = function(target, videoEnabled) {
        if (working) {
            return false;
        }

        working = true;

        if (videoEnabled) {
            voiceCall = false;

            // 设置媒体容器
            cube.mpComm.setRemoteVideoElement(g.app.videoChatPanel.remoteVideo);
            cube.mpComm.setLocalVideoElement(g.app.videoChatPanel.localVideo);
        }
        else {
            voiceCall = true;

            // 设置媒体容器
            cube.mpComm.setRemoteVideoElement(g.app.voiceCallPanel.remoteVideo);
            cube.mpComm.setLocalVideoElement(g.app.voiceCallPanel.localVideo);
        }

        // 媒体约束
        var mediaConstraint = new MediaConstraint(videoEnabled, true);
        // 发起通话
        return cube.mpComm.makeCall(target, mediaConstraint);
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
                g.app.voiceCallPanel.showAnswerCall(cube.mpComm.getActiveRecord().getCaller());
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
                g.app.videoChatPanel.showAnswerCall(cube.mpComm.getActiveRecord().getCaller());
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

        if (cube.mpComm.hangupCall()) {
            if (voiceCall) {
                g.app.voiceCallPanel.close();
                g.app.voiceCallPanel.closeNewCallToast();
            }
            else {
                g.app.videoChatPanel.close();
                g.app.videoChatPanel.closeNewCallToast();
            }
        }
        else {
            console.error('终止通话时发生错误。');

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
