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

// 对话框组件
(function(g) {

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

    var toastBE = Swal.mixin({
        toast: true,
        position: 'bottom-end',
        showConfirmButton: false,
        timer: 3000
    });

    var promptCallback = function() {};

    var confirmCallback = function() {};

    var alertCallback = null;

    var loadingModal = null;
    var loadingModalShown = false;
    var loadingModalTimer = 0;
    var loading = false;

    var prepare = function() {
        if (null != app.globalPopover) {
            app.globalPopover.popover('hide');
        }
    }

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
         * @param {boolean} [rb] 是否右下角显示。
         */
        launchToast: function(type, text, rb) {
            if (rb) {
                toastBE.fire({
                    icon: type,
                    title: text
                });
            }
            else {
                toast.fire({
                    icon: type,
                    title: text
                });
            }
        },

        /**
         * 显示吐司提示。
         * @param {string} text 
         * @param {string} [type] 
         * @param {boolean} [rb] 是否右下角显示。
         */
        toast: function(text, type, rb) {
            if (undefined !== type) {
                g.dialog.launchToast(type, text, rb);
            }
            else {
                g.dialog.launchToast(Toast.Info, text, rb);
            }
        },

        alert: function(text) {
            Swal.fire({
                toast: true,
                icon: 'info',
                title: text,
                showConfirmButton: false,
                timer: 3000
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
            prepare();

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
            prepare();

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
            this.closeConfirm(yesOrNo);
        },

        /**
         * 显示提示框。
         * @param {string} content 内容。
         * @param {function} [callback] 回调函数。
         * @param {string} [buttonLabel] 按钮显示的文本，默认：“我知道了”
         */
        showAlert: function(content, callback, buttonLabel) {
            prepare();

            var el = $('#modal_alert');
            el.find('.modal-body').html('<p>' + content + '</p>');

            if (buttonLabel) {
                el.find('button.alert-confirm-button').text(buttonLabel);
            }
            else {
                el.find('button.alert-confirm-button').text('我知道了');
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
                alertCallback = null;
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
            prepare();

            if (loading) {
                return;
            }

            loading = true;

            if (undefined === timeout) {
                timeout = 8000;
            }

            var timeoutTimer = 0;

            if (null == loadingModal) {
                loadingModal = $('#modal_loading');
                loadingModal.on('hidden.bs.modal', function() {
                    loadingModalShown = false;

                    if (loadingModalTimer != 0) {
                        clearInterval(loadingModalTimer);
                        loadingModalTimer = 0;
                    }
                    if (timeoutTimer != 0) {
                        clearTimeout(timeoutTimer);
                        timeoutTimer = 0;
                    }

                    loading = false;
                });

                loadingModal.on('shown.bs.modal', function() {
                    loadingModalShown = true;
                });
            }

            var el = loadingModal;
            el.find('.modal-title').html(content + '&hellip;');

            var elElapsed = el.find('.modal-elapsed-time');
            elElapsed.text('0 秒');

            var count = 0;
            loadingModalTimer = setInterval(function() {
                ++count;
                elElapsed.text(count + ' 秒');

                if (count * 1000 > timeout) {
                    if (loadingModalTimer != 0) {
                        clearInterval(loadingModalTimer);
                        loadingModalTimer = 0;
                    }
                    if (timeoutTimer != 0) {
                        clearTimeout(timeoutTimer);
                        timeoutTimer = 0;
                        el.modal('hide');
                    }
                }
            }, 1000);

            el.modal({
                keyboard: false,
                backdrop: 'static'
            });

            timeoutTimer = setTimeout(function() {
                clearInterval(loadingModalTimer);
                loadingModalTimer = 0;
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
            if (0 != loadingModalTimer) {
                clearInterval(loadingModalTimer);
                loadingModalTimer = 0;
            }

            if (null != loadingModal) {
                loadingModal.modal('hide');
            }
            else {
                $('#modal_loading').modal('hide');
            }

            if (!loadingModalShown) {
                setTimeout(function() {
                    if (loadingModalShown) {
                        g.dialog.hideLoading();
                    }
                    else {
                        setTimeout(function() {
                            g.dialog.hideLoading();
                        }, 500);
                    }
                }, 500);
            }
        },

        /**
         * 显示指定文件标签的图片。
         * @param {FileLabel} file 文件标签。
         */
        showImage: function(file) {
            prepare();

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

            g.cube().fileStorage.getFileURL(file, function(fileLabel, httpURL, httpsURL) {
                show(g.cube().fileStorage.secure ? httpsURL : httpURL);
            });
        },

        /**
         * 显示数组里的图片文件。
         * @param {Array} fileList 文件数组。
         * @param {number} [initIndex] 初始化索引。
         */
        showImages: function(fileList, initIndex) {
            prepare();

            var el = document.createElement('div');

            var show = function() {
                var viewer = new Viewer(el, {
                    initialViewIndex: (undefined !== initIndex) ? initIndex : 0,
                    hidden: function () {
                        viewer.destroy();
                    }
                });
                viewer.show();
            };

            var count = fileList.length;
            var secure = g.cube().fileStorage.secure;
            fileList.forEach(function(item) {
                g.cube().fileStorage.getFileURL(item, function(fileLabel, httpURL, httpsURL) {
                    var url = secure ? httpsURL : httpURL;
                    var image = new Image();
                    image.src = url;
                    el.appendChild(image);

                    --count;
                    if (0 == count) {
                        show();
                    }
                });
            });
        },

        /**
         * 下载文件并显示保存文件对话框。
         * @param {string} fileCode 指定下载文件的文件码。
         */
        downloadFile: function(fileCode) {
            prepare();
            
            g.cube().fileStorage.downloadFile(fileCode);
        }
    };

    g.dialog = dialog;

    g.Toast = Toast;

})(window);
