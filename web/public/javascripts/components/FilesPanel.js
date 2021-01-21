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

    var that = null;

    var panelEl = null;
    var toolbarEl = null;

    var table = null;

    var currentDir = null;

    var FilesPanel = function(el) {
        panelEl = el;
        table = new FilesTable(el.find('.table-files'));

        that = this;
    }

    FilesPanel.prototype.setTitle = function(title) {
        panelEl.find('.fp-title').text(title);
    }

    FilesPanel.prototype.updateTitlePath = function() {
        if (null == currentDir) {
            return;
        }

        var parentList = [];
        this.recurseParent(parentList, currentDir);

        var html = ['<ol class="breadcrumb float-sm-right">',
            '<li class="breadcrumb-item active"><a href="javascript:;">',
                '我的文件',
            '</li>'];

        parentList.forEach(function(item) {
            html.push('<li class="breadcrumb-item"><a href="javascript:;">');
            html.push(item.getName());
            html.push('</a></li>');
        });

        html.push('</ol>');

        panelEl.find('.fp-path').html(html.join(''));
    }

    FilesPanel.prototype.recurseParent = function(list, child) {
        var parent = child.getParent();
        if (null == parent) {
            return;
        }

        list.push(parent);
        this.recurseParent(list, parent);
    }

    FilesPanel.prototype.loadAllFiles = function() {
        if (null == currentDir) {
            g.app.filesCtrl.getRoot(function(root) {
                currentDir = root;
                that.loadAllFiles();
            });
            return;
        }

        var tlist = [];

        currentDir.listDirectories(function(dir, list) {
            tlist = tlist.concat(list);

            currentDir.listFiles(0, 20, function(dir, files) {
                tlist = tlist.concat(files);

                
            });
        });

        this.updateTitlePath();
    }

    FilesPanel.prototype.updateTable = function(list) {

    }

    g.FilesPanel = FilesPanel;

})(window);
