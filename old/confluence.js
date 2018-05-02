// Sets Case Type and Topic
var loadTopics = function() {
    // Set Case Type and Topic
    $('#type').val(caseTree[selectedTabName].type);
    $('#description').val(caseTree[selectedTabName].description);
    var topicsList = $('#topic'); // Get a reference so we don't scan the DOM on $.each below
    topicsList.find("option:gt(0)").remove(); // Leave the first item - bag the rest
    // Add the topics for the tab
    $.each(caseTree[selectedTabName].topics, function(index, value) {
        topicsList.append($('<option />').attr('value', value).text(value)); 
    });
};

// Search Confluence via undocumented REST API (searchv3)
var searchConfluence = function(searchText, index) {
    if(searchText != '') {
        // Report search event to Google Analytics
        gtag('event', 'Search');
        gtag('event', 'Search: ' + searchText);
        // Next line can be removed once Confluence gets an SSL cert
        var pageSize = 8;
        var url = 'https://developers.perfectomobile.com/rest/searchv3/1.0/search?queryString=' + encodeURI(searchText) + '&startIndex=' + index + '&pageSize=' + pageSize;
        $.ajax({
            url: url,
            headers: {'X-Requested-With': 'XMLHttpRequest'},
            dataType: 'json',
            success: function(data, status, xhr) {
                // Log these in case we want to put in pagination later
                console.log('Number of articles', data.total);
                console.log('Number of pages', Math.ceil(data.total/pageSize));
                var searchResults = [];
                var article = '';
                $('#searchResults').empty(); // Clear the card of past articles
                $('#searchResults').append('<br/><h2>Search Results</h2');
                $.each(data.results, function(index, value) {
                    value.title = value.title.replace(/@@@e?n?d?hl@@@/g, ''); // strip out formatting (odd Confluence tags)
                    value.bodyTextHighlights = value.bodyTextHighlights.replace(/@@@e?n?d?hl@@@/g, ''); // strip out formatting
                    value.url = 'http://developers.perfectomobile.com/pages/viewpage.action?pageId=' + value.id;
                    article = '<article><a href="' + value.url + '" class="search" target="_blank">' + value.title + '</a><p class="text-muted">' + value.bodyTextHighlights + '<br/><span class="article-date">' + value.friendlyDate + '</span></p></article>';
                    $('#searchResults').append(article);
                    searchResults.push(article);
                });
                $('#searchResults').append("<h2>Didn't help? Please continue below to open a case...</h2");
                $('#searchStatus').hide();
                // Setup Google Analytics tracking on articles found
                $('a.search').on('click', function(e) {
                    var articleName = $(e.target).text();
                    gtag('event', 'Search Article');
                    gtag('event', 'Search Article: ' + articleName);
                });
                // Change cursor to normal
                $('body').css('cursor','default');
            }
        });
        $('#subject').val(searchText);
    }
};

// Handle submit on search form
$('#searchForm').on('submit', function(e) {
    e.preventDefault();  // prevent form from submitting
    $('body').css('cursor','progress');
    $('#searchStatus').show();
    searchConfluence($('#queryString').val(), 0);
});

// DOM loaded
$(document).ready(function() {
    // Load typeahead for search field
    $.getJSON('typeahead.json', function(data) {
        $('.typeahead').typeahead({
            source: data
        });
    });
});