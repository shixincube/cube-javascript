// signin.js

$(document).ready(function() {
    $('#accout_id').on('changed.bs.select', function(e, clickedIndex, isSelected, previousValue) {
        $('#account_name').val(gAccounts[parseInt(clickedIndex)].name);
    })
});
