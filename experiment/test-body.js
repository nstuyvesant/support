// Variables with global scope
var selectedType;
var selectedTopic;

// Type chosen and tab displayed. Set global variable and reset state
$('#typeTabs').on('shown.bs.tab', function(e) {
    selectedType = $(e.target).attr('aria-controls');

    // Hide Contact Support (if displayed) until a Topic is re-selected
    $('#contactSupport').removeAttr('style');

    // Reset the Topic selection and hide any visible articles
    selectedTopic = '';
    $('.nav-pills > li > a.nav-link').removeClass('active show');
    $('#articleContent > .tab-pane').removeClass('active show');
});

// Topic chosen and tab displayed. Set global variable.
$('ul.nav-pills').on('shown.bs.tab', function(e) {
    selectedTopic = $(e.target).attr('aria-controls');
    $('#topic').val(selectedTopic);
    $('#contactSupport').show();
});

// Enable tooltips for previously hidden objects
$('.with-tooltips').on('shown.bs.collapse', function() {
    $('[data-toggle="tooltip"]').tooltip({ // Turn on tool tips for the now-visible form
        container: 'body'
    });
});

// DOM loaded
$(document).ready(function() {
    //TODO: Add jQuery validation of form, recaptcha on second form, chat, and TimeTrade
});
