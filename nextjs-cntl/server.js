const express = require('express');
const next = require('next');
const fs = require('fs');
const path = require('path');

const config = {
  debug:false,
  UseHTTPS:true,
  UseMatchmaker:true,
  publicIp: '54.249.83.187',
  peerConnectionOptions: '{"offerExtmapAllowMixed":false , "iceServers":[{"urls":["stun:stun.l.google.com:19302","turn:54.249.83.187:19303"],"username":"PixelStreamingUser","credential":"Another TURN in the road"}]}'
};

const port = process.env.PORT || config.UseHTTPS?80:3000;
const httpsPort = 443;
const certPath = 'C:\\vt.tairapromote.com';
// const dev = process.env.NODE_ENV !== 'production';
const dev = process.env.REACT_APP_NODE_ENV.trim() !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const logging = require('./modules/logging.js');
logging.RegisterConsoleLogger();

let WebSocket = require('ws');

var streamerPort = 8888; // port to listen to WebRTC proxy connections
var serverPublicIp;
var clientConfig = { type: 'config', peerConnectionOptions: {} };
let players = new Map(); // playerId <-> player, where player is either a web-browser or a native webrtc player
let nextPlayerId = 100;

try {
  if (typeof config.publicIp != 'undefined') {
    serverPublicIp = config.publicIp.toString();
  }

  if (typeof config.streamerPort != 'undefined') {
    streamerPort = config.streamerPort;
  }

  if (typeof config.peerConnectionOptions != 'undefined') {
    clientConfig.peerConnectionOptions = JSON.parse(config.peerConnectionOptions);
    console.log(`peerConnectionOptions = ${JSON.stringify(clientConfig.peerConnectionOptions)}`);
  }
} catch (e) {
  console.error(e);
  process.exit(2);
}

const grantPermissionCallback = (emails) => {
  for (let p of players.values()) {
    if(p.isAdmin || (emails.length>1 && p.email === emails[1]))
      p.ws.send(JSON.stringify({ type: 'permission', value: true }));
    else
      p.ws.send(JSON.stringify({ type: 'permission', value: false }));
  }
}

