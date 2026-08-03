const express = require('express');
const QRCode = require('qrcode');

function orderUrlFor(req) {
  return `${req.protocol}://${req.get('host')}/order`;
}

function buildQrRouter() {
  const router = express.Router();

  router.get('/qr.png', async (req, res) => {
    try {
      const png = await QRCode.toBuffer(orderUrlFor(req), { type: 'png', width: 480, margin: 2 });
      res.set('Content-Type', 'image/png');
      res.set('Cache-Control', 'no-store');
      res.send(png);
    } catch (err) {
      console.error('[routes/qr] failed to generate QR code:', err);
      res.status(500).end();
    }
  });

  router.get('/qr-url', (req, res) => {
    res.json({ url: orderUrlFor(req) });
  });

  return router;
}

module.exports = buildQrRouter;
