// ui-message.js

/**
 * Toast 提示类型。
 */
var CubeToast = {
    Success: 'success',
    Info: 'info',
    Error: 'error',
    Warning: 'warning',
    Question: 'question'
};

/**
 * 对话框处理。
 */
(function(g){

    g.ui = g.ui || {};

    // Alert modal

    var alertCallback = null;

    function showAlert(content, callback) {
        var el = $('#modal_alert');
        el.find('.modal-body').html('<p>' + content + '</p>');

        if (undefined === callback) {
            alertCallback = null;
        }
        else {
            alertCallback = callback;
        }

        el.modal();
    }

    g.ui.fireAlert = function() {
        if (null != alertCallback) {
            alertCallback();
        }
    }

    g.ui.showAlert = showAlert;

    // Confirm modal

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

    // Prompt modal

    var promptCallback = function() {};

    function showPrompt(title, label, callback) {
        var el = $('#modal_prompt');
        el.find('.modal-title').text(title);
        el.find('.prompt-label').text(label);

        el.find('.prompt-input').val('');

        promptCallback = callback;

        el.modal();
    }

    g.ui.firePrompt = function(ok) {
        promptCallback(ok, $('#modal_prompt').find('.prompt-input').val());
    }

    g.ui.showPrompt = showPrompt;


    // Loading modal

    var loadingModal = null;

    function showLoading(content, timeout) {
        if (undefined === timeout) {
            timeout = 8000;
        }

        var timer = 0;
        var timeoutTimer = 0;

        if (null == loadingModal) {
            loadingModal = $('#modal_loading');
            loadingModal.on('hidden.bs.modal', function() {
                if (timer != 0) {
                    clearInterval(timer);
                }
                if (timeoutTimer != 0) {
                    clearTimeout(timeoutTimer);
                }
            });
        }

        var el = loadingModal;
        el.find('.modal-title').html(content + '&hellip;');

        var elElapsed = el.find('.modal-elapsed-time');
        elElapsed.text('0 秒');

        var count = 0;
        timer = setInterval(function() {
            ++count;
            elElapsed.text(count + ' 秒');
        }, 1000);

        el.modal({
            keyboard: false,
            backdrop: 'static'
        });

        timeoutTimer = setTimeout(function() {
            clearInterval(timer);
            timer = 0;
            clearTimeout(timeoutTimer);
            timeoutTimer = 0;
            el.modal('hide');
        }, timeout);

        return el;
    }

    function hideLoading() {
        if (null != loadingModal) {
            loadingModal.modal('hide');
        }
        else {
            $('#modal_loading').modal('hide');
        }
    }

    g.ui.showLoading = showLoading;
    g.ui.hideLoading = hideLoading;
})(window);


/**
 * 消息目录。
 */
function MessageCatalogue(app) {
    this.app = app;

    this.catalogues = [];

    this.lastCatalogItem = null;
    this.clickListener = null;
}

MessageCatalogue.prototype.setClickListener = function(listener) {
    this.clickListener = listener;
}

MessageCatalogue.prototype.getItem = function(itemId) {
    var id = parseInt(itemId);
    for (var i = 0; i < this.catalogues.length; ++i) {
        var item = this.catalogues[i];
        if (item.id == id) {
            return item;
        }
    }
    return null;
}