app.prepare().then(() => {
  const server = express();

  if(config.UseHTTPS) {
    //Setup http -> https redirect
    console.log('Redirecting http->https');
    server.use(function (req, res, next) {
      if (!req.secure) {
        if (req.get('Host')) {
          var hostAddressParts = req.get('Host').split(':');
          var hostAddress = hostAddressParts[0];
          if (httpsPort != 443) {
            hostAddress = `${hostAddress}:${httpsPort}`;
          }
          return res.redirect(['https://', hostAddress, req.originalUrl].join(''));
        } else {
          console.error(`unable to get host name from header. Requestor ${req.ip}, url path: '${req.originalUrl}', available headers ${JSON.stringify(req.headers)}`);
          return res.status(400).send('Bad Request');
        }
      }
      next();
    });
  }
	
  server.get('/api/players/list', (req, res) => {
    // console.log('api/players/list server.all ' + req.url);
    req.players = players;
    return handle(req, res);
  });
  
  server.get('/getStreamUrl', (req, res) => {
    console.log('getStreamUrl ' + JSON.stringify(req.query));
    let cirus = getAvailableCirrusServer();
    if(cirus != undefined) {
      res.json(cirus.socketUrl);
      console.log('cirus.clientConfig ' + cirus.address + ':' + cirus.port);
    }
    
    return res.end();
  });
	
  server.post('/api/players/grantPermission', (req, res) => {
    req.callback = grantPermissionCallback;
    return handle(req, res);
  });
  
  server.all('*', (req, res) => {
	// console.log('server.all' + req.url);
    return handle(req, res);
  });
  var http = require('http').Server(server);

  http.listen(port, (err) => {
    if (err) throw err;
    console.log(`Listening on port ${port}...`);
  });

  var https;
  if (config.UseHTTPS) {
    //HTTPS certificate details
    const options = {
      key: fs.readFileSync(path.join(certPath, '/privkey.pem')),
      cert: fs.readFileSync(path.join(certPath, '/fullchain.pem'))
    };

    https = require('https').Server(options, server);

    https.listen(httpsPort, function () {
      console.logColor(logging.Green, 'Https listening on *: ' + httpsPort);
    });
    
  }
	
  let playerServer = new WebSocket.Server({ server: config.UseHTTPS ? https : http});
  if(!config.debug) {
    console.logColor(logging.Green, `WebSocket listening to Players connections on :${port}`)
    playerServer.on('connection', function (ws, req) {
      // Reject connection if streamer is not connected
      if (!streamer || streamer.readyState != 1 /* OPEN */) {
        ws.close(1013 /* Try again later */, 'Streamer is not connected');
        return;
      }

      let playerId = ++nextPlayerId;
      console.log(`player ${playerId} (${req.connection.remoteAddress}) connected`);

      players.set(playerId, { ws: ws, id: playerId});

      function sendPlayersCount() {
        let playerCountMsg = JSON.stringify({ type: 'playerCount', count: players.size });
        for (let p of players.values()) {
          p.ws.send(playerCountMsg);
        }
      }

      ws.on('message', function (msg) {
        console.logColor(logging.Blue, `<- player ${playerId}: ${msg}`);

        try {
          msg = JSON.parse(msg);
        } catch (err) {
          console.error(`Cannot parse player ${playerId} message: ${err}`);
          ws.close(1008, 'Cannot parse');
          return;
        }
        
        if (msg.type == 'offer') {
          console.log(`<- player ${playerId}: offer`);
          msg.playerId = playerId;
          streamer.send(JSON.stringify(msg));
        } else if (msg.type == 'iceCandidate') {
          console.log(`<- player ${playerId}: iceCandidate`);
          msg.playerId = playerId;
          streamer.send(JSON.stringify(msg));
        } else if (msg.type == 'stats') {
          console.log(`<- player ${playerId}: stats\n${msg.data}`);
        } else if (msg.type == 'kick') {
          let playersCopy = new Map(players);
          for (let p of playersCopy.values()) {
            if (p.id != playerId) {
              console.log(`kicking player ${p.id}`)
              p.ws.close(4000, 'kicked');
            }
          }
        } else if (msg.type == 'email') {
          console.log(`<- player ${playerId}: email: ${msg.email}`);
          let p = players.get(playerId);
          p.email = msg.email;
          p.isAdmin = msg.isAdmin;
          let emailObj = Array.from(players.values()).map(val => { return val.email; });
          for (let p of players.values()) {
            p.ws.send(JSON.stringify({ type: 'newConnect', players: emailObj}));
          }
        } else {
          console.error(`<- player ${playerId}: unsupported message type: ${msg.type}`);
          ws.close(1008, 'Unsupported message type');
          return;
        }
      });

      function onPlayerDisconnected() {
        players.delete(playerId);
        streamer.send(JSON.stringify({ type: 'playerDisconnected', playerId: playerId }));
        // sendPlayerDisconnectedToFrontend();
        sendPlayerDisconnectedToMatchmaker();

        let emailObj = Array.from(players.values()).map(val => { return val.email; });
        for (let p of players.values()) {
          p.ws.send(JSON.stringify({ type: 'newConnect', players: emailObj}));
        }
        sendPlayersCount();
      }

      ws.on('close', function (code, reason) {
        console.logColor(logging.Yellow, `player ${playerId} connection closed: ${code} - ${reason}`);
        onPlayerDisconnected();
      });

      ws.on('error', function (error) {
        console.error(`player ${playerId} connection error: ${error}`);
        ws.close(1006 /* abnormal closure */,  "playerServer error " + error);
        onPlayerDisconnected();
      });

      // sendPlayerConnectedToFrontend();
      sendPlayerConnectedToMatchmaker();
      
      ws.send(JSON.stringify(clientConfig));

      sendPlayersCount();
    });
  }
});

  let streamerServer = new WebSocket.Server({ port: streamerPort, backlog: 1 });
  console.logColor(logging.Green, `WebSocket listening to Streamer connections on :${streamerPort}`)
  let streamer; // WebSocket connected to Streamer
  
if(!config.debug) {
  streamerServer.on('connection', function (ws, req) {
    console.logColor(logging.Green, `Streamer connected: ${req.connection.remoteAddress}`);

    ws.on('message', function onStreamerMessage(msg) {
      console.logColor(logging.Blue, `<- Streamer: ${msg}`);

      try {
        msg = JSON.parse(msg);
      } catch (err) {
        console.error(`cannot parse Streamer message: ${msg}\nError: ${err}`);
        streamer.close(1008, 'Cannot parse');
        return;
      }

      let playerId = msg.playerId;
      delete msg.playerId; // no need to send it to the player
      let player = players.get(playerId);
      if (!player) {
        console.log(`dropped message ${msg.type} as the player ${playerId} is not found`);
        return;
      }

      if (msg.type == 'answer') {
        player.ws.send(JSON.stringify(msg));
      } else if (msg.type == 'iceCandidate') {
        player.ws.send(JSON.stringify(msg));
      } else if (msg.type == 'disconnectPlayer') {
        player.ws.close(1011 /* internal error */, msg.reason);
      } else {
        console.error(`unsupported Streamer message type: ${msg.type}`);
        streamer.close(1008, 'Unsupported message type');
      }
    });

    function onStreamerDisconnected() {
      disconnectAllPlayers();
    }

    ws.on('close', function (code, reason) {
      console.error(`streamer disconnected: ${code} - ${reason}`);
      onStreamerDisconnected();
    });

    ws.on('error', function (error) {
      console.error(`streamer connection error: ${error}`);
      ws.close(1006 /* abnormal closure */, "streamer error " + error);
      onStreamerDisconnected();
    });

    streamer = ws;

    streamer.send(JSON.stringify(clientConfig));
  });
}

