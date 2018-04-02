var caseTree = {};

$.getJSON('test-hierarchy.json', function(data) {
    caseTree = data;
});

// Handle click on tabs
$('#issueTypes').on('shown.bs.tab', function(e) {
    var selectedTabName = $(e.target).attr('aria-controls');
    $('#issueTypeSelected').text(selectedTabName);
    $('.typeahead').typeahead({
        source: caseTree.types[0].topics[0].subtopics
    });
});

// DOM loaded
$(document).ready(function() {

});
