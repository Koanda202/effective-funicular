const { v4: uuidv4 } = require('uuid');
const store = require('./store');
const printHooks = require('./printing/printHooks');
const { DRINKS, SIZES, MILKS, SYRUPS, TEMPERATURES, STATUSES, MAX_EXTRA_SHOTS } = require('./constants');

class ValidationError extends Error {}

function validateInput(input) {
  const { drink, size, milk, temperature, extraShots = 0, syrups = [] } = input;

  if (!DRINKS.includes(drink)) throw new ValidationError(`Invalid drink: ${drink}`);
  if (!SIZES.includes(size)) throw new ValidationError(`Invalid size: ${size}`);
  if (!MILKS.includes(milk)) throw new ValidationError(`Invalid milk: ${milk}`);
  if (!TEMPERATURES.includes(temperature)) throw new ValidationError(`Invalid temperature: ${temperature}`);
  if (!Number.isInteger(extraShots) || extraShots < 0 || extraShots > MAX_EXTRA_SHOTS) {
    throw new ValidationError(`Invalid extraShots: ${extraShots}`);
  }
  if (!Array.isArray(syrups) || syrups.some((s) => !SYRUPS.includes(s))) {
    throw new ValidationError(`Invalid syrups: ${JSON.stringify(syrups)}`);
  }
}

function createOrder(input) {
  validateInput(input);

  const now = new Date().toISOString();
  const order = {
    id: uuidv4(),
    ticketNumber: store.nextTicketNumber(),
    customerName: (input.customerName || '').trim() || 'Guest',
    drink: input.drink,
    size: input.size,
    milk: input.milk,
    extraShots: input.extraShots || 0,
    syrups: input.syrups || [],
    temperature: input.temperature,
    notes: (input.notes || '').trim(),
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  store.insert(order);

  // Fire-and-forget: a slow/broken print handler must never delay the
  // customer's confirmation or the kitchen broadcast.
  printHooks.notifyNewOrder(order).catch((err) => {
    console.error('[orders] print notification failed:', err);
  });

  return order;
}

function setStatus(id, status) {
  if (!STATUSES.includes(status)) {
    throw new ValidationError(`Invalid status: ${status}`);
  }
  const updated = store.update(id, { status, updatedAt: new Date().toISOString() });
  if (!updated) throw new ValidationError(`Order not found: ${id}`);
  return updated;
}

function listOrders() {
  return store.getAll();
}

module.exports = { createOrder, setStatus, listOrders, ValidationError };
