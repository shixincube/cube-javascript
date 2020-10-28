// ui-message.js

/**
 * 对话框处理。
 */
(function(g){

    g.ui = g.ui || {};

    var confirmCallback = function() {};

    function showConfirm(title, content, callback) {
        var el = $('#modal_confirm');
        el.find('.modal-title').text(title);
        el.find('.modal-body').html('<p>' + content + '</p>');

        confirmCallback = callback;

        el.modal();
    }

    g.ui.fireConfirm = function(yesOrNo) {
        confirmCallback(yesOrNo);
    }

    g.ui.showConfirm = showConfirm;

    function showLoading(content, timeout) {
        var el = $('#modal_loading');
        el.find('.modal-title').html(content + '&hellip;');

        var elElapsed = el.find('.modal-elapsed-time');
        elElapsed.text('0 秒');

        var count = 0;
        var time = setInterval(function() {
            ++count;
            elElapsed.text(count + ' 秒');
        }, 1000);

        el.modal({
            keyboard: false,
            backdrop: 'static'
        });

        setTimeout(function() {
            clearInterval(time);
            el.modal('hide');
        }, timeout);
    }

    g.ui.showLoading = showLoading;
})(window);


/**
 * 消息目录。
 */
function MessageCatalogue(app) {
    this.app = app;

    this.catalogues = app.catalogues.concat();

    this.elItemMap = {};

    this.lastCatalogItem = null;
    this.clickListener = null;

    var that = this;
    for (var i = 0; i < this.catalogues.length; ++i) {
        var el = $('#catalog_item_' + i);
        this.elItemMap[el.attr('data')] = el;
        el.on('click', function(e) {
            that.onCatalogItemClick($(this), e);
        });
    }
}

MessageCatalogue.prototype.setClickListener = function(listener) {
    this.clickListener = listener;
}

MessageCatalogue.prototype.appendItem = function(item) {
    var index = this.catalogues.length;
    var id = 0;
    var thumb = '/images/group-avatar.png';
    var label = null;
    var sublabel = null;
    var badge = null;

    if (item instanceof Group) {
        id = item.getId();
        label = item.getName();
        sublabel = ' ';
        badge = formatShortTime(item.getLastActiveTime());

        this.catalogues.push({
            index: index,
            id: id,
            thumb: thumb,
            label: label,
            sublabel: sublabel,
            badge: badge
        });
    }
    else if (item instanceof Contact) {
        // TODO
    }

    if (null == label) {
        return;
    }

    var html = [
    '<li id="catalog_item_', index, '" class="item pl-2 pr-2" data="', id, '">',
        '<div class="product-img"><img class="img-size-50 img-round-rect" src="', thumb ,'"/></div>',
        '<div class="product-info">',
            '<span class="product-title">', label,
                '<span class="badge badge-light float-right">', badge, '</span>',
            '</span>',
            '<span class="product-description">', sublabel, '</span>',
        '</div>',
    '</li>'];

    var el = $(html.join(''));

    this.elItemMap[id] = el;

    var elCatalogue = $('#catalogue');
    elCatalogue.append(el);

    var that = this;
    el.on('click', function(e) {
        that.onCatalogItemClick($(this), e);
    });
}

MessageCatalogue.prototype.updateSubLabel = function(id, sublabel, time) {
    var el = this.elItemMap[id];
    el.find('.product-description').text(sublabel);
    el.find('.badge').text(formatShortTime(time));
}

MessageCatalogue.prototype.onCatalogItemClick = function(el, e) {
    if (null != this.lastCatalogItem) {
        if (this.lastCatalogItem.attr('id') == el.attr('id')) {
            return;
        }

        this.lastCatalogItem.removeClass('catalog-active');
    }

    el.addClass('catalog-active');
    this.lastCatalogItem = el;

    var itemId = parseInt(el.attr('data'));

    var account = this.app.getContact(itemId);
    if (null != account) {
        // 点击是联系人
        this.clickListener(account);
        return;
    }

    // 点击的是群组
    this.clickListener(this.app.getGroup(itemId));
}




/**
 * 消息面板。
 */
function MessagePanel(app) {
    this.app = app;
    var contacts = app.contacts;

    this.el = $('#messages');

    this.elTitle = this.el.find('.card-title');
    this.elMsgView = this.el.find('.card-body');
    this.elInput = this.el.find('textarea');
    this.elInput.val('');
    if (!this.elInput[0].hasAttribute('disabled')) {
        this.elInput.attr('disabled', 'disabled');
    }

    var that = this;
    // 发送按钮 Click 事件
    $('#btn_send').on('click', function(e) {
        that.onSendClick(e);
    });
    // 发送框键盘事件
    this.elInput.keypress(function(event) {
        var e = event || window.event;
        if (e && e.keyCode == 13 && e.ctrlKey) {
            that.onSendClick(e);
        }
    });
    // 详情按钮
    $('#details').on('click', function(e) {
        that.onDetailsClick(e);
    });
    // 新建群按钮 Click 事件
    $('#new_group').on('click', function(e) {
        $('#new_group_dialog').modal({
            keyboard: true,
            backdrop: 'static'
        });
    });
    $('#new_group_dialog').on('hidden.bs.modal', function(e) {
        $('#new_group_input_name').val('');
        for (var i = 0; i < contacts.length; ++i) {
            $('#group_member_' + i).prop('checked', false);
        }
    });
    $('#new_group_submit').on('click', function(e) {
        that.onNewGroupSubmitClick(e);
    });

    this.owner = null;
    this.current = null;

    this.views = {};
    for (var i = 0; i < contacts.length; ++i) {
        var contact = contacts[i];
        var el = $('<div class="direct-chat-messages"></div>');
        this.views[contact.id] = {
            el: el,
            isGroup: false,
            messageIds: []
        };
    }

    // 发送事件监听器
    this.sendListener = null;
    // 提交建群事件监听器
    this.submitNewGroupListener = null;
}

