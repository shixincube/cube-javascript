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

    var that = null;

    var panelEl = null;
    var recentTrEl = null;
    var hideTimer = 0;

    var recentList = null;

    var clickEmojiHandler = null;

    function mouseover() {
        if (hideTimer > 0) {
            clearTimeout(hideTimer);
            hideTimer = 0;
        }
    }

    function mouseout() {
        if (hideTimer > 0) {
            return;
        }

        hideTimer = setTimeout(function() {
            that.hide();
        }, 500);
    }

    function emojiMouseover() {
        var el = $(this);
        el.next().css('display', 'block');
    }
    function emojiMouseout() {
        var el = $(this);
        el.next().css('display', 'none');
    }

    function emojiClick() {
        var el = $(this);
        var data = {
            "code": el.text().codePointAt(0).toString(16),
            "desc": el.next().text()
        };
        clickEmojiHandler(data);

        if (!el.hasClass('recent-emoji')) {
            that.appendRecent(data);
        }
    }

    var EmojiPanel = function(clickHandler) {
        that = this;

        clickEmojiHandler = clickHandler;

        panelEl = $('.emoji-panel');
        panelEl.on('mouseover', mouseover);
        panelEl.on('mouseout', mouseout);
        panelEl.blur(blur);

        panelEl.find('.emoji').on('mouseover', emojiMouseover);
        panelEl.find('.emoji').on('mouseout', emojiMouseout);
        panelEl.find('.emoji').click(emojiClick);

        recentTrEl = panelEl.find('.recent');

        setTimeout(function() {
            that.loadRecent();
        }, 1000);
    }

    EmojiPanel.prototype.show = function(anchorEl) {
        var left = g.getElementLeft(anchorEl[0]);
        var top = g.getElementTop(anchorEl[0]);

        top -= 64 + 42 + 232;

        panelEl.css('left', left + 'px');
        panelEl.css('top', top + 'px');
        panelEl.css('display', 'block');

        if (hideTimer > 0) {
            clearTimeout(hideTimer);
            hideTimer = 0;
        }
    }

    EmojiPanel.prototype.hide = function() {
        panelEl.css('display', 'none');
    }

    EmojiPanel.prototype.tryHide = function() {
        if (hideTimer > 0) {
            clearTimeout(hideTimer);
            hideTimer = 0;
        }

        hideTimer = setTimeout(function() {
            that.hide();
        }, 500);
    }

    EmojiPanel.prototype.loadRecent = function() {
        recentList = g.app.loadConfig('recentEmoji');
        if (null == recentList) {
            recentList = [];
            return;
        }

        for (var i = 0; i < recentList.length; ++i) {
            var value = recentList[i];
            var el = recentTrEl.find('.recent-' + i);
            el.find('.emoji').html('&#x' + value.code + ';');
            el.find('.emoji-desc').html(value.desc);
            el.css('visibility', 'visible');
        }
    }

    EmojiPanel.prototype.appendRecent = function(data) {
        // 不能添加重复的表情，删除已存在的表情
        for (var i = 0; i < recentList.length; ++i) {
            var r = recentList[i];
            if (r.code == data.code) {
                recentList.splice(i, 1);
                break;
            }
        }

        recentList.unshift(data);
        if (recentList.length > 10) {
            recentList.pop();
        }

        for (var i = 0; i < recentList.length; ++i) {
            var value = recentList[i];
            var el = recentTrEl.find('.recent-' + i);
            el.find('.emoji').html('&#x' + value.code + ';');
            el.find('.emoji-desc').html(value.desc);
            el.css('visibility', 'visible');
        }

        for (var i = recentList.length; i < 10; ++i) {
            var el = recentTrEl.find('.recent-' + i);
            el.find('.emoji').html('&nbsp;');
            el.find('.emoji-desc').html('&nbsp;');
            el.css('visibility', 'hidden');
        }

        g.app.saveConfig('recentEmoji', recentList);
    }

    g.EmojiPanel = EmojiPanel;

})(window);
