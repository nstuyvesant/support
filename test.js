// Globals
var running = false;
var dataCenters = ['bos', 'phx', 'lon', 'fra', 'syd', 'yyz', 'gdl'];

// Use IP API to get user's network info
const getNetworkInfo = function() {
    $.getJSON('http://ip-api.com/json', function(data) {
        var location = data.city + ', ' + data.region + ' (' + data.countryCode + ')';
        $('#ip').val(data.query);
        $('#location').val(location);
        $('#isp').val(data.isp);
        $('#tz').val(data.timezone);
        //getProxyInfo(data.query); // limited to 100/day unless I register (then 1000/day)
    });
};

// Use proxycheck.io to determine whether there is a proxy
const getProxyInfo = function(ip) {
    $.getJSON('https://proxycheck.io/v2/'+ ip +'?callback=false', function(data) {
        $('#proxy').val(data[ip].proxy == 'no' ? 'No proxy detected' : data[ip].type + ' proxy detected');
    });
};

// const pingTests = function() {
//     for(var dataCenter in dataCenters) {

//     }
// };

// Visually toggle the start/stop button and begin the test
$('#startStop').on('click', function() {
    running = !running; // toggle
    if(running) {
        $('#startStopIcon').removeClass('far fa-play-circle').addClass('far fa-stop-circle');
        console.log('Clicked Start');
        start();
    } else {
        $('#startStopIcon').removeClass('far fa-stop-circle').addClass('far fa-play-circle');
        console.log('Clicked Stop');
        stopAll();
    }
});

// DOM ready
$(document).ready(function() {
    getNetworkInfo(); // Detect client's networking and populate fields
});

//--------------Nate's stuff above this line-----------------
const STREAMINGTIME = 30000;
var trigger;
var w = null;
var ipReq = false;
var stsType = 'none';
var player;
var streamPID;
var streamTesting = 'none';
var state = [];
var nextProtocolTrigger = null;
var locations = ['bos', 'phx', 'lon', 'fra', 'syd', 'yyz', 'gdl'];
var sts = ['wakefield-streaming2', 'phx-sts-2', 'uk-streaming2', 'fra-sts', 'yyz-sts']
var locIndex = -1;
var status = 'Idle';

function update() {
    if (status == 'Network') // speedtest is active
        w.postMessage('status')
    else if (streamTesting == 'active') {
        state[player.getState()]++;
        var tableCell = '#' + locations[locIndex] + "-" + stsType;
        if (player.getState() == 'error') {
            streamTesting = 'abort';
            $(tableCell).html('-1');
            status = 'Error';
            updateStatusText('Streaming tests for ' + stsType + 'Failed!');
            clearTimeout(nextProtocolTrigger);
            nextSts();
        } else {
            x = $(tableCell).html();
            x = Math.round(100 - (100 / (STREAMINGTIME / 100) * state['buffering']));
            $(tableCell).html(x);
        }
    }
}

// When status received, split string and put values in appropriate fields
function eventHandler(event) { 
    // event.data format: status;download;upload;ping (speeds are in mbit/s) (status: 0=not started, 1=downloading, 2=uploading, 3=ping, 4=done, 5=aborted)
    var data = event.data.split(';') 
    if (data[0] == 4) {
        w = null;
        status = 'Streaming';
        updateStatusText('Network tests done. Starting streaming tests.');
        streamTest();
    } else if((data[0] >= 1) && (data[0] <= 3)) {
        var tableCellPrefix = '#' + locations[locIndex];
        $(tableCellPrefix + '-download').html(data[1]);
        $(tableCellPrefix + '-ping').html(data[3]);
        $(tableCellPrefix + '-jitter').html(data[5]);
    }
}

// Begin running streaming tests
function streamTestActive() {
    streamTesting = 'active';
    updateStatusText('Streaming test for ' + locations[locIndex] + ' using ' + stsType + ' now ' + streamTesting);
    nextProtocolTrigger = setTimeout(nextSts, STREAMINGTIME);
}

// Qualify whether the data is good, bad, or meh
function qualifyStatus(id, bad, fair, greater, suffix) {
    var tableCell = $('#' + id);
    var value = parseFloat(tableCell.html());
    if (value == -1) {
        tableCell.html('<i class="fas fa-exclamation-triangle"></i>');
    } else if (greater) {
        if (value > bad) {
            tableCell.html('<i class="far fa-thumbs-down"></i>' + value + suffix);
        } else if (value > fair) {
            tableCell.html('<i class="far fa-meh"></i>' + value + suffix);
        } else {
            tableCell.html('<i class="far fa-thumbs-up"></i>' + value + suffix);
        }
    } else {
        if (value < bad) {
            tableCell.html('<i class="far fa-thumbs-down"></i>' + value + suffix);
        } else if (value < fair) {
            tableCell.html('<i class="far fa-meh"></i>' + value + suffix);
        } else {
            tableCell.html('<i class="far fa-thumbs-up"></i>' + value + suffix);
        }
    }
} // updateStatus

