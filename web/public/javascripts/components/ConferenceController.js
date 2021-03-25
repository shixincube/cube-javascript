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

    var timelineAll = null;

    var newConferenceDialog = null;

    function onNewConference(e) {
        var el = newConferenceDialog;
        el.find('input[name="conf-subject"]').val('');
        el.find('input[name="conf-pwd"]').val('');
        el.find('textarea[name="conf-summary"]').val('');

        var date = new Date();
        date.setMinutes(date.getMinutes() + 30);
        el.find('input[name="conf-schedule"]').val(g.datetimePickerToString(date));

        el.find('div.participant').each(function() {
            $(this).remove();
        });

        el.find('.overlay').css('visibility', 'hidden');
        el.modal('show');
    }

    function onAppendParticipant(e) {
        g.app.selectContactsDialog.show(function(result) {
            var el = newConferenceDialog.find('#conf-participant');
            result.forEach(function(value, index) {
                var html = [
                    '<div class="participant" data="', value.getId(), '">',
                        '<div class="avatar">',
                            '<img src="', value.getContext().avatar, '" />',
                        '</div>',
                        '<div class="name">',
                            '<div>', value.getPriorityName(), '</div>',
                        '</div>',
                        '<a href="javascript:app.confCtrl.removeParticipantInNewDialog(', value.getId(), ');"><span class="badge badge-danger">&times;</span></a>',
                    '</div>'
                ];
                el.append($(html.join('')));
            });
        }, getAppendedParticipants());
    }

    function getAppendedParticipants() {
        var list = [];
        newConferenceDialog.find('div.participant').each(function() {
            var id = $(this).attr('data');
            list.push(parseInt(id));
        });
        return list;
    }

    /**
     * 确认新建会议。
     * @returns 
     */
    function onNewConfirm() {
        // 主题
        var el = newConferenceDialog.find('input[name="conf-subject"]');
        var subject = el.val().trim();
        if (subject.length < 3) {
            g.validate(el, '请填写会议主题，会议主题不能少于3个字符。');
            return;
        }

        // 密码
        el = newConferenceDialog.find('input[name="conf-pwd"]');
        var password = el.val().trim();

        // 摘要
        el = newConferenceDialog.find('textarea[name="conf-summary"]');
        var summary = el.val().trim();

        // 计划时间
        el = newConferenceDialog.find('input[name="conf-schedule"]');
        var value = el.val().trim();
        if (value.length <= 10) {
            g.validate(el);
            return;
        }
        var schedule = g.datetimePickerToDate(value);
        var scheduleTime = schedule.getTime();

        // 结束时间，用时长计算
        el = newConferenceDialog.find('select[name="conf-duration"]');
        el = el.find(':selected');
        var duration = parseInt(el.attr('data'));
        var expireTime = scheduleTime + (duration * 60 * 60 * 1000);

        // 邀请
        var idList = getAppendedParticipants();
        var invitationList = [];
        idList.forEach(function(value) {
            var contact = app.queryContact(value);
            invitationList.push(new Invitation(contact.getId(), contact.getName(), contact.getPriorityName()));
        });

        newConferenceDialog.find('.overlay').css('visibility', 'visible');

        // 创建会议
        cube.cs.createConference(subject, password, summary, scheduleTime, expireTime, invitationList, function(conference) {
            newConferenceDialog.modal('hide');
            g.dialog.showAlert('会议“<b>' + conference.subject + '</b>”已创建，计划开始时间是<b>' + g.formatFullTime(conference.scheduleTime) + '</b>。');
        }, function(error) {
            newConferenceDialog.modal('hide');
            g.dialog.showAlert('创建会议失败，请稍后再试！错误码：' + error.code);
        });
    }


    /**
     * 会议控制器。
     * @param {CubeEngine} cubeEngine 
     */
    var ConferenceController = function(cubeEngine) {
        cube = cubeEngine;
        this.init();
    }

    ConferenceController.prototype.init = function() {
        timelineAll = new ConferenceTimeline($('#conf-timeline-all'));

        // 新建会议按钮
        $('button[data-toggle="new-conference"]').on('click', onNewConference);

        // 新建会议对话框
        newConferenceDialog = $('#new_conference_dialog');
        newConferenceDialog.find('#datetimepicker-schedule').datetimepicker({
            locale: 'zh-cn'
        });
        newConferenceDialog.find('#conf-participant button').on('click', onAppendParticipant);
        newConferenceDialog.find('button[data-target="confirm"]').on('click', onNewConfirm);
    }

    ConferenceController.prototype.ready = function() {
        var ending = Date.now();
        var beginning = ending - (30 * 24 * 60 * 60 * 1000);
        cube.cs.listConferences(beginning, ending, function(list, beginning, ending) {
            timelineAll.update(list);
        }, function(error) {
            console.log(error);
        });
    }

    ConferenceController.prototype.removeParticipantInNewDialog = function(id) {
        var el = newConferenceDialog.find('#conf-participant').find('div[data="' + id + '"]');
        el.remove();
    }

    ConferenceController.prototype.fireNewConference = function() {
        onNewConference();
    }

    g.ConferenceController = ConferenceController;

 })(window);
