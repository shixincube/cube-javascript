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

    var popover = null;

    var panelEl = null;
    var tableEl = null;

    var makeTableRow = function(fileAnchor) {
        return [
            '<tr data-sn="', fileAnchor.sn, '">',
                '<td>', Math.round(fileAnchor.position / fileAnchor.fileSize), '%</td>',
                '<td>', g.formatYMDHMS(Date.now()), '</td>',
                '<td class="file-finish-time">--</td>',
                '<td>', fileAnchor.fileName, '</td>',
                '<td>', g.formatSize(fileAnchor.fileSize), '</td>',
                '<td class="speed-rate">--</td>',
            '</tr>'
        ];
    }

    var FileTransferPanel = function() {
        panelEl = $('.file-trans-panel');
        tableEl = panelEl.find('tbody[data-target="surface"]');

        panelEl.find('a[data-widget="close"]').click(function() {
            popover.popover('hide');
        });
    }

    FileTransferPanel.prototype.show = function(activePopover) {
        popover = activePopover;
        panelEl.css('display', 'block');

        // panelEl.find('.no-data').css('display', 'none');
        // panelEl.find('.file-content').css('display', 'block');
    }

    FileTransferPanel.prototype.hide = function() {
        panelEl.css('display', 'none');
    }

    FileTransferPanel.prototype.fireUploadStart = function(fileAnchor) {
        panelEl.find('.no-data').css('display', 'none');
        panelEl.find('.file-content').css('display', 'block');

        tableEl.append($(makeTableRow(fileAnchor).join('')));
    }

    FileTransferPanel.prototype.fireUploading = function(fileAnchor) {

    }

    FileTransferPanel.prototype.fireUploadEnd = function(folder, fileLabel) {

    }

    g.FileTransferPanel = FileTransferPanel;

})(window);
