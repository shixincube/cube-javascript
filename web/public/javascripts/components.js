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

// 对话框组件
(function(g) {
    'use strict';

    /**
     * Toast 提示类型。
     */
    var Toast = {
        Success: 'success',
        Info: 'info',
        Error: 'error',
        Warning: 'warning',
        Question: 'question'
    };

    var toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
    });

    var promptCallback = function() {};

    var confirmCallback = function() {};

    var alertCallback = null;

    var loadingModal = null;
    var loading = false;

    var dialog = {

        /**
         * 获取浏览器内容区域高度。
         */
        getFullHeight: function() {
            return parseInt(document.body.clientHeight) + 57 + 8;
        },

        /**
         * 显示吐司提示。
         * @param {string} type 
         * @param {string} text 
         */
        launchToast: function(type, text) {
            toast.fire({
                icon: type,
                title: text
            });
        },

        /**
         * 显示提示输入框。
         * @param {string} title 标题。
         * @param {string} label 输入内容提示。
         * @param {function} callback 回调函数。回调函数不返回值或者返回 {@linkcode true} 时关闭对话框。
         * @param {string} [prevalue] 预置输入框内的文本。
         */
        showPrompt: function(title, label, callback, prevalue) {
            var el = $('#modal_prompt');
            el.find('.modal-title').text(title);
            el.find('.prompt-label').text(label);

            if (prevalue) {
                el.find('.prompt-input').val(prevalue);
            }
            else {
                el.find('.prompt-input').val('');
            }

            promptCallback = callback;

            el.modal();
        },

        /**
         * 关闭提示输入框。
         * @param {boolean} ok 是否点击了确定按钮。
         */
        closePrompt: function(ok) {
            var el = $('#modal_prompt');
            if (ok) {
                var res = promptCallback(ok, el.find('.prompt-input').val());
                if (undefined === res || res) {
                    el.modal('hide');
                }
            }
            else {
                promptCallback(ok, el.find('.prompt-input').val());
            }
        },

        /**
         * 隐藏提示输入框。
         * @param {boolean} [ok] 是否点击确定。
         */
        hidePrompt: function(ok) {
            if (undefined !== ok) {
                this.closePrompt(ok);
            }
            else {
                var el = $('#modal_prompt');
                el.modal('hide');
            }
        },

        /**
         * 显示确认框。
         * @param {string} title 标题。
         * @param {string} content 提示内容。
         * @param {function} callback 回调函数。
         * @param {string} [okButtonLabel] 确认按钮的显示文本，默认：“确定”。
         */
        showConfirm: function(title, content, callback, okButtonLabel) {
            var el = $('#modal_confirm');
            el.find('.modal-title').text(title);
            el.find('.modal-body').html('<p>' + content + '</p>');

            el.find('.btn-primary').text(okButtonLabel ? okButtonLabel : '确定');

            confirmCallback = callback;

            el.modal();
        },

        /**
         * 关闭确认框。
         * @param {boolean} yesOrNo 是否点击了确定按钮。
         */
        closeConfirm: function(yesOrNo) {
            confirmCallback(yesOrNo);
        },

        hideConfirm: function(yesOrNo) {
            this.closeConfirm();
        },

        /**
         * 显示提示框。
         * @param {string} content 内容。
         * @param {function} [callback] 回调函数。
         * @param {string} [buttonLabel] 按钮显示的文本，默认：“确定”
         */
        showAlert: function(content, callback, buttonLabel) {
            var el = $('#modal_alert');
            el.find('.modal-body').html('<p>' + content + '</p>');

            if (buttonLabel) {
                el.find('button.btn-default').text(buttonLabel);
            }
            else {
                el.find('button.btn-default').text('确定');
            }
    
            if (undefined === callback) {
                alertCallback = null;
            }
            else {
                alertCallback = callback;
            }
    
            el.modal();
        },

        /**
         * 关闭提示框。
         */
        closeAlert: function() {
            if (null != alertCallback) {
                alertCallback();
            }
            $('#modal_alert').modal('hide');
        },

        hideAlert: function() {
            this.closeAlert();
        },

        /**
         * 显示进度提示。
         * @param {string} content 提示的内容。
         * @param {number} timeout 超时时长。单位：毫秒。
         */
        showLoading: function(content, timeout) {
            if (loading) {
                return;
            }

            loading = true;

            if (undefined === timeout) {
                timeout = 8000;
            }

            var timer = 0;
            var timeoutTimer = 0;

            if (null == loadingModal) {
                loadingModal = $('#modal_loading');
                loadingModal.on('hidden.bs.modal', function() {
                    if (timer != 0) {
                        clearInterval(timer);
                    }
                    if (timeoutTimer != 0) {
                        clearTimeout(timeoutTimer);
                    }

                    loading = false;
                });
            }

            var el = loadingModal;
            el.find('.modal-title').html(content + '&hellip;');

            var elElapsed = el.find('.modal-elapsed-time');
            elElapsed.text('0 秒');

            var count = 0;
            timer = setInterval(function() {
                ++count;
                elElapsed.text(count + ' 秒');
            }, 1000);

            el.modal({
                keyboard: false,
                backdrop: 'static'
            });

            timeoutTimer = setTimeout(function() {
                clearInterval(timer);
                timer = 0;
                clearTimeout(timeoutTimer);
                timeoutTimer = 0;
                el.modal('hide');
            }, timeout);

            return el;
        },

        /**
         * 隐藏加载提示对话框。
         */
        hideLoading: function() {
            if (null != loadingModal) {
                loadingModal.modal('hide');
            }
            else {
                $('#modal_loading').modal('hide');
            }
        },

        /**
         * 显示指定文件标签的图片。
         * @param {FileLabel} file 文件标签。
         */
        showImage: function(file) {
            var show = function(url) {
                var image = new Image();
                image.src = url;
                var viewer = new Viewer(image, {
                    hidden: function () {
                        viewer.destroy();
                    }
                });
                viewer.show();
            };

            g.cube().fileStorage.getFileURL(file, function(fileLabel, url, surl) {
                show(url);
            });
        },

        /**
         * 下载文件并显示保存文件对话框。
         * @param {string} fileCode 指定下载文件的文件码。
         */
        downloadFile: function(fileCode) {
            g.cube().fileStorage.downloadFile(fileCode);
        }
    };

    g.dialog = dialog;

    g.Toast = Toast;

})(window);

