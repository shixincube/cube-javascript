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

/**
 * 语音通话面板。
 */
(function(g) {
    'use strict'

    var VoiceCallPanel = function(el) {
        this.el = el;

        this.elPeerAvatar = el.find('img[data-target="avatar"]');
        this.elPeerName = el.find('span[data-target="name"]');
        this.elInfo = el.find('span[data-target="info"]');

        var that = this;

        this.btnHangup = el.find('button[data-target="hangup"]');
        this.btnHangup.on('click', function() {
            that.hangup(that);
        });

        el.draggable({
            handle: ".modal-header"
        });

        el.on('shown.bs.modal', function() {
        });
    }

    VoiceCallPanel.prototype.show = function(target) {
        console.log('语音通话 ' + target.getId());

        this.elPeerAvatar.attr('src', target.getContext().avatar);
        this.elPeerName.text(target.getName());
        this.elInfo.text('正在呼叫...');

        this.el.modal({
            keyboard: false,
            backdrop: false
        });
    }

    VoiceCallPanel.prototype.close = function() {
        this.el.modal('hide');
    }

    VoiceCallPanel.prototype.hangup = function() {
        this.close();
    }

    g.VoiceCallPanel = VoiceCallPanel;

})(window);
