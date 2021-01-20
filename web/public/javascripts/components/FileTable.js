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

    var FileTable = function(el) {
        this.el = el;
        this.noFileBg = $('#table_files_nofile');
        this.eachPageNum
        this.surfaceA = el.find('tbody[data-target="surface-a"]');
        this.surfaceB = el.find('tbody[data-target="surface-b"]');
    }

    FileTable.prototype.updatePage = function(list) {
        if (list.length == 0) {
            this.noFileBg.css('display', 'block');
            return;
        }

        var html = [];

        list.forEach(function(element) {
            var rowHtml = null;
            if (element instanceof FileLabel) {
                rowHtml = [
                    '<tr><td><div class="icheck-primary">',
                        '<input type="checkbox" value="" id="check_1">',
                            '<label for="check_s1"></label></div></td>',
                        '<td class="file-icon"></td>',
                        '<td class="file-name">我是界面结构测试文件-请忽略我.docx</td>',
                        '<td class="file-size">987.71 MB</td>',
                        '<td class="file-lastmodifed">2021-1-19 18:25:00</td>',
                    '</tr>'
                ];
            }
            else {
                if (element.isHidden()) {
                    return;
                }

                rowHtml = [
                    '<tr><td><div class="icheck-primary">',
                        '<input type="checkbox" value="" id="', element.getId(), '">',
                            '<label for="', element.getId(), '"></label></div></td>',
                        '<td class="file-icon"><i class="ci ci-file-directory"></i></td>',
                        '<td class="file-name">', element.getName(), '</td>',
                        '<td class="file-size">--</td>',
                        '<td class="file-lastmodifed">', g.formatYMDHMS(element.getLastModified()), '</td>',
                    '</tr>'
                ];
            }
            
            html = html.concat(rowHtml);
        });

        if (html.length > 0) {
            this.noFileBg.css('display', 'none');
        }

        this.surfaceA[0].innerHTML = html.join('');
    }

    g.FileTable = FileTable;

})(window);
