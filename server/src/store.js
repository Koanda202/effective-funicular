const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const DB_FILE = path.join(__dirname, '..', 'data', 'orders.json');
const adapter = new FileSync(DB_FILE);
const db = low(adapter);

db.defaults({ orders: [], ticketCounter: 0, ticketDate: '' }).write();

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getAll() {
  return db.get('orders').value();
}

function insert(order) {
  db.get('orders').push(order).write();
  return order;
}

function update(id, patch) {
  const record = db.get('orders').find({ id });
  if (!record.value()) return null;
  record.assign(patch).write();
  return record.value();
}

function nextTicketNumber() {
  const today = todayKey();
  if (db.get('ticketDate').value() !== today) {
    db.set('ticketDate', today).set('ticketCounter', 0).write();
  }
  const next = db.get('ticketCounter').value() + 1;
  db.set('ticketCounter', next).write();
  return next;
}

module.exports = { getAll, insert, update, nextTicketNumber };
