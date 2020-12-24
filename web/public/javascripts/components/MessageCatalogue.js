// MessageCatalogue.js

(function(g) {
    'use strict'

    var MessageCatalogue = function(el) {
        this.el = el;
        this.items = [];
    };

    MessageCatalogue.prototype.getItem = function(itemId) {
        var id = parseInt(itemId);
        for (var i = 0; i < this.items.length; ++i) {
            var item = this.items[i];
            if (item.id == id) {
                return item;
            }
        }
        return null;
    }

    /**
     * 
     * @param {Contact|Group|Account} value 
     */
    MessageCatalogue.prototype.appendItem = function(value) {
        var index = this.items.length;
        var id = 0;
        var el = null;
        var thumb = 'images/group-avatar.png';
        var label = null;
        var desc = null;
        var badge = null;

        if (value instanceof Group) {
            id = value.getId();
            label = value.getName();
            desc = ' ';
            badge = formatShortTime(value.getLastActiveTime());
        }
        else if (value instanceof Contact) {
            id = value.getId();
            label = value.getName();
            desc = ' ';
            badge = '';
        }
        else {
            id = value.id;
            thumb = value.avatar;
            label = value.name;
            desc = ' ';
            badge = '';
        }

        if (null == label) {
            return;
        }

        var item = this.getItem(id);
        if (null != item) {
            return;
        }

        item = {
            index: index,
            id: id,
            el: el,
            thumb: thumb,
            label: label,
            desc: desc,
            badge: badge
        };

        this.items.push(item);

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

        this.el.append(el);

        var that = this;
        el.on('click', function(e) {
            var itemId = parseInt($(this).attr('data'));
            that.onItemClick(itemId);
        });
    }

    MessageCatalogue.prototype.onItemClick = function(id) {

    }

    g.MessageCatalogue = MessageCatalogue;

})(window);
