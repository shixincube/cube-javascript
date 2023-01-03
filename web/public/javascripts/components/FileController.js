/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020-2023 Cube Team.
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

    var cube = null;

    var selfRoot = null;

    var folderMap = new OrderMap();

    /**
     * 每页数据条目数。
     * @type {number}
     */
    var numPerPage = 20;

    /**
     * 文件夹描述。
     */
    var Folder = function() {
        this.pages = new OrderMap();
        this.list = [];
        this.fileIndex = 0;
    }

    /**
     * 返回指定页的数据列表。
     * @param {number} page 页码索引。
     * @returns {Array} 返回指定页的数据列表。
     */
    Folder.prototype.get = function(page) {
        return this.pages.get(page);
    }

    /**
     * 添加指定页对应的数据。
     * @param {number} page 页码索引。
     * @param {FileLabel|Directory} data 文件标签或者目录。
     */
    Folder.prototype.append = function(page, data) {
        if (this.contains(data)) {
            return false;
        }

        var pdata = this.pages.get(page);
        if (null == pdata) {
            pdata = [];
            this.pages.put(page, pdata);
        }
        pdata.push(data);
        this.list.push(data);
        return true;
    }

    /**
     * 返回指定页包含的数据数量。
     * @param {number} page 页码索引。
     * @returns {number} 返回指定页包含的数据数量。
     */
    Folder.prototype.size = function(page) {
        var pdata = this.pages.get(page);
        if (null == pdata) {
            return 0;
        }
        return pdata.length;
    }

    /**
     * 当前文件夹是否包含了指定数据。
     * @param {FileLabel|Directory} data 指定数据。
     * @returns {boolean} 如果包含返回 {@linkcode true} 。
     */
    Folder.prototype.contains = function(data) {
        for (var i = 0; i < this.list.length; ++i) {
            var d = this.list[i];
            if (d.getId() == data.getId()) {
                return true;
            }
        }

        return false;
    }


    /**
     * 文件控制器。
     * @param {Cube} cubeEngine 
     */
    var FileController = function(cubeEngine) {
        cube = cubeEngine;
        this.numPerPage = numPerPage;
    }

    /**
     * 就绪。
     */
    FileController.prototype.ready = function() {
        g.app.fileCatalog.prepare();

        // 显示仪表板
        g.app.fileCatalog.select('btn_sharing_dashboard');
    }

    /**
     * 获取当前用户的根目录。
     * @param {function} handler 回调函数，参数：({@linkcode root}:{@link Directory}) 。
     */
    FileController.prototype.getRoot = function(handler) {
        if (null != selfRoot) {
            handler(selfRoot);
            return;
        }

        cube.fs.getSelfRoot(function(dir) {
            selfRoot = dir;
            handler(selfRoot);
        }, function(error) {
            console.log(error);
        });
    }

    /**
     * 重置目录的分页数据。
     * @param {Directory} directory 目录。
     */
    FileController.prototype.resetPageData = function(directory) {
        folderMap.remove(directory.getId());
    }

    /**
     * 获取目录的指定页的数据量。
     * @param {Directory} directory 目录。
     * @param {number} page 页码索引。
     * @returns {number} 返回目录的指定页的数据量。
     */
    FileController.prototype.sizePage = function(directory, page) {
        var folder = folderMap.get(directory.getId());
        if (null == folder) {
            return 0;
        }
        var pageData = folder.get(page);
        if (null == pageData) {
            return 0;
        }
        return pageData.length;
    }

    /**
     * 获取指定目录所在页的分页数据。
     * @param {Directory} directory 目录。
     * @param {number} page 页码索引。
     * @param {function} callback 回调函数。参数：({@linkcode list}:Array<{@link FileLabel}|{@link Directory}>) 。
     */
    FileController.prototype.getPageData = function(directory, page, callback) {
        var folder = folderMap.get(directory.getId());
        if (null == folder) {
            folder = new Folder();
            folderMap.put(directory.getId(), folder);
        }

        var pageData = folder.get(page);
        if (null != pageData) {
            callback(pageData);
            return;
        }

        directory.listDirectories(function(dir, list) {
            if (folder.list.length < list.length) {
                for (var i = 0; i < list.length; ++i) {
                    folder.append(page, list[i]);

                    // 如果当前页数据已填满，停止遍历
                    if (folder.size(page) == numPerPage) {
                        break;
                    }
                }

                pageData = folder.get(page);
                if (null != pageData && pageData.length == numPerPage) {
                    callback(pageData);
                    return;
                }
            }

            // 加载文件数据
            directory.listFiles(folder.fileIndex, folder.fileIndex + numPerPage, function(dir, files) {
                for (var i = 0; i < files.length; ++i) {
                    if (folder.append(page, files[i])) {
                        // 更新索引
                        folder.fileIndex += 1;

                        if (folder.size(page) == numPerPage) {
                            break;
                        }
                    }
                }

                callback(folder.get(page));
            });
        });
    }

    g.FileController = FileController;

})(window);
