'use strict';

const http = require('http');
const WebSocket = require('ws');
const app = require('./src/app');
const { Log } = require('./logger');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const connections = new Map();

wss.on('connection', (ws, req) => {
  const userId = req.headers['x-user-id'] || 'anonymous';
  connections.set(userId, ws);

  Log('backend', 'info', 'ws', 'client connected');

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw);
      if (msg.action === 'subscribe') {
        Log('backend', 'info', 'ws', 'client subscribed');
      }
    } catch {
      Log('backend', 'warn', 'ws', 'invalid message received');
    }
  });

  ws.on('close', () => {
    connections.delete(userId);
    Log('backend', 'info', 'ws', 'client disconnected');
  });

  ws.on('error', () => {
    Log('backend', 'error', 'ws', 'websocket error occurred');
  });

  const heartbeat = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ event: 'ping', ts: Date.now() }));
    }
  }, 30000);

  ws.on('close', () => clearInterval(heartbeat));
});

app.set('wsConnections', connections);

server.listen(PORT, () => {
  Log('backend', 'info', 'server', `listening on port ${PORT}`);
  console.log(`Server running on port ${PORT}`);
});