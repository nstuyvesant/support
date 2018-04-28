// Variables with global scope
var selectedType;
var selectedTopic;

// Set global type based on tab selection
$('#typeTabs').on('shown.bs.tab', function(e) {
    selectedType = $(e.target).attr('aria-controls');
});

// Set global topic based on tab selection
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

$('#suggestionType').on('click', function(e) {
    $('#contactSupport').hide();
});

// DOM loaded
$(document).ready(function() {
    
});
