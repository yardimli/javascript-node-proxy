"use strict";

var http = require('http');
var sys  = require('sys');
var fs   = require('fs');

var atob = require('atob');

var webSocketServer = require('websocket').server;

var clients = [];
var lastclient;

var responses = [];

var webSocketsServerPort = 1337;

// HTTP server
var server = http.createServer(function(request, response) {
	// Not important for us. We're writing WebSocket server, not HTTP server
});

//--------------------------------------------------------------------------------
server.listen(webSocketsServerPort, function() {
	console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
});

//--------------------------------------------------------------------------------
var wsServer = new webSocketServer({
	httpServer: server,
	maxReceivedFrameSize:10*1024*1024,
	maxReceivedMessageSize:10*1024*1024
});

wsServer.on('request', function(request) {
	console.log((new Date()) + ' Connection from origin ' + request.origin + '.');
	var connection = request.accept(null, request.origin);

	clients.push(connection);
	lastclient = connection;
//	connection.binaryType = "arraybuffer";

	var index = clients.length - 1;

	console.log((new Date()) + ' Connection accepted. User index: '+index);

	connection.on('message', function(message) {
		if (message.type === 'utf8') { // accept only text
			//console.log(message);

			try {
				var messagedata = JSON.parse( message.utf8Data );
			} catch (e) {
				console.log('This doesn\'t look like a valid JSON: ', message.utf8Data);
				return;
			}

			if (messagedata['msgtype']=='connection') {
				connection.sendUTF(JSON.stringify({ msgtype: 'connection', message : 'hello to you too' }));
				console.log('got hello from client '+index);
			} else
			if (messagedata['msgtype']=='pagedata') {
				console.log('got file from client '+index);

				console.log('response index: '+messagedata['resindex']);

				responses[parseInt(messagedata['resindex'])].writeHead(messagedata['headerstatus'], '{' + messagedata['xheaders'] + '}');

				var buf = new Buffer(messagedata['xcontent'], 'base64'); // Ta-da

				responses[parseInt(messagedata['resindex'])].end(	buf	);


				console.log('headers '+messagedata['xheaders']);
			} else
			if (messagedata['msgtype']=='pagedataerror') {
				responses[parseInt(messagedata['resindex'])].writeHead(404, '{Content-Type:html}');
				responses[parseInt(messagedata['resindex'])].end('some error message');

			} else
			{
				console.log(messagedata['msgtype']);
			}


			//connection.sendUTF(JSON.stringify({ msgtype: 'hellocode', hellocode : hellocode }));

		}
	});


	// user disconnected
	connection.on('close', function(connection) {
		console.log((new Date()) + " Peer " +  connection.remoteAddress + " with index "+ index +" disconnected.");
	});
});








//------------------------------------------------------- sort of a proxy server
http.createServer(function(request, response) {
	var ip = request.connection.remoteAddress;

	sys.log(ip + ") " + request.method + " " + request.url);

	responses.push(response);
	if (request.method=="GET")
	{
		lastclient.sendUTF(JSON.stringify({ msgtype: 'geturl', urltoget : request.url, requestheaders:request.headers, requestmethod:request.method, resindex: responses.length - 1 }));
	} else
	if (request.method=="POST") {
		var reqBody = '';
		request.on('data', function (data) {
			reqBody += data;

			if (reqBody.length > 1e7) { //10MB
				resp.writeHead(413, 'Request Entity Too Large', { 'Content-Type': 'text/html' });
				resp.end('<!doctype html><html><head><title>413</title></head><body>413: Request Entity Too Large</body></html>');
			}
		});

		request.on('end', function () {
			//var formData = qs.parse(reqBody);

			lastclient.sendUTF(JSON.stringify({ msgtype: 'geturl', urltoget : request.url, requestheaders:request.headers, requestmethod:request.method, requestdata : reqBody, resindex: responses.length - 1 }));
		});
	}

}).listen(8080);
