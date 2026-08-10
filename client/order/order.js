(async function () {
  const currentOrder = {
    drink: null,
    size: null,
    milk: null,
    extraShots: 0,
    syrups: [],
    pastries: [],
    temperature: null,
  };

  const els = {
    orderForm: document.getElementById('order-form'),
    summary: document.getElementById('summary'),
    submitBtn: document.getElementById('submit-btn'),
    shotsCount: document.getElementById('shots-count'),
    customerName: document.getElementById('customer-name'),
    notes: document.getElementById('notes'),
    errorBanner: document.getElementById('error-banner'),
    errorText: document.getElementById('error-text'),
    retryBtn: document.getElementById('retry-btn'),
    trackingView: document.getElementById('tracking-view'),
    trackIcon: document.getElementById('track-icon'),
    trackTicket: document.getElementById('track-ticket'),
    trackStatus: document.getElementById('track-status'),
    newOrderBtn: document.getElementById('new-order-btn'),
  };

  const socket = io();
  let activeOrder = null;

  const STATUS_TEXT = {
    pending: "Please pay at the counter to start your drink.",
    'in-progress': 'Your drink is being made…',
    completed: 'Your order is ready! Enjoy ☕',
  };

  function renderTracking() {
    if (!activeOrder) return;
    const ready = activeOrder.status === 'completed';
    els.trackTicket.textContent = `Order #${activeOrder.ticketNumber}`;
    els.trackStatus.textContent = STATUS_TEXT[activeOrder.status] || '';
    els.trackStatus.classList.toggle('ready', ready);
    els.trackIcon.classList.toggle('ready', ready);
    els.trackIcon.textContent = ready ? '☕' : '✓';
    if (ready && navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }

  function showTracking(order) {
    activeOrder = order;
    sessionStorage.setItem('activeOrderId', order.id);
    renderTracking();
    els.orderForm.hidden = true;
    els.trackingView.hidden = false;
  }

  function showBuilder() {
    activeOrder = null;
    sessionStorage.removeItem('activeOrderId');
    els.trackingView.hidden = true;
    els.orderForm.hidden = false;
  }

  socket.on('order:updated', (order) => {
    if (activeOrder && order.id === activeOrder.id) {
      activeOrder = order;
      renderTracking();
    }
  });

  function renderOptionGroup(containerId, values, group, multi) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    values.forEach((value) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option-btn';
      btn.textContent = value;
      btn.dataset.group = group;
      btn.dataset.value = value;
      btn.dataset.multi = multi ? 'true' : 'false';
      container.appendChild(btn);
    });
  }

  function buildMenuCard(value, group, multi, description) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option-btn menu-card';
    btn.dataset.group = group;
    btn.dataset.value = value;
    btn.dataset.multi = multi ? 'true' : 'false';

    const name = document.createElement('span');
    name.className = 'menu-card-name';
    name.textContent = value;
    btn.appendChild(name);

    if (description) {
      const desc = document.createElement('span');
      desc.className = 'menu-card-desc';
      desc.textContent = description;
      btn.appendChild(desc);
    }

    return btn;
  }

  function renderMenuCards(containerId, values, group, multi, descriptions) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    values.forEach((value) => {
      container.appendChild(buildMenuCard(value, group, multi, descriptions[value]));
    });
  }

  function renderDrinkCategories(categories, descriptions) {
    const container = document.getElementById('drink-categories');
    container.innerHTML = '';
    categories.forEach((category) => {
      const section = document.createElement('section');
      section.className = 'menu-section';

      const heading = document.createElement('h2');
      heading.className = 'menu-heading';
      heading.textContent = category.name;
      section.appendChild(heading);

      const grid = document.createElement('div');
      grid.className = 'menu-grid';
      category.items.forEach((value) => {
        grid.appendChild(buildMenuCard(value, 'drink', false, descriptions[value]));
      });
      section.appendChild(grid);

      container.appendChild(section);
    });
  }

  function updateSummary() {
    const parts = [];
    if (currentOrder.size) parts.push(currentOrder.size);
    if (currentOrder.temperature) parts.push(currentOrder.temperature);
    if (currentOrder.milk && currentOrder.milk !== 'None') parts.push(currentOrder.milk + ' milk');
    if (currentOrder.drink) parts.push(currentOrder.drink);
    let line = parts.length ? parts.join(' ') : 'Choose a drink to get started.';
    if (currentOrder.extraShots > 0) line += `, +${currentOrder.extraShots} shot${currentOrder.extraShots > 1 ? 's' : ''}`;
    if (currentOrder.syrups.length) line += `, ${currentOrder.syrups.join(' + ')} flavor`;
    if (currentOrder.pastries.length) line += `, with ${currentOrder.pastries.join(' + ')}`;
    els.summary.textContent = line;

    const ready = currentOrder.drink && currentOrder.size && currentOrder.milk && currentOrder.temperature;
    els.submitBtn.disabled = !ready;
  }

  function handleOptionClick(e) {
    const btn = e.target.closest('.option-btn');
    if (!btn) return;
    const { group, value, multi } = btn.dataset;

    if (multi === 'true') {
      const idx = currentOrder[group].indexOf(value);
      if (idx >= 0) {
        currentOrder[group].splice(idx, 1);
        btn.classList.remove('selected');
      } else {
        currentOrder[group].push(value);
        btn.classList.add('selected');
      }
    } else {
      currentOrder[group] = value;
      document.querySelectorAll(`.option-btn[data-group="${group}"]`).forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
    }
    updateSummary();
  }

  document.getElementById('order-form').addEventListener('click', handleOptionClick);

  document.getElementById('shots-minus').addEventListener('click', () => {
    currentOrder.extraShots = Math.max(0, currentOrder.extraShots - 1);
    els.shotsCount.textContent = currentOrder.extraShots;
    updateSummary();
  });
  document.getElementById('shots-plus').addEventListener('click', () => {
    currentOrder.extraShots = Math.min(4, currentOrder.extraShots + 1);
    els.shotsCount.textContent = currentOrder.extraShots;
    updateSummary();
  });

  function resetForm() {
    currentOrder.drink = null;
    currentOrder.size = null;
    currentOrder.milk = null;
    currentOrder.extraShots = 0;
    currentOrder.syrups = [];
    currentOrder.pastries = [];
    currentOrder.temperature = null;
    document.querySelectorAll('.option-btn.selected').forEach((b) => b.classList.remove('selected'));
    els.shotsCount.textContent = '0';
    els.customerName.value = '';
    els.notes.value = '';
    updateSummary();
  }

  async function submitOrder() {
    els.errorBanner.hidden = true;
    els.submitBtn.disabled = true;

    const payload = {
      ...currentOrder,
      customerName: els.customerName.value,
      notes: els.notes.value,
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server error (${res.status})`);
      }
      const order = await res.json();
      showTracking(order);
    } catch (err) {
      els.errorText.textContent = err.message || 'Could not send order. Check the connection and retry.';
      els.errorBanner.hidden = false;
      els.submitBtn.disabled = false;
    }
  }

  document.getElementById('submit-btn').addEventListener('click', submitOrder);
  els.retryBtn.addEventListener('click', submitOrder);
  els.newOrderBtn.addEventListener('click', () => {
    resetForm();
    showBuilder();
  });

  async function restoreTracking() {
    const savedId = sessionStorage.getItem('activeOrderId');
    if (!savedId) return;
    try {
      const res = await fetch('/api/orders');
      const orders = await res.json();
      const found = orders.find((o) => o.id === savedId);
      if (found) {
        showTracking(found);
      } else {
        sessionStorage.removeItem('activeOrderId');
      }
    } catch (err) {
      // Leave the builder showing if we can't reach the server yet.
    }
  }

  try {
    const menu = await fetchMenu();
    const descriptions = menu.descriptions || {};
    renderDrinkCategories(menu.drinkCategories || [{ name: 'Drink', items: menu.drinks }], descriptions);
    renderOptionGroup('size-options', menu.sizes, 'size', false);
    renderOptionGroup('milk-options', menu.milks, 'milk', false);
    renderOptionGroup('syrup-options', menu.syrups, 'syrups', true);
    renderOptionGroup('temperature-options', menu.temperatures, 'temperature', false);
    renderMenuCards('pastry-options', menu.pastries, 'pastries', true, descriptions);
    updateSummary();
  } catch (err) {
    els.summary.textContent = 'Failed to load menu. Please reload the page.';
  }

  await restoreTracking();
})();
