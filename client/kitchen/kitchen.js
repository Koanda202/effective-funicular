(function () {
  const orders = new Map(); // id -> order
  let snapshotLoaded = false;
  const buffered = [];

  const columns = {
    pending: document.getElementById('col-pending'),
    'in-progress': document.getElementById('col-in-progress'),
    completed: document.getElementById('col-completed'),
  };
  const statusEl = document.getElementById('connection-status');

  const NEXT_STATUS = { pending: 'in-progress', 'in-progress': 'completed' };
  const PREV_STATUS = { 'in-progress': 'pending', completed: 'in-progress' };

  function applyOrder(order) {
    const existing = orders.get(order.id);
    if (existing && existing.updatedAt >= order.updatedAt) return;
    orders.set(order.id, order);
  }

  function timeAgo(iso) {
    const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  }

  function drinkLine(order) {
    let line = `${order.size} ${order.temperature} `;
    if (order.milk !== 'None') line += `${order.milk} `;
    line += order.drink;
    if (order.extraShots > 0) line += `, +${order.extraShots} shot${order.extraShots > 1 ? 's' : ''}`;
    if (order.syrups.length) line += `, ${order.syrups.join(' + ')}`;
    return line;
  }

  function buildCard(order) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = order.id;

    const actions = [];
    if (PREV_STATUS[order.status]) {
      actions.push(`<button class="btn-secondary" data-action="prev">Undo</button>`);
    }
    if (NEXT_STATUS[order.status]) {
      const label = order.status === 'pending' ? 'Start' : 'Complete';
      actions.push(`<button class="btn-primary" data-action="next">${label}</button>`);
    }

    card.innerHTML = `
      <div class="ticket">#${order.ticketNumber} &mdash; ${order.customerName}</div>
      <div class="drink-line">${drinkLine(order)}</div>
      ${order.notes ? `<div class="notes">${escapeHtml(order.notes)}</div>` : ''}
      <div class="age" data-created="${order.createdAt}">${timeAgo(order.createdAt)}</div>
      <div class="actions">${actions.join('')}</div>
    `;

    card.querySelectorAll('button[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextStatus = btn.dataset.action === 'next' ? NEXT_STATUS[order.status] : PREV_STATUS[order.status];
        setStatus(order.id, nextStatus, btn);
      });
    });

    return card;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function render() {
    Object.values(columns).forEach((col) => (col.innerHTML = ''));
    const sorted = [...orders.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    sorted.forEach((order) => {
      const col = columns[order.status];
      if (col) col.appendChild(buildCard(order));
    });
  }

  setInterval(() => {
    document.querySelectorAll('.age').forEach((el) => {
      el.textContent = timeAgo(el.dataset.created);
    });
  }, 15000);

  const socket = io();

  socket.on('connect', () => {
    statusEl.textContent = 'connected';
    statusEl.className = 'status connected';
  });
  socket.on('disconnect', () => {
    statusEl.textContent = 'disconnected — reconnecting…';
    statusEl.className = 'status disconnected';
  });

  socket.on('order:new', (order) => {
    if (!snapshotLoaded) {
      buffered.push(order);
      return;
    }
    applyOrder(order);
    render();
  });

  socket.on('order:updated', (order) => {
    if (!snapshotLoaded) {
      buffered.push(order);
      return;
    }
    applyOrder(order);
    render();
  });

  function setStatus(id, status, btn) {
    if (btn) btn.disabled = true;
    socket.emit('order:setStatus', { id, status }, (res) => {
      if (!res || !res.ok) {
        console.error('Failed to update status', res && res.error);
        if (btn) btn.disabled = false;
      }
      // Successful updates arrive via the order:updated broadcast, which
      // re-renders every connected display identically.
    });
  }

  async function loadSnapshot() {
    try {
      const res = await fetch('/api/orders');
      const snapshot = await res.json();
      snapshot.forEach(applyOrder);
      buffered.forEach(applyOrder);
      snapshotLoaded = true;
      render();
    } catch (err) {
      statusEl.textContent = 'failed to load orders';
      statusEl.className = 'status disconnected';
    }
  }

  loadSnapshot();
})();
