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

    function onInProgress(target) {

    }

    function onRinging(event) {
        g.app.voiceCallPanel.tipWaitForAnswer();
    }

    function onConnected(event) {

    }

    function onBye(event) {
        working = false;
    }

    function onNewCall(event) {

    }

    function onTimeout(event) {
        g.app.voiceCallPanel.close();
        g.dialog.launchToast(Toast.Info, '对方无应答');
    }

    function onCallFailed(event) {
        var error = event.data;
        working = false;
        console.log('onCallFailed - ' + error);

        if (error.code == CallState.MediaPermissionDenied) {
            g.app.voiceCallPanel.close();
            g.dialog.launchToast(Toast.Warning, '未能获得麦克风使用权限');
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
        cube.mpComm.on(CallEvent.Timeout, onTimeout);
        cube.mpComm.on(CallEvent.CallFailed, onCallFailed);
    }

    CallController.prototype.callContact = function(target) {
        if (working) {
            return false;
        }

        working = true;

        g.app.voiceCallPanel.terminate = function(panel) {
            cube.mpComm.hangupCall();
            working = false;
        }

        // 只使用音频通道
        var mediaConstraint = new MediaConstraint(false, true);

        cube.mpComm.setRemoteVideoElement(g.app.voiceCallPanel.removeVideo);
        cube.mpComm.setLocalVideoElement(g.app.voiceCallPanel.localVideo);

        cube.mpComm.makeCall(target, mediaConstraint);

        return true;
    }

    g.CallController = CallController;

})(window);
