// ui-message.js

function MessagePanel(el) {
    this.el = el;

    this.elTitle = el.find('.card-title');
    this.elMsgView = el.find('.card-body');
    this.elInput = el.find('textarea');
    this.elInput.val('');
    if (!this.elInput[0].hasAttribute('disabled')) {
        this.elInput.attr('disabled', 'disabled');
    }

    var that = this;
    $('#btn_send').on('click', function(e) {
        that.onSendClick(e);
    });

    this.owner = null;
    this.current = null;
    this.targets = {};

    this.sendListener = null;
}

MessagePanel.prototype.setOwner = function(account) {
    this.owner = account;
}

MessagePanel.prototype.setSendListener = function(listener) {
    this.sendListener = listener;
}

MessagePanel.prototype.changeTarget = function(target) {
    if (null == this.current) {
        this.elInput.removeAttr('disabled');
        $('#btn_send').removeAttr('disabled');
    }
    else {
        // 记录
        var record = this.targets[this.current.id];
        var el = this.elMsgView.find('.direct-chat-messages');
        record.elMessages = el;
        el.remove();
    }

    var record = this.targets[target.id];
    if (undefined === record) {
        var el = $('<div class="direct-chat-messages"></div>');
        this.elMsgView.append(el);
        record = {
            target: target,
            elMessages: this.elMsgView.find('.direct-chat-messages')
        };
        this.targets[target.id] = record;
    }
    else {
        var el = record.elMessages;
        this.elMsgView.append(el);
    }

    this.current = target;

    this.elTitle.text(target.name);
}

MessagePanel.prototype.appendMessage = function(from, text, time) {
    var right = '';
    var nfloat = 'float-left';
    var tfloat = 'float-right';

    if (from.id == this.owner.id) {
        right = 'right';
        nfloat = 'float-right';
        tfloat = 'float-left';
    }

    var html = ['<div class="direct-chat-msg ', right, '"><div class="direct-chat-infos clearfix"><span class="direct-chat-name ', nfloat, '">',
        from.name,
        '</span><span class="direct-chat-timestamp ', tfloat, '">',
        formatShortTime(time),
        '</span></div>',
        '<img src="', from.avatar, '" class="direct-chat-img">',
        '<div class="direct-chat-text">', text, '</div></div>'
    ];

    var parentEl = this.targets[this.current.id].elMessages;
    parentEl.append($(html.join('')));
}

MessagePanel.prototype.onSendClick = function(e) {
    var text = this.elInput.val();
    if (text.length == 0) {
        return;
    }

    this.appendMessage(this.owner, text, Date.now());
    this.sendListener.call(this.current, text);

    this.elInput.val('');
}