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

    var btnSelectAll = null;
    var btnNewDir = null;

    var infoLoaded = 0;
    var infoTotal = 0;

    var table = null;

    var rootDir = null;
    var currentDir = null;

    var FilesPanel = function(el) {
        panelEl = el;
        table = new FilesTable(el.find('.table-files'));

        btnSelectAll = el.find('.checkbox-toggle');
        btnNewDir = el.find('button[data-target="new-dir"]');

        infoLoaded = el.find('.info-loaded');
        infoTotal = el.find('.info-total');

        that = this;

        this.initUI();
    }

    FilesPanel.prototype.initUI = function() {
        // 全选按钮
        btnSelectAll.click(function () {
            var clicks = $(this).data('clicks');
            if (clicks) {
                // Uncheck all checkboxes
                $('.table-files input[type=\'checkbox\']').prop('checked', false);
                $('.checkbox-toggle .far.fa-check-square').removeClass('fa-check-square').addClass('fa-square');
            }
            else {
                // Check all checkboxes
                $('.table-files input[type=\'checkbox\']').prop('checked', true);
                $('.checkbox-toggle .far.fa-square').removeClass('fa-square').addClass('fa-check-square');
            }
            $(this).data('clicks', !clicks);
        });

        // 新建文件夹
        btnNewDir.click(function() {
            g.dialog.showPrompt('新建文件夹', '请输入新建文件夹的名称', function(state, value) {
                if (state) {
                    var name = value.trim();
                    if (name.length == 0) {
                        alert('文件夹名称不能为空。');
                        return false;
                    }

                    that.newDirectory(name);
                    return true;
                }
            });
        });
    }

    FilesPanel.prototype.setTitle = function(title) {
        panelEl.find('.fp-title').text(title);
    }

    FilesPanel.prototype.updateTitlePath = function() {
        if (null == currentDir) {
            return;
        }

        var dirList = [];
        this.recurseParent(dirList, currentDir);

        var rootActive = (dirList.length == 0) ? ' active' : '';
        var rootEl = (dirList.length == 0) ? '我的文件' :
            '<a href="javascript:app.filesPanel.changeDirectory(\'' + rootDir.getId() + '\');">我的文件</a>';

        var html = ['<ol class="breadcrumb float-sm-right">',
            '<li class="breadcrumb-item', rootActive, '">', rootEl, '</li>'];

        for (var i = 0; i < dirList.length; ++i) {
            var dir = dirList[i];
            html.push('<li class="breadcrumb-item');
            if (i + 1 == dirList.length) {
                html.push(' active');
                html.push('">');
                html.push(dir.getName());
                html.push('</li>');
            }
            else {
                html.push('"><a href="javascript:;">');
                html.push(dir.getName());
                html.push('</a></li>');
            }
        }

        html.push('</ol>');

        panelEl.find('.fp-path').html(html.join(''));
    }

    FilesPanel.prototype.recurseParent = function(list, dir) {
        var parent = dir.getParent();
        if (null == parent) {
            return;
        }

        list.push(dir);
        this.recurseParent(list, parent);
    }

    FilesPanel.prototype.showRoot = function() {
        if (null == currentDir) {
            g.app.filesCtrl.getRoot(function(root) {
                rootDir = root;
                currentDir = root;
                that.showRoot();
            });
            return;
        }

        // test data
        // var now = Date.now();
        // for (var i = 1; i <= 20; ++i) {
        //     var dir = new Directory(null);
        //     dir.id = i;
        //     dir.name = '我是文件夹 ' + i;
        //     dir.lastModified = now + i;
        //     currentDir.addChild(dir);
        // }
        // test data - end

        var tlist = [];
        currentDir.listDirectories(function(dir, list) {
            tlist = tlist.concat(list);

            currentDir.listFiles(0, 20, function(dir, files) {
                tlist = tlist.concat(files);
                // 更新表格
                table.updatePage(currentDir, 0, 20, tlist);

                infoLoaded.text(tlist.length);
                infoTotal.text(currentDir.totalDirs() + currentDir.totalFiles());
            });
        });

        this.updateTitlePath();
    }

    FilesPanel.prototype.select = function(id) {
        table.select(parseInt(id));
    }

    FilesPanel.prototype.changeDirectory = function(id) {
        var dirId = parseInt(id);
        if (currentDir.getId() == dirId) {
            return;
        }

        var dir = currentDir.getDirectory(dirId);
        currentDir = dir;

        // 遍历目录
        var tlist = [];
        currentDir.listDirectories(function(dir, list) {
            tlist = tlist.concat(list);

            currentDir.listFiles(0, 20, function(dir, files) {
                tlist = tlist.concat(files);
                // 更新表格
                table.updatePage(currentDir, 0, 20, tlist);

                infoLoaded.text(tlist.length);
                infoTotal.text(currentDir.totalDirs() + currentDir.totalFiles());
            });
        });

        this.updateTitlePath();
    }

    FilesPanel.prototype.newDirectory = function(dirName) {
        g.dialog.launchToast(Toast.Info, '新建文件夹 "' + dirName + '"');
        currentDir.newDirectory(dirName, function(newDir) {
            table.insertFolder(newDir);
        }, function(error) {
            g.dialog.launchToast(Toast.Error, '新建文件夹失败: ' + error.code);
        });
    }

    FilesPanel.prototype.resetSelectAllButton = function() {
        btnSelectAll.data('clicks', false);
        $('.checkbox-toggle .far.fa-check-square').removeClass('fa-check-square').addClass('fa-square');
    }

    g.FilesPanel = FilesPanel;

})(window);
