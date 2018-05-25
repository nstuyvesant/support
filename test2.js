/* global $, jwplayer, Worker */
// TODO: Change export format to CSV
// TODO: Allow check all / uncheck all
// TODO: Get my sample.mp4 distributed to all streamers /vod directory to replace the existing sample.mp4 bunny animation then comment line 344 and uncomment 345
// TODO: Someday, drop IE11 support and use ES6 formatted strings, arrow functions, Intl.DateTimeFormat().resolvedOptions().timeZone, etc.

// Global constants
const streamTypes = ['rtmp', 'rtmpt', 'rtmps'] // types of streams we'll be testing
const playbackDuration = 30000 // (ms) - how long to test each video stream (30 seconds)
const rotatingPlane = '<div class="sk-rotating-plane"></div>' // cool CSS effect
const errorIcon = '<i class="fas fa-exclamation-triangle"></i>' // triangle
const thumbsUp = ' <i class="far fa-thumbs-up"></i>'
const thumbsDown = ' <i class="far fa-thumbs-down"></i>'
const meh = ' <i class="far fa-meh"></i>' // face with blank expression

// Global variables
let playerEnabled = true
let testResults = { // what to test plus results as they come in
  dataCenters: [
    {
      name: 'Boston-Y',
      code: 'bosy',
      streamer: 'wakefield-streaming6'
    },
    {
      name: 'Boston-Z',
      code: 'bosz',
      streamer: 'wakefield-streaming6-teridions'
    }
  ]
}
let dataCenters = testResults.dataCenters // for easier reference / readability
let running = false // tracks state of Start/Stop button, set in #startStop click handler
let selectedDataCenter = 0 // index of the array element in dataCenters for current tests
let selectedStreamType // index of the array element in streamTypes for current test (increments at top of function so use -1)
let player // reference to JW Player 7 (initially set in DOM ready)
let speedTestWorker // reference to web worker running speed tests
let getTestUpdatesTrigger // enables canceling setInterval on speedTestWorker, exists during speed test only
let testNextStreamerTrigger = null // enables clear timeout on textNextStreamer()
let testTypeRunning = 'None' // possible values: None | Network | Streaming

// Start/Stop button handler
$('#startStop').on('click', function () {
  running = !running // toggle

  if (running) { // Visually alter start/stop button with FontAwesome classes, begin testing
    $('#startStop').removeClass('btn-success').addClass('btn-danger').html('<span id="startStopIcon" class="far fa-stop-circle"></span> Stop Test')
    testNextDataCenter()
  } else {
    stopAll(false)
  }
})

// Test where we left off (redo current data center if results are incomplete)
function testNextDataCenter () {
  // Stop testing if there are no more data centers to test
  if (selectedDataCenter >= dataCenters.length) {
    selectedDataCenter = 0 // reset to beginning because we tested them all
    stopAll(true)
    return false // we're done
  }

  let dataCenterChecked = $('#' + dataCenters[selectedDataCenter].code).is(':checked')

  if (dataCenterChecked && selectedDataCenter < dataCenters.length) {
    // Run speed tests between user and data center (completion is indicated by a triggered event)
    updateStatus('Running ' + dataCenters[selectedDataCenter].name + ' network tests...')
    testTypeRunning = 'Network'
    speedTestWorker = new Worker('speedtest-worker.js')
    getTestUpdatesTrigger = setInterval(getTestUpdates, 100) // Invoke every 100ms - asks web worker for speed test status and tracks streaming buffering
    speedTestWorker.onmessage = speedTestMessageHandler // Writes speed test results to table cells
    speedTestWorker.postMessage('start {"test_order":"I_P_D", "url_dl": "https://bos-lqt.perfectomobile.com/garbage.php", "url_ul": "https://bos-lqt.perfectomobile.com/empty.php", "url_ping": "https://bos-lqt.perfectomobile.com/empty.php", "url_telemetry": "https://bos-lqt.perfectomobile.com/telemetry.php"} ')
    return true // still have more to test
  }

  selectedDataCenter++
  testNextDataCenter()
  return true
}

// Stop running tests but keep track of data center where we left off
function stopAll (done) {
  clearInterval(testNextStreamerTrigger)
  switch (testTypeRunning) {
    case 'Network':
      if (speedTestWorker) speedTestWorker.postMessage('abort')
      clearInterval(getTestUpdatesTrigger)
      speedTestWorker.terminate()
      break
    case 'Streaming':
      finishedStreamingTests(true) // boolean to indicate we want to stop everything and not advance to next data center
      // stopStream(true)
      break
  }
  updateStatus(done ? 'All tests completed.' : 'All tests stopped.')
  testTypeRunning = 'None'
  running = false
  $('#startStop').removeClass('btn-danger').addClass('btn-success').html('<span id="startStopIcon" class="far fa-play-circle"></span> Start Test')
}

// Every 100ms... for speed tests, tell web worker we want status
function getTestUpdates () {
  if (speedTestWorker) speedTestWorker.postMessage('status')
}

// Handle when speedTestMessageHandler() triggers custom jQuery event indicating speed test is done
$('body').on('speedTestComplete', function () {
  clearInterval(getTestUpdatesTrigger) // stop monitoring for status changes
  speedTestWorker.terminate() // kill the web worker
  testTypeRunning = 'None'
  qualifySpeedTestResults()
  if (playerEnabled) {
    player.setConfig({ autostart: true }) // Don't need to invoke player.play() as we advance through playlist
    testTypeRunning = 'Streaming'
    selectedStreamType = -1
    // Show rotating squares while we start streaming tests
    const tableCellPrefix = '#' + dataCenters[selectedDataCenter].code
    $(tableCellPrefix + '-rtmp').html(rotatingPlane)
    $(tableCellPrefix + '-rtmpt').html(rotatingPlane)
    $(tableCellPrefix + '-rtmps').html(rotatingPlane)
    testNextStreamer() // next task in chain of asynchronous events
  } else {
    selectedDataCenter++
    testNextDataCenter()
  }
})

function testNextStreamer () {
  // Move to next element in streamTypes array (why we started at -1 instead of 0)
  selectedStreamType++

  // Finished a streaming test and need to decide what to do next
  if (selectedStreamType > 0) {
    // Calculate played to unplayed percentage (not sure we need to tell user it's a percentage - a 0-100 score is a score)
    let qoe = player.qoe().item.sums
    let played = qoe.playing || qoe.complete || 0
    let notPlayed = (qoe.buffering || 0) + (qoe.loading || 0)
    let elapsedTime = played + notPlayed
    let streamQuality = elapsedTime !== 0 ? Math.round(played * 100 / elapsedTime) : -1 // prevent divide by zero

    // Store streamQuality in results
    let lastStreamTypeCompleted = selectedStreamType - 1 // readability
    dataCenters[selectedDataCenter][streamTypes[lastStreamTypeCompleted]] = streamQuality

    // Update table cell with results
    let tableCell = '#' + dataCenters[selectedDataCenter].code + '-' + streamTypes[lastStreamTypeCompleted]
    $(tableCell).html(streamQuality)
    if (!streamQuality) { // equals zero
      console.log('STREAMING NEVER STARTED (typically associated with 503 errors from streamer)')
      console.log('player state = ', player.getState())
      console.log('playlistItem', player.getPlaylistItem())
      console.log('played', played)
      console.log('notPlayed', notPlayed)
    }
    qualifyResult(tableCell, 80, 90, false, '') // Might need to adjust scores

    if (selectedStreamType === streamTypes.length) { // no more stream types to test
      selectedDataCenter++ // move on to next data center
      if (selectedDataCenter === dataCenters.length) { // unless there are no more
        stopAll(true)
        return
      }

      // Else done with streaming tests until next data center test (see finishedStreamingTests())
      finishedStreamingTests()
      return
    }
  }

  // Advance to the next playlist item in preloaded array to current data center and play
  let selectedPlayListItem = selectedDataCenter * streamTypes.length + selectedStreamType
  player.playlistItem(selectedPlayListItem) // requires player.setConfig({autostart: true})
  updateStatus('Running ' + streamTypes[selectedStreamType].toUpperCase() + ' streaming test from ' + dataCenters[selectedDataCenter].name + '...')
  testNextStreamerTrigger = setTimeout(testNextStreamer, playbackDuration) // Call function again after video has played for playbackDuration
}

function finishedStreamingTests (stopAll) {
  player.stop()
  testTypeRunning = 'None'
  clearTimeout(testNextStreamerTrigger)
  if (!stopAll && selectedDataCenter < dataCenters.length) {
    testNextDataCenter()
  }
}

// Convert blanks to zero, set number of decimal places and return a float
function cleanupResult (value, precision) {
  return value === '' ? 0 : Math.round(value) / precision
}

// Handle messages sent by speedTestWorker
function speedTestMessageHandler (event) {
  // TODO: revise web worker to return JSON rather than semicolon delimited data
  // Format for returned event.data:
  // status;download;upload;latency (speeds are in Mbps) (status: 0=not started, 1=downloading, 2=uploading, 3=latency, 4=done, 5=aborted)
  let data = event.data.split(';')
  if (data[0] === '4') { // Done with network tests, move on to streaming...
    $('body').trigger('speedTestComplete') // trigger custom event handler
  } else if ((data[0] >= 1) && (data[0] <= 3)) { // update the cell
    let tableCellPrefix = '#' + dataCenters[selectedDataCenter].code
    dataCenters[selectedDataCenter].latency = cleanupResult(data[3], 1)
    dataCenters[selectedDataCenter].jitter = cleanupResult(data[5], 1e1)
    dataCenters[selectedDataCenter].download = cleanupResult(data[1], 1)
    $(tableCellPrefix + '-latency').html(dataCenters[selectedDataCenter].latency)
    $(tableCellPrefix + '-jitter').html(dataCenters[selectedDataCenter].jitter)
    $(tableCellPrefix + '-download').html(dataCenters[selectedDataCenter].download)
  };
}

// Qualify whether the results are good, bad, meh, or error
function qualifyResult (id, bad, fair, greater, suffix) {
  let tableCell = $(id)
  let value = parseFloat(tableCell.html())
  if (value <= 0) {
    tableCell.html(errorIcon)
  } else if (greater) {
    if (value > bad) {
      tableCell.html(value + suffix + thumbsDown)
    } else if (value > fair) {
      tableCell.html(value + suffix + meh)
    } else {
      tableCell.html(value + suffix + thumbsUp)
    }
  } else {
    if (value < bad) {
      tableCell.html(value + suffix + thumbsDown)
    } else if (value < fair) {
      tableCell.html(value + suffix + meh)
    } else {
      tableCell.html(value + suffix + thumbsUp)
    }
  }
}

// Rate quality for completed network tests
function qualifySpeedTestResults () {
  let tableCellPrefix = '#' + dataCenters[selectedDataCenter].code
  qualifyResult(tableCellPrefix + '-download', 0.5, 0.75, false, '')
  qualifyResult(tableCellPrefix + '-latency', 300, 150, true, '')
  qualifyResult(tableCellPrefix + '-jitter', 100, 50, true, '')
}

// Handle click on Download Results (intentionally enabled even while test is still running)
$('#download').on('click', function () {
  let dataToDownload = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(testResults))
  let downloadButton = $('#download')
  downloadButton.attr('href', dataToDownload)
  downloadButton.attr('download', 'Perfecto Connectivity Test Results.json')
})

// Handle sites checkbox
$('#sites').change(function () {
  $('input:checkbox').not(this).prop('checked', this.checked)
})

// DOM ready handler
$(document).ready(function () {
  // Detect client's networking and populate fields
  $.getJSON('https://support.perfecto.io/php/ip-info.php', function (response) {
    // loop through returned attributes and write to fields with matching id
    for (let attribute in response) {
      $('#' + attribute).val(response[attribute])
    }
    // Save to test results
    testResults.connectionInfo = response
    // testResults.connectionInfo.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone // curse you IE11 (worst browser ever)
  })

  // Initialize media player with generated playlist
  player = jwplayer('player').setup({ // Use JSON format because jwplayer docs recommend it (although works OK as regular object)
    'playlist': generatePlayList(),
    'rtmp': {
      'bufferLength': 0
    }
    // Player settings configured on www.jwplayer.com:
    // 'height': 868,
    // 'width': 401, // Must be > 400 or Chrome suppresses playback
    // 'displaytitle': false,
    // 'autostart': false,
    // 'primary': 'flash',
    // 'preload': 'none',
    // 'mute': true
  })

  // Handle setup error (either https://content.jwplatform.com needs to be whitelisted or Flash is not enabled)
  player.on('setupError', function () {
    console.log('SETUP ERROR: JW Player')
    playerEnabled = false
    window.alert('Flash is required for the streaming tests (though the speed test will still run). Please enable Flash for https://support.perfecto.io. If Flash is enabled, please make sure https://content.jwplatform.com is whitelisted by your IT team.')
    $('#flashWarning').removeClass('collapse')
    $('#player').hide()
  })
})

// Generates array of RTMP urls for each dataCenter and streamType to pass to player.setup()
function generatePlayList () {
  let playList = []
  for (let dataCenter in dataCenters) {
    for (let streamType in streamTypes) {
      playList.push({
        // file: streamTypes[streamType] + '://' + dataCenters[dataCenter].streamer + '.perfectomobile.com/live/conTest',
        file: streamTypes[streamType] + '://' + dataCenters[dataCenter].streamer + '.perfectomobile.com/vod/sample.mp4',
        image: 'phone.jpg',
        title: dataCenters[dataCenter].name + ' (' + streamTypes[streamType].toUpperCase() + ')'
      })
    }
  }
  return playList
}

// Write status near Start/Stop button and console log
function updateStatus (message) {
  $('#status').html(message)
  console.log(message)
}
