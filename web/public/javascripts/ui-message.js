// ui-message.js

function MessagePanel(el) {
    this.el = el;

    this.elTitle = el.find('.card-title');
}

MessagePanel.prototype.setTitle = function(title) {
    this.elTitle.text(title);
}
