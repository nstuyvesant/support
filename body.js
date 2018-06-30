/* global $, location, gtag, grecaptcha, intlTelInputUtils, Munchkin, FormData */
// Variables with global scope
let selectedType
let selectedTopic
let cloudStatus = {}

// Set timestamp for reCAPTCHA settings submitted to Salesforce (both forms)
function refreshCaptchaTimestamps () {
  // Only save updated captcha settings if form's captcha response is null or empty (for each form)
  let response = $('#g-recaptcha-response')
  if (response == null || response.val().trim() === '') {
    let captchaSettings = JSON.parse($('#captchaSettings').val())
    captchaSettings.ts = JSON.stringify(new Date().getTime())
    $('#captchaSettings').val(JSON.stringify(captchaSettings))
  }
}

// Remove error message on hidden field
function recaptchaCallback () {
  $('#hiddenRecaptcha').valid()
}

// Extract querystring values
function qs (key) {
  key = key.replace(/[*+?^$.[\]{}()|\\/]/g, '\\$&') // escape RegEx meta chars
  let match = location.search.match(new RegExp('[?&]' + key + '=([^&]+)(&|$)'))
  return match && decodeURIComponent(match[1].replace(/\+/g, ' '))
}

// If execution report is provided, put in hidden field for later append to description
function setHiddenParametersField () {
  let executionReport = qs('desc')
  if (executionReport) $('#parameters').val('\n==== Auto-attached by Perfecto =====\n' + executionReport)
}

// Conditionally display outage alerts based on cloudStatus object
function displayOutageAlerts (cloudFQDN) {
  if (cloudStatus.outages.indexOf(cloudFQDN) !== -1 || cloudStatus.outages.indexOf('all') !== -1) {
    $('#cloudStatusAlert').show()
    $('#message').text(cloudStatus.message)
    // Report outage alert to Google Analytics
    gtag('event', 'Outage: ' + cloudFQDN)
  }
}

// Change cursor to busy on any AJAX operation
$(document).ajaxStart(function () {
  $(document.body).css({'cursor': 'wait'})
}).ajaxStop(function () {
  $(document.body).css({'cursor': 'default'})
})

// Handle change to FQDN
$('#fqdn').on('change', function (e) {
  let newFQDN = $(e.target).val()
  displayOutageAlerts(newFQDN)
})

// Handle change to phone
$('#phone').on('change', function () {
  let phoneFormatted = $('#phone').intlTelInput('getNumber', intlTelInputUtils.numberFormat.INTERNATIONAL)
  $('#phone').val(phoneFormatted)
  $('#phone').val(phoneFormatted) // Overcome Safari bug by doing it twice
})

// Type chosen and tab displayed. Set global variable and reset state
$('#typeTabs').on('shown.bs.tab', function (e) {
  selectedType = $(e.target).attr('aria-controls')
  $('#type').val(selectedType)

  // Treat types as virtual pages with Google Analytics
  gtag('config', 'UA-2078617-29', {'page_path': '/' + selectedType.toLowerCase()})

  // Hide Contact Support (if displayed) until a Topic is re-selected
  $('#contactSupport').removeAttr('style')

  // Reset the Topic selection and hide any visible articles
  selectedTopic = ''
  $('.nav-pills > li > a.nav-link').removeClass('active show')
  $('#articleContent > .tab-pane').removeClass('active show')
})

// Topic chosen and tab displayed. Set global variable.
$('ul.nav-pills').on('shown.bs.tab', function (e) {
  let target = $(e.target)
  selectedTopic = target.attr('aria-controls')
  let description = target.attr('data-description')
  let selectedTopicHref = target.attr('href')
  // Set the form fields (not currently visible)
  $('#topic').val(selectedTopic)
  $('#description').val(description)

  if (selectedTopic === 'Cloud: Outage') { // Make Urgent visible
    $('#priorityLow').parent().removeClass('selected')
    let priorityUrgent = $('#priorityUrgent')
    priorityUrgent.prop('checked', true)
    priorityUrgent.parent().removeClass('collapse')
    priorityUrgent.parent().addClass('selected')
    $('#priorityHigh').parent().removeClass('currently-last')
  } else { // Reset priority
    $('#priorityUrgent').parent().addClass('collapse')
    $('#priorityUrgent').removeClass('selected')
    $('#priorityLow').prop('checked', true)
    $('#priorityLow').parent().addClass('selected')
    $('#priorityHigh').parent().addClass('currently-last')
  }
  // Show Contact Support area (Chat and Open Case)
  $('#contactSupport').show()

  // Treat topics as virtual pages with Google Analytics
  gtag('config', 'UA-2078617-29', {'page_path': '/' + selectedType.toLowerCase() + selectedTopicHref})
})

// Enable tooltips for previously hidden objects
$('.with-tooltips').on('shown.bs.collapse', function () {
  $('[data-toggle="tooltip"]').tooltip({ // Turn on tool tips for the now-visible form
    container: 'body'
  })
})

// Handle submit on request form
$('#requestForm').on('submit', function (e) {
  $('#submit').prop('disabled', true) // prevent double submissions
  e.preventDefault()
  if ($('#requestForm').valid) {
    // Append execution URL to description
    $('#description').val($('#description').val() + $('#parameters').val())
    // Submit the form via AJAX
    $.ajax({
      url: 'https://support.perfecto.io/php/create-case.php', // full URL makes it easier to test locally
      type: 'POST',
      data: new FormData(this),
      dataType: 'json',
      enctype: 'multipart/form-data',
      contentType: false,
      cache: false,
      processData: false,
      success: function (response) {
        // Clear the subject and description, reset priority to Low
        $('#subject').val('')
        $('#description').val('')
        $('#priorityLow').prop('checked', true) // doesn't visually correct the radio buttons (TODO: function)
        $('#supportCase').removeClass('show') // hide form
        $('#contactSupport').removeAttr('style')
        // Reset the page state
        $('.active.show').removeClass('active show')
        // Provide case number and URL in alert to show case was successfully created
        $('#caseNumber').text('Case ' + response.number).attr('href', response.url).attr('target', '_blank')
        $('#submitStatus').show()
        // Tell Google Analytics we submitted
        gtag('event', 'Case Submitted') // general
        gtag('event', 'Case: ' + selectedTopic) // specific
      }
    })
      .fail(function (e) {
        console.log('Form submission not successful', e)
      })
      .always(function () {
        $('#submit').prop('disabled', false) // re-enable the Submit button
      })
  }
})

// DOM ready
$(document).ready(function () {
  // Load status of clouds to display alert if one or more clouds are having an outage
  $.getJSON('health.json', function (data) {
    cloudStatus = data
    displayOutageAlerts($('#fqdn').val())
  })

  // reCAPTCHA requires a timestamp updated every half-second
  setInterval(refreshCaptchaTimestamps, 500)
  setHiddenParametersField()

  // Make radio buttons in button-groups work
  $('input[name=priority]:radio').on('change', function (e) {
    let target = $(e.target)
    $('label.btn').removeClass('selected')
    target.parent().addClass('selected')
  })

  // Load required fields from querystring (if provided)

  let name = qs('name')
  if (name) {
    $('#name').val(name)
  }

  let email = qs('username') // or could use email parameter sent (not sure why both are sent by MCM)
  if (!email) {
    email = qs('email')
  }
  $('#email').val(email)

  let phone = qs('phone')
  if (phone && phone.length > 10) { // Discard if it's too short to be real
    $('#phone').val(phone)
  }
  $('#phone').intlTelInput({
    nationalMode: false,
    utilsScript: 'https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/12.1.13/js/utils.js'
  })

  let fqdn = qs('appUrl')
  $('#fqdn').val(fqdn)

  // Report source to Google Analytics
  let origin = qs('origin') || 'Web'
  if (fqdn) {
    gtag('event', 'Visit: MCM/Digitalzoom')
  } else if (origin === 'Customer Portal') {
    gtag('event', 'Visit: Customer Portal')
  } else {
    gtag('event', 'Visit: Direct')
  }

  // Digitalzoom sends the FQDN as cname instead of appUrl
  let cname = qs('cname')
  if (!fqdn && cname) {
    $('#fqdn').val(cname + '.perfectomobile.com')
  }

  // Set hidden form fields. While iterating each parameter would be more compact, explicit assignments are easier to manage
  $('#origin').val(origin)
  $('#company').val(qs('company'))
  let timezone = qs('timezone')
  if (!timezone) {
    let d = new Date()
    let n = d.getTimezoneOffset()
    timezone = -n / 60
  }
  $('#timezone').val(timezone)
  $('#mcmVersion').val(qs('mcmVersion'))
  $('#hssVersion').val(qs('hssVersion'))
  $('#location').val(qs('location'))
  $('#cradleId').val(qs('cradleId'))
  $('#deviceId').val(qs('deviceId'))
  $('#model').val(qs('model'))
  $('#os').val(qs('os'))
  $('#version').val(qs('version'))

  // Setup form validation for Cases. jQuery Validation bug for selects - must use name not ID.
  $('#requestForm').validate({
    ignore: '.ignore',
    rules: {
      priority: {
        required: true
      },
      name: {
        required: true
      },
      email: {
        required: true,
        email: true
      },
      phone: {
        required: {
          depends: function (element) {
            return ($('#priority').val() === 'Urgent' || $('#priority').val() === 'High')
          }
        }
      },
      fqdn: {
        required: true,
        minlength: 13
      },
      subject: {
        required: true
      },
      description: {
        required: true
      },
      hiddenRecaptcha: {
        required: function () {
          if (grecaptcha.getResponse() === '') {
            return true
          } else {
            return false
          }
        }
      }
    }
  })

  // Marketo Munchkin
  $.ajax({
    url: 'https://munchkin.marketo.net/munchkin-beta.js',
    dataType: 'script',
    cache: true,
    success: function () {
      Munchkin.init('482-YUQ-296')
    }
  })
})

// Querystring test params
// ?os=iOS&mcmVersion=18%2E3&deviceId=2A56E99775698D2F1BABD7C1F9D57CA06AF0C7F6&company=Perfecto%20Mobile&cradleId=BOS%2DE8%2D4%2D1%2FVIRTUAL%2F02&hssVersion=18%2E3%2E1&email=nates%40perfectomobile%2Ecom&model=iPhone%2D6&salesforceCustomerId=&location=NA%2DUS%2DBOS&version=10%2E3%2E2&appUrl=demo%2Eperfectomobile%2Ecom&timezone=%2D5&phoneNumber=%2B1%20%28781%29%20697%2D5344&mcmDevVersion=18%2E3%2E0%2E3&manufacturer=Apple&username=nates%40perfectomobile%2Ecom&desc=Execution%20ID%3A%20acirstea%40salesforce.com_AndroidPerfectoCommunityTest_18-03-15_13_00_00_1823%0ATest%20Name%3A%20Android%20Perfecto%20Community%20Test%0AStart%20Time%3A%20Thu%20Mar%2015%202018%2009%3A00%3A12%20GMT-0400%20(EDT)%0AReport%20Link%3A%20https%3A%2F%2Fsalesforce.reporting.perfectomobile.com%2Ftest%2F5aaa6ea7cff47e000b5a7d50%0A
