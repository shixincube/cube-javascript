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

    $(document).ready(function() {
        $.get('/account/all', function(response, status, xhr) {
            var list = response;

            var accounts = [];
            // 添加可用账号
            list.forEach(function(item) {
                if (item.state == 'offline') {
                    if (accounts.length == 0) {
                        $('#accout_id').append(['<option value="', item.id, '" selected="selected">', item.id, '</option>'].join(''));
                    }
                    else {
                        $('#accout_id').append(['<option value="', item.id, '">', item.id, '</option>'].join(''));
                    }
                    accounts.push(item);
                }
            });

            $('#accout_id').selectpicker('refresh');
            // 同步显示对应昵称
            $('#accout_id').on('changed.bs.select', function(e, clickedIndex, isSelected, previousValue) {
                $('#account_name').val(accounts[parseInt(clickedIndex)].name);
            });

            if (accounts.length > 0) {
                $('#account_name').val(accounts[0].name);
            }
            else {
                alert('没有可用账号');
            }
        }, 'json');


        // 登录按钮
        $('#btn_login').on('click', function(e) {
            var id = $('#accout_id').val();
            var name = $('#account_name').val();

            var data = {
                "id" : id,
                "name" : name
            };
            $.post('/account/login', data, function(response, status, xhr) {
                window.location.href = 'main.html?t=' + response.token;
            }, 'json');
        });
    });

})(jQuery);
