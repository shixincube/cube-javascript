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

    var btnSelectAll = null;

    var btnUpload = null;
    var btnNewDir = null;
    var btnEmptyTrash = null;
    var btnRestore = null;
    var btnParent = null;
    var btnRecycle = null;

    var infoLoaded = 0;
    var infoTotal = 0;

    var btnPrev = null;
    var btnNext = null;

    var table = null;

    var rootDir = null;
    var currentDir = null;
    var currentPage = {
        page: 0,
        loaded: 0
    };
    var currentFilter = null;

    var selectedSearch = false;
    var selectedRecycleBin = false;

    /**
     * 我的文件主界面的文件表格面板。
     * @param {jQuery} el 界面元素。
     */
    var FilesPanel = function(el) {
        panelEl = el;
        table = new FilesTable(el.find('.table-files'));

        btnSelectAll = el.find('.checkbox-toggle');
        btnUpload = el.find('button[data-target="upload"]');
        btnEmptyTrash = el.find('button[data-target="empty-trash"]');
        btnRestore = el.find('button[data-target="restore"]');
        btnNewDir = el.find('button[data-target="new-dir"]');
        btnParent = el.find('button[data-target="parent"]');
        btnRecycle = el.find('button[data-target="recycle"]');

        infoLoaded = el.find('.info-loaded');
        infoTotal = el.find('.info-total');

        btnPrev = el.find('button[data-target="prev"]');
        btnPrev.attr('disabled', 'disabled');
        btnNext = el.find('button[data-target="next"]');
        btnNext.attr('disabled', 'disabled');

        that = this;

        this.initUI();
    }

    /**
     * 初始化 UI 。
     * @private
     */
    FilesPanel.prototype.initUI = function() {
        // 全选按钮
        btnSelectAll.click(function () {
            var clicks = $(this).data('clicks');
            if (clicks) {
                // Uncheck all checkboxes
                $('.table-files input[type="checkbox"]').prop('checked', false);
                $('.checkbox-toggle .far.fa-check-square').removeClass('fa-check-square').addClass('fa-square');
            }
            else {
                // Check all checkboxes
                $('.table-files input[type="checkbox"]').prop('checked', true);
                $('.checkbox-toggle .far.fa-square').removeClass('fa-square').addClass('fa-check-square');
            }
            $(this).data('clicks', !clicks);
        });

        // 上传文件
        btnUpload.click(function() {
            window.cube().launchFileSelector(function(event) {
                let file = event.target.files[0];
                currentDir.uploadFile(file, function(fileAnchor) {
                    // 正在加载
                }, function(dir, fileLabel) {
                    that.refreshTable(true);
                }, function(error) {

                });
            });
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

        // 清空回收站
        btnEmptyTrash.click(function() {
            g.dialog.showConfirm('清空回收站', '您确认清空回收站吗？<p class="text-danger tip">清空回收站将删除回收站内的所有文件，不可恢复！</p>', function(ok) {
                if (ok) {
                    window.cube().fs.emptyTrash(function(root) {
                        that.showRecyclebin();
                    }, function(error) {
                        g.dialog.launchToast(Toast.Error, '清空回收站失败: ' + error.code);
                    });
                }
            }, '清空回收站');
        });

        // 恢复文件
        btnRestore.click(function() {
            var idList = [];
            var list = panelEl.find('.table-files input[type="checkbox"]');
            for (var i = 0; i < list.length; ++i) {
                var el = $(list.get(i));
                if (el.prop('checked')) {
                    idList.push(parseInt(el.attr('id')));
                }
            }

            if (idList.length == 0) {
                return;
            }

            window.cube().fs.restoreTrash(idList, function(root, result) {
                // 刷新回收站数据
                that.showRecyclebin();
                // 重置根目录分页数据
                app.filesCtrl.resetPageData(root);
            }, function(error) {
                g.dialog.launchToast(Toast.Error, '清空回收站失败: ' + error.code);
            });
        });

        // 上一级/回到父目录
        btnParent.click(function() {
            if (currentDir == rootDir) {
                return;
            }

            var parent = currentDir.getParent();
            that.changeDirectory(parent);
        });

        // 删除文件或文件夹
        btnRecycle.click(function() {
            var result = [];
            var list = panelEl.find('.table-files input[type="checkbox"]');
            for (var i = 0; i < list.length; ++i) {
                var el = $(list.get(i));
                if (el.prop('checked')) {
                    result.push({
                        id: parseInt(el.attr('id')),
                        type: el.attr('data-type')
                    });
                }
            }

            if (result.length == 0) {
                return;
            }

            var text = null;

            if (selectedRecycleBin) {
                var idList = [];
                result.forEach(function(item) {
                    idList.push(item.id);
                });

                text = ['您确定要删除所选择的“<span class="text-danger">', idList.length, '</span>”个项目吗？',
                    '<p class="text-danger tip">将立即删除此项目。您不能撤销此操作。</p>'];

                g.dialog.showConfirm('立即删除', text.join(''), function(ok) {
                    if (ok) {
                        // 抹除指定文件
                        window.cube().fs.eraseTrash(idList, function(root) {
                            that.showRecyclebin();
                        }, function(error) {
                            g.dialog.launchToast(Toast.Error, '删除文件失败: ' + error.code);
                        });
                    }
                }, '立即删除');
            }
            else {
                if (result.length == 1) {
                    var name = '';
                    var item = currentDir.getDirectory(result[0].id);
                    if (null == item) {
                        item = currentDir.getFile(result[0].id);
                        name = item.getFileName();
                    }
                    else {
                        name = item.getName();
                    }
                    text = ['您确定要删除', result[0].type == 'folder' ? '文件夹' : '文件', '“<span class="text-danger">', name, '</span>”吗？'];
                }
                else {
                    text = ['您确定要删除所选择的<b>', result.length, '</b>个项目吗？'];
                }

                g.dialog.showConfirm('删除文件', text.join(''), function(ok) {
                    if (ok) {
                        var dirList = [];
                        var fileList = [];
                        result.forEach(function(item) {
                            if (item.type == 'folder') {
                                dirList.push(item.id);
                            }
                            else {
                                fileList.push(item.id);
                            }
                        });

                        var dirCompleted = dirList.length == 0 ? true : false;
                        var fileCompleted = fileList.length == 0 ? true : false;

                        currentDir.deleteDirectory(dirList, true, function(workingDir, resultList) {
                            dirCompleted = true;
                            if (fileCompleted) {
                                that.refreshTable(true);
                            }
                        }, function(error) {
                            g.dialog.launchToast(Toast.Error, '删除文件夹失败: ' + error.code);
                        });

                        currentDir.deleteFile(fileList, function(workingDir, resultList) {
                            fileCompleted = true;
                            if (dirCompleted) {
                                that.refreshTable(true);
                            }
                        }, function(error) {
                            g.dialog.launchToast(Toast.Error, '删除文件失败: ' + error.code);
                        });
                    }
                }, '删除');
            }
        });

        // 上一页
        btnPrev.click(function() {
            if (selectedRecycleBin) {

            }
            else if (selectedSearch) {
                if (currentFilter.begin == 0) {
                    return;
                }

                currentFilter.end = currentFilter.begin;
                currentFilter.begin = currentFilter.begin - g.app.filesCtrl.numPerPage;

                if (currentFilter.begin == 0) {
                    btnPrev.attr('disabled', 'disabled');
                }

                // 搜索文件
                window.cube().fs.searchFile(currentFilter, function(filter, list) {
                    if (list.length < g.app.filesCtrl.numPerPage) {
                        btnNext.attr('disabled', 'disabled');

                        if (list.length == 0) {
                            return;
                        }
                    }

                    table.updatePage(list);
                    infoLoaded.text(list.length);

                    btnNext.removeAttr('disabled');
                }, function(error) {
                    g.dialog.launchToast(Toast.Error, '过滤文件错误: ' + error.code);
                });
            }
            else {
                if (currentPage.page == 0) {
                    return;
                }

                currentPage.page -= 1;
                if (currentPage.page == 0) {
                    btnPrev.attr('disabled', 'disabled');
                }

                that.refreshTable();

                btnNext.removeAttr('disabled');
            }
        });

        // 下一页
        btnNext.click(function() {
            if (selectedRecycleBin) {

            }
            else if (selectedSearch) {
                currentFilter.begin = currentFilter.end;
                currentFilter.end = currentFilter.end + g.app.filesCtrl.numPerPage;

                // 搜索文件
                window.cube().fs.searchFile(currentFilter, function(filter, list) {
                    if (list.length < g.app.filesCtrl.numPerPage) {
                        btnNext.attr('disabled', 'disabled');

                        if (list.length == 0) {
                            currentFilter.end = currentFilter.end - g.app.filesCtrl.numPerPage;
                            currentFilter.begin = currentFilter.end - g.app.filesCtrl.numPerPage;
                            return;
                        }
                    }

                    btnPrev.removeAttr('disabled');

                    table.updatePage(list);
                    infoLoaded.text(list.length);
                }, function(error) {
                    g.dialog.launchToast(Toast.Error, '过滤文件错误: ' + error.code);
                });
            }
            else {
                g.app.filesCtrl.getPageData(currentDir, currentPage.page + 1, function(result) {
                    if (null == result) {
                        // 没有新数据
                        btnNext.attr('disabled', 'disabled');

                        if (currentPage.page != 0) {
                            btnPrev.removeAttr('disabled');
                        }

                        g.dialog.launchToast(Toast.Info, '没有更多数据');
                    }
                    else {
                        currentPage.page += 1;
                        that.refreshTable();
                    }
                });
            }
        });
    }

    /**
     * 设置标题。
     * @param {string} title 标题。
     */
    FilesPanel.prototype.setTitle = function(title) {
        panelEl.find('.fp-title').text(title);
    }

    /**
     * 更新标题里的路径信息。
     */
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

    /**
     * 向上递归（递归父目录）所有目录，并依次保存到列表里。
     * @param {Array} list 列表。
     * @param {Directory} dir 起始目录。
     */
    FilesPanel.prototype.recurseParent = function(list, dir) {
        var parent = dir.getParent();
        if (null == parent) {
            return;
        }

        list.push(dir);
        this.recurseParent(list, parent);
    }

    /**
     * 使用当前目录数据刷新表格。
     * @param {boolean} reset 是否重置当前目录。
     */
    FilesPanel.prototype.refreshTable = function(reset) {
        if (reset) {
            g.app.filesCtrl.resetPageData(currentDir);
        }

        g.app.filesCtrl.getPageData(currentDir, currentPage.page, function(result) {
            if (null == result) {
                btnNext.attr('disabled', 'disabled');
                table.updatePage([]);
                infoLoaded.text(0);
                infoTotal.text(0);
                return;
            }

            // 更新表格
            table.updatePage(result);

            // 当前加载的数量
            currentPage.loaded = result.length;

            // 更新数量信息
            infoLoaded.text(currentPage.page * g.app.filesCtrl.numPerPage + result.length);
            infoTotal.text(currentDir.totalDirs() + currentDir.totalFiles());

            // 判断下一页
            if (currentPage.loaded < g.app.filesCtrl.numPerPage) {
                btnNext.attr('disabled', 'disabled');
            }
            else {
                btnNext.removeAttr('disabled');
            }
        });

        // 判断上一页
        if (currentPage.page == 0) {
            btnPrev.attr('disabled', 'disabled');
        }
        else {
            btnPrev.removeAttr('disabled');
        }

        // 判断下一页
        if (currentPage.loaded < g.app.filesCtrl.numPerPage) {
            btnNext.attr('disabled', 'disabled');
        }
        else {
            btnNext.removeAttr('disabled');
        }
    }

    /**
     * 显示根目录。
     */
    FilesPanel.prototype.showRoot = function() {
        selectedSearch = false;
        selectedRecycleBin = false;

        if (null == currentDir) {
            g.app.filesCtrl.getRoot(function(root) {
                rootDir = root;
                currentDir = root;
                that.showRoot();
            });
            return;
        }

        btnUpload.css('display', 'inline-block');
        btnNewDir.css('display', 'inline-block');
        btnParent.css('display', 'block');
        btnEmptyTrash.css('display', 'none');
        btnRestore.css('display', 'none');

        this.refreshTable();

        this.updateTitlePath();
    }

    /**
     * 显示图片文件
     */
    FilesPanel.prototype.showImages = function() {
        selectedSearch = true;
        selectedRecycleBin = false;
        btnEmptyTrash.css('display', 'none');
        btnRestore.css('display', 'none');

        panelEl.find('.fp-path').html('');
        btnUpload.css('display', 'none');
        btnNewDir.css('display', 'none');
        btnParent.css('display', 'none');
        btnPrev.attr('disabled', 'disabled');
        btnNext.attr('disabled', 'disabled');

        currentFilter = {
            begin: 0,
            end: g.app.filesCtrl.numPerPage,
            type: ['jpg', 'png', 'gif', 'bmp']
        };

        // 搜索文件
        window.cube().fs.searchFile(currentFilter, function(filter, list) {
            table.updatePage(list);
            infoLoaded.text(list.length);

            if (list.length == g.app.filesCtrl.numPerPage) {
                btnNext.removeAttr('disabled');
            }
        }, function(error) {
            g.dialog.launchToast(Toast.Error, '过滤图片文件: ' + error.code);
        });

        infoTotal.text('--');
    }

    /**
     * 显示文档文件。
     */
    FilesPanel.prototype.showDocuments = function() {
        selectedSearch = true;
        selectedRecycleBin = false;
        btnEmptyTrash.css('display', 'none');
        btnRestore.css('display', 'none');

        panelEl.find('.fp-path').html('');
        btnUpload.css('display', 'none');
        btnNewDir.css('display', 'none');
        btnParent.css('display', 'none');
        btnPrev.attr('disabled', 'disabled');
        btnNext.attr('disabled', 'disabled');

        currentFilter = {
            begin: 0,
            end: g.app.filesCtrl.numPerPage,
            type: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
                'docm', 'dotm', 'dotx', 'ett', 'xlsm', 'xlt', 'dpt',
                'ppsm', 'ppsx', 'pot', 'potm', 'potx', 'pps', 'ptm']
        };

        // 搜索文件
        window.cube().fs.searchFile(currentFilter, function(filter, list) {
            table.updatePage(list);
            infoLoaded.text(list.length);

            if (list.length == g.app.filesCtrl.numPerPage) {
                btnNext.removeAttr('disabled');
            }
        }, function(error) {
            g.dialog.launchToast(Toast.Error, '过滤文档文件: ' + error.code);
        });

        infoTotal.text('--');
    }

    /**
     * 显示回收站。
     */
    FilesPanel.prototype.showRecyclebin = function() {
        selectedSearch = false;
        selectedRecycleBin = true;
        btnEmptyTrash.css('display', 'inline-block');
        btnRestore.css('display', 'inline-block');

        panelEl.find('.fp-path').html('');
        btnUpload.css('display', 'none');
        btnNewDir.css('display', 'none');
        btnParent.css('display', 'none');
        btnPrev.attr('disabled', 'disabled');
        btnNext.attr('disabled', 'disabled');

        window.cube().fs.listTrash(0, 20, function(root, list, begin, end) {
            table.updatePage(list, true);
            infoLoaded.text(list.length);
            infoTotal.text('--');
        }, function(error) {
            g.dialog.launchToast(Toast.Error, '读取回收站数据错误: ' + error.code);
            table.updatePage([]);
            infoLoaded.text(0);
            infoTotal.text('--');
        });
    }

    /**
     * 切换选择指定 ID 的行。
     * @param {string} id 数据的 ID 。
     */
    FilesPanel.prototype.toggleSelect = function(id) {
        table.toggleSelect(id);
    }

    /**
     * 切换目录。
     * @param {number|Directory} idOrDir 指定切换的目录。
     */
    FilesPanel.prototype.changeDirectory = function(idOrDir) {
        if (selectedRecycleBin || selectedSearch) {
            return;
        }

        var type = (typeof idOrDir);
        if (type == 'number' || type == 'string') {
            var dirId = parseInt(idOrDir);

            if (currentDir.getId() == dirId) {
                return;
            }

            if (dirId == rootDir.getId()) {
                currentDir = rootDir;
            }
            else {
                var dir = currentDir.getDirectory(dirId);
                if (null == dir) {
                    // 从 FS 模块直接查询目录
                    dir = g.cube().fs.querySelfDirectory(dirId);
                }
                currentDir = dir;
            }

            table.unselect(dirId);
        }
        else {
            if (idOrDir == currentDir) {
                return;
            }

            currentDir = idOrDir;
        }

        // 刷新列表
        this.refreshTable();

        this.updateTitlePath();
    }

    /**
     * 使用默认方式打开文件。
     * @param {string} fileCode 文件码。
     * @param {number} directoryId 文件所在的目录 ID 。
     */
    FilesPanel.prototype.openFile = function(fileCode, directoryId) {
        var fileLabel = null;
        var directory = null;

        if (selectedRecycleBin) {
        }
        else if (selectedSearch) {
            var searchItem = window.cube().fs.querySearch(directoryId, fileCode);
            if (null != searchItem) {
                directory = searchItem.directory;
                fileLabel = searchItem.file;
            }
        }
        else {
            directory = currentDir;
            fileLabel = directory.getFile(fileCode);
        }

        if (null == fileLabel) {
            return;
        }

        var type = fileLabel.getFileType();
        if (type == 'png' || type == 'jpeg' || type == 'gif' || type == 'jpg' || type == 'bmp') {
            table.unselect(fileCode);
            g.dialog.showImage(fileLabel);
        }
        else {
            table.unselect(fileCode);
            g.app.fileDetails.open(fileLabel, directory);
        }
    }

    /**
     * 打开对应文件的文件详情界面。
     * @param {stirng} fileCode 文件码。
     */
    FilesPanel.prototype.openFileDetails = function(fileCode) {
        if (selectedRecycleBin) {
            return;
        }
        else if (selectedSearch) {
            return;
        }

        var fileLabel = currentDir.getFile(fileCode);
        if (null == fileLabel) {
            return;
        }

        table.unselect(fileCode);
        g.app.fileDetails.open(fileLabel, currentDir);
    }

    /**
     * 在当前表格里插入新的目录。
     * @param {string} dirName 新目录的名称。
     */
    FilesPanel.prototype.newDirectory = function(dirName) {
        g.dialog.launchToast(Toast.Info, '新建文件夹“' + dirName + '”');
        currentDir.newDirectory(dirName, function(newDir) {
            table.insertFolder(newDir);
            // 重置分页数据
            g.app.filesCtrl.resetPageData(currentDir);
        }, function(error) {
            g.dialog.launchToast(Toast.Error, '新建文件夹失败: ' + error.code);
        });
    }

    /**
     * 重置“全选”复选框。
     */
    FilesPanel.prototype.resetSelectAllButton = function() {
        btnSelectAll.data('clicks', false);
        $('.checkbox-toggle .far.fa-check-square').removeClass('fa-check-square').addClass('fa-square');
    }

    g.FilesPanel = FilesPanel;

})(window);
