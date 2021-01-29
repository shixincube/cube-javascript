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

    var FilesPanel = function(el) {
        panelEl = el;
        table = new FilesTable(el.find('.table-files'));

        btnSelectAll = el.find('.checkbox-toggle');
        btnUpload = el.find('button[data-target="upload"]');
        btnEmptyTrash = el.find('button[data-target="empty-trash"]');
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
                        id: el.attr('id'),
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
     * @param {string} title 
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
     * 递归所有目录。
     * @param {Array} list 
     * @param {Directory} dir 
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

        btnEmptyTrash.css('display', 'none');

        if (null == currentDir) {
            g.app.filesCtrl.getRoot(function(root) {
                rootDir = root;
                currentDir = root;
                that.showRoot();
            });
            return;
        }

        btnNewDir.css('display', 'inline-block');
        btnParent.css('display', 'block');

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

        panelEl.find('.fp-path').html('');
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

        panelEl.find('.fp-path').html('');
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

        panelEl.find('.fp-path').html('');
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
     * 选中指定 ID 的表格行。
     * @param {*} id 
     */
    FilesPanel.prototype.select = function(id) {
        table.select(id);
    }

    /**
     * 切换目录。
     * @param {*} idOrDir 
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

    FilesPanel.prototype.openFile = function(fileCode) {
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

        var type = fileLabel.getFileType();
        if (type == 'png' || type == 'jpeg' || type == 'gif' || type == 'jpg' || type == 'bmp') {
            g.dialog.showImage(fileLabel);
        }
        else {
            // TODO
        }
    }

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

    FilesPanel.prototype.resetSelectAllButton = function() {
        btnSelectAll.data('clicks', false);
        $('.checkbox-toggle .far.fa-check-square').removeClass('fa-check-square').addClass('fa-square');
    }

    g.FilesPanel = FilesPanel;

})(window);
