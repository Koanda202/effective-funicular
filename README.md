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
   immediately in the "Awaiting Payment" column on every open kitchen
   display, and the customer sees a live tracking screen on their own
   device. Baristas tap "Mark Paid" once payment is collected at the
   register, then "Complete" once the drink is made — the customer's
   screen updates automatically at each step, ending in "Your order is
   ready!"

No HTTPS is required for LAN use. Note that most phone cameras only follow
`http://` QR links if the phone is actually able to reach that address —
double check the phone is on the same Wi-Fi network as the server.

### Optional: add the order screen to the iPad Home Screen

In Safari, open `/order`, tap Share → "Add to Home Screen". The page
declares `apple-mobile-web-app-capable`, so it launches full-screen like a
kiosk app with no browser chrome.

## Making the QR code work from anywhere (not just your Wi-Fi)

By default the `/scan` QR code only works for phones on the same Wi-Fi as
the server. To make it reachable from any network — with no domain to buy
and no cost — put a free **ngrok** static domain in front of the server.
The app already adapts to it automatically: `server/src/index.js` trusts
the `X-Forwarded-*` headers a tunnel sets, so the QR code, order links,
and kitchen tracking updates all work the same way through the tunnel as
they do on the LAN. No other code changes are needed.

This does mean the app becomes reachable by anyone with the link, not just
customers physically in your shop — there's no login on `/order` or
`/kitchen`. That's an accepted tradeoff for keeping things simple; add a
shared passcode later if that becomes a problem.

One caveat of the free tier: the **first** time any given visitor's phone
hits your ngrok URL, they'll briefly see an ngrok interstitial page
("You are about to visit... Visit Site") before reaching `/order` — one
extra tap, not a real login, and only shows once per browser.

**Setup** (free ngrok account, no credit card, no domain purchase):

1. Sign up at https://ngrok.com (email only).
2. Install ngrok on the computer running the server:
   - macOS: `brew install ngrok`
   - Windows/Linux: https://ngrok.com/download
3. Copy your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken
   and run:
   ```bash
   ngrok config add-authtoken <YOUR_TOKEN>
   ```
4. Claim your one free static domain at https://dashboard.ngrok.com/domains
   (click "+ Create Domain") — you'll get something like
   `random-words-1234.ngrok-free.app`. This is yours permanently at no cost.
5. Run the tunnel, pointing it at your local server:
   ```bash
   ngrok http --url=random-words-1234.ngrok-free.app 3000
   ```
   Leave this running in its own terminal, alongside `npm start`.
6. Open `https://random-words-1234.ngrok-free.app/scan` (not `localhost`,
   not the LAN IP) and print/display that QR code — it now works from any
   phone on any network, and keeps working indefinitely as long as the
   tunnel and server are both running. If either one stops (computer off,
   `ngrok`/`npm start` closed), ordering pauses until you start them again,
   but the URL itself — and the printed QR — never changes.

### If you get a domain later: Cloudflare Tunnel instead

Owning a domain unlocks a cleaner alternative with no interstitial page:

1. Add your domain to Cloudflare (free plan) and point its nameservers at
   Cloudflare per their dashboard instructions.
2. Install `cloudflared`: `brew install cloudflared` (macOS), or see
   https://pkg.cloudflare.com for other platforms.
3. `cloudflared tunnel login` (opens a browser once to authenticate).
4. `cloudflared tunnel create coffee-order`, then
   `cloudflared tunnel route dns coffee-order coffee.yourdomain.com`.
5. `cloudflared tunnel run --url http://localhost:3000 coffee-order` —
   leave running alongside `npm start` (or `cloudflared service install`
   to run it as a background service that survives a reboot).
6. Open `https://coffee.yourdomain.com/scan` and print that QR instead.

## Extending with a real printer

See the comment block at the bottom of `server/src/printing/printHooks.js`.
In short: write a new handler function `(order) => Promise<void>` in a new
file under `server/src/printing/`, and call `registerPrintHandler(...)`
with it — no other code needs to change.
