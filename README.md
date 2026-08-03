# Coffee Order — Multi-Device

A coffee shop ordering app: customers build an order on an iPad using
toggles/buttons, and it instantly appears on one or more kitchen/barista
display devices over the same Wi-Fi network.

## Architecture

- **Server**: Node.js + Express + Socket.io (`server/`). Serves the client
  files, exposes a small REST API for the menu and order creation, and
  pushes live updates to every connected kitchen display over WebSockets.
  Orders persist to a local JSON file (`server/data/orders.json`) via
  lowdb, so they survive a server restart.
- **Client**: plain HTML/CSS/JS, no build step (`client/`).
  - `client/order` — the iPad-facing order builder, served at `/order`.
  - `client/kitchen` — the live order queue for baristas, served at
    `/kitchen`. Any number of devices can open this URL and they'll all
    stay in sync, since the server is the single source of truth.
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
4. Submit an order on the iPad — it appears immediately in the "New"
   column on every open kitchen display. Baristas tap "Start" / "Complete"
   to move it through the queue, and every display updates together.

No HTTPS is required for LAN use.

### Optional: add the order screen to the iPad Home Screen

In Safari, open `/order`, tap Share → "Add to Home Screen". The page
declares `apple-mobile-web-app-capable`, so it launches full-screen like a
kiosk app with no browser chrome.

## Extending with a real printer

See the comment block at the bottom of `server/src/printing/printHooks.js`.
In short: write a new handler function `(order) => Promise<void>` in a new
file under `server/src/printing/`, and call `registerPrintHandler(...)`
with it — no other code needs to change.
