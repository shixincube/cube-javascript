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

    var catalogEl = null;
    var transEl = null;

    var btnAllFiles = null;
    var btnImageFiles = null;
    var btnDocFiles = null;
    var btnRecyclebin = null;

    var activeBtn = null;

    var FilesCatalogue = function(catalogEl, transEl) {
        catalogEl = catalogEl;
        transEl = transEl;

        btnAllFiles = catalogEl.find('#btn_all_files');
        btnImageFiles = catalogEl.find('#btn_image_files');
        btnDocFiles = catalogEl.find('#btn_doc_files');
        btnRecyclebin = catalogEl.find('#btn_recyclebin');

        activeBtn = btnAllFiles;
    }

    FilesCatalogue.prototype.prepare = function() {
        g.app.filesPanel.loadAllFiles();
    }

    FilesCatalogue.prototype.select = function(id) {
        if (activeBtn.attr('id') == id) {
            return;
        }

        activeBtn.removeClass('active');
        // var filter = null;

        if (btnAllFiles.attr('id') == id) {
            activeBtn = btnAllFiles;
            g.app.filesPanel.loadAllFiles();
        }
        else if (btnImageFiles.attr('id') == id) {
            activeBtn = btnImageFiles;
            // filter = ['jpg', 'jpeg', 'png', 'gif'];
        }
        else if (btnDocFiles.attr('id') == id) {
            activeBtn = btnDocFiles;
            // filter = ['pdf', 'doc', 'docm', 'docx', 'dotm', 'dotx', 'ett',
            //     'xls', 'xlsm', 'xlsx', 'xlt', 'dpt', 'ppsm', 'ppsx', 'pot',
            //     'potm', 'potx', 'pps', 'ppt', 'pptm', 'pptx'];
        }
        else if (btnRecyclebin.attr('id') == id) {
            activeBtn = btnRecyclebin;
            // filter = ['recycle'];
        }

        activeBtn.addClass('active');

        // 更新面板
        g.app.filesPanel.setTitle(activeBtn.attr('title'));
    }

    g.FilesCatalogue = FilesCatalogue;

})(window);
