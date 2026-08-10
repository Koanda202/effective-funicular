const express = require('express');
const orders = require('../orders');
const constants = require('../constants');

function buildOrdersRouter(io) {
  const router = express.Router();

  router.get('/menu', (req, res) => {
    res.json({
      drinks: constants.DRINKS,
      drinkCategories: [
        { name: 'Specialty Coffee Drinks', items: constants.SPECIALTY_COFFEE_DRINKS },
        { name: 'Non Coffee Drinks', items: constants.NON_COFFEE_DRINKS },
      ],
      sizes: constants.SIZES,
      milks: constants.MILKS,
      syrups: constants.SYRUPS,
      pastries: constants.PASTRIES,
      temperatures: constants.TEMPERATURES,
      maxExtraShots: constants.MAX_EXTRA_SHOTS,
      descriptions: { ...constants.DRINK_DESCRIPTIONS, ...constants.PASTRY_DESCRIPTIONS },
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
