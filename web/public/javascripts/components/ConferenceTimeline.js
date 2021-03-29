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
    'use strict';

    /**
     * 会议时间线。
     * @param {*} el 
     */
    var ConferenceTimeline = function(el) {
        this.container = el;
        this.timelineEl = el.find('.timeline');
    }

    ConferenceTimeline.prototype.update = function(list) {
        // 清空时间线元素
        this.timelineEl.empty();

        if (list.length > 0) {
            this.container.find('.no-conference').css('display', 'none');

            var now = Date.now();

            for (var i = 0; i < list.length; ++i) {
                var conf = list[i];

                var date = new Date(conf.scheduleTime);
                var expire = new Date(conf.expireTime);

                var iconClass = null;
                var btnGroup = [];

                if (now >= conf.scheduleTime && now <= conf.expireTime) {
                    // 正在进行的会议
                    iconClass = 'bg-red';
                    btnGroup.push('<button class="btn btn-success btn-sm" onclick="javascript:;">进入会议</button>');
                    if (conf.getFounder().getId() == app.getSelf().getId()) {
                        // 本人是会议创建人，可结束会议
                        btnGroup.push('<button class="btn btn-danger btn-sm">结束会议</button>');
                    }
                }
                else if (now > conf.expireTime) {
                    // 已结束的会议
                    iconClass = 'bg-green';
                    btnGroup.push('<button class="btn btn-default btn-sm" onclick="javascript:;">查看会议记录</button>');
                }
                else {
                    // 尚未开始的会议
                    iconClass = 'bg-blue';
                    btnGroup.push('<button class="btn btn-success btn-sm" onclick="javascript:;">进入会议</button>');
                    if (conf.getFounder().getId() == app.getSelf().getId()) {
                        // 本人是会议创建人，可取消会议
                        btnGroup.push('<button class="btn btn-danger btn-sm" onclick="javascript:;">取消会议</button>');
                    }
                }

                var lockIcon = conf.hasPassword() ? '<i class="fas fa-lock" title="会议已设置密码"></i>' : '<i class="fas fa-unlock" title="会议无密码"></i>';

                var invitees = conf.getInvitees();
                invitees.unshift(conf.getFounder());
                var htmlInvitee = [];
                invitees.forEach(function(value, index) {
                    var contact = app.queryContact(value.id);

                    // 状态
                    var state = null;
                    if (index == 0) {
                        state = [
                            '<span class="badge badge-info"><i class="fas fa-user-cog"></i></span>'
                        ];
                    }
                    else {
                        if (value.acceptionTime > 0) {
                            if (value.accepted) {
                                state = [
                                    '<span class="badge badge-success"><i class="fas fa-check-circle"></i></span>'
                                ];
                            }
                            else {
                                state = [
                                    '<span class="badge badge-danger"><i class="fas fa-ban"></i></span>'
                                ];
                            }
                        }
                        else {
                            state = [
                                '<span class="badge badge-info"><i class="fas fa-question-circle"></i></span>'
                            ];
                        }
                    }

                    var html = null;
                    if (null != contact) {
                        html = [
                            '<div class="participant" data="', contact.getId(), '">',
                                '<div class="avatar"><img src="images/', contact.getContext().avatar, '"></div>',
                                '<div class="name"><div>', contact.getName(), '</div></div>',
                                state.join(''),
                            '</div>'
                        ];
                    }
                    else {
                        html = [
                            '<div class="participant" data="', value.id, '">',
                                '<div class="avatar"><img src="', 'images/favicon.png', '"></div>',
                                '<div class="name"><div>', value.displayName, '</div></div>',
                                state.join(''),
                            '</div>'
                        ];
                    }

                    htmlInvitee.push(html.join(''));
                });

                var html = [
                    '<div class="time-label">',
                        '<span class="bg-blue">', (date.getMonth() + 1), '月', date.getDate(), '日</span>',
                    '</div>',
                    '<div>',
                        '<i class="fas fa-users ', iconClass, '"></i>',
                        '<div class="timeline-item">',
                            '<span class="time">', lockIcon, '&nbsp;&nbsp;<i class="fas fa-clock"></i> ',
                                    g.formatNumber(date.getHours()), ':', g.formatNumber(date.getMinutes()), ' - ',
                                    g.formatNumber(expire.getHours()), ':', g.formatNumber(expire.getMinutes()),
                            '</span>',
                            '<h3 class="timeline-header">', conf.subject, '</h3>',
                            '<div class="timeline-body">',
                                '<p>', conf.summary.length == 0 ? '<i class="text-muted" style="font-size:12px;">无会议描述信息</i>' : conf.summary, '</p>',
                                '<div class="invitees">', htmlInvitee.join(''), '</div>',
                            '</div>',
                            '<div class="timeline-footer">',
                                btnGroup.join(''),
                            '</div>',
                        '</div>',
                    '</div>'
                ];

                this.timelineEl.append($(html.join('')));
            }

            this.timelineEl.append($('<div><i class="fas fa-clock bg-gray"></i></div>'));
        }
        else {
            this.container.find('.no-conference').css('display', 'table');
        }
    }

    g.ConferenceTimeline = ConferenceTimeline;

 })(window);
