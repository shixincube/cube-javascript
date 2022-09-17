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

    var maxFileSize = 500 * 1024 * 1024;

    var that = null;

    var panelEl = null;

    var searchBox = null;
    var searchInput = null;
    var searchClear = null;
    var searchButton = null;
    var searchFilter = null;

    var btnSelectAll = null;

    var btnUpload = null;
    var btnNewDir = null;
    var btnEmptyTrash = null;
    var btnRestore = null;
    var btnParent = null;
    var btnRefresh = null;
    var btnRecycle = null;
    var btnShare = null;

    var pageInfoBar = null;

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
    var currentFileList = null;

    // 使用过滤器方式显示数据
    var selectedFilter = false;
    // 显示回收站
    var selectedRecycleBin = false;

    var activeFileLabel = null;
    var dialogCreateSharingTag;
    var switchPreview;
    var switchWatermark;
    var switchDownload;
    var switchDownloadTrace;

    function refreshCreateSharingTagDialogOption(prepare, previewChanged) {
        if (prepare) {
            if (activeFileLabel.isDocumentType()) {
                switchPreview.prop('disabled', false);
                switchPreview.prop('checked', false);
                switchWatermark.prop('disabled', true);
                switchWatermark.prop('checked', false);
                switchDownload.prop('disabled', false);
                switchDownload.prop('checked', true);
                switchDownloadTrace.prop('disabled', false);
                switchDownloadTrace.prop('checked', true);
            }
            else if (activeFileLabel.isImageType()) {
                switchPreview.prop('disabled', false);
                switchPreview.prop('checked', true);
                switchWatermark.prop('disabled', false);
                switchWatermark.prop('checked', true);
                switchDownload.prop('disabled', false);
                switchDownload.prop('checked', true);
                switchDownloadTrace.prop('disabled', false);
                switchDownloadTrace.prop('checked', true);
            }
            else {
                switchPreview.prop('disabled', true);
                switchPreview.prop('checked', false);
                switchWatermark.prop('disabled', true);
                switchWatermark.prop('checked', false);
                switchDownload.prop('disabled', true);
                switchDownload.prop('checked', true);
                switchDownloadTrace.prop('disabled', false);
                switchDownloadTrace.prop('checked', true);
            }
        }
        else {
            if (previewChanged) {
                if (activeFileLabel.isDocumentType() || activeFileLabel.isImageType()) {
                    if (!switchPreview.prop('checked')) {
                        switchWatermark.prop('checked', false);
                        switchWatermark.prop('disabled', true);
                    }
                    else {
                        switchWatermark.prop('checked', activeFileLabel.isImageType());
                        switchWatermark.prop('disabled', false);
                    }
                }

                if (!switchPreview.prop('checked') && !switchDownload.prop('checked')) {
                    switchDownload.prop('checked', true);
                }
            }
            else {
                if (!switchDownload.prop('checked')) {
                    switchDownloadTrace.prop('disabled', true);
                    switchDownloadTrace.prop('checked', true);
                }
                else {
                    switchDownloadTrace.prop('disabled', false);
                    switchDownloadTrace.prop('checked', true);
                }

                if (!switchPreview.prop('checked') && !switchDownload.prop('checked')) {
                    switchPreview.prop('checked', true);
                }
            }
        }
    }

    function refreshPageInfoBar(numLoaded, numTotal) {
        if (undefined !== numTotal) {
            pageInfoBar.text('当前页 ' + numLoaded + ' 个，共 ' + numTotal + ' 个');
        }
        else {
            pageInfoBar.text('当前页 ' + numLoaded + ' 个');
        }
    }

    /**
     * 我的文件主界面的文件表格面板。
     * @param {jQuery} el 界面元素。
     */
    var FilePanel = function(el) {
        panelEl = el;
        table = new FileTable(el.find('.file-table'));

        searchBox = el.find('.file-search-box');
        searchInput = searchBox.find('input');
        searchClear = searchBox.find('.search-input-clear');
        searchButton = searchBox.find('.search-input-submit');

        btnSelectAll = el.find('.checkbox-toggle');
        btnUpload = el.find('button[data-target="upload"]');
        btnEmptyTrash = el.find('button[data-target="empty-trash"]');
        btnRestore = el.find('button[data-target="restore"]');
        btnNewDir = el.find('button[data-target="new-dir"]');
        btnRefresh = el.find('button[data-target="refresh"]');
        btnParent = el.find('button[data-target="parent"]');
        btnRecycle = el.find('button[data-target="recycle"]');
        btnShare = el.find('button[data-target="share"]');

        pageInfoBar = el.find('.load-info');

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
    FilePanel.prototype.initUI = function() {
        dialogCreateSharingTag = $('#create_file_sharing_dialog');
        switchPreview = dialogCreateSharingTag.find('#preview-switch');
        switchPreview.change(function() {
            refreshCreateSharingTagDialogOption(false, true);
        });
        switchWatermark = dialogCreateSharingTag.find('#watermark-switch');
        switchDownload = dialogCreateSharingTag.find('#download-switch');
        switchDownload.change(function() {
            refreshCreateSharingTagDialogOption(false, false);
        });
        switchDownloadTrace = dialogCreateSharingTag.find('#download-trace-switch');

        var inputTimer = 0;
        // 输入框事件
        searchInput.val('');
        searchInput.on('change keyup paste', function(e) {
            if (e.keyCode == 13 && searchInput.val().length > 0) {
                searchClear.css('display', 'inline-block');
                searchInput.blur();
                searchButton.click();
                return;
            }

            if (inputTimer > 0) {
                return;
            }

            inputTimer = setTimeout(function() {
                clearTimeout(inputTimer);
                inputTimer = 0;

                var value = searchInput.val();
                if (value.length > 0) {
                    searchClear.css('display', 'inline-block');
                }
                else {
                    searchClear.css('display', 'none');
                    that.clearSearch();
                }
            }, 100);
        });
        searchClear.click(function() {
            searchInput.val('');
            searchClear.css('display', 'none');
            that.clearSearch();
        });
        searchButton.click(function() {
            that.searchFile();
        });

        // 全选按钮
        btnSelectAll.click(function () {
            var clicked = $(this).prop('checked');
            if (clicked) {
                $('.file-table input[type="checkbox"]').prop('checked', true);
            }
            else {
                $('.file-table input[type="checkbox"]').prop('checked', false);
            }
        });

        // 上传文件
        btnUpload.click(function() {
            if (null == currentDir) {
                g.dialog.toast('文件服务模块未就绪');
                return;
            }

            window.cube().launchFileSelector(function(event) {
                const files = event.target.files;
                if (files[0].size > maxFileSize) {
                    g.dialog.showAlert('为了文档分享体验更加便捷，我们不建议分享超过 500MB 大小的文件。');
                    return;
                }

                currentDir.uploadFile(files[0], function(fileAnchor) {
                    // 回调启动上传
                    g.app.fileCatalog.onFileUpload(fileAnchor);
                }, function(fileAnchor) {
                    // 正在上传
                    g.app.fileCatalog.onFileUploading(fileAnchor);
                }, function(dir, fileLabel) {
                    // 已上传
                    g.app.fileCatalog.onFileUploaded(dir, fileLabel);
                    that.refreshTable(true);
                }, function(error) {
                    g.dialog.toast('上传文件失败：' + error.code, Toast.Error);
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
            var list = panelEl.find('.file-table input[type="checkbox"]');
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
                app.fileCtrl.resetPageData(root);
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

        // 刷新当前页
        btnRefresh.click(function() {
            g.dialog.showLoading('正在刷新数据……');

            that.refreshTable(false, function() {
                g.dialog.hideLoading();
            });

            btnSelectAll.prop('checked', false);
        });

        // 删除文件或文件夹
        btnRecycle.click(function() {
            var result = [];
            var list = panelEl.find('.file-table input[type="checkbox"]');
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
                    text = ['您确定要删除', result[0].type == 'folder' ? '文件夹' : '文件', ' “<span class="text-danger">', name, '</span>” 吗？'];
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

                        currentDir.deleteFiles(fileList, function(workingDir, resultList) {
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

        // 分享文件
        btnShare.click(function() {
            var result = [];
            var list = panelEl.find('.file-table input[type="checkbox"]');
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
                g.dialog.toast('请选择一个您需要分享的文件。');
                return;
            }
            else if (result.length > 1) {
                g.dialog.toast('请选择一个您需要分享的文件。');
                return;
            }
            else if (result.length == 1) {
                var item = currentDir.getFile(result[0].id);
                if (null == item) {
                    // 不是文件
                    return;
                }

                that.openCreateSharingTagDialog(item);
            }
        });

        // 上一页
        btnPrev.click(function() {
            if (selectedRecycleBin) {
                // TODO
            }
            else if (selectedFilter) {
                if (currentFilter.begin == 0) {
                    return;
                }

                currentFilter.end = currentFilter.begin;
                currentFilter.begin = currentFilter.begin - g.app.fileCtrl.numPerPage;

                if (currentFilter.begin == 0) {
                    btnPrev.attr('disabled', 'disabled');
                }

                // 搜索文件
                window.cube().fs.searchFile(currentFilter, function(filter, list) {
                    if (list.length < g.app.fileCtrl.numPerPage) {
                        btnNext.attr('disabled', 'disabled');

                        if (list.length == 0) {
                            return;
                        }
                    }

                    table.updatePage(list);

                    refreshPageInfoBar(list.length);

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
                // TODO
            }
            else if (selectedFilter) {
                currentFilter.begin = currentFilter.end;
                currentFilter.end = currentFilter.end + g.app.fileCtrl.numPerPage;

                // 搜索文件
                window.cube().fs.searchFile(currentFilter, function(filter, list) {
                    if (list.length < g.app.fileCtrl.numPerPage) {
                        btnNext.attr('disabled', 'disabled');

                        if (list.length == 0) {
                            currentFilter.end = currentFilter.end - g.app.fileCtrl.numPerPage;
                            currentFilter.begin = currentFilter.end - g.app.fileCtrl.numPerPage;
                            return;
                        }
                    }

                    btnPrev.removeAttr('disabled');

                    table.updatePage(list);
                    refreshPageInfoBar(list.length);
                }, function(error) {
                    g.dialog.launchToast(Toast.Error, '过滤文件错误: ' + error.code);
                });
            }
            else {
                g.app.fileCtrl.getPageData(currentDir, currentPage.page + 1, function(result) {
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
     * 隐藏文件数据面板。
     */
    FilePanel.prototype.hide = function() {
        panelEl.css('display', 'none');
        currentFileList = null;
    }

    /**
     * 设置标题。
     * @param {string} title 标题。
     */
    FilePanel.prototype.setTitle = function(title) {
        panelEl.find('.fp-title').text(title);
    }

    /**
     * 更新标题里的路径信息。
     */
    FilePanel.prototype.updateTitlePath = function() {
        if (null == currentDir) {
            return;
        }

        var dirList = [];
        this.recurseParent(dirList, currentDir);

        var rootActive = (dirList.length == 0) ? ' active' : '';
        var rootEl = (dirList.length == 0) ? '我的文件' :
            '<a href="javascript:app.filePanel.changeDirectory(\'' + rootDir.getId() + '\');">我的文件</a>';

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
    FilePanel.prototype.recurseParent = function(list, dir) {
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
     * @param {function} [completion] 完成操作回调。
     */
    FilePanel.prototype.refreshTable = function(reset, completion) {
        if (reset) {
            g.app.fileCtrl.resetPageData(currentDir);
            // 更新空间显示数据
            g.app.fileCatalog.refreshSpaceSize();
        }

        if (!selectedFilter && !selectedRecycleBin) {
            g.app.fileCtrl.getPageData(currentDir, currentPage.page, function(result) {
                if (null == result) {
                    btnNext.attr('disabled', 'disabled');
                    table.updatePage([]);

                    refreshPageInfoBar(0);
    
                    if (completion) {
                        completion.call(null);
                    }
    
                    return;
                }
    
                // 更新表格
                table.updatePage(result);
    
                // 当前加载的数量
                currentPage.loaded = result.length;

                // 更新数量信息
                refreshPageInfoBar(currentPage.page * g.app.fileCtrl.numPerPage + result.length,
                    currentDir.totalDirs() + currentDir.totalFiles());

                // 判断下一页
                if (currentPage.loaded < g.app.fileCtrl.numPerPage) {
                    btnNext.attr('disabled', 'disabled');
                }
                else {
                    btnNext.removeAttr('disabled');
                }
    
                if (completion) {
                    completion.call(null);
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
            if (currentPage.loaded < g.app.fileCtrl.numPerPage) {
                btnNext.attr('disabled', 'disabled');
            }
            else {
                btnNext.removeAttr('disabled');
            }
        }
        else if (selectedRecycleBin) {
            this.showRecyclebin(completion);
        }
        else {
            if (completion) {
                completion(null);
            }
        }
    }

    /**
     * 显示根目录。
     */
    FilePanel.prototype.showRoot = function() {
        btnSelectAll.prop('checked', false);
        panelEl.css('display', 'block');

        // 显示搜索框
        searchBox.css('visibility', 'visible');

        selectedFilter = false;
        selectedRecycleBin = false;
        currentFileList = null;

        if (null == currentDir) {
            g.app.fileCtrl.getRoot(function(root) {
                rootDir = root;
                currentDir = root;
                that.showRoot();
            });
            return;
        }

        btnUpload.css('display', 'inline-block');
        btnNewDir.css('display', 'inline-block');
        btnRefresh.css('display', 'inline-block');
        btnParent.css('display', 'block');
        btnEmptyTrash.css('display', 'none');
        btnRestore.css('display', 'none');

        this.refreshTable();

        this.updateTitlePath();
    }

    /**
     * 显示图片文件
     */
    FilePanel.prototype.showImages = function() {
        btnSelectAll.prop('checked', false);
        panelEl.css('display', 'block');

        // 隐藏搜索框
        searchBox.css('visibility', 'hidden');

        selectedFilter = true;
        selectedRecycleBin = false;
        btnEmptyTrash.css('display', 'none');
        btnRestore.css('display', 'none');

        panelEl.find('.fp-path').html('');
        btnUpload.css('display', 'none');
        btnNewDir.css('display', 'none');
        btnRefresh.css('display', 'none');
        btnParent.css('display', 'none');
        btnPrev.attr('disabled', 'disabled');
        btnNext.attr('disabled', 'disabled');

        currentFilter = {
            begin: 0,
            end: g.app.fileCtrl.numPerPage,
            types: ['jpg', 'png', 'gif', 'bmp']
        };

        // 搜索文件
        window.cube().fs.searchFile(currentFilter, function(filter, list) {
            // 记录文件
            currentFileList = [];
            list.forEach(function(item) {
                currentFileList.push(item.file);
            });

            table.updatePage(list);

            refreshPageInfoBar(list.length);

            if (list.length == g.app.fileCtrl.numPerPage) {
                btnNext.removeAttr('disabled');
            }
        }, function(error) {
            g.dialog.launchToast(Toast.Error, '过滤图片文件: ' + error.code);
        });
    }

    /**
     * 显示文档文件。
     */
    FilePanel.prototype.showDocuments = function() {
        btnSelectAll.prop('checked', false);
        panelEl.css('display', 'block');

        // 隐藏搜索框
        searchBox.css('visibility', 'hidden');

        selectedFilter = true;
        selectedRecycleBin = false;
        currentFileList = null;

        btnEmptyTrash.css('display', 'none');
        btnRestore.css('display', 'none');

        panelEl.find('.fp-path').html('');
        btnUpload.css('display', 'none');
        btnNewDir.css('display', 'none');
        btnRefresh.css('display', 'none');
        btnParent.css('display', 'none');
        btnPrev.attr('disabled', 'disabled');
        btnNext.attr('disabled', 'disabled');

        currentFilter = {
            begin: 0,
            end: g.app.fileCtrl.numPerPage,
            types: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
                'docm', 'dotm', 'dotx', 'ett', 'xlsm', 'xlt', 'dpt',
                'ppsm', 'ppsx', 'pot', 'potm', 'potx', 'pps', 'ptm']
        };

        // 搜索文件
        window.cube().fs.searchFile(currentFilter, function(filter, list) {
            table.updatePage(list);

            refreshPageInfoBar(list.length);

            if (list.length == g.app.fileCtrl.numPerPage) {
                btnNext.removeAttr('disabled');
            }
        }, function(error) {
            g.dialog.launchToast(Toast.Error, '过滤文档文件: ' + error.code);
        });
    }

    /**
     * 显示回收站。
     */
    FilePanel.prototype.showRecyclebin = function(completion) {
        btnSelectAll.prop('checked', false);
        panelEl.css('display', 'block');

        // 隐藏搜索框
        searchBox.css('visibility', 'hidden');

        selectedFilter = false;
        selectedRecycleBin = true;
        currentFileList = null;

        btnEmptyTrash.css('display', 'inline-block');
        btnRestore.css('display', 'inline-block');

        panelEl.find('.fp-path').html('');
        btnUpload.css('display', 'none');
        btnNewDir.css('display', 'none');
        btnRefresh.css('display', 'inline-block');
        btnParent.css('display', 'none');
        btnPrev.attr('disabled', 'disabled');
        btnNext.attr('disabled', 'disabled');

        window.cube().fs.listTrash(0, 19, function(root, list, begin, end) {
            table.updatePage(list);

            refreshPageInfoBar(list.length);

            if (completion) {
                completion(list);
            }
        }, function(error) {
            g.dialog.launchToast(Toast.Error, '读取回收站数据错误: ' + error.code);
            table.updatePage([]);

            refreshPageInfoBar(0);

            if (completion) {
                completion(null);
            }
        });
    }

    /**
     * 切换选择指定 ID 的行。
     * @param {string} id 数据的 ID 。
     */
    FilePanel.prototype.toggleSelect = function(id) {
        table.toggleSelect(id);
    }

    /**
     * 切换目录。
     * @param {number|Directory} idOrDir 指定切换的目录。
     */
    FilePanel.prototype.changeDirectory = function(idOrDir) {
        if (selectedRecycleBin || selectedFilter) {
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
                    dir = g.cube().fs.queryDirectory(dirId);
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

        // 退出搜索模式
        if (null != searchFilter) {
            this.finishSearch();
        }
    }

    /**
     * 使用默认方式打开文件。
     * @param {string} fileCode 文件码。
     * @param {number} directoryId 文件所在的目录 ID 。
     */
    FilePanel.prototype.openFile = function(fileCode, directoryId) {
        var fileLabel = null;
        var directory = null;

        if (selectedRecycleBin) {
            // 回收站里的文件
            //fileLabel = g.cube().fs.queryTrashFile(fileCode);
            return;
        }
        else if (selectedFilter) {
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
            if (null == currentFileList) {
                g.dialog.showImage(fileLabel);
            }
            else {
                var index = 0;
                for (var i = 0; i < currentFileList.length; ++i) {
                    if (currentFileList[i].getFileCode() == fileLabel.getFileCode()) {
                        index = i;
                        break;
                    }
                }
                g.dialog.showImages(currentFileList, index);
            }
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
    FilePanel.prototype.openFileDetails = function(fileCode) {
        if (selectedRecycleBin) {
            return;
        }
        else if (selectedFilter) {
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
    FilePanel.prototype.newDirectory = function(dirName) {
        g.dialog.launchToast(Toast.Info, '新建文件夹“' + dirName + '”');
        currentDir.newDirectory(dirName, function(newDir) {
            table.insertFolder(newDir);
            // 重置分页数据
            g.app.fileCtrl.resetPageData(currentDir);
        }, function(error) {
            g.dialog.launchToast(Toast.Error, '新建文件夹失败: ' + error.code);
        });
    }

    /**
     * 重命名目录。
     * @param {number} dirId 
     */
    FilePanel.prototype.renameDirectory = function(dirId) {
        var dir = g.cube().fs.queryDirectory(dirId);
        if (null == dir) {
            alert('查找目录出错');
            return;
        }

        g.dialog.showPrompt('重命名文件夹', '请输入文件夹 “' + dir.getName() + '” 的新名称：', function(ok, input) {
            if (ok) {
                if (input.length == 0) {
                    g.dialog.launchToast(Toast.Warning, '请输入正确的文件夹名称');
                    return false;
                }
                else if (input == dir.getName()) {
                    g.dialog.launchToast(Toast.Warning, '请输入新的文件夹名称');
                    return false;
                }

                g.dialog.showLoading('重命名文件夹');

                dir.rename(input, function(workingDir) {
                    g.dialog.hideLoading();

                    // 更新目录
                    table.updateFolder(workingDir);
                }, function(error) {
                    g.dialog.hideLoading();

                    g.dialog.launchToast(Toast.Error, '重命名文件夹出错: ' + error.code);
                });

                return true;
            }
        }, dir.getName());
    }

    /**
     * 重命名文件。
     * @param {*} fileName 
     * @param {*} fileCode 
     */
    FilePanel.prototype.renameFile = function(fileName, fileCode) {
        var filename = helper.extractFilename(fileName);
        g.dialog.showPrompt('重命名文件', '请输入文件 “' + fileName + '” 的新名称：', function(ok, input) {
            if (ok) {
                if (input.length == 0) {
                    g.dialog.launchToast(Toast.Warning, '请输入正确的文件名称');
                    return false;
                }
                else if (input == filename) {
                    g.dialog.launchToast(Toast.Warning, '请输入新的文件名称');
                    return false;
                }

                g.dialog.showLoading('重命名文件');

                g.cube().fs.renameFile(currentDir, fileCode, input, function(dir, fileLabel) {
                    g.dialog.hideLoading();

                    // 更新文件行
                    table.updateFile(fileLabel);
                }, function(error) {
                    g.dialog.hideLoading();
                    g.dialog.launchToast(Toast.Error, '重命名文件出错: ' + error.code);
                });

                return true;
            }
        }, filename);
    }

    /**
     * 删除文件夹。
     * @param {number} dirId 
     */
    FilePanel.prototype.promptDeleteDirectory = function(dirId) {
        if (selectedRecycleBin) {
            var trashDir = g.cube().fs.queryTrash(dirId);
            if (null == trashDir) {
                alert('查找废弃目录出错');
                return;
            }

            var text = ['您确定要删除文件夹 ', '“<span class="text-danger">', trashDir.getName(), '</span>” 及该文件夹内的',
                        '<span class="text-danger">全部文件</span>',
                        '吗？<p class="text-danger">该操作不可撤销！</p>'];
            g.dialog.showConfirm('删除文件夹', text.join(''), function(ok) {
                if (ok) {
                    g.dialog.showLoading('删除文件夹');

                    // 删除废弃文件
                    g.cube().fs.eraseTrash([ dirId ], function(root, list) {
                        g.dialog.launchToast(Toast.Success, '已删除文件夹“' + trashDir.getName() + "”");

                        that.refreshTable(true, function() {
                            g.dialog.hideLoading();
                        });
                    }, function(error) {
                        g.dialog.hideLoading();
                        g.dialog.launchToast(Toast.Error, '删除文件夹失败: ' + error.code);
                    });
                }
            }, '删除文件夹');
        }
        else {
            var dir = g.cube().fs.queryDirectory(dirId);
            if (null == dir) {
                alert('查找目录出错');
                return;
            }
    
            var text = ['您确定要删除文件夹 ', '“<span class="text-danger">', dir.getName(), '</span>” 及该文件夹内的',
                        '<span class="text-danger">全部文件</span>',
                        '吗？'];
            g.dialog.showConfirm('删除文件夹', text.join(''), function(ok) {
                if (ok) {
                    currentDir.deleteDirectory([ dir ], true, function(workingDir, resultList) {
                        g.dialog.launchToast(Toast.Success, '已删除文件夹“' + dir.getName() + "”");
    
                        that.refreshTable(true);
                    }, function(error) {
                        g.dialog.launchToast(Toast.Error, '删除文件夹失败: ' + error.code);
                    });
                }
            }, '删除文件夹');
        }
    }

    /**
     * 打开创建文件分享对话框。
     * @param {*} item 
     */
    FilePanel.prototype.openCreateSharingTagDialog = function(item) {
        if (null != app.globalPopover) {
            app.globalPopover.popover('hide');
        }

        var el = dialogCreateSharingTag;

        var show = function(fileLabel) {
            el.find('#file-name').val(fileLabel.getFileName());
            el.find('#file-size').val(g.formatSize(fileLabel.getFileSize()));
            el.find('#sharing-password').val('');

            // 更新选项
            activeFileLabel = fileLabel;
            refreshCreateSharingTagDialogOption(true);

            el.find('button[data-target="confirm"]').click(function() {
                var duration = el.find('#file-sharing-duration').val();
                duration = toDurationLong(duration);

                var password = el.find('#sharing-password').val().trim();
                if (password.length == 0) {
                    password = null;
                }
                else if (password.length != 6) {
                    alert('访问码长度不正确，请输入6位访问码或不输入访问码。');
                    return;
                }

                // 显示遮罩
                el.find('.overlay').css('visibility', 'visible');

                var watermark = null;
                var previewWatermark = switchWatermark.prop('checked');
                if (previewWatermark) {
                    watermark = g.app.account.name;
                    if (g.app.account.phone) {
                        watermark = watermark + "_" + g.app.account.phone.substr(g.app.account.phone.length - 4, 4);
                    }
                }

                // 创建分享标签
                g.engine.fs.createSharingTag(fileLabel, {
                                                            "duration": duration,
                                                            "password": password,
                                                            "preview" : switchPreview.prop('checked'),
                                                            "watermark": watermark,
                                                            "download": switchDownload.prop('checked'),
                                                            "traceDownload": switchDownloadTrace.prop('checked')
                                                        }, (sharingTag) => {
                    el.modal('hide');

                    var url = sharingTag.getURL();
                    var id = sharingTag.id;

                    var html = [
                        '<p>已创建 “', fileLabel.getFileName(), '” 的分享链接：</p>',
                        '<div class="input-group input-group-sm">',
                            '<input id="url_', id, '" type="text" class="form-control" value="', url, '" />',
                            '<span class="input-group-append">',
                                '<button type="button" class="btn btn-default btn-flat alert-clippy-button" title="复制分享链接到剪贴板" data-clipboard-target="#url_', id, '"><i class="fas fa-clipboard"></i></button>',
                            '</span>',
                        '</div>',
                    ];

                    var clipboard = null;

                    g.dialog.showAlert(html.join(''), function() {
                        if (null != clipboard) {
                            clipboard.destroy();
                        }
                    }, '关闭');

                    setTimeout(function() {
                        clipboard = new ClipboardJS('.alert-clippy-button');
                        clipboard.on('success', function() {
                            g.dialog.toast('链接地址已复制到剪贴板', Toast.Success);
                        });
                    }, 500);
                }, (error) => {
                    el.modal('hide');
                });
            });

            el.find('.overlay').css('visibility', 'hidden');
            el.modal('show');
        };

        if (typeof item === 'string') {
            g.cube().fs.getFileLabel(item, function(fileLabel) {
                show(fileLabel);
            }, function(error) {
                g.dialog.toast('未找到文件：' + error.code);
            });
        }
        else {
            show(item);
        }
    }

    /**
     * 提示删除文件。
     * @param {string} fileName 
     * @param {string} fileCode 
     */
    FilePanel.prototype.promptDeleteFile = function(fileName, fileCode) {
        if (selectedRecycleBin) {
            var trashFile = g.cube().fs.queryTrashFile(fileCode);
            if (null == trashFile) {
                return;
            }

            var text = ['您确定要删除文件 ', '“<span class="text-danger">', fileName, '</span>” 吗？',
                        '<p class="text-danger">该操作不可撤销！</p>'];
            g.dialog.showConfirm('删除文件', text.join(''), function(ok) {
                if (ok) {
                    g.dialog.showLoading('删除文件');

                    g.cube().fs.eraseTrash([ trashFile.getId() ], function(root, list) {
                        that.refreshTable(false);
                        g.dialog.hideLoading();
                    }, function(error) {
                        g.dialog.hideLoading();
                        g.dialog.launchToast(Toast.Error, '删除文件失败: ' + error.code);
                    });
                }
            }, '删除');
        }
        else {
            var text = ['您确定要删除文件 ', '“<span class="text-danger">', fileName, '</span>” 吗？'];
            g.dialog.showConfirm('删除文件', text.join(''), function(ok) {
                if (ok) {
                    g.dialog.showLoading('删除文件');

                    currentDir.deleteFiles([ fileCode ], function(workingDir, resultList) {
                        that.refreshTable(true);
                        g.dialog.hideLoading();
                    }, function(error) {
                        g.dialog.hideLoading();
                        g.dialog.launchToast(Toast.Error, '删除文件失败: ' + error.code);
                    });
                }
            }, '删除');
        }
    }

    /**
     * 提示发送文件给联系人。
     * @param {*} fileName 
     * @param {*} fileCode 
     */
    FilePanel.prototype.promptSendFile = function(fileName, fileCode) {
        cube().messaging.getRecentConversations(function(list) {
            if (list.length == 0) {
                g.dialog.toast('您还没有添加任何联系人', Toast.Info);
                return;
            }

            app.contactListDialog.show(list, [], function(selectedList) {

            }, '发送文件', '发送文件“' + fileName + '”给已选择的联系人：', 10);
        });

        /*cube().contact.getDefaultContactZone(function(zone) {
            if (zone.numParticipants() == 0) {
                g.dialog.toast('您还没有添加任何联系人', Toast.Info);
                return;
            }
        }, function(error) {
            g.dialog.toast('获取联系人数据出错：' + error.code, Toast.Error);
        });*/
    }

    /**
     * 提示移动文件。
     * @param {*} fileName 
     * @param {*} fileCode 
     */
    FilePanel.prototype.promptMoveFile = function(fileName, fileCode) {
        g.cube().fs.getSelfRoot(function(root) {
            g.app.folderTreeDialog.open(root, function(directory) {
                if (null != directory) {
                    var dirName = (directory.getName() == 'root') ? '根目录' : directory.getName();

                    g.dialog.showConfirm('移动文件', '是否确认将文件 “' + fileName + '” 移动到目录 “' + dirName + '” 吗？',
                        function(yesOrNo) {
                            if (yesOrNo) {
                                g.dialog.showLoading('正在移动文件');

                                g.cube().fs.moveFile(fileCode, currentDir, directory, function(fileLabel, srcDir, destDir) {
                                    // 关闭对话框
                                    g.app.folderTreeDialog.close();

                                    setTimeout(function() {
                                        g.dialog.hideLoading();

                                        that.refreshTable(true);
                                    }, 100);
                                }, function(error) {
                                    // 关闭对话框
                                    g.app.folderTreeDialog.close();

                                    g.dialog.toast('移动文件失败：' + error.code, Toast.Error);
                                });
                            }
                        });

                    // 不关闭对话框
                    return false;
                }
                else {
                    g.dialog.toast('您没有选择目标文件夹');
                }
            });
        }, function(error) {
            g.dialog.toast('发生错误：' + error, Toast.Error);
        });
    }

    /**
     * 下载文件。
     * @param {string} fileCode 
     */
    FilePanel.prototype.downloadFile = function(fileCode) {
        cube().fs.getFileLabel(fileCode, function(fileLabel) {
            if (fileLabel.getFileSize() < 100 * 1024 * 1024) {
                // 小于 100 MB 文件使用下载器下载
                cube().fs.downloadFile(fileLabel, function(fileLabel, fileAnchor) {
                    // 开始
                    g.app.fileCatalog.onFileDownload(fileLabel, fileAnchor);
                }, function(fileLabel, fileAnchor) {
                    // 下载中
                    g.app.fileCatalog.onFileDownloading(fileLabel, fileAnchor);
                }, function(fileLabel, fileAnchor) {
                    // 下载成功
                    g.app.fileCatalog.onFileDownloaded(fileLabel, fileAnchor);
                }, function(error) {
                    // 下载出错
                    g.dialog.toast('下载文件出错：' + error.code, Toast.Error);
                });
            }
            else {
                // 大于 100 MB 文件
                cube().fs.downloadFileWithHyperlink(fileLabel, function(fileLabel, fileAnchor) {
                    // 开始
                    g.app.fileCatalog.onFileDownload(fileLabel, fileAnchor);
                }, function(fileLabel, fileAnchor) {
                    // 触发 Downloading 事件
                    g.app.fileCatalog.onFileDownloading(fileLabel, fileAnchor);
                }, function(fileLabel, fileAnchor) {
                    // 触发事件
                    g.app.fileCatalog.onFileDownloaded(fileLabel, fileAnchor);
                }, function(error) {
                    g.dialog.toast('下载文件出错：' + error.code, Toast.Error);
                });
            }
        }, function(error) {
            g.dialog.toast('查找文件出错：' + error.code, Toast.Error);
        });
    }

    /**
     * 根据指定关键词搜索文件。
     */
    FilePanel.prototype.searchFile = function() {
        var keyword = searchInput.val();
        if (keyword.length == 0) {
            return;
        }

        // 检索词
        var words = keyword.split(' ');

        g.dialog.showLoading('正在检索目录和文件');

        this.setTitle('搜索结果');

        panelEl.find('.fp-path').html('');
        btnUpload.css('display', 'none');
        btnNewDir.css('display', 'none');
        btnRefresh.css('display', 'none');
        btnParent.css('display', 'inline-block');
        btnPrev.attr('disabled', 'disabled');
        btnNext.attr('disabled', 'disabled');

        searchFilter = {
            begin: 0,
            end: 14,
            nameKeywords: words
        };
        g.cube().fs.searchFile(searchFilter, function(filter, searchItemList) {
            g.dialog.hideLoading();

            if (searchItemList.length == 0) {
                g.dialog.toast('没有找到匹配条件的结果');
                that.clearSearch();
                return;
            }

            // searchItemList.forEach(function(item) {
            //     console.log('Dir: ' + item.isDirectory() + ' - ' + item.directory.getName() +
            //         (item.isDirectory() ? '' : (' - ' + item.file.getFileName())));
            // });

            // 将当前目录设置为根目录
            currentDir = rootDir;

            // 更新表格
            table.updatePage(searchItemList);

            refreshPageInfoBar(searchItemList.length);
        }, function(error) {
            g.dialog.hideLoading();
            g.dialog.toast('检索目录和文件出错：' + error.code, Toast.Error);
        });
    }

    /**
     * 清空搜索。
     */
    FilePanel.prototype.clearSearch = function() {
        if (null != searchFilter) {
            this.setTitle('全部文件');
            // 将当前目录设置为根目录
            currentDir = rootDir;
            this.showRoot();
        }

        searchInput.val('');
        searchFilter = null;
    }

    /**
     * 结束搜索模式。
     */
    FilePanel.prototype.finishSearch = function() {
        this.setTitle('全部文件');
        searchFilter = null;
        searchInput.val('');
        searchClear.css('display', 'none');

        btnUpload.css('display', 'inline-block');
        btnNewDir.css('display', 'inline-block');
        btnRefresh.css('display', 'inline-block');
        btnParent.css('display', 'block');
        btnEmptyTrash.css('display', 'none');
        btnRestore.css('display', 'none');
    }


    function toDurationLong(value) {
        if (value == '24h') {
            return 24 * 60 * 60 * 1000;
        }
        else if (value == '48h') {
            return 48 * 60 * 60 * 1000;
        }
        else if (value == '72h') {
            return 72 * 60 * 60 * 1000;
        }
        else if (value == '7d') {
            return 7 * 24 * 60 * 60 * 1000;
        }
        else if (value == '30d') {
            return 30 * 24 * 60 * 60 * 1000;
        }
        else {
            return 0;
        }
    }

    g.FilePanel = FilePanel;

})(window);
