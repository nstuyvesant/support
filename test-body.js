// Load articles in card lower-left from array (except for Suggestions)
// var loadArticles = function(tabName) {
//     if(tabName != 'suggestion') {
//         $('#articles').empty(); // Clear the card of past articles
//         $.each(caseTree[tabName].articles, function(index, value) {
//             var currentNode = caseTree[tabName].articles[index];
//             var url = currentNode.url;
//             var title = currentNode.title;
//             var synopsis = currentNode.synopsis;
//             var article = `<article><a href="${url}" target="_blank">${title}</a><p class="text-muted">${synopsis}</p></article>`;
//             $('#articles').append(article);
//         });
//     }
// };

// Sets Case Type, Topic, and Subtopic
// var loadSubtopics = function(tabName) {
//     // Set Case Type and Topic
//     $('#type').val(caseTree[tabName].type);
//     $('#topic').val(caseTree[tabName].topic);
//     switch(tabName) {
//         case 'device':
//             $('#caseSystemType').val('Hosted - Mobile');
//             break;
//         case 'web':
//             $('#caseSystemType').val('Hosted - Web');
//             break;
//         default:
//             $('#caseSystemType').val('N/A');
//     }
//     $('#description').val(caseTree[tabName].description);
//     var subtopicsList = $('#subtopic'); // Get a reference so we don't scan the DOM on $.each below
//     subtopicsList.find("option:gt(0)").remove(); // Leave the first item - bag the rest
//     // Add the subtopics for the tab
//     $.each(caseTree[tabName].subtopics, function(index, value) {
//         subtopicsList.append($('<option />').attr('value', value).text(value)); 
//     });
// };

// Extract querystring values
// var qs = function(key) {
//     key = key.replace(/[*+?^$.\[\]{}()|\\\/]/g, "\\$&"); // escape RegEx meta chars
//     var match = location.search.match(new RegExp("[?&]"+key+"=([^&]+)(&|$)"));
//     return match && decodeURIComponent(match[1].replace(/\+/g, " "));
// };

// Grab inbound querystring params into a string to append to description
// var setHiddenParametersField = function() {
//     // Cleanup style later
//     var parameters = '';
//     var timezone = qs('timezone');
//     if(timezone) parameters += `\nUser GMT Offset: ${timezone}`;
//     var mcmVersion = qs('mcmVersion');
//     if(mcmVersion) parameters += `\nCloud Version: ${mcmVersion}`;
//     var manufacturer = qs('manufacturer');
//     if(manufacturer) parameters += `\nManufacturer: ${manufacturer}`;
//     var model = qs('model');
//     if(model) parameters += `\nModel: ${model}`;
//     var os = qs('os');
//     if(os) parameters += `\nOS Version: ${os}`;
//     var deviceId = qs('deviceId');
//     if(deviceId) parameters += `\nDevice ID: ${deviceId}`;
//     var location = qs('location');
//     if(location) parameters += `\nLocation: ${location}`;
//     var executionReport = qs('desc');
//     if(executionReport) parameters += `\n${executionReport}`;
//     if(parameters != '') $('#parameters').val(`\n==== Auto-attached by Perfecto =====${parameters}`);
// };

// Set timestamp for reCAPTCHA settings submitted to Salesforce
// var refreshCaptchaTimestamp = function() {
//     var response = document.getElementById('g-recaptcha-response');
//     if (response == null || response.value.trim() == "") {
//         var elems = JSON.parse($('#captcha_settings').val());
//         elems.ts = JSON.stringify(new Date().getTime());
//         $('#captcha_settings').val(JSON.stringify(elems));
//     }
// }

// Search Confluence via undocumented REST API (searchv3)
// var searchConfluence = function(searchText, index) {
//     if(searchText != '') {
//         const pageSize = 8;
//         const url = `https://cors-anywhere.herokuapp.com/http://developers.perfectomobile.com/rest/searchv3/1.0/search?queryString=${encodeURI(searchText)}&startIndex=${index}&pageSize=${pageSize}`;
//         $.ajax({
//             url: url,
//             headers: {'X-Requested-With': 'XMLHttpRequest'},
//             dataType: 'json',
//             success: function(data, status, xhr) {
//                 console.log('Number of articles', data.total);
//                 console.log('Number of pages', Math.ceil(data.total/pageSize));
//                 var searchResults = [];
//                 var article = '';
//                 $('#searchResults').empty(); // Clear the card of past articles
//                 $('#searchResults').append('<br/><h2>Search Results</h2');
//                 $.each(data.results, function(index, value) {
//                     value.title = value.title.replace(/@@@e?n?d?hl@@@/g, ''); // strip out formatting
//                     value.bodyTextHighlights = value.bodyTextHighlights.replace(/@@@e?n?d?hl@@@/g, ''); // strip out formatting
//                     value.url = `http://developers.perfectomobile.com/pages/viewpage.action?pageId=${value.id}`;
//                     article = `<article><a href="${value.url}" target="_blank">${value.title}</a><p class="text-muted">${value.bodyTextHighlights}<br/><span class="article-date">${value.friendlyDate}</span></p></article>`;
//                     $('#searchResults').append(article);
//                     searchResults.push(article);
//                 });
//                 $('#searchResults').append("<h2>Didn't help? Please continue below to open a case...</h2");
//                 $('#searchStatus').hide();
//                 $('body').css('cursor','default');
//             }
//         });
//         $('#subject').val(searchText);
//     }
// };

// Handle submit on search form
// $('#searchForm').on('submit', function(e) {
//     e.preventDefault();  //prevent form from submitting
//     $('body').css('cursor','progress');
//     $('#searchStatus').show();
//     searchConfluence($('#queryString').val(), 0);
// });

// Handle submit on request form
// $('#requestForm').on('submit', function(e) {
//     // Append parameters to description field
//     $('#description').val(`${$('#description').val()}${$('#parameters').val()}`);
// });

// Handle click on tabs
// $('#topicTabs').on('shown.bs.tab', function(e) {
//     var selectedTabName = $(e.target).attr('aria-controls');
//     loadSubtopics(selectedTabName);
//     if(selectedTabName != 'suggestion') {
//         $('#subtopic').show();
//         $('#severity').show();
//         loadSubtopics(selectedTabName);
//         loadArticles(selectedTabName);
//     } else {
//         $('#subtopic').hide();
//         $('#severity').hide();
//     };
// });




// Conditionally display outage alerts based on cloudStatus object
// var displayOutageAlerts = function(cloudFQDN) {
//     if(cloudStatus.outages.indexOf(cloudFQDN) != -1 || cloudStatus.outages.indexOf('all') != -1) {
//         $('#cloudStatusAlert').show();
//         $('#message').text(cloudStatus.message);
//     }
// };

// Handle change to FQDN
// $('#fqdn').on('change', function(e) {
//     var newFQDN = $(e.target).val();
//     displayOutageAlerts(newFQDN);
// });

// Remove error message on hidden field
// var recaptchaCallback = function() {
//     $('#hiddenRecaptcha').valid();
// };


//=================TEST CODE===================
// Handle click on tabs
$('#issueTypes').on('shown.bs.tab', function(e) {
    var selectedTabName = $(e.target).attr('aria-controls');
    $('#issueTypeSelected').text(selectedTabName);
    $.getJSON('test-hierarchy.json', function(data) {
        $('.typeahead').typeahead({
            source: data.types['Issue'].subtopics
        });
    });
    // loadSubtopics(selectedTabName);
    // if(selectedTabName != 'suggestion') {
    //     $('#subtopic').show();
    //     $('#severity').show();
    //     loadSubtopics(selectedTabName);
    //     loadArticles(selectedTabName);
    // } else {
    //     $('#subtopic').hide();
    //     $('#severity').hide();
    // };
});
//=================TEST CODE===================

// var cloudStatus = {};
// var caseTree = {};

