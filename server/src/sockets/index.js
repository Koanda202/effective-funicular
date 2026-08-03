const orders = require('../orders');

function registerSockets(io) {
  io.on('connection', (socket) => {
    socket.on('order:setStatus', ({ id, status } = {}, ack) => {
      try {
        const updated = orders.setStatus(id, status);
        io.emit('order:updated', updated);
        if (typeof ack === 'function') ack({ ok: true, order: updated });
      } catch (err) {
        if (typeof ack === 'function') ack({ ok: false, error: err.message });
      }
    });
  });
}

module.exports = registerSockets;
