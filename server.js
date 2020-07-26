
// Port where we'll run the websocket server
const webSocketsServerPort = 1337;
// websocket and http servers
const webSocketServer = require('websocket').server;
const http = require('http');

// list of currently connected clients (users)
let clients = [];

const sounds = ["./aPing.mp3", "./dPing.wav"];
let soundIndex = 0;

let mapFile = null;

/**
 * HTTP server
 */
const server = http.createServer(function (request, response) {
	// Not important for us. We're writing WebSocket server,
	// not HTTP server
});
server.listen(webSocketsServerPort, function () {
	console.log((new Date()) + " Server is listening on port "
		+ webSocketsServerPort);
});
/**
 * WebSocket server
 */
const wsServer = new webSocketServer({
	// WebSocket server is tied to a HTTP server. WebSocket
	// request is just an enhanced HTTP request. For more info 
	// http://tools.ietf.org/html/rfc6455#page-6
	httpServer: server
});
// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('request', function (request) {
	console.log((new Date()) + ' Connection from origin '
		+ request.origin + '.');
	// accept connection - you should check 'request.origin' to
	// make sure that client is connecting from your website
	// (http://en.wikipedia.org/wiki/Same_origin_policy)
	

	const clientConnection = request.accept(null, request.origin);
	
	let newId = 0;
	do {
		newId = Math.random();
	}
	while (clients.find(function(client) {return client.uid == newId;}))
	
	const clientSound = sounds[soundIndex];
	++soundIndex;
	if (soundIndex >= sounds.length) {
		soundIndex = 0;
	}

	const currentClient = {
		uid: newId,
		connection: clientConnection, 
		color: '#'+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6), //Random color
		sound: clientSound
	}
	
	clients.push(currentClient);

	//Send map file if it's already chosen
	if (mapFile !== null) {
		clientConnection.sendUTF(JSON.stringify(mapFile));
	}

	// user sent some message
	clientConnection.on('message', function (message) {
		if (message.type === 'utf8') { // accept only text
			
			//First player who loads a map will cause all other clients to be loaded into the same map
			if (mapFile === null) {
				let json;
				try {
					json = JSON.parse(message.utf8Data);
				} catch (e) {
					console.log('Invalid JSON: ', message.utf8Data);
					return;
				}

				if (json.type == "map") {
					mapFile = json;
					for (let i = 0; i < clients.length; ++i) {
						if (clients[i].connection != clientConnection) {
							clients[i].connection.sendUTF(JSON.stringify(json));
						}
					}
				}
			}
			else {
				const dataArr = message.utf8Data.split(","); // XYZ coordinates

				const json = JSON.stringify({
					type: "data",
					clientId: currentClient.uid,
					clientColor: currentClient.color,
					clientSound: currentClient.sound,
					x: parseFloat(dataArr[0]), 
					y: parseFloat(dataArr[1]), 
					z: parseFloat(dataArr[2])
				});
				for (let i = 0; i < clients.length; ++i) {
					if (clients[i].connection != clientConnection) {
						clients[i].connection.sendUTF(json);
					}
				}
			}
		}
	});
	// user disconnected
	clientConnection.on('close', function (connection) {
	
		
		const indexToRemove = clients.indexOf(currentClient);
		clients.splice(indexToRemove, 1);

		if (clients.length < 1) {
			mapFile = null;
		}
		else {
			const json = JSON.stringify({
				type: "remove",
				clientId: currentClient.uid
			});

			for (let i = 0; i < clients.length; ++i) {
				clients[i].connection.sendUTF(json);
			}
		}
		
	});
	
});