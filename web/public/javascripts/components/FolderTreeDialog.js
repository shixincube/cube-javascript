/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020-2022 Cube Team.
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
    'use strict';

    var that = null;

    var dialogEl = null;
    var treeViewEl = null;
    var rootEl = null;

    var selectedEl = null;
    var selectedDirId = 0;

    var loadedDirIdList = [];

    var confirmCallback = null;

    function makeFolderLevel(directory, level) {
        var html = [
            '<li id="d_', directory.getId(), '" class="nav-item foler-tree-level-', level, '" data-level="', level, '">',
                '<a href="javascript:;" onclick="app.folderTreeDialog.selectFolder(', directory.getId(), ',', level,');" id="', directory.getId(), '" class="nav-link">',
                    '<i class="nav-icon fas fa-folder"></i>',
                    '<p>', directory.getName(), '</p>',
                '</a>',
            '</li>'
        ];
        return $(html.join(''));
    }

    function makeFolderSublevel(directory, children, level) {
        var html = [
            '<li id="d_', directory.getId(), '" class="nav-item has-treeview foler-tree-level-', level, '" data-level="', level, '">',
                '<a href="javascript:;" onclick="app.folderTreeDialog.selectFolder(', directory.getId(), ',', level, ');" id="', directory.getId(), '" class="nav-link">',
                    '<i class="nav-icon fas fa-folder"></i>',
                    '<p>',
                        directory.getName(),
                        '<i class="right fas fa-angle-left"></i>',
                    '</p>',
                '</a>',
                '<ul class="nav nav-treeview treeview-menu">'
        ];

        children.forEach(function(child) {
            var childLevel = level + 1;
            var childHtml = [
                '<li id="d_', child.getId(), '" class="nav-item foler-tree-level-', childLevel, '" data-level="', childLevel, '">',
                    '<a href="javascript:;" onclick="app.folderTreeDialog.selectFolder(', child.getId(), ',', childLevel, ');" id="', child.getId(), '" class="nav-link">',
                        '<i class="nav-icon fas fa-folder"></i>',
                        '<p>', child.getName(), '</p>',
                    '</a>',
                '</li>'
            ];

            html = html.concat(childHtml);
        });

        html.push('</ul></li>');
        return $(html.join(''));
    }

    function FolderTreeDialog() {
        that = this;
        dialogEl = $('#modal_folder_tree');
        treeViewEl = dialogEl.find('ul[data-widget="treeview"]');
        rootEl = dialogEl.find('.folder-root');

        dialogEl.find('button[data-target="confirm"]').click(function() {
            var result = true;
            if (null != selectedEl) {
                result = confirmCallback(g.cube().fs.queryDirectory(selectedDirId));
            }
            else {
                result = confirmCallback(null);
            }

            if (undefined === result || result) {
                dialogEl.modal('hide');
            }
        });

        dialogEl.find('a[data-target="root"]').click(function() {
            that.selectRoot();
        });
    }

    FolderTreeDialog.prototype.open = function(root, callback) {
        confirmCallback = callback;

        rootEl.empty();

        dialogEl.find('a[data-target="root"]').removeClass('active');
        selectedEl = null;
        selectedDirId = 0;

        root.listDirectories(function(dir, list) {
            list.forEach(function(item) {
                // 添加 Level 1
                var el = makeFolderLevel(item, 1);
                rootEl.append(el);

                if (loadedDirIdList.indexOf(item.getId()) < 0) {
                    loadedDirIdList.push(item.getId());
                }
            });
        }, function(error) {
            g.dialog.toast('加载目录出错：' + error.code);
        });

        dialogEl.modal('show');
    }

    FolderTreeDialog.prototype.close = function() {
        dialogEl.modal('hide');
    }

    FolderTreeDialog.prototype.selectRoot = function() {
        if (null != selectedEl) {
            selectedEl.removeClass('active');
        }

        selectedEl = dialogEl.find('a[data-target="root"]');
        if (!selectedEl.hasClass('active')) {
            selectedEl.addClass('active');
        }
        g.cube().fs.getSelfRoot(function(dir) {
            selectedDirId = dir.getId();
        }, function(error) {
            g.dialog.toast('加载目录出错：' + error.code);
        });
    }

    FolderTreeDialog.prototype.selectFolder = function(id, level) {
        if (null != selectedEl) {
            selectedEl.removeClass('active');
        }

        selectedDirId = id;
        selectedEl = dialogEl.find('#' + id);
        if (!selectedEl.hasClass('active')) {
            selectedEl.addClass('active');
        }

        // 节点
        var treeNode = selectedEl.parent();

        if (!treeNode.hasClass('has-treeview')) {
            // 读取下一级目录
            var directory = g.cube().fs.queryDirectory(id);
            if (directory.totalDirs() > 0) {
                directory.listDirectories(function(dir, list) {

                    treeNode.addClass('has-treeview');

                    treeNode.replaceWith(makeFolderSublevel(dir, list, level));

                    list.forEach(function(item) {
                        if (loadedDirIdList.indexOf(item.getId()) < 0) {
                            loadedDirIdList.push(item.getId());
                        }
                    });

                    that.updateView();
                }, function(error) {
                    g.dialog.toast('加载目录出错：' + error.code);
                });
            }
        }
    }

    FolderTreeDialog.prototype.updateView = function() {
        //treeViewEl.Treeview({ accordion: false });
        rootEl.css('height', (loadedDirIdList.length * 40) + 'px');
    }

    g.FolderTreeDialog = FolderTreeDialog;

})(window);