(function(g) {
    'use strict'

    var dialogEl = null;

    /**
     * 文件详情对话框。
     * @param {jQuery} el 
     */
    var FileDetails = function(el) {
        dialogEl = el;
    }

    /**
     * 打开文件详情对话框。
     * @param {FileLabel} fileLabel 文件标签。
     * @param {Directory} [directory] 文件所在的目录。
     */
    FileDetails.prototype.open = function(fileLabel, directory) {
        dialogEl.find('h3[data-target="file-name"]').text(fileLabel.getFileName());
        dialogEl.find('h5[data-target="file-type"]').text(fileLabel.getFileType().toUpperCase());
        dialogEl.find('h5[data-target="file-size"]').text(g.formatSize(fileLabel.getFileSize()));
        dialogEl.find('h5[data-target="file-date"]').text(g.formatYMDHMS(fileLabel.getLastModified()));

        if (directory) {
            var path = [];
            g.recurseParent(path, directory);
            var dirList = [];
            if (path.length == 1) {
                dirList.push('/');
            }
            else {
                path.forEach(function(dir) {
                    if (!dir.isRoot()) {
                        dirList.push(dir.getName() + ' &gt; ');
                    }
                });
            }
            dialogEl.find('h5[data-target="file-path"]').html(dirList.join(''));
        }
        else {
            dialogEl.find('h5[data-target="file-path"]').text('--');
        }

        dialogEl.modal('show');
    }

    /**
     * 关闭对话框。
     */
    FileDetails.prototype.close = function() {
        dialogEl.modal('hide');
    }

    g.FileDetails = FileDetails;

})(window);
