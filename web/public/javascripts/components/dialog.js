// dialog.js

// 对话框组件

(function(g) {
    'use strict'

    var promptCallback = function() {};

    var confirmCallback = function() {};

    var alertCallback = null;

    var loadingModal = null;
    var loading = false;

    var dialog = {
        /**
         * 显示提示输入框。
         * @param {*} title 
         * @param {*} label 
         * @param {*} callback 
         */
        showPrompt: function(title, label, callback) {
            var el = $('#modal_prompt');
            el.find('.modal-title').text(title);
            el.find('.prompt-label').text(label);

            el.find('.prompt-input').val('');

            promptCallback = callback;

            el.modal();
        },

        closePrompt: function(ok) {
            promptCallback(ok, $('#modal_prompt').find('.prompt-input').val());
        },

        /**
         * 显示确认框。
         * @param {*} title 
         * @param {*} content 
         * @param {*} callback 
         */
        showConfirm: function(title, content, callback) {
            var el = $('#modal_confirm');
            el.find('.modal-title').text(title);
            el.find('.modal-body').html('<p>' + content + '</p>');

            confirmCallback = callback;

            el.modal();
        },

        closeConfirm: function(yesOrNo) {
            confirmCallback(yesOrNo);
        },

        /**
         * 显示提示框。
         * @param {*} content 
         * @param {*} callback 
         */
        showAlert: function(content, callback) {
            var el = $('#modal_alert');
            el.find('.modal-body').html('<p>' + content + '</p>');
    
            if (undefined === callback) {
                alertCallback = null;
            }
            else {
                alertCallback = callback;
            }
    
            el.modal();
        },

        closeAlert: function() {
            if (null != alertCallback) {
                alertCallback();
            }
        },

        /**
         * 显示进度提示。
         * @param {*} content 
         * @param {*} timeout 
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

        hideLoading: function() {
            if (null != loadingModal) {
                loadingModal.modal('hide');
            }
            else {
                $('#modal_loading').modal('hide');
            }
        }
    };

    g.dialog = dialog;

})(window);
