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

    var jumpTarget = null;

    function login() {
        var account = $('#account').val();
        var password = $('#password').val();
        var remember = $('#remember').prop('checked');

        if (account.length < 3) {
            $(document).Toasts('create', {
                class: 'bg-danger', 
                title: '提示',
                autohide: true,
                delay: 3000,
                body: '请正确填写您的账号'
            });
            return;
        }

        if (password.length < 8) {
            $(document).Toasts('create', {
                class: 'bg-danger', 
                title: '提示',
                autohide: true,
                delay: 3000,
                body: '请正确填写您的密码，密码长度不能少于8位'
            });
            return;
        }

        var pwdMD5 = md5(password);

        $('#password').val('');
        $('#password').blur();

        $('#modal_login').modal('show');

        // 发送登录请求
        $.post(server.url + '/account/login/', {
            "account": account,
            "password": pwdMD5,
            "device": 'Web/' + navigator.userAgent,
            "remember": remember
        }, function(response, status, xhr) {
            if (response.code == 0) {
                var date = new Date();
                date.setTime(date.getTime() + 7 * 24 * 60 * 60 * 1000);
                document.cookie = 'CubeAppToken=' + response.token + '; expires=' + date.toUTCString();
                document.cookie = 'CubeTrace=' + response.trace + '; expires=' + date.toUTCString();

                if (null != jumpTarget) {
                    window.location.href = jumpTarget + '&t=' + response.token;
                }
                else {
                    // window.location.href = 'main.html';
                    window.location.href = 'main.html?t=' + response.token;
                }
            }
            else if (response.code == 1) {
                $('#modal_login').modal('hide');
                $(document).Toasts('create', {
                    class: 'bg-danger', 
                    title: '提示',
                    autohide: true,
                    delay: 3000,
                    body: '登录失败，不允许同一个用户同时重复登录'
                });
            }
            else {
                $('#modal_login').modal('hide');
                $(document).Toasts('create', {
                    class: 'bg-danger', 
                    title: '提示',
                    autohide: true,
                    delay: 3000,
                    body: '登录失败，请确认用户名或密码是否正确 (' + response.code + ')'
                });
            }
        }, 'json').fail(function() {
            $('#modal_login').modal('hide');
            $(document).Toasts('create', {
                class: 'bg-danger', 
                title: '提示',
                autohide: true,
                delay: 3000,
                body: '登录失败，服务器故障'
            });
        });
    }

    $(document).ready(function() {
        $('#password').val('');
        $('#remember').prop('checked', 'checked');

        // 登录按钮
        $('#btn_login').on('click', function(e) {
            login();
        });

        // 注册按钮
        $('#btn_register').on('click', function(e) {
            var href = 'register.html';
            if (null != jumpTarget) {
                href += '?jump=' + jumpTarget;
            }

            window.location.href = href;
        });

        $('#password').on('keypress', function(e) {
            if (e.keyCode == 13) {
                login();
            }
        });

        var searchString = window.location.search;
        var auto = searchString.indexOf('c=logout') < 0 && searchString.indexOf('c=hold') < 0;

        var cookie = window.readCookie('CubeAppToken');

        if (searchString.indexOf('account=') >= 0) {
            var account = window.getQueryString('account');
            $('#account').val(account);
        }
        else if (null != cookie && cookie.length >= 32 && auto) {
            // 尝试使用 Cookie 登录
            $('#modal_login').modal('show');

            var timer = setTimeout(function() {
                $('#modal_login').modal('hide');
            }, 10000);

            // 跨域携带 Cookie
            $.ajax({
                type: "POST",
                url: server.url + '/account/login/',
                /*xhrFields: {
                    withCredentials: true
                },*/
                crossDomain: true,
                dataType: 'json',
                data: {
                    "device": 'Web/' + navigator.userAgent,
                    "token": cookie
                },
                success: function(response, status, xhr) {
                    clearTimeout(timer);

                    $('#modal_login').modal('hide');

                    if (response.code == 0) {
                        window.location.href = 'main.html';
                    }
                    else if (response.code == 1) {
                        $(document).Toasts('create', {
                            class: 'bg-danger', 
                            title: '提示',
                            autohide: true,
                            delay: 3000,
                            body: '登录失败，不允许重复登录'
                        });
                    }
                    else {
                        $(document).Toasts('create', {
                            class: 'bg-danger', 
                            title: '提示',
                            autohide: true,
                            delay: 3500,
                            body: '请重新登录 #' + response.code
                        });
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    clearTimeout(timer);

                    $('#modal_login').modal('hide');

                    $(document).Toasts('create', {
                        class: 'bg-danger', 
                        title: '提示',
                        autohide: true,
                        delay: 3000,
                        body: '登录失败，服务器故障'
                    });
                }
            });
        }
        else if (searchString.indexOf('c=logout') >= 0) {
            var date = new Date();
            document.cookie = 'CubeAppToken=?; expires=' + date.toUTCString();
            document.cookie = 'CubeTrace=?; expires=' + date.toUTCString();
        }
        else if (searchString.indexOf('c=hold') >= 0) {
            // 停留在该页面
        }

        // 获取跳转目标
        if (window.location.search.indexOf('jump=') >= 0) {
            var tmp = window.location.search.split('jump=');
            jumpTarget = tmp[1];
        }
    });

})(jQuery);
