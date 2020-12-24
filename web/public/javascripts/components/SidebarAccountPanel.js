// SidebarAccountPanel.js

(function(g) {
    'use strict'

    var SidebarAccountPanel = function(el) {
        this.el = el;
    };

    SidebarAccountPanel.prototype.updateAvatar = function(path) {
        this.el.find('img[data-target="avatar"]').attr('src', path);
    }

    SidebarAccountPanel.prototype.updateName = function(name) {
        this.el.find('a[data-target="name"]').text(name);
    }

    g.SidebarAccountPanel = SidebarAccountPanel;

})(window);
