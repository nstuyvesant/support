var trigger;
		var w = null;
		var ipReq = false;
		var stsType = "none";
		var player;
		var streamPID;
		var streamTesting = "none";
		var state = [];
		var streamingTime = 30000;
		var nextProtocolTrigger = null;
		var locations = ["bos", "phx", "lon", "fra", "yyz"];
		//var locations = ["bos","phx","lon","fra","syd","can","gdl"];
		var sts = ["wakefield-streaming2", "phx-sts-2", "UK-streaming2", "fra-sts", "YYZ-STS"]
		// var sts = ["wakefield-streaming2","phx-sts-2","UK-streaming2","fra-sts","syd","can","mex"]
		//var locations = ["bos"];
		//var sts = ["wakefield-streaming2"]
		var locIndex = -1;
		var status = "Idle";

		function update() {
		    if (status == "Network") // speedtest is active
		        w.postMessage('status')
		    else if (streamTesting == "active") {
		        state[player.getState()]++;
		        if (player.getState() == "error") {
		            streamTesting = "abort";
		            document.getElementById(locations[locIndex] + "-" + stsType).textContent = "-1";
		            status = "Error";
		            updateStatusText("Streaming tests for " + stsType + " Failed!");
		            clearTimeout(nextProtocolTrigger);
		            nextSts();
		        } else {
		            x = document.getElementById(locations[locIndex] + "-" + stsType).textContent;
		            x = Math.round(100 - (100 / (streamingTime / 100) * state["buffering"]));
		            document.getElementById(locations[locIndex] + "-" + stsType).textContent = x;
		        }
		    }
		} // update

		function eventHandler(event) { // when status is received, split the string and put the values in the appropriate fields
		    var data = event.data.split(';') // string format: status;download;upload;ping (speeds are in mbit/s) (status: 0=not started, 1=downloading, 2=uploading, 3=ping, 4=done, 5=aborted)
		    //console.log("got event: " + event.data);
		    if (data[0] == 4) {
		        w = null;
		        status = "Streaming";
		        updateStatusText("Network test done, starting streaming tests");
		        streamTest();
		    } else if ((data[0] >= 1) && (data[0] <= 3)) {
		        document.getElementById(locations[locIndex] + '-download').textContent = data[1]
		        document.getElementById(locations[locIndex] + '-ping').textContent = data[3]
		        document.getElementById(locations[locIndex] + '-jitter').textContent = data[5]
		        document.getElementById('ip').textContent = data[4]
		        if (!ipReq)
		            IPInfo(data[4]);
		    } else {
		        //console.log("got event: " + event.data);
		    }
		} // eventHandler




		function streamTestActive() {
		    streamTesting = "active";
		    updateStatusText("streaming test for " + locations[locIndex] + " using " + stsType + " now " + streamTesting);
		    nextProtocolTrigger = setTimeout(nextSts, streamingTime);
		} // streamTestActive

		function updateStatus(id, bad, fair, greater, suffix) {

		    value = parseFloat(document.getElementById(id).textContent);
		    if (value == -1) {
		        document.getElementById(id).innerHTML = "<img src=\"error.png\"/>Error"
		    } else if (greater) {
		        if (value > bad) {
		            document.getElementById(id).innerHTML = "<img src=\"sad.png\"/>" + value + suffix
		        } else if (value > fair) {
		            document.getElementById(id).innerHTML = "<img src=\"confused.png\"/>" + value + suffix
		        } else {
		            document.getElementById(id).innerHTML = "<img src=\"happy.png\"/>" + value + suffix
		        }
		    } else {
		        if (value < bad) {
		            document.getElementById(id).innerHTML = "<img src=\"sad.png\"/>" + value + suffix
		        } else if (value < fair) {
		            document.getElementById(id).innerHTML = "<img src=\"confused.png\"/>" + value + suffix
		        } else {
		            document.getElementById(id).innerHTML = "<img src=\"happy.png\"/>" + value + suffix
		        }
		    }
		} // updateStatus

		function nextSts() {

		    state['idle'] = 0;
		    state['buffering'] = 0;
		    state['playing'] = 0;
		    state['paused'] = 0;
		    streamTesting = "init";

		    if (stsType == "none") {
		        stsType = "rtmp"
		    } else {
		        player.stop();
		        player.remove();
		        updateStatusText("Finalizing stream testing for type: " + stsType);
		        updateStatus(locations[locIndex] + '-' + stsType, 85, 95, false, "%");
		        comments();

		        if (stsType == "rtmp")
		            stsType = "rtmpt";
		        else if (stsType == "rtmpt")
		            stsType = "rtmps";
		        else { // done all types, next location
		            updateStatusText("Stopping stream testing");
		            var oReq = new XMLHttpRequest();
		            oReq.addEventListener("load", function() {
		                console.log(this.responseText);
		            });
		            oReq.open("GET", "streamStart.php?type=stop&pid=" + streamPID);
		            oReq.send();
		            streamTesting = "none";
		            if (!nextLocation())
		                stopAll();
		            return;
		        }
		    }

		    status = "Stream";
		    updateStatusText("streaming test for " + locations[locIndex] + " using " + stsType + "and going to:" + sts[locIndex] + " now " + streamTesting);
		    player.setup({
		        flashplayer: "jwv7/jwplayer.flash.swf",
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

		function updateStatusText(msg) {
		    document.getElementById("status").textContent = status + " - " + msg;
		    console.log(status + " - " + msg);
		} // updateStatusText

		function stopAll() {
		    console.log("stopping all tests");
		    if (w)
		        w.postMessage("abort");
		    clearInterval(trigger);
		    status = "stopped";
		    updateStatusText("All stopped");
		    var out = {
		        id: document.getElementById("ip").textContent + "-" + Date.now(),
		        ip: {
		            ip: document.getElementById("ip").textContent,
		            ipInfo: document.getElementById("ipInfo").textContent,
		            proxy: document.getElementById("proxy").textContent
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

		    var oReq = new XMLHttpRequest();
		    oReq.addEventListener("load", function() {
		        console.log(this.responseText);
		    });
		    oReq.open("POST", "result.php");
		    oReq.send(JSON.stringify(out));
		    console.log(JSON.stringify(out));
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
		    oReq.open("GET", "streamStart.php?type=start&sts=" + sts[locIndex]);
		    oReq.send();
		    status = "Init Stream";
		    updateStatusText("Starting stream testing");
		} // streamTest

		function comments() {
		    updateStatus(locations[locIndex] + '-download', 0.5, 0.75, false, "")
		    updateStatus(locations[locIndex] + '-ping', 300, 150, true, "")
		    updateStatus(locations[locIndex] + '-jitter', 100, 50, true, "")

		}

		function newHandler() {
		    w = new Worker('speedtest-worker.js') // create new worker
		    w.onmessage = eventHandler
		    return w
		} // newHandler



		function IPInfoAnswer() {
		    s = JSON.parse(this.responseText);
		    text = "Client location: " + s.city + ", " + s.country + "(" + s.lat + "," + s.lon + "); Organization: " + s.org;
		    document.getElementById("ipInfo").textContent = text
		    // console.log(this.responseText);
		}

		function IPInfo(ip) {
		    var oReq = new XMLHttpRequest();
		    oReq.addEventListener("load", IPInfoAnswer);
		    oReq.open("GET", "http://ip-api.com/json/" + ip);
		    oReq.send();
		    proxyInfo();
		    ipReq = true;
		}

		function proxyInfoAnswer() {
		    document.getElementById("proxy").textContent = this.responseText;
		}

		function proxyInfo() {
		    var oReq = new XMLHttpRequest();
		    oReq.addEventListener("load", proxyInfoAnswer);
		    oReq.open("GET", "http://ec2-52-90-97-231.compute-1.amazonaws.com/speedtest-master/proxyDetect.php");
		    oReq.send();
		}

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
		    updateStatusText("Starting all tests");
		    trigger = setInterval(update, 100) // ask for status every 100ms
		    nextLocation();
		} // start