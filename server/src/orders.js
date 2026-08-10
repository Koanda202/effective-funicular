const { v4: uuidv4 } = require('uuid');
const store = require('./store');
const printHooks = require('./printing/printHooks');
const { DRINKS, SIZES, MILKS, SYRUPS, PASTRIES, TEMPERATURES, STATUSES, MAX_EXTRA_SHOTS } = require('./constants');

class ValidationError extends Error {}

function validateInput(input) {
  const { drink, size, milk, temperature, extraShots = 0, syrups = [], pastries = [] } = input;

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
  if (!Array.isArray(pastries) || pastries.some((p) => !PASTRIES.includes(p))) {
    throw new ValidationError(`Invalid pastries: ${JSON.stringify(pastries)}`);
  }
}

function createOrder(input) {
  validateInput(input);

  const now = new Date().toISOString();
  const order = {
    id: uuidv4(),
    batchId: input.batchId || uuidv4(),
    ticketNumber: store.nextTicketNumber(),
    customerName: (input.customerName || '').trim() || 'Guest',
    drink: input.drink,
    size: input.size,
    milk: input.milk,
    extraShots: input.extraShots || 0,
    syrups: input.syrups || [],
    pastries: input.pastries || [],
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

// A customer can order several drinks at once. Each drink becomes its own
// independent order (own ticket number, own status) sharing one batchId,
// so the kitchen sees and can progress each drink separately while the
// customer's tracking screen still shows them as one submission.
function createOrderBatch(input) {
  const items = Array.isArray(input.items) ? input.items : [];
  if (items.length === 0) {
    throw new ValidationError('Order must include at least one drink');
  }

  // Validate every item before creating any of them, so one bad item in a
  // multi-drink cart can't leave earlier items silently created.
  items.forEach((item) => validateInput(item));

  const pastries = input.pastries || [];
  if (!Array.isArray(pastries) || pastries.some((p) => !PASTRIES.includes(p))) {
    throw new ValidationError(`Invalid pastries: ${JSON.stringify(pastries)}`);
  }

  const batchId = uuidv4();
  const { customerName, notes } = input;

  return items.map((item, index) => createOrder({
    ...item,
    customerName,
    notes,
    // Pastries apply to the whole order, not each drink - attach once.
    pastries: index === 0 ? pastries : [],
    batchId,
  }));
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

module.exports = { createOrder, createOrderBatch, setStatus, listOrders, ValidationError };
