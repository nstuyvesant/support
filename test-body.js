// Handle click on tabs
$('#issueTypes').on('shown.bs.tab', function(e) {
    var selectedTabName = $(e.target).attr('aria-controls');
    $('#issueTypeSelected').text(selectedTabName);
    $.getJSON('test-hierarchy.json', function(data) {
        console.log(data);
        // $('.typeahead').typeahead({
        //     source: data.types['Issue'].subtopics
        // });
    });
});

// DOM loaded
$(document).ready(function() {
});
