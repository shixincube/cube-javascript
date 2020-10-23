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
        el.find('.modal-body').text(content);

        confirmCallback = callback;

        el.modal();
    }

    g.ui.fireConfirm = function(yesOrNo) {
        confirmCallback(yesOrNo);
    }

    g.ui.showConfirm = showConfirm;
})(window);


/**
 * 消息目录。
 */
function MessageCatalogue(app) {
    this.app = app;
    this.catalogues = app.catalogues;

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

    var accountId = parseInt(el.attr('data'));
    var that = this;

    this.app.getAccount(accountId, function(data, textStatus) {
        if (textStatus == 'success') {
            that.clickListener(data);
        }
    });
}




/**
 * 消息面板。
 */
function MessagePanel(contacts) {
    this.el = $('#messages');

    this.elTitle = this.el.find('.card-title');
    this.elMsgView = this.el.find('.card-body');
    this.elInput = this.el.find('textarea');
    this.elInput.val('');
    if (!this.elInput[0].hasAttribute('disabled')) {
        this.elInput.attr('disabled', 'disabled');
    }

    var that = this;
    $('#btn_send').on('click', function(e) {
        that.onSendClick(e);
    });
    this.elInput.keypress(function(event) {
        var e = event || window.event;
        if (e && e.keyCode == 13 && e.ctrlKey) {
            that.onSendClick(e);
        }
    });

    this.owner = null;
    this.current = null;

    this.views = {};
    for (var i = 0; i < contacts.length; ++i) {
        var contact = contacts[i];
        var el = $('<div class="direct-chat-messages"></div>');
        this.views['' + contact.id] = {
            el: el,
            contact: contact,
            messageIds: []
        };
    }

    this.sendListener = null;
}

MessagePanel.prototype.setOwner = function(account) {
    this.owner = account;
}

MessagePanel.prototype.setSendListener = function(listener) {
    this.sendListener = listener;
}

/**
 * 更换当前的目标面板。
 * @param {object} target 目标联系人。
 */
MessagePanel.prototype.changeTarget = function(target) {
    if (null == this.current) {
        this.elInput.removeAttr('disabled');
        $('#btn_send').removeAttr('disabled');
    }
    else {
        // 记录
        var view = this.views['' + this.current.id];
        view.el.remove();
    }

    var view = this.views['' + target.id];
    this.elMsgView.append(view.el);

    this.current = target;

    this.elTitle.text(target.name);

    // 滚动条控制
    var offset = parseInt(this.elMsgView.prop('scrollHeight'));
    this.elMsgView.scrollTop(offset);
}

/**
 * 添加消息到面板。
 * @param {object} sender 发送人。
 * @param {string} text 消息内容。
 * @param {number} time 消息时间戳。
 * @param {object} [target] 目标面板。
 */
MessagePanel.prototype.appendMessage = function(sender, text, time, target) {
    var targetId = (undefined !== target) ? target.id : this.current.id;

    var view = this.views['' + targetId];

    var right = '';
    var nfloat = 'float-left';
    var tfloat = 'float-right';

    if (sender.id == this.owner.id) {
        right = 'right';
        nfloat = 'float-right';
        tfloat = 'float-left';
    }

    var html = ['<div class="direct-chat-msg ', right, '"><div class="direct-chat-infos clearfix"><span class="direct-chat-name ', nfloat, '">',
        sender.name,
        '</span><span class="direct-chat-timestamp ', tfloat, '">',
        formatFullTime(time),
        '</span></div>',
        '<img src="', sender.avatar, '" class="direct-chat-img">',
        '<div class="direct-chat-text">', text, '</div></div>'
    ];

    var parentEl = view.el;
    parentEl.append($(html.join('')));

    // 滚动条控制
    var offset = parseInt(this.elMsgView.prop('scrollHeight'));
    this.elMsgView.scrollTop(offset);
}

MessagePanel.prototype.onSendClick = function(e) {
    var text = this.elInput.val();
    if (text.length == 0) {
        return;
    }

    this.elInput.val('');

    this.appendMessage(this.owner, text, Date.now());
    this.sendListener.call(null, this.current, text);
}