function disconnectAllPlayers(code, reason) {
  let clone = new Map(players);
  for (let player of clone.values()) {
    player.ws.close(code, reason);
  }
}

//---------------------------------------------------------------------
//matchmaker server
const net = require('net');

// A list of all the Cirrus server which are connected to the Matchmaker.
var cirrusServers = new Map();

var matchmakerPort = 9999;

// Get a Cirrus server if there is one available which has no clients connected.
function getAvailableCirrusServer() {
	for (cirrusServer of cirrusServers.values()) {
		if (cirrusServer.numConnectedClients === 0) {
			return cirrusServer;
		}
	}
	
	console.log('WARNING: No empty Cirrus servers are available');
	return undefined;
}

function disconnect(connection) {
  console.log(`Ending connection to remote address ${connection.remoteAddress}`);
  connection.end();
}

const matchmakerServer = net.createServer((connection) => {
connection.on('data', (data) => {
  try {
    message = JSON.parse(data);
  } catch(e) {
    console.log(`ERROR (${e.toString()}): Failed to parse Cirrus information from data: ${data.toString()}`);
    disconnect(connection);
    return;
  }
  if (message.type === 'connect') {
    // A Cirrus server connects to this Matchmaker server.
    cirrusServer = {
      address: message.address,
      port: message.port,
      numConnectedClients: 0,
      socketUrl:message.socketUrl,
    };
    cirrusServers.set(connection, cirrusServer);
    console.log(`Cirrus server ${cirrusServer.address}:${cirrusServer.port} connected to Matchmaker`);
  } else if (message.type === 'clientConnected') {
    // A client connects to a Cirrus server.
    cirrusServer = cirrusServers.get(connection);
    cirrusServer.numConnectedClients++;
    console.log(`Client connected to Cirrus server ${cirrusServer.address}:${cirrusServer.port}`);
  } else if (message.type === 'clientDisconnected') {
    // A client disconnects from a Cirrus server.
    cirrusServer = cirrusServers.get(connection);
    cirrusServer.numConnectedClients--;
    console.log(`Client disconnected from Cirrus server ${cirrusServer.address}:${cirrusServer.port}`);
  } else {
    console.log('ERROR: Unknown data: ' + JSON.stringify(message));
    disconnect(connection);
  }
});

// A Cirrus server disconnects from this Matchmaker server.
connection.on('error', () => {
  cirrusServers.delete(connection);
  console.log(`Cirrus server ${cirrusServer.address}:${cirrusServer.port} disconnected from Matchmaker`);
});
});

matchmakerServer.listen(matchmakerPort, () => {
  console.log('Matchmaker listening on *:' + matchmakerPort);
});

/**
 * Function that handles the connection to the matchmaker.
 */

 if (config.UseMatchmaker) {
  var matchmakerAddress = '127.0.0.1';
	var matchmaker = new net.Socket();
  var matchmakerRetryInterval = 5;

	matchmaker.on('connect', function() {
		console.log(`Cirrus connected to Matchmaker ${matchmakerAddress}:${matchmakerPort}`);
		message = {
			type: 'connect',
			address: typeof serverPublicIp === 'undefined' ? '127.0.0.1' : serverPublicIp,
			port: port,
      // socketUrl: 'wss://' + (typeof serverPublicIp === 'undefined' ? '127.0.0.1' : serverPublicIp) + ':' + httpsPort
      socketUrl: 'wss://vt.tairapromote.com'
		};
		matchmaker.write(JSON.stringify(message));
	});

	matchmaker.on('error', (err) => {
		console.log(`Matchmaker connection error ${JSON.stringify(err)}`);
	});

	matchmaker.on('end', () => {
		console.log('Matchmaker connection ended');
	});

	matchmaker.on('close', (hadError) => {
		console.log(`Matchmaker connection closed (hadError=${hadError})`);
		reconnect();
	});

	// Attempt to connect to the Matchmaker
	function connect() {
    if(streamer!=undefined)
      matchmaker.connect(matchmakerPort, matchmakerAddress);
    else 
      reconnect();
	}

	// Try to reconnect to the Matchmaker after a given period of time
	function reconnect() {
		console.log(`Try reconnect to Matchmaker in ${matchmakerRetryInterval} seconds`)
		setTimeout(function() {
			connect();
		}, matchmakerRetryInterval * 1000);
	}

	reconnect();
}

// The Matchmaker will not re-direct clients to this Cirrus server if any client
// is connected.
function sendPlayerConnectedToMatchmaker() {
	if (!config.UseMatchmaker)
		return;

	message = {
		type: 'clientConnected'
	};
	matchmaker.write(JSON.stringify(message));
}

// The Matchmaker is interested when nobody is connected to a Cirrus server
// because then it can re-direct clients to this re-cycled Cirrus server.
function sendPlayerDisconnectedToMatchmaker() {
	if (!config.UseMatchmaker)
		return;

	message = {
		type: 'clientDisconnected'
	};
	matchmaker.write(JSON.stringify(message));
}