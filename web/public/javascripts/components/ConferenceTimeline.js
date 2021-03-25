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

    var container = null;
    var timelineEl = null;

    var ConferenceTimeline = function(el) {
        container = el;
        timelineEl = el.find('.timeline');
    }

    ConferenceTimeline.prototype.update = function(list) {
        if (list.length > 0) {
            container.find('.no-conference').css('display', 'none');

            for (var i = 0; i < list.length; ++i) {
                var conf = list[i];

                var date = new Date(conf.scheduleTime);

                var html = [
                    '<div class="time-label">',
                        '<span class="bg-red">', (date.getMonth() + 1), '月', date.getDate(), '日</span>',
                    '</div>',
                    '<div>',
                        '<i class="fas fa-users bg-blue"></i>',
                        '<div class="timeline-item">',
                            '<span class="time"><i class="fas fa-clock"></i> ', date.getHours(), ':', g.formatNumber(date.getMinutes()), '</span>',
                            '<h3 class="timeline-header"><a href="javascript:;">', conf.subject, '</a></h3>',
                            '<div class="timeline-body">',
                                '<p>', conf.summary, '</p>',
                            '</div>',
                            '<div class="timeline-footer">',
                                '<button class="btn btn-primary btn-sm">加入会议</button>',
                                '<button class="btn btn-danger btn-sm">取消会议</button>',
                            '</div>',
                        '</div>',
                    '</div>'
                ];

                timelineEl.append($(html.join('')));
            }
        }
        else {
            container.find('.no-conference').css('display', 'table');
        }
    }

    g.ConferenceTimeline = ConferenceTimeline;

 })(window);
