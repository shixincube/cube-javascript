// ContactDetails.js

(function(g) {
    'use strict'

    var ContactDetails = function() {
    }

    ContactDetails.prototype.show = function(contact) {
        var el = $('#modal_contact_details');
        el.find('.widget-user-username').text(contact.getName());
        el.find('.widget-user-desc').text(contact.getId());
        el.find('.user-avatar').attr('src', contact.getContext().avatar);
        el.find('.user-state').text(contact.getContext().state == 'online' ? '在线' : '离线');
        el.find('.user-region').text(contact.getContext().region);
        el.find('.user-department').text(contact.getContext().department);
        el.modal('show');
    }

    g.ContactDetails = ContactDetails;

})(window);