MessagePanel.prototype.setSendListener = function(listener) {
    this.sendListener = listener;
}

MessagePanel.prototype.setSubmitNewGroupListener = function(listener) {
    this.submitNewGroupListener = listener;
}

/**
 * 更换当前的目标面板。
 * @param {Contact|Group} target 目标联系人或者群组。
 */
MessagePanel.prototype.changeTarget = function(target) {
    if (null == this.current) {
        this.elInput.removeAttr('disabled');
        $('#btn_send').removeAttr('disabled');
    }
    else {
        // 记录
        var view = this.views[this.current.getId()];
        view.el.remove();
    }

    var view = this.views[target.getId()];
    this.elMsgView.append(view.el);

    this.current = target;

    this.elTitle.text(target.getName());

    // 滚动条控制
    var offset = parseInt(this.elMsgView.prop('scrollHeight'));
    this.elMsgView.scrollTop(offset);
}

/**
 * 添加群。
 * @param {Group} group 
 */
MessagePanel.prototype.addGroup = function(group) {
    var key = group.getId();
    if (undefined !== this.views[key]) {
        return;
    }

    var el = $('<div class="direct-chat-messages"></div>');
    var view = {
        el: el,
        isGroup: true,
        messageIds: [],
        detailMemberTable: $('<tbody></tbody>')
    };
    this.views[key] = view;

    var members = group.getMembers();
    for (var i = 0; i < members.length; ++i) {
        var member = members[i];
        var contact = this.app.getContact(member.getId());
        var html = [
            '<tr>',
                '<td>', (i + 1), '</td>',
                '<td><img class="table-avatar" src="', contact.getContext().avatar, '" /></td>',
                '<td>', member.getName(), '</td>',
                '<td>', member.getId(), '</td>',
            '</tr>'];

        var elMem = $(html.join(''));
        view.detailMemberTable.append(elMem);
    }
}

/**
 * 添加消息到面板。
 * @param {Contact} sender 发送人。
 * @param {string} text 消息内容。
 * @param {number} time 消息时间戳。
 * @param {Contact|Group} [target] 目标面板。
 */
MessagePanel.prototype.appendMessage = function(sender, text, time, target) {
    var targetId = (undefined !== target) ? target.getId() : this.current.getId();

    var view = this.views[targetId];

    var right = '';
    var nfloat = 'float-left';
    var tfloat = 'float-right';

    if (sender.id == this.app.cubeContact.getId()) {
        right = 'right';
        nfloat = 'float-right';
        tfloat = 'float-left';
    }

    var html = ['<div class="direct-chat-msg ',
            right, '"><div class="direct-chat-infos clearfix"><span class="direct-chat-name ', nfloat, '">',
        sender.getName(),
        '</span><span class="direct-chat-timestamp ', tfloat, '">',
        formatFullTime(time),
        '</span></div>',
        '<img src="', sender.getContext().avatar, '" class="direct-chat-img">',
        '<div class="direct-chat-text">', text, '</div></div>'
    ];

    var parentEl = view.el;
    parentEl.append($(html.join('')));

    // 滚动条控制
    var offset = parseInt(this.elMsgView.prop('scrollHeight'));
    this.elMsgView.scrollTop(offset);
}

MessagePanel.prototype.onDetailsClick = function(e) {
    if (null == this.current) {
        return;
    }

    var view = this.views[this.current.getId()];

    if (view.isGroup) {
        var el = $('#modal_group_details');
        
        // view.detailMemberTable;
        el.modal('show');
    }
    else {
        var item = this.app.getContact(this.current.getId());
        var el = $('#modal_contact_details');
        el.find('.widget-user-username').text(item.getName());
        el.find('.widget-user-desc').text(item.getId());
        el.find('.user-avatar').attr('src', item.getContext().avatar);
        el.find('.user-state').text(item.getContext().state == 'online' ? '在线' : '离线');
        el.find('.user-region').text(item.getContext().region);
        el.find('.user-department').text(item.getContext().department);
        el.modal('show');
    }
}

MessagePanel.prototype.onSendClick = function(e) {
    var text = this.elInput.val();
    if (text.length == 0) {
        return;
    }

    this.elInput.val('');

    this.appendMessage(this.app.cubeContact, text, Date.now());
    this.sendListener.call(null, this.current, text);
}

MessagePanel.prototype.onNewGroupSubmitClick = function(e) {
    // 提取群名称
    var groupName = $('#new_group_input_name').val();

    // 提取选择的群成员 ID
    var memberList = [];
    for (var i = 0; i < this.app.cubeContactList.length; ++i) {
        var el = $('#group_member_' + i);
        if (el.prop('checked')) {
            var id = parseInt(el.attr('data'));
            memberList.push(id);
        }
    }

    if (memberList.length == 0) {
        alert('没有选择群成员');
        return;
    }

    $('#new_group_dialog').modal('hide');

    this.submitNewGroupListener(groupName, memberList);
}
