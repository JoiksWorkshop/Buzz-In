// Buzz-In — live Jeopardy-style buzzer server
// Express serves the static client; Socket.io handles real-time lobbies + buzzing.

const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

// ---- In-memory lobby store -------------------------------------------------
// lobbies[CODE] = {
//   code, password, hostId, maxPlayers, questionValue, buzzersOpen,
//   buzzOrder: [socketId...], players: { socketId: {id,name,score} }
// }
const lobbies = {};

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no easily-confused chars
  let code;
  do {
    code = '';
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  } while (lobbies[code]);
  return code;
}

function publicState(lobby) {
  const players = Object.values(lobby.players).map(p => ({
    id: p.id,
    name: p.name,
    score: p.score,
    buzzPos: lobby.buzzOrder.indexOf(p.id) // -1 if not buzzed
  }));
  // Sort scoreboard high-to-low for display
  players.sort((a, b) => b.score - a.score);
  return {
    code: lobby.code,
    hostId: lobby.hostId,
    maxPlayers: lobby.maxPlayers,
    questionValue: lobby.questionValue,
    buzzersOpen: lobby.buzzersOpen,
    hasPassword: !!lobby.password,
    password: lobby.password || '',
    buzzOrder: lobby.buzzOrder.slice(),
    players
  };
}

function broadcast(code) {
  const lobby = lobbies[code];
  if (!lobby) return;
  io.to(code).emit('lobbyState', publicState(lobby));
}

function isHost(socket, lobby) {
  return lobby && lobby.hostId === socket.id;
}

io.on('connection', (socket) => {
  let joinedCode = null;

  socket.on('createLobby', (data, cb) => {
    const name = (data.name || '').trim().slice(0, 20) || 'Host';
    const max = Math.min(8, Math.max(1, parseInt(data.maxPlayers, 10) || 6));
    const password = (data.password || '').trim();
    const code = genCode();
    lobbies[code] = {
      code,
      password: password || null,
      hostId: socket.id,
      maxPlayers: max,
      questionValue: 200,
      buzzersOpen: true,
      buzzOrder: [],
      players: {}
    };
    lobbies[code].players[socket.id] = { id: socket.id, name, score: 0 };
    socket.join(code);
    joinedCode = code;
    cb && cb({ ok: true, code, you: socket.id });
    broadcast(code);
  });

  socket.on('joinLobby', (data, cb) => {
    const code = (data.code || '').trim().toUpperCase();
    const name = (data.name || '').trim().slice(0, 20) || 'Player';
    const lobby = lobbies[code];
    if (!lobby) return cb && cb({ ok: false, error: 'Lobby not found.' });
    if (lobby.password && lobby.password !== (data.password || '').trim())
      return cb && cb({ ok: false, error: 'Wrong password.' });
    if (Object.keys(lobby.players).length >= lobby.maxPlayers)
      return cb && cb({ ok: false, error: 'Lobby is full.' });
    lobby.players[socket.id] = { id: socket.id, name, score: 0 };
    socket.join(code);
    joinedCode = code;
    cb && cb({ ok: true, code, you: socket.id });
    broadcast(code);
  });

  socket.on('buzz', () => {
    const lobby = lobbies[joinedCode];
    if (!lobby || !lobby.players[socket.id]) return;
    if (!lobby.buzzersOpen) return;
    if (lobby.buzzOrder.includes(socket.id)) return;
    lobby.buzzOrder.push(socket.id);
    broadcast(joinedCode);
  });

  // ---- Host-only controls ----
  socket.on('openBuzzers', () => {
    const lobby = lobbies[joinedCode];
    if (!isHost(socket, lobby)) return;
    lobby.buzzOrder = [];
    lobby.buzzersOpen = true;
    broadcast(joinedCode);
  });

  socket.on('resetBuzzers', () => {
    const lobby = lobbies[joinedCode];
    if (!isHost(socket, lobby)) return;
    lobby.buzzOrder = [];
    broadcast(joinedCode);
  });

  socket.on('lockBuzzers', () => {
    const lobby = lobbies[joinedCode];
    if (!isHost(socket, lobby)) return;
    lobby.buzzersOpen = false;
    broadcast(joinedCode);
  });

  socket.on('setQuestionValue', (v) => {
    const lobby = lobbies[joinedCode];
    if (!isHost(socket, lobby)) return;
    lobby.questionValue = parseInt(v, 10) || 0;
    broadcast(joinedCode);
  });

  socket.on('adjustScore', ({ playerId, delta }) => {
    const lobby = lobbies[joinedCode];
    if (!isHost(socket, lobby)) return;
    const p = lobby.players[playerId];
    if (!p) return;
    p.score += parseInt(delta, 10) || 0;
    broadcast(joinedCode);
  });

  socket.on('setScore', ({ playerId, value }) => {
    const lobby = lobbies[joinedCode];
    if (!isHost(socket, lobby)) return;
    const p = lobby.players[playerId];
    if (!p) return;
    p.score = parseInt(value, 10) || 0;
    broadcast(joinedCode);
  });

  socket.on('setMaxPlayers', (v) => {
    const lobby = lobbies[joinedCode];
    if (!isHost(socket, lobby)) return;
    const max = Math.min(8, Math.max(Object.keys(lobby.players).length, parseInt(v, 10) || 1));
    lobby.maxPlayers = max;
    broadcast(joinedCode);
  });

  socket.on('kickPlayer', (playerId) => {
    const lobby = lobbies[joinedCode];
    if (!isHost(socket, lobby)) return;
    if (playerId === lobby.hostId) return; // host can't kick self
    const target = io.sockets.sockets.get(playerId);
    if (target) {
      target.emit('kicked');
      target.leave(lobby.code);
    }
    delete lobby.players[playerId];
    lobby.buzzOrder = lobby.buzzOrder.filter(id => id !== playerId);
    broadcast(joinedCode);
  });

  function handleLeave() {
    const lobby = lobbies[joinedCode];
    if (!lobby) return;
    delete lobby.players[socket.id];
    lobby.buzzOrder = lobby.buzzOrder.filter(id => id !== socket.id);
    if (Object.keys(lobby.players).length === 0) {
      delete lobbies[lobby.code]; // empty lobby is removed
      return;
    }
    if (lobby.hostId === socket.id) {
      // promote the next remaining player to host
      lobby.hostId = Object.keys(lobby.players)[0];
    }
    broadcast(lobby.code);
  }

  socket.on('leaveLobby', () => { handleLeave(); joinedCode = null; });
  socket.on('disconnect', () => { handleLeave(); });
});

server.listen(PORT, () => {
  console.log('Buzz-In running on port ' + PORT);
});
