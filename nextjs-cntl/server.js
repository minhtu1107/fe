const {getPlayers} = require( './services/players.jsx');

const express = require('express');
const next = require('next');

const port = process.env.PORT || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const config = {
  debug:true,
  publicIp: '54.249.83.187',
  peerConnectionOptions: '{"iceServers":[{"urls":["stun:stun.l.google.com:19302","turn:54.249.83.187:19303"],"username":"PixelStreamingUser","credential":"Another TURN in the road"}]}'
};

  // const logging = require('./modules/logging.js');
if(!config.debug) {
  // logging.RegisterConsoleLogger();
}

var streamerPort = 8888; // port to listen to WebRTC proxy connections
var serverPublicIp;
var clientConfig = { type: 'config', peerConnectionOptions: {} };
let players = getPlayers(); //new Map(); // playerId <-> player, where player is either a web-browser or a native webrtc player
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

app.prepare().then(() => {
  const server = express();

  server.get('/api/players/list', (req, res) => {
    req.players = players;
    return handle(req, res);
  });

  server.all('*', (req, res) => {
    return handle(req, res);
  });

  var http = require('http').Server(server);

  http.listen(port, (err) => {
    if (err) throw err;
    console.log(`Listening on port ${port}...`);
  });


    let playerServer = new WebSocket.Server({ server: http });
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
      players.set(playerId, { ws: ws, id: playerId });

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
          let emailObj = Array.from(players.values()).map(val => { return val.email; });
          ws.send(JSON.stringify({ type: 'newConnect', players: emailObj}));
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
        // sendPlayerDisconnectedToMatchmaker();
        sendPlayersCount();
      }

      ws.on('close', function (code, reason) {
        console.logColor(logging.Yellow, `player ${playerId} connection closed: ${code} - ${reason}`);
        onPlayerDisconnected();
      });

      ws.on('error', function (error) {
        console.error(`player ${playerId} connection error: ${error}`);
        ws.close(1006 /* abnormal closure */, error);
        onPlayerDisconnected();
      });

      // sendPlayerConnectedToFrontend();
      // sendPlayerConnectedToMatchmaker();

      ws.send(JSON.stringify(clientConfig));

      sendPlayersCount();
    });
  }
});

let WebSocket = require('ws');

  let streamerServer = new WebSocket.Server({ port: streamerPort, backlog: 1 });
  let streamer; // WebSocket connected to Streamer
if(!config.debug) {
  console.logColor(logging.Green, `WebSocket listening to Streamer connections on :${streamerPort}`)

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
      ws.close(1006 /* abnormal closure */, error);
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