function nextSts() {
    state['idle'] = 0;
    state['buffering'] = 0;
    state['playing'] = 0;
    state['paused'] = 0;
    streamTesting = 'init';

    if(stsType == "none") {
        stsType = "rtmp"
    } else {
        player.stop();
        player.remove();
        updateStatusText('Finalizing stream testing for type: ' + stsType);
        qualifyStatus(locations[locIndex] + '-' + stsType, 85, 95, false, '%');
        comments();

        if(stsType == "rtmp")
            stsType = "rtmpt";
        else if(stsType == "rtmpt")
            stsType = "rtmps";
        else { // done all types, next location
            updateStatusText("Stopping stream testing");
            var oReq = new XMLHttpRequest();
            oReq.addEventListener("load", function() {
                console.log(this.responseText);
            });
            oReq.open("GET", "http://ec2-52-90-97-231.compute-1.amazonaws.com/speedtest-master/streamStart.php?type=stop&pid=" + streamPID);
            oReq.send();
            streamTesting = "none";
            if (!nextLocation())
                stopAll();
            return;
        }
    }

    status = 'Stream';
    updateStatusText("streaming test for " + locations[locIndex] + " using " + stsType + "and going to:" + sts[locIndex] + " now " + streamTesting);
    player.setup({
        flashplayer: "jwplayer.flash.swf",
        autostart: true,
        file: stsType + "://" + sts[locIndex] + ".perfectomobile.com/live/conTest",
        width: "320",
        height: "240",
        rtmp: {
            bufferLength: 0,
        },
        events: {
            onBufferChange: function(obj) {},
            onFirstFrame: function(obj) {}
        }
    });
    setTimeout(streamTestActive, 4000);

} // nextSts

// Write status near Start/Stop button
function updateStatusText(msg) {
    $('#status').html(status + ' - ' + msg);
    console.log(status + " - " + msg);
}

function stopAll() {
    console.log('Stopping all tests');
    if (w)
        w.postMessage("abort");
    clearInterval(trigger);
    status = "stopped";
    updateStatusText("All stopped");
    var out = {
        id: document.getElementById("ip").textContent + "-" + Date.now(),
        ip: {
            ip: $('#ip').val(),
            proxy: $('#proxy').val(),
            location: $('#location').val(),
            location: $('#isp').val(),
            tz: $('#tz').val()
        },
        locations: []
    }
    for (var i = 0, len = locations.length; i < len; i++) {
        out.locations[i] = {
            location: locations[i],
            latency: document.getElementById(locations[i] + '-ping').textContent,
            download: document.getElementById(locations[i] + '-download').textContent,
            jitter: document.getElementById(locations[i] + '-jitter').textContent,
            rtmp: document.getElementById(locations[i] + '-rtmp').textContent,
            rtmpt: document.getElementById(locations[i] + '-rtmpt').textContent,
            rtmps: document.getElementById(locations[i] + '-rtmps').textContent
        }
    }

    // Post to the locations
    $.ajax({
        type: 'POST',
        url: 'http://ec2-52-90-97-231.compute-1.amazonaws.com/speedtest-master/result.php',
        data: JSON.stringify(out),
        contentType: 'application/json; charset=utf-8',
        crossDomain: true,
        dataType: 'jsonp',
        success: function(data) {
            console.log(data);
        }
    });

    // var oReq = new XMLHttpRequest();
    // oReq.addEventListener("load", function() {
    //     console.log(this.responseText);
    // });
    // oReq.open("POST", "result.php");
    // oReq.send(JSON.stringify(out));
    // console.log(JSON.stringify(out));
} // stopAll

function streamStarted() {
    streamPID = this.responseText;
    // jwplayer.key = "k/WD83HHK6xlWeRUuyRM+5fHBxfSCgwUUC7e++bhF5Urqx59"; // V8
    jwplayer.key = "pAFx+xZh2QbZIfGG2QUSVdDSasRktc53eglFxQ854CpEKdIp"; // V7
    player = jwplayer("mediaspace");
    stsType = "none";
    setTimeout(nextSts, 3000);
    updateStatusText("Stream initialized for location: " + locations[locIndex]);
} // streamStarted

function streamTest() {

    document.getElementById(locations[locIndex] + '-rtmp').textContent = 100;
    document.getElementById(locations[locIndex] + '-rtmpt').textContent = 100;
    document.getElementById(locations[locIndex] + '-rtmps').textContent = 100;

    var oReq = new XMLHttpRequest();
    oReq.addEventListener("load", streamStarted);
    oReq.open("GET", "http://ec2-52-90-97-231.compute-1.amazonaws.com/speedtest-master/streamStart.php?type=start&sts=" + sts[locIndex]);
    oReq.send();
    status = "Init Stream";
    updateStatusText("Starting stream testing");
} // streamTest

function comments() {
    qualifyStatus(locations[locIndex] + '-download', 0.5, 0.75, false, "");
    qualifyStatus(locations[locIndex] + '-ping', 300, 150, true, "");
    qualifyStatus(locations[locIndex] + '-jitter', 100, 50, true, "");
}

function newHandler() {
    w = new Worker('speedtest-worker.js'); // create new worker
    w.onmessage = eventHandler;
    return w;
} // newHandler


function nextLocation() {
    if (locIndex + 1 < locations.length) {
        locIndex = locIndex + 1;
        status = "New";
        updateStatusText("Starting DC #" + locIndex + "(" + locations[locIndex] + ")");
        w = newHandler()
        status = "Network";
        updateStatusText("starting network test for " + locations[locIndex])
        w.postMessage('start {"test_order":"I_P_D",	"url_dl": "http://' + locations[locIndex] + '-lqt.perfectomobile.com/garbage.php", "url_ul": "http://' + locations[locIndex] + '-lqt.perfectomobile.com/empty.php", "url_ping": "http://' + locations[locIndex] + '-lqt.perfectomobile.com/empty.php", "url_telemetry": "http://' + locations[locIndex] + '-lqt.perfectomobile.com/telemetry.php"} ')
        return true;
    } else
        return false;
} // nextLocation


function start() {
    updateStatusText("Starting Tests");
    trigger = setInterval(update, 100) // ask for status every 100ms
    nextLocation();
} // start