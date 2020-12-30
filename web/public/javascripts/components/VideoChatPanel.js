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
 * 视频聊天面板。
 */
(function(g) {
    'use strict'

    var remoteContainer = null;
    var localContainer = null;

    var remoteVideo = null;
    var localVideo = null;

    var mainVideo = null;

    var VideoChatPanel = function(el) {
        this.el = el;
        var that = this;

        el.draggable({
            handle: ".modal-header"
        });

        el.on('shown.bs.modal', function() {
            //el.css('marginLeft', '-320px');
        });

        remoteContainer = el.find('div[data-target="video-remote"]');
        localContainer = el.find('div[data-target="video-local"]');

        remoteContainer.on('click', function(e) {
            if (mainVideo == localVideo) {
                that.switchVideo();
            }
        });

        localContainer.on('click', function(e) {
            if (mainVideo == remoteVideo) {
                that.switchVideo();
            }
        });

        remoteVideo = remoteContainer[0].querySelector('video');
        localVideo = localContainer[0].querySelector('video');

        mainVideo = remoteVideo;
    }

    VideoChatPanel.prototype.show = function(target) {
        console.log('尝试视频连线 ' + target.getId());

        this.el.modal({
            keyboard: false,
            backdrop: false
        });
    }

    VideoChatPanel.prototype.switchVideo = function() {
        if (mainVideo == remoteVideo) {
            remoteContainer.removeClass('video-main');
            localContainer.removeClass('video-pip');

            remoteContainer.addClass('video-pip');
            localContainer.addClass('video-main');

            mainVideo = localVideo;
        }
        else {
            localContainer.removeClass('video-main');
            remoteContainer.removeClass('video-pip');

            localContainer.addClass('video-pip');
            remoteContainer.addClass('video-main');

            mainVideo = remoteVideo;
        }
    }

    g.VideoChatPanel = VideoChatPanel;

})(window);
