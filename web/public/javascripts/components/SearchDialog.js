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

/**
 * 搜索对话框。
 */
 (function(g) {
    'use strict';

    var SearchDialog = function() {
        var that = this;
        this.el = $('#search_dialog');

        this.overlay = this.el.find('.item-overlay');

        this.input = this.el.find('input[data-target="search-input"]');
        this.input.val('');
        this.input.on('input', function() {
            that.onInputChanged();
        });

        this.resultEl = this.el.find('div[data-target="search-result"]');

        this.submitTimer = 0;
    }

    SearchDialog.prototype.show = function() {
        this.overlay.css('display', 'none');
        this.resultEl.empty();
        this.el.modal('show');
    }

    SearchDialog.prototype.onInputChanged = function() {
        var that = this;
        var value = that.input.val().trim();
        if (value.length == 0) {
            clearTimeout(that.submitTimer);
            that.submitTimer = 0;
            return;
        }

        if (that.submitTimer > 0) {
            clearTimeout(that.submitTimer);
        }
        that.submitTimer = setTimeout(function() {
            clearTimeout(that.submitTimer);
            that.submitTimer = 0;

            value = that.input.val().trim();
            console.log('Search keyword: ' + value);
        }, 1000);
    }

    g.SearchDialog = SearchDialog;
    
 })(window);
