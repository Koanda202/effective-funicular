// A print handler is any function (order) => void | Promise<void>.
// Register one to have it invoked whenever a new order is created.
const handlers = [];

function registerPrintHandler(fn) {
  handlers.push(fn);
}

async function notifyNewOrder(order) {
  for (const fn of handlers) {
    try {
      await fn(order);
    } catch (err) {
      console.error('[printHooks] handler failed, order flow unaffected:', err);
    }
  }
}

// Default handler: no real printer wired up yet - just proves the extension
// point fires. Replace/add real handlers below (see docs).
registerPrintHandler((order) => {
  console.log(`[printHooks] would print ticket #${order.ticketNumber} (${order.drink})`);
});

module.exports = { registerPrintHandler, notifyNewOrder };

/*
 * To add real hardware printing later:
 *   - ESC/POS thermal printer (USB/network/Bluetooth receipt printer):
 *     use a library like `node-thermal-printer` or `escpos`, open the
 *     connection once at startup, and register a handler here that formats
 *     `order` into a receipt layout and sends it to the printer.
 *   - AirPrint / network printer via IPP:
 *     use a library like `ipp` to submit a rendered order (e.g. a small
 *     PDF/image built with `pdfkit` or similar) as a print job.
 *   Either way: build the integration as a new file under printing/, export
 *   a handler function of shape (order) => Promise<void>, and call
 *   registerPrintHandler(yourHandler) - no changes needed elsewhere.
 */
