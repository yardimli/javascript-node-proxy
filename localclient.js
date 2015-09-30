"use strict";

$(document).ready(function() {

	// if user is running mozilla then use it's built-in WebSocket
	window.WebSocket = window.WebSocket || window.MozWebSocket;

	if (!window.WebSocket) {
		$("#debug").prepend('<br>' + (new Date()) + ' Sorry, but your browser doesn\'t ' + 'support WebSockets.');
		return;
	}

	var connection = new WebSocket('ws://192.168.1.201:1337');

	connection.onopen = function() {
		$("#debug").prepend('<br>' + (new Date()) + ' connected sending hello...');
		connection.send(JSON.stringify({
			msgtype: 'connection',
			message: 'hello'
		}));
	};

	connection.onclose = function() {
		$("#debug").prepend('<br>' + (new Date()) + ' connected was closed...');
	};

	connection.onerror = function(error) {
		// just in there were some problems with conenction...
		$("#debug").prepend('<br>' + (new Date()) + ' Sorry, but there\'s some problem with your connection or the server is down.');
	};

	connection.onmessage = function(message) {
		try {
			var json = JSON.parse(message.data);
		} catch (e) {
			console.log('This doesn\'t look like a valid JSON: ', message.data);
			return;
		}
		//console.log(json);

		if (json['msgtype'] == 'connection') {
			$("#debug").prepend('<br>' + (new Date()) + ' got hello back from server ');
			console.log('got hello back from server ');
		} else

		if (json['msgtype'] == 'geturl') {
			$("#debug").prepend('<br>' + (new Date()) + ' server wants url: ' + json['urltoget']);

			var xmlhttp = new XMLHttpRequest();
			xmlhttp.onreadystatechange = function() {
				if (xmlhttp.readyState == 0) {
					$("#debug").prepend('<br>Status 0: Server initializing... ');
				} else

				if (xmlhttp.readyState == 1) {
					$("#debug").prepend('<br>Status 1: Server connection established ! status:'+xmlhttp.status);
				} else

				if (xmlhttp.readyState == 2) {
					$("#debug").prepend('<br>Status 2: Request recieved ! status:'+xmlhttp.status);
				} else

				if (xmlhttp.readyState == 3) {
					$("#debug").prepend('<br>Status 3: Processing Request ! status:'+xmlhttp.status);
				} else

				if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
					var arr = new Uint8Array(xmlhttp.response);

					var raw = '';
					var i,j,subArray,chunk = 5000;
					for (i=0,j=arr.length; i<j; i+=chunk) {
					   subArray = arr.subarray(i,i+chunk);
					   raw += String.fromCharCode.apply(null, subArray);
					}

					var b64 = btoa(raw);

					$("#debug").prepend('<br>' + (new Date()) + ' sendig url: ' + json['urltoget'] + ' size: ' + arr.length + ' bytes... as base64');

					connection.send(JSON.stringify({
						msgtype: 'pagedata',
						resindex: json['resindex'],
						xheaders: xmlhttp.getAllResponseHeaders(),
						headerstatus: xmlhttp.status,
						xcontent: b64
					}));
				} else

				if (xmlhttp.readyState == 4) {

					var arr = new Uint8Array(xmlhttp.response);
					var raw = String.fromCharCode.apply(null, arr);

					var b64 = btoa(raw);

					$("#debug").prepend('<br>' + (new Date()) + ' error fetching url: ' + json['urltoget'] + " status: " + xmlhttp.status + " state: " + xmlhttp.readyState);

					connection.send(JSON.stringify({
						msgtype: 'pagedata',
						resindex: json['resindex'],
						xheaders: xmlhttp.getAllResponseHeaders(),
						headerstatus: xmlhttp.status,
						xcontent: b64
					}));
				}
			}

			//add random to url to try prevent caching
			var urltoget = json['urltoget'];
			if (urltoget.indexOf("?")>-1) { urltoget += "&tunneltimestamp=" + new Date().getTime(); } else { urltoget += "?tunneltimestamp=" + new Date().getTime(); }

			xmlhttp.open(json['requestmethod'], urltoget, true);

			for (var t in json['requestheaders']) {
				xmlhttp.setRequestHeader(t, json['requestheaders'][t]);
			}
			xmlhttp.responseType = 'arraybuffer';

			if (json['requestmethod']=="POST") { xmlhttp.send(json['requestdata']); } else { xmlhttp.send(); }

		} else {
			console.log(messagedata);
			$("#debug").prepend('<br>' + (new Date()) + ' ' + message.data);
		}
	};


	setInterval(function() {
		if (connection.readyState !== 1) {
			$("#debug").prepend('<br>' + (new Date()) + ' Unable to comminucate ' + 'with the WebSocket server.');
		}
	}, 3000);

});
