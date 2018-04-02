var caseTree = {};

$.getJSON('test-hierarchy.json', function(data) {
    caseTree = data;
});

// Handle click on tabs
$('#issueTypes').on('shown.bs.tab', function(e) {
    var selectedTabName = $(e.target).attr('aria-controls');
    $('#issueTypeSelected').text(selectedTabName);
    $('.typeahead').typeahead({
        // TODO: load the one appropriate for selectedTabName
        source: caseTree.types[0].topics[0].subtopics
    });
    $('#searchResults').empty(); // Clear the card of past articles
    $('#searchResults').append('<br/><h2>Maybe one of these articles can help...</h2');
    var searchResults = [];
    var article = '';
    $.each(caseTree.types[0].topics[0].articles, function(index, value) {
        value.url = `http://developers.perfectomobile.com/pages/viewpage.action?pageId=${value.id}`;
        article = `<article><a href="${value.url}" target="_blank">${value.title}</a><p class="text-muted">${value.synopsis}</p></article>`;
        $('#searchResults').append(article);
        searchResults.push(article);
    });
    $('#didNotHelp').show();
    $('body').css('cursor','default');
});

// DOM loaded
$(document).ready(function() {

});
