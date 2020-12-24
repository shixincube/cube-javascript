// app-login.js

(function ($) {
    'use strict'

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
