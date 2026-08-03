const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');

const buildOrdersRouter = require('./routes/orders');
const registerSockets = require('./sockets');

const PORT = process.env.PORT || 3000;
const CLIENT_DIR = path.join(__dirname, '..', '..', 'client');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());

app.get('/order', (req, res) => {
  res.sendFile(path.join(CLIENT_DIR, 'order', 'index.html'));
});

app.get('/kitchen', (req, res) => {
  res.sendFile(path.join(CLIENT_DIR, 'kitchen', 'index.html'));
});

app.use('/api', buildOrdersRouter(io));
app.use(express.static(CLIENT_DIR));

registerSockets(io);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Coffee order server listening on http://0.0.0.0:${PORT}`);
  console.log(`  Order screen:   http://localhost:${PORT}/order`);
  console.log(`  Kitchen screen: http://localhost:${PORT}/kitchen`);
});
