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
    var hideTimer = 0;

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
        clickEmojiHandler({
            "code": el.text().codePointAt(0).toString(16),
            "desc": el.next().text()
        });
    }

    var EmojiPanel = function(clickHandler) {
        that = this;

        clickEmojiHandler = clickHandler;

        panelEl = $('.emoji-panel');
        panelEl.on('mouseover', mouseover);
        panelEl.on('mouseout', mouseout);

        panelEl.find('.emoji').on('mouseover', emojiMouseover);
        panelEl.find('.emoji').on('mouseout', emojiMouseout);
        panelEl.find('.emoji').click(emojiClick);
    }

    EmojiPanel.prototype.show = function(anchorEl) {
        var left = g.getElementLeft(anchorEl[0]);
        var top = g.getElementTop(anchorEl[0]);

        top -= 64 + 42 + 232;

        panelEl.css('left', left + 'px');
        panelEl.css('top', top + 'px');
        panelEl.css('display', 'block');
    }

    EmojiPanel.prototype.hide = function() {
        panelEl.css('display', 'none');
    }

    EmojiPanel.prototype.loadRecent = function() {
        var config = g.app.load.loadConfig('recentEmoji');
        if (null == config) {
            return;
        }

        var tr = panelEl.find('.recent');
        
    }

    EmojiPanel.prototype.appendRecent = function() {

    }

    g.EmojiPanel = EmojiPanel;

})(window);
