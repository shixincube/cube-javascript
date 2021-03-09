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

(function ($, g) {
    'use strict';

    var validator = null;

    var avatar = 'images/avatar01.png';

    function register() {
        var avatar = $('#select_avatar img').attr('src');
        var nickname = $('#nickname').val().trim();
        var account = $('#account').val().trim();
        var password = $('#password').val().trim();

        if (!validator.form()) {
            return;
        }

        var pwdMD5 = md5(password);

        $('#modal_register').modal('show');
        $('#password').val('');
        $('#retype_password').val('');

        var data = {
            "account" : account,
            "password" : pwdMD5,
            "nickname": nickname,
            "avatar": avatar
        };
        $.post('/account/register', data, function(response, status, xhr) {
            $('#modal_register').modal('hide');
            if (response.code == 0) {
                $(document).Toasts('create', {
                    class: 'bg-success', 
                    title: '提示',
                    autohide: true,
                    delay: 4000,
                    body: '账号 "' + account + '" 注册成功，即将返回首页'
                });
                setTimeout(function() {
                    window.location.href = 'index.html';
                }, 4200);
            }
            else {
                $(document).Toasts('create', {
                    class: 'bg-danger', 
                    title: '提示',
                    autohide: true,
                    delay: 3000,
                    body: '账号重名，请更换账号名后再尝试注册'
                });
            }
        }, 'json');
    }


    g.selectAvatar = function(num) {
        if (num < 10) {
            avatar = 'images/avatar0'+ num +'.png';
        }
        else {
            avatar = 'images/avatar'+ num +'.png';
        }

        $('#select_avatar img').attr('src', avatar);

        $('#modal_avatar').modal('hide');
    }

    $(document).ready(function() {
        // 选择头像
        $('#select_avatar').on('click', function(e) {
            $('#modal_avatar').modal('show');
        });

        // 注册按钮
        $('#btn_register').on('click', function(e) {
            register();
        });

        // 密码输入框
        $('#password').on('keypress', function(e) {
            if (e.keyCode == 13) {
                register();
            }
        });
        // 密码输入框
        $('#retype_password').on('keypress', function(e) {
            if (e.keyCode == 13) {
                register();
            }
        });

        $.validator.addMethod("isAccount", function(value, element) {   
            var tel = /^\w+$/;
            return this.optional(element) || (tel.test(value));
        }, "请正确填写账号，只能使用字母、数字和下划线“_”");

        validator = $('.register').validate({
            rules: {
                nickname: {
                    required: true,
                    minlength: 3
                },
                account: {
                    required: true,
                    minlength: 6,
                    maxlength: 30,
                    isAccount: true
                },
                password: {
                    required: true,
                    minlength: 8
                },
                retype_password: {
                    equalTo: "#password"
                }
            },
            messages: {
                nickname: {
                    required: "请正确填写您的昵称",
                    minlength: $.validator.format("昵称最少需要 {0} 个字符")
                },
                account: {
                    required: "请正确填写您的账号名",
                    minlength: $.validator.format("账号最少需要 {0} 个字符"),
                    maxlength: $.validator.format("账号最多只能包含 {0} 个字符"),
                },
                password: {
                    required: "请正确填写您的密码",
                    minlength: $.validator.format("密码最少需要 {0} 个字符")
                },
                retype_password: {
                    equalTo: "请填写与上一项相同的密码"
                }
            },
            errorElement: 'span',
            errorPlacement: function (error, element) {
                error.addClass('invalid-feedback');
                element.closest('.input-group').append(error);
            },
            highlight: function (element, errorClass, validClass) {
                $(element).addClass('is-invalid');
            },
            unhighlight: function (element, errorClass, validClass) {
                $(element).removeClass('is-invalid');
            }
        });
    });

})(jQuery, window);
