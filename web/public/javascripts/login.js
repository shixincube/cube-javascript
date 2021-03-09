/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020 Shixin Cube Team.
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

(function ($) {
    'use strict';

    function login() {
        var account = $('#account').val();
        var password = $('#password').val();

        if (account.length < 3) {
            $(document).Toasts('create', {
                class: 'bg-danger', 
                title: '提示',
                autohide: true,
                delay: 3000,
                body: '请输入正确的账号'
            });
            return;
        }

        if (password.length < 8) {
            $(document).Toasts('create', {
                class: 'bg-danger', 
                title: '提示',
                autohide: true,
                delay: 3000,
                body: '密码长度不能少于8位'
            });
            return;
        }

        var pwdMD5 = md5(password);

        $('#password').val('');
        $('#password').blur();

        $('#modal_login').modal('show');

        // $.post('/account/login', data, function(response, status, xhr) {
        //     window.location.href = 'main.html?t=' + response.token;
        // }, 'json');
    }

    $(document).ready(function() {
        $('#password').val('');

        // 登录按钮
        $('#btn_login').on('click', function(e) {
            login();
        });

        $('#password').on('keypress', function(e) {
            if (e.keyCode == 13) {
                login();
            }
        });
    });

})(jQuery);
