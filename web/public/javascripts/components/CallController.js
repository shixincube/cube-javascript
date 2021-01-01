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

(function(g) {
    'use strict'

    var cube = null;

    var that = null;

    var working = false;

    var voiceCall = false;


    function onInProgress(target) {
    }

    function onRinging(event) {
        if (voiceCall) {
            g.app.voiceCallPanel.tipWaitForAnswer();
        }
    }

    function onConnected(event) {
        if (voiceCall) {
            g.app.voiceCallPanel.tipConnected();
        }
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

        if (voiceCall) {
            g.app.voiceCallPanel.close();

            if (record.isCaller()) {
                var recordMessage = new CallRecordMessage(record);
                cube.messaging.sendTo(record.getCallee(), recordMessage);
            }
        }

        var duration = record.getDuration();
        var log = '通话结束 - ' + g.formatClockTick(parseInt(duration / 1000));
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
    }

    function onTimeout(event) {
        if (voiceCall) {
            g.app.voiceCallPanel.close();
            g.app.voiceCallPanel.closeNewCallToast();
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

            }
        }

        if (voiceCall) {
            g.app.voiceCallPanel.close();
            g.app.voiceCallPanel.closeNewCallToast();
        }
    }

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

    CallController.prototype.makeCall = function(target) {
        if (working) {
            return false;
        }

        working = true;

        voiceCall = true;

        // 设置媒体容器
        cube.mpComm.setRemoteVideoElement(g.app.voiceCallPanel.removeVideo);
        cube.mpComm.setLocalVideoElement(g.app.voiceCallPanel.localVideo);

        // 只使用音频通道
        var mediaConstraint = new MediaConstraint(false, true);
        cube.mpComm.makeCall(target, mediaConstraint);

        return true;
    }

    CallController.prototype.answerCall = function() {
        if (!working) {
            return false;
        }

        g.app.voiceCallPanel.closeNewCallToast();

        // 设置媒体容器
        cube.mpComm.setRemoteVideoElement(g.app.voiceCallPanel.removeVideo);
        cube.mpComm.setLocalVideoElement(g.app.voiceCallPanel.localVideo);

        // 只使用音频通道
        var mediaConstraint = new MediaConstraint(false, true);
        return cube.mpComm.answerCall(mediaConstraint);
    }

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
        }
        else {
            alert('拒绝通话发生错误。');
        }

        return true;
    }

    g.CallController = CallController;

})(window);