MessageCatalogue.prototype.appendItem = function(item) {
    var index = this.catalogues.length;
    var id = 0;
    var el = null;
    var thumb = '/images/group-avatar.png';
    var label = null;
    var desc = null;
    var badge = null;

    if (item instanceof Group) {
        id = item.getId();
        label = item.getName();
        desc = ' ';
        badge = formatShortTime(item.getLastActiveTime());
    }
    else if (item instanceof Contact) {
        id = item.getId();
        label = item.getName();
        desc = ' ';
        badge = '';
    }
    else {
        id = item.id;
        thumb = item.avatar;
        label = item.name;
        desc = ' ';
        badge = '';
    }

    if (null == label) {
        return;
    }

    var cur = this.getItem(id);
    if (null != cur) {
        return;
    }

    var item = {
        index: index,
        id: id,
        el: el,
        thumb: thumb,
        label: label,
        desc: desc,
        badge: badge
    };

    this.catalogues.push(item);

    var html = [
    '<li id="catalog_item_', index, '" class="item pl-2 pr-2" data="', id, '">',
        '<div class="product-img"><img class="img-size-50 img-round-rect" src="', thumb ,'"/></div>',
        '<div class="product-info ellipsis">',
            '<span class="product-title ellipsis">',
                '<span class="title">', label, '</span>',
                '<span class="badge badge-light float-right">', badge, '</span>',
            '</span>',
            '<span class="product-description">', desc, '</span>',
        '</div>',
    '</li>'];

    var el = $(html.join(''));

    item.el = el;

    var elCatalogue = $('#catalogue');
    elCatalogue.append(el);

    var that = this;
    el.on('click', function(e) {
        var itemId = parseInt($(this).attr('data'));
        that.onCatalogItemClick(itemId);
    });
}

MessageCatalogue.prototype.removeItem = function(item) {
    var id = item.getId();
    var current = null;

    // 从列表里删除
    for (var i = 0; i < this.catalogues.length; ++i) {
        var ca = this.catalogues[i];
        if (ca.id == id) {
            current = ca;
            this.catalogues.splice(i, 1);
            break;
        }
    }

    if (null == current) {
        return;
    }

    // 刷新界面
    if (null != this.lastCatalogItem && this.lastCatalogItem.id == id) {
        // 重新选中别的目录
        this.onCatalogItemClick(this.catalogues[0].id);
    }

    // 移除 DOM 节点
    var el = current.el;
    el.remove();
}

MessageCatalogue.prototype.updateItem = function(id, desc, time, label) {
    var current = this.getItem(id);
    if (null == current) {
        return;
    }

    var el = current.el;

    if (null != desc) {
        if (typeof desc === 'string') {
            el.find('.product-description').text(desc);
        }
        else if (desc instanceof Message) {
            var msg = desc;
            if (msg.hasAttachment()) {
                el.find('.product-description').text('[文件] ' + msg.getAttachment().getFileName());
            }
            else {
                el.find('.product-description').text(msg.getPayload().content);
            }
        }
        else if (desc instanceof File) {
            el.find('.product-description').text('[文件] ' + desc.name);
        }
    }

    el.find('.badge').text(formatShortTime(time));

    if (label) {
        el.find('.title').text(label);
    }
}

