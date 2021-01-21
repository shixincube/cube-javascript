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

    var cube = null;

    var selfRoot = null;

    var FilesController = function(cubeEngine) {
        cube = cubeEngine;
    }

    FilesController.prototype.resetFiles = function() {
        var handle = function(dir) {
            g.app.filesPanel.updatePage(dir.getSubdirectories());
        }

        cube.fs.getSelfRoot(function(dir) {
            selfRoot = dir;
            handle(selfRoot);
        }, function(error) {
            console.log(error);
        });

        // test ui
        // var list = [];
        // for (var i = 0; i < 20; ++i) {
        //     var label = new FileLabel(i, 'shixincube.com');
        //     list.push(label);
        // }
        // g.app.filesPanel.updatePage(list);
    }

    FilesController.prototype.getRoot = function(handler) {
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

    FilesController.prototype.getAllFiles = function(pageNum, size, handler) {
        
    }

    g.FilesController = FilesController;

})(window);