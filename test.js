// Globals
let running = false;

// Get user's network info from PHP
const getNetworkInfo = function() {
    $.getJSON('https://support.perfecto.io/php/ip-info.php', function(response) {
        var location = response.city + ', ' + response.region + ' (' + response.country + ')';
        $('#ip').val(response.ip);
        $('#proxy').val(response.proxy);
        $('#location').val(location);
        $('#isp').val(response.isp);
        $('#tz').val(response.timezone);
    });
};

// Visually toggle the start/stop button and begin the test
$('#startStop').on('click', function() {
    running = !running; // toggle
    if(running) {
        $('#startStopIcon').removeClass('far fa-play-circle').addClass('far fa-stop-circle');
        console.log('Clicked Start.');
        start();
    } else {
        $('#startStopIcon').removeClass('far fa-stop-circle').addClass('far fa-play-circle');
        console.log('Clicked Stop.');
        stopAll();
    }
});

// DOM ready
$(document).ready(function() {
    getNetworkInfo(); // Detect client's networking and populate fields

    // Initialize the media player
    jwplayer('mediaspace').setup({
        //autostart: true,
        image: 'perfecto-p.svg',
        height: 270, // 9
        width: 480, // 16
        file: 'https://content.jwplatform.com/videos/ld5esXSv-5lUteR9r.mp4',
        rtmp: {
            bufferLength: 0
        }
      });
});

const STREAMINGTIME = 30000;
const dataCenters = ['bos', 'fra', 'gdl', 'lon', 'phx', 'syd', 'yyz'];
const sts = ['wakefield-streaming2', 'fra-sts', 'gdl-sts', 'uk-streaming2', 'phx-sts-2', 'syd-sts', 'yyz-sts'];

var trigger;
var currentDataCenterIndex = -1;
var status = 'Idle';
var speedTestWorker = null;
var stsType = 'none';
var player;
var streamPID;
var streamTesting = 'none';
var state = [];
var nextProtocolTrigger = null;

// Write status near Start/Stop button
function updateStatus(message) {
    $('#status').html(message);
    console.log(message);
}

// When Start is clicked, this is run every 100 ms to write results to page so user sees progress
function speedTestUpdate() {
    if (status === 'Network') // speedtest is active
        speedTestWorker.postMessage('status');
    else if (streamTesting == 'active') {
        state[player.getState()]++;
        var tableCell = '#' + dataCenters[currentDataCenterIndex] + '-' + stsType;
        if (player.getState() === 'error') {
            streamTesting = 'abort';
            $(tableCell).html('-1');
            status = 'Error';
            updateStatus('Streaming tests for ' + stsType + ' failed!');
            clearTimeout(nextProtocolTrigger);
            nextSts();
        } else {
            $(tableCell).html(Math.round(100 - (100 / (STREAMINGTIME / 100) * state['buffering'])));
        }
    }
}

// Invoked by newSpeedTestWorker() when message received. Split string and put values in appropriate fields.
function speedTestMessage(event) { 
    // Format for returned event.data:
    // status;download;upload;ping (speeds are in mbit/s) (status: 0=not started, 1=downloading, 2=uploading, 3=ping, 4=done, 5=aborted)
    let data = event.data.split(';');
    if (data[0] === '4') {
        console.log('Finished network tests.');
        speedTestWorker = null;
        qualifySpeedTestResults();
        //updateStatus('Network tests done.');
        updateStatus('Running streaming tests...')
        status = 'Streaming';
        streamTest();
    } else if((data[0] >= 1) && (data[0] <= 3)) {
        let tableCellPrefix = '#' + dataCenters[currentDataCenterIndex];
        $(tableCellPrefix + '-download').html(data[1]);
        $(tableCellPrefix + '-ping').html(data[3]);
        $(tableCellPrefix + '-jitter').html(data[5]);
    }
}

// Create a worker to handle speed tests and call speedTestMessage() whenever there's a message
function newSpeedTestWorker() {
    speedTestWorker = new Worker('speedtest-worker.js');
    speedTestWorker.onmessage = speedTestMessage;
    return speedTestWorker;
}

// Use globals to keep track of data centers we tested. Pick up from where we left off.
function nextLocation() {
    if(currentDataCenterIndex + 1 < dataCenters.length) {
        currentDataCenterIndex++;
        let dataCenterCode = dataCenters[currentDataCenterIndex];
        let dataCenterName = $('#' + dataCenterCode).html().trim();
        updateStatus('Running network tests to ' + dataCenterName + ' data center...');
        status = 'New';
        speedTestWorker = newSpeedTestWorker();
        status = 'Network';
        speedTestWorker.postMessage('start {"test_order":"I_P_D", "url_dl": "https://' + dataCenterCode + '-lqt.perfectomobile.com/garbage.php", "url_ul": "https://' + dataCenterCode + '-lqt.perfectomobile.com/empty.php", "url_ping": "https://' + dataCenterCode + '-lqt.perfectomobile.com/empty.php", "url_telemetry": "https://' + dataCenterCode + '-lqt.perfectomobile.com/telemetry.php"} ');
        return true;
    } else // no more data centers to test
        return false;
}

// Start testing and invoke update() every 100ms to get status
function start() {
    console.log('Running network tests to each data center.')
    trigger = setInterval(speedTestUpdate, 100);
    nextLocation();
}

// Stop running tests but keep track of where we left off
function stopAll() {
    console.log('Stopping all tests...');
    if(speedTestWorker) speedTestWorker.postMessage('abort');
    clearInterval(trigger);
    status = 'stopped';
    updateStatus('Stopped.');
}

// Qualify whether the results are good, bad, meh, or error
function qualifyResult(id, bad, fair, greater, suffix) {
    let tableCell = $('#' + id);
    let value = parseFloat(tableCell.html());
    if (value == -1) {
        tableCell.html('<i class="fas fa-exclamation-triangle"></i>');
    } else if (greater) {
        if (value > bad) {
            tableCell.html(value + suffix + ' <i class="far fa-thumbs-down"></i>');
        } else if (value > fair) {
            tableCell.html(value + suffix +' <i class="far fa-meh"></i>');
        } else {
            tableCell.html(value + suffix + ' <i class="far fa-thumbs-up"></i>');
        }
    } else {
        if (value < bad) {
            tableCell.html(value + suffix + ' <i class="far fa-thumbs-down"></i>');
        } else if (value < fair) {
            tableCell.html(value + suffix + ' <i class="far fa-meh"></i>');
        } else {
            tableCell.html(value + suffix + ' <i class="far fa-thumbs-up"></i>');
        }
    }
}

// Rate quality for completed network tests
function qualifySpeedTestResults() {
    let dataCenter = dataCenters[currentDataCenterIndex];
    qualifyResult(dataCenter + '-download', 0.5, 0.75, false, '');
    qualifyResult(dataCenter + '-ping', 300, 150, true, '');
    qualifyResult(dataCenter + '-jitter', 100, 50, true, '');
}

// Begin running streaming tests
function streamTestActive() {
    streamTesting = 'active';
    let dataCenterCode = dataCenters[currentDataCenterIndex];
    let dataCenterName = $('#' + dataCenterCode).html().trim();
    updateStatus(stsType.toUpperCase() + ' streaming test to ' + dataCenterName + ' data center...');
    nextProtocolTrigger = setTimeout(nextSts, STREAMINGTIME);
}

function nextSts() {
    state['idle'] = 0;
    state['buffering'] = 0;
    state['playing'] = 0;
    state['paused'] = 0;
    streamTesting = 'init';

    if(stsType == 'none') {
        stsType = 'rtmp'
    } else {
        player.stop();
        player.remove();
        updateStatus('Finalizing ' + stsType.toUpperCase() + ' stream testing...');
        qualifyResult(dataCenters[currentDataCenterIndex] + '-' + stsType, 85, 95, false, '%');
        qualifySpeedTestResults();

        if(stsType == 'rtmp')
            stsType = 'rtmpt';
        else if(stsType == 'rtmpt')
            stsType = 'rtmps';
        else { // done all types, next location
            updateStatus('Stopping stream testing...');

            $.get('https://support.perfecto.io/php/stream-start.php?type=stop&pid=' + streamPID).done(function(response) {
                console.log('stream-start.php?type=stop', response);
            });

            streamTesting = 'none';
            if (!nextLocation())
                stopAll();
            return;
        }
    }

    status = 'Stream';
    let dataCenterCode = dataCenters[currentDataCenterIndex];
    let dataCenterName = $('#' + dataCenterCode).html().trim();
    updateStatus(stsType.toUpperCase() + ' test to ' + dataCenterName + ' (' + sts[currentDataCenterIndex] + ')...');
    player.setup({
        //flashplayer: 'jwv7/jwplayer.flash.swf',
        //autostart: true,
        file: stsType + '://' + sts[currentDataCenterIndex] + '.perfectomobile.com/live/conTest',
        //width: '320',
        //height: '240',
        //rtmp: {
        //    bufferLength: 0,
        //},
        events: {
            onBufferChange: function(obj) {},
            onFirstFrame: function(obj) {}
        }
    });
    setTimeout(streamTestActive, 4000);

}

function streamStarted() {
    streamPID = this.responseText;
    jwplayer.key = "k/WD83HHK6xlWeRUuyRM+5fHBxfSCgwUUC7e++bhF5Urqx59"; // V8
    //jwplayer.key = 'pAFx+xZh2QbZIfGG2QUSVdDSasRktc53eglFxQ854CpEKdIp'; // V7
    player = jwplayer('mediaspace');
    stsType = 'none';
    setTimeout(nextSts, 3000);
    let dataCenterCode = dataCenters[currentDataCenterIndex];
    let dataCenterName = $('#' + dataCenterCode).html().trim();
    updateStatus('Opening stream to ' + dataCenterName + ' data center...');
}

function streamTest() {
    const tableCellPrefix = '#' + dataCenters[currentDataCenterIndex];
    // Show progress while we start streaming tests
    const rotatingPlane = '<div class="sk-rotating-plane"></div>';
    $(tableCellPrefix + '-rtmp').html(rotatingPlane);
    $(tableCellPrefix + '-rtmpt').html(rotatingPlane);
    $(tableCellPrefix + '-rtmps').html(rotatingPlane);

    $.get('https://support.perfecto.io/php/stream-start.php?type=start&sts=' + sts[currentDataCenterIndex]).done(function(response) {
        console.log('stream-start.php?type=start', response);
        streamStarted();
    });
    status = 'Init Stream';
    let dataCenterCode = dataCenters[currentDataCenterIndex];
    let dataCenterName = $('#' + dataCenterCode).html().trim();
    updateStatus('Running streaming test to ' + dataCenterName + ' data center...');
}