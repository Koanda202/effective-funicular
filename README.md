# Coffee Order — Multi-Device

A coffee shop ordering app: customers build an order on an iPad (or their
own phone via a QR code) using toggles/buttons, and it instantly appears on
one or more kitchen/barista display devices over the same Wi-Fi network.

## Architecture

- **Server**: Node.js + Express + Socket.io (`server/`). Serves the client
  files, exposes a small REST API for the menu and order creation, and
  pushes live updates to every connected kitchen display over WebSockets.
  Orders persist to a local JSON file (`server/data/orders.json`) via
  lowdb, so they survive a server restart.
- **Client**: plain HTML/CSS/JS, no build step (`client/`).
  - `client/order` — the order builder, served at `/order`. Works on the
    iPad or any phone browser — the same page, no separate mobile version.
  - `client/kitchen` — the live order queue for baristas, served at
    `/kitchen`. Any number of devices can open this URL and they'll all
    stay in sync, since the server is the single source of truth.
  - `client/scan` — a "Scan to Order" screen, served at `/scan`, showing a
    QR code that opens `/order` on whatever phone scans it. Meant to be
    displayed on a register tablet/monitor, or printed as a table tent.
    The QR code is generated server-side (`server/src/routes/qr.js`) from
    whatever host/IP the `/scan` page itself was loaded from, so it always
    points customers to the right address without hardcoding an IP.
- **Printing**: not wired to real hardware yet. `server/src/printing/printHooks.js`
  is the extension point — it fires a hook on every new order (currently
  just logs to the console) and documents how to plug in a real ESC/POS
  thermal printer or AirPrint/IPP integration later.

## Running it

```bash
npm install --workspaces
npm start
```

The server listens on `0.0.0.0:3000` (not just localhost) so other devices
on the same network can reach it.

1. Find the host machine's LAN IP:
   - macOS: `ipconfig getifaddr en0`
   - Linux: `ip addr`
2. On the iPad, open Safari to `http://<LAN-IP>:3000/order`.
3. On any other laptop/tablet/phone on the same Wi-Fi, open
   `http://<LAN-IP>:3000/kitchen`.
4. On a register tablet/monitor (or a printout), open
   `http://<LAN-IP>:3000/scan` — it shows a QR code customers can scan
   with their own phone to land directly on `/order`. Because the QR code
   is generated from whatever address loaded the `/scan` page, always open
   `/scan` using the LAN IP (not `localhost`) so phones on the same Wi-Fi
   can actually reach it.
5. Submit an order (from the iPad or a customer's phone) — it appears
   immediately in the "New" column on every open kitchen display. Baristas
   tap "Start" / "Complete" to move it through the queue, and every
   display updates together.

No HTTPS is required for LAN use. Note that most phone cameras only follow
`http://` QR links if the phone is actually able to reach that address —
double check the phone is on the same Wi-Fi network as the server.

### Optional: add the order screen to the iPad Home Screen

In Safari, open `/order`, tap Share → "Add to Home Screen". The page
declares `apple-mobile-web-app-capable`, so it launches full-screen like a
kiosk app with no browser chrome.

## Extending with a real printer

See the comment block at the bottom of `server/src/printing/printHooks.js`.
In short: write a new handler function `(order) => Promise<void>` in a new
file under `server/src/printing/`, and call `registerPrintHandler(...)`
with it — no other code needs to change.
