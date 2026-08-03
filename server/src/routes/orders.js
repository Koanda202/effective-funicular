const express = require('express');
const orders = require('../orders');
const constants = require('../constants');

function buildOrdersRouter(io) {
  const router = express.Router();

  router.get('/menu', (req, res) => {
    res.json({
      drinks: constants.DRINKS,
      sizes: constants.SIZES,
      milks: constants.MILKS,
      syrups: constants.SYRUPS,
      temperatures: constants.TEMPERATURES,
      maxExtraShots: constants.MAX_EXTRA_SHOTS,
    });
  });

  router.get('/orders', (req, res) => {
    res.json(orders.listOrders());
  });

  router.post('/orders', (req, res) => {
    try {
      const order = orders.createOrder(req.body || {});
      io.emit('order:new', order);
      res.status(201).json(order);
    } catch (err) {
      if (err instanceof orders.ValidationError) {
        res.status(400).json({ error: err.message });
      } else {
        console.error('[routes/orders] unexpected error:', err);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  return router;
}

module.exports = buildOrdersRouter;