MessageCatalogue.prototype.onCatalogItemClick = function(itemId) {
    if (null != this.lastCatalogItem) {
        if (this.lastCatalogItem.id == itemId) {
            // 同一个项目，直接返回
            return;
        }

        this.lastCatalogItem.el.removeClass('catalog-active');
    }

    var current = this.getItem(itemId);

    current.el.addClass('catalog-active');

    this.lastCatalogItem = current;

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

    this.initContextMenu();

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

    // 发送文件按钮
    $('#btn_send_file').on('click', function(e) {
        $('#select_file').click();
    });
    $('#select_file').on('change', function(e) {
        that.onSendFile(e);
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
    // 提交创建群操作
    $('#new_group_submit').on('click', function(e) {
        that.onNewGroupSubmitClick(e);
    });

    // 修改群组
    $('#group_details_modify').on('click', function(e) {
        that.onModifyGroup(e);
    });
    // 添加群成员
    $('#group_details_add').on('click', function(e) {
        that.onAddGroupMemberClick(e);
    });
    // 提交选择的群成员
    $('#contact_list_submit').on('click', function(e) {
        that.onContactListSubmitClick(e);
    });
    // 退出群组
    $('#group_details_quit').on('click', function(e) {
        that.onQuitGroupClick(e);
    });
    // 解散群
    $('#group_details_dissolve').on('click', function(e) {
        that.onDissolveGroupClick(e);
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

    // 提交建群事件监听器
    this.submitCreateGroupListener = null;
    // 提交退出群事件监听器
    this.submitQuitGroupListener = null;
    // 提交解散群事件监听器
    this.submitDissolveGroupListener = null;
}

MessagePanel.prototype.initContextMenu = function() {
    var app = this.app;
    this.elMsgView.contextMenu({
        selector: '.direct-chat-msg',
        callback: function(key, options) {
            // var m = "clicked: " + key + " on " + $(this).attr('id');
            // console.log(m);
            if (key == 'delete') {
                app.fireDeleteMessage(parseInt($(this).attr('id')));
            }
            else if (key == 'recall') {
                app.fireRecallMessage(parseInt($(this).attr('id')));
            }
        },
        items: {
            // "forward": { name: "转发" },
            "recall": { name: "撤回" },
            "delete": { name: "删除" }
        }
    });
}

MessagePanel.prototype.setCreateGroupListener = function(listener) {
    this.submitCreateGroupListener = listener;
}

MessagePanel.prototype.setQuitGroupListener = function(listener) {
    this.submitQuitGroupListener = listener;
}

MessagePanel.prototype.setDissolveGroupListener = function(listener) {
    this.submitDissolveGroupListener = listener;
}

/**
 * 更换当前的目标面板。
 * @param {Contact|Group} target 目标联系人或者群组。
 */
MessagePanel.prototype.changeTarget = function(target) {
    if (null == this.current) {
        this.elInput.removeAttr('disabled');
        $('#btn_send').removeAttr('disabled');
        $('#btn_send_file').removeAttr('disabled');
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
        detailMemberTable: null
    };
    this.views[key] = view;

    view.detailMemberTable = this.createGroupDetailsTable(group);
}

/**
 * 移除群。
 * @param {Group} group 
 */
MessagePanel.prototype.removeGroup = function(group) {
    var key = group.getId();
    if (undefined === this.views[key]) {
        return;
    }

    if (this.current.getId() == group.getId()) {
        // 当前面板有效

        this.elTitle.text('');
        this.elInput.addAttr('disabled');
        $('#btn_send').addAttr('disabled');

        var view = this.views[key];
        view.el.remove();

        this.current = null;
    }

    delete this.views[key];
}

MessagePanel.prototype.updateGroup = function(group) {
    var key = group.getId();
    var view = this.views[key];
    if (undefined === view) {
        return;
    }

    // 重置详情表格
    var panelEl = null;
    if (null != this.current && this.current.getId() == group.getId()) {
        panelEl = view.detailMemberTable.parent();
        view.detailMemberTable.remove();
        this.current = group;

        // 更新面板标题
        this.elTitle.text(group.getName());

        // 更新详情页标题
        var el = $('#modal_group_details');
        el.find('.widget-user-username').text(group.getName());
    }

    view.detailMemberTable = this.createGroupDetailsTable(group);

    if (null != panelEl) {
        panelEl.append(view.detailMemberTable);
    }
}

MessagePanel.prototype.createGroupDetailsTable = function(group) {
    var detailMemberTable = $('<tbody></tbody>');

    var removeable = group.isOwner(this.app.cubeContact);

    var clickEvent = [
        'window.app.fireRemoveMember(', 
            'parseInt($(this).attr(\'data-group\')),',
            'parseInt($(this).attr(\'data-member\'))',
        ');'
    ];
    clickEvent = clickEvent.join('');

    var members = group.getMembers();
    for (var i = 0; i < members.length; ++i) {
        var member = members[i];

        var operation = (member.equals(this.app.cubeContact) || group.isOwner(member)) ? [ '' ]
            : [ '<button class="btn btn-danger btn-xs', (removeable ? '' : ' disabled'), '" onclick="', clickEvent, '"',
                ' data-member="', member.getId(), '"',
                ' data-group="', group.getId(), '"',
                ' data-original-title="从本群中移除" data-placement="top" data-toggle="tooltip"><i class="fas fa-minus"></i></button>'];
        operation = operation.join('');

        var contact = this.app.getContact(member.getId());
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

/**
 * 添加消息到面板。
 * @param {number} id 消息 ID 。
 * @param {Contact} sender 发送人。
 * @param {string|File|Message} content 消息内容。
 * @param {number} time 消息时间戳。
 * @param {Contact|Group} [target] 目标面板。
 */
MessagePanel.prototype.appendMessage = function(id, sender, content, time, target) {
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

    var text = null;
    var fileInfo = null;

    var attachment = null;

    if (typeof content === 'string') {
        text = content;
    }
    else if (content instanceof Message) {
        if (content.hasAttachment()) {
            attachment = content.getAttachment();
            fileInfo = {
                name: attachment.getFileName(),
                size: attachment.getFileSize()
            };
        }
        else {
            text = content.getPayload().content;
        }
    }
    else if (content instanceof File) {
        fileInfo = {
            name: content.name,
            size: content.size
        };
    }

    if (null != fileInfo) {
        var action = null;
        if (null == attachment) {
            action = [];
        }
        else {
            var type = attachment.getFileType();
            if (type == 'png' || type == 'jpg' || type == 'gif') {
                action = ['<a class="btn btn-xs btn-info" title="查看图片" href="javascript:app.showImage(\'',
                                attachment.getFileCode(), '\');">',
                    '<i class="fas fa-file-image"></i>',
                '</a>'];
            }
            else {
                action = ['<a class="btn btn-xs btn-info" title="下载文件" href="javascript:app.downloadFile(\'',
                                attachment.getFileCode(), '\');">',
                    '<i class="fas fa-download"></i>',
                '</a>'];
            }
        }

        var fileDesc = ['<table class="file-label" border="0" cellspacing="4" cellpodding="0">',
                '<tr>',
                    '<td rowspan="2">', '<i class="fa fa-file file-icon"></i>', '</td>',
                    '<td colspan="2" class="file-name">', fileInfo.name, '</td>',
                '</tr>',
                '<tr>',
                    '<td class="file-size">', formatSize(fileInfo.size), '</td>',
                    '<td class="file-action">', action.join(''), '</td>',
                '</tr>',
            '</table>'];
        text = fileDesc.join('');
    }

    var html = ['<div id="', id, '" class="direct-chat-msg ',
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

MessagePanel.prototype.removeMessage = function(message) {
    var view = null;

    if (message.isFromGroup()) {
        view = this.views[message.getGroupId()];
    }
    else {
        var targetId = message.getFrom() == this.app.cubeContact.getId() ? message.getTo() : message.getFrom();
        view = this.views[targetId];
    }

    if (undefined === view || null == view) {
        return;
    }

    var msgEl = view.el.find('#' + message.getId());
    msgEl.remove();
}

/**
 * 更新消息内容。
 * @param {Message} message 
 */
MessagePanel.prototype.updateMessageContent = function(message) {
    var el = this.elMsgView.find('#' + message.getId());
    var attachment = message.getAttachment();
    if (null != attachment) {
        var action = null;
        var type = attachment.getFileType();
        if (type == 'png' || type == 'jpg' || type == 'gif') {
            action = ['<a class="btn btn-xs btn-info" title="查看图片" href="javascript:app.showImage(\'',
                            attachment.getFileCode(), '\');">',
                    '<i class="fas fa-file-image"></i>',
                '</a>'];
        }
        else {
            action = ['<a class="btn btn-xs btn-info" title="下载文件" href="javascript:app.downloadFile(\'',
                            attachment.getFileCode(), '\');">',
                    '<i class="fas fa-download"></i>',
                '</a>'];
        }
        el.find('.file-action').html(action.join(''));
    }
}

MessagePanel.prototype.onDetailsClick = function(e) {
    if (null == this.current) {
        return;
    }

    var view = this.views[this.current.getId()];

    if (view.isGroup) {
        var item = this.app.getGroup(this.current.getId());
        var el = $('#modal_group_details');
        el.find('.widget-user-username').text(item.getName());

        // 设置数据
        $('#group_details_quit').attr('data', item.getId());
        $('#group_details_dissolve').attr('data', item.getId());

        var table = el.find('.table');
        table.find('tbody').remove();
        table.append(view.detailMemberTable);
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

    // 触发发送
    var message = this.app.fireSend(this.current, text);

    this.appendMessage(message.id, this.app.cubeContact, text, Date.now());
}

MessagePanel.prototype.onSendFile = function(e) {
    var file = e.target.files[0];

    // 触发发送
    var message = this.app.fireSend(this.current, file);

    this.appendMessage(message.id, this.app.cubeContact, file, Date.now());
}

MessagePanel.prototype.onNewGroupSubmitClick = function(e) {
    // 提取群名称
    var groupName = $('#new_group_input_name').val();
    if (groupName.length > 0 && groupName.length < 4) {
        ui.showAlert('群组名称不能少于4个字。');
        return;
    }

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
        ui.showAlert('没有选择群成员');
        return;
    }

    $('#new_group_dialog').modal('hide');

    this.submitCreateGroupListener(groupName, memberList);
}

MessagePanel.prototype.onContactListSubmitClick = function(e) {
    var groupId = this.current.getId();
    var memberIdList = [];
    for (var i = 0; i < this.app.cubeContactList.length; ++i) {
        var contact = this.app.cubeContactList[i];
        var el = $('#list_contact_' + contact.getId());

        // 没有被禁用的 checkbox 并且被选中
        if (!el.prop('disabled') && el.prop('checked')) {
            memberIdList.push(contact.getId());
        }
    }

    if (memberIdList.length == 0) {
        ui.showAlert('请选择至少一个联系人。');
        return;
    }

    this.app.fireAddMember(groupId, memberIdList);
    $('#contact_list_dialog').modal('hide');
}

MessagePanel.prototype.onModifyGroup = function(e) {
    if (null == this.current) {
        return;
    }

    var that = this;
    ui.showPrompt('修改群组名称', '请输入新的群组名', function(ok, text) {
        if (ok && text.length > 3) {
            that.app.fireModifyGroupName(that.current.getId(), text);
        }
    });
}

MessagePanel.prototype.onAddGroupMemberClick = function(e) {
    if (null == this.current) {
        return;
    }

    for (var i = 0; i < this.app.cubeContactList.length; ++i) {
        var contact = this.app.cubeContactList[i];
        var el = $('#list_contact_' + contact.getId());
        el.prop('checked', false);
        el.prop('disabled', false);
    }

    var list = this.app.getGroup(this.current.getId()).getMembers();
    for (var i = 0; i < list.length; ++i) {
        var member = list[i];
        var el = $('#list_contact_' + member.getId());
        el.prop('checked', true);
        el.prop('disabled', true);
    }

    // 选中已经在群里的成员
    $('#contact_list_dialog').find('.modal-title').text('选择群成员');
    $('#contact_list_dialog').modal('show');
}

MessagePanel.prototype.onQuitGroupClick = function(e) {
    var id = $('#group_details_quit').attr('data');
    if (this.submitQuitGroupListener(parseInt(id))) {
        $('#modal_group_details').modal('hide');
    }
}

MessagePanel.prototype.onDissolveGroupClick = function(e) {
    var id = $('#group_details_dissolve').attr('data');
    if (this.submitDissolveGroupListener(parseInt(id))) {
        $('#modal_group_details').modal('hide');
    }
}