// DOM loaded
$(document).ready(function() {
    // Load typeahead for search field
    // $.getJSON('typeahead.json', function(data) {
    //     $('.typeahead').typeahead({
    //         source: data
    //     });
    // });

    // Load status of clouds to display alert if one or more clouds are having an outage
    // $.getJSON('health.json', function(data) {
    //     cloudStatus = data;
    //     displayOutageAlerts($('#fqdn').val());
    // });

    // setInterval(refreshCaptchaTimestamp, 500); // every half-second
    // setHiddenParametersField();
    // var returnURL = 'https://support.perfecto.io/?submitted=true';
    // $('#retURL').val(returnURL);

    // Show confirmation if submitted
    // if(qs('submitted')) {
    //     $('#submitStatus').show();
    // }

    // // Load required fields from querystring if provided
    // var email = qs('username');
    // $('#email').val(email);
    // $('#email').val(email); // Overcomes Safari bug where placeholder doesn't disappear

    // var fqdn = qs('appUrl');
    // $('#fqdn').val(fqdn);
    // $('#fqdn').val(fqdn); // Overcomes Safari bug where placeholder doesn't disappear

    // var phone = qs('phone');
    // if(phone && phone.length > 10) { // Often +123 is entered as a phone number on the MCM
    //     $('#phone').val(phone);
    //     $('#phone').val(phone); // Overcomes Safari bug where placeholder doesn't disappear                
    // }

    // var name = qs('name');
    // if(name) {
    //     $('#name').val(name);
    //     $('#name').val(name); // Overcomes Safari bug where placeholder doesn't disappear                
    // }

    // var cname = qs('cname');
    // if(!fqdn && cname) {
    //     $('#fqdn').val(`${cname}.perfectomobile.com`);
    //     $('#fqdn').val(`${cname}.perfectomobile.com`); // Overcomes Safari bug where placeholder doesn't disappear
    // }



    // Setup articles and subtopics for default selected tab (Device)
    // $.getJSON('hierarchy.json', function(data) {
    //     caseTree = data;
    //     loadSubtopics('device');
    //     loadArticles('device');
    // });

    // Setup form validate. jQuery Validation bug for selects - must use name not ID
    // $('#requestForm').validate({
    //     ignore: ".ignore",
    //     rules: {
    //         name: {
    //             required: true                        
    //         },
    //         email: {
    //             required: true,
    //             email: true
    //         },
    //         '00ND0000002w9Lj': { // fqdn
    //             required: true,
    //             minlength: 13
    //         },
    //         subject: {
    //             required: true
    //         },
    //         description: {
    //             required: true
    //         },
    //         '00ND0000005cKFJ': { // severity
    //             required: true
    //         },
    //         '00ND0000004nqq2': { // subtopic
    //             required: true
    //         },
    //         hiddenRecaptcha: {
    //             required: function() {
    //                 if (grecaptcha.getResponse() == '') {
    //                     return true;
    //                 } else {
    //                     return false;
    //                 }
    //             }
    //         }
    //     }
    // });
});

// Querystring test params
// ?os=iOS&mcmVersion=18%2E3&deviceId=2A56E99775698D2F1BABD7C1F9D57CA06AF0C7F6&company=Perfecto%20Mobile&cradleId=BOS%2DE8%2D4%2D1%2FVIRTUAL%2F02&hssVersion=18%2E3%2E1&email=nates%40perfectomobile%2Ecom&model=iPhone%2D6&salesforceCustomerId=&location=NA%2DUS%2DBOS&version=10%2E3%2E2&appUrl=demo%2Eperfectomobile%2Ecom&timezone=%2D5&phoneNumber=%2B1%20%28781%29%20697%2D5344&mcmDevVersion=18%2E3%2E0%2E3&manufacturer=Apple&username=nates%40perfectomobile%2Ecom&desc=Execution%20ID%3A%20acirstea%40salesforce.com_AndroidPerfectoCommunityTest_18-03-15_13_00_00_1823%0ATest%20Name%3A%20Android%20Perfecto%20Community%20Test%0AStart%20Time%3A%20Thu%20Mar%2015%202018%2009%3A00%3A12%20GMT-0400%20(EDT)%0AReport%20Link%3A%20https%3A%2F%2Fsalesforce.reporting.perfectomobile.com%2Ftest%2F5aaa6ea7cff47e000b5a7d50%0A
