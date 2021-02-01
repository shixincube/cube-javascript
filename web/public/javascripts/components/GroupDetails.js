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

    var btnModify = null;

    var GroupDetails = function(el) {
        this.el = el;
        this.lastGroup = null;
        this.lastTimestamp = 0;
    }

    GroupDetails.prototype.show = function(group) {
        if (null != this.lastGroup && this.lastGroup.getId() == group.getId() && group.getLastActiveTime() == this.lastTimestamp) {
            this.el.modal('show');
            return;
        }

        this.lastGroup = group;
        this.lastTimestamp = group.getLastActiveTime();

        var el = this.el;
        el.find('.widget-user-username').text(group.getName());

        // // 设置数据
        $('#group_details_modify').attr('data', group.getId());
        $('#group_details_add').attr('data', group.getId());
        $('#group_details_quit').attr('data', group.getId());
        $('#group_details_dissolve').attr('data', group.getId());

        var table = el.find('.table');
        table.find('tbody').remove();
        table.append(this.createGroupDetailsTable(group));
        el.modal('show');
    }

    /**
     * @private
     * @param {Group} group 
     */
    GroupDetails.prototype.createGroupDetailsTable = function(group) {
        var detailMemberTable = $('<tbody></tbody>');

        var removeable = group.isOwner(g.app.getSelf());

        var clickEvent = [
            'app.messagingCtrl.removeGroupMember(', 
                'parseInt($(this).attr(\'data-group\')),',
                'parseInt($(this).attr(\'data-member\'))',
            ');'
        ];
        clickEvent = clickEvent.join('');

        var members = group.getMembers();
        for (var i = 0; i < members.length; ++i) {
            var member = members[i];

            var operation = (member.equals(g.app.getSelf()) || group.isOwner(member)) ? [ '' ]
                : [ '<button class="btn btn-danger btn-xs', (removeable ? '' : ' disabled'), '" onclick="', clickEvent, '"',
                    ' data-member="', member.getId(), '"',
                    ' data-group="', group.getId(), '"',
                    ' data-original-title="从本群中移除" data-placement="top" data-toggle="tooltip"><i class="fas fa-minus"></i></button>'];
            operation = operation.join('');

            var contact = g.app.queryContact(member.getId());
            var html = [
                '<tr>',
                    '<td>', (i + 1), '</td>',
                    '<td><img class="table-avatar" src="', contact.getContext().avatar, '" /></td>',
                    '<td>', member.getName(), '</td>',
                    '<td>', member.getId(), '</td>',
                    '<td>', member.getContext().region, '</td>',
                    '<td>', member.getContext().department, '</td>',
                    '<td>', operation, '</td>',
                '</tr>'];
    
            var elMem = $(html.join(''));
            detailMemberTable.append(elMem);
        }
    
        return detailMemberTable;
    }

    g.GroupDetails = GroupDetails;

})(window);
