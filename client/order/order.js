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

  // Drinks already added to this order. Pastries/name/notes are shared
  // across the whole order rather than per-drink, so they stay on
  // currentOrder and aren't part of these snapshots.
  const cart = [];

  const els = {
    orderForm: document.getElementById('order-form'),
    summary: document.getElementById('summary'),
    submitBtn: document.getElementById('submit-btn'),
    addDrinkBtn: document.getElementById('add-drink-btn'),
    cartList: document.getElementById('cart-list'),
    shotsCount: document.getElementById('shots-count'),
    customerName: document.getElementById('customer-name'),
    notes: document.getElementById('notes'),
    errorBanner: document.getElementById('error-banner'),
    errorText: document.getElementById('error-text'),
    retryBtn: document.getElementById('retry-btn'),
    trackingView: document.getElementById('tracking-view'),
    trackIcon: document.getElementById('track-icon'),
    trackTicket: document.getElementById('track-ticket'),
    trackItems: document.getElementById('track-items'),
    newOrderBtn: document.getElementById('new-order-btn'),
  };

  const socket = io();
  let activeOrders = [];

  const STATUS_TEXT = {
    pending: 'Sent to the kitchen',
    'in-progress': 'Being made…',
    completed: 'Ready! ☕',
  };

  function renderTracking() {
    if (!activeOrders.length) return;
    const allReady = activeOrders.every((o) => o.status === 'completed');

    els.trackTicket.textContent = activeOrders.length === 1
      ? `Order #${activeOrders[0].ticketNumber}`
      : `Orders #${activeOrders.map((o) => o.ticketNumber).join(', #')}`;

    els.trackItems.innerHTML = '';
    activeOrders.forEach((order) => {
      const ready = order.status === 'completed';
      const row = document.createElement('div');
      row.className = 'track-item';

      const name = document.createElement('span');
      name.className = 'track-item-name';
      name.textContent = order.drink + (order.pastries && order.pastries.length ? ` + ${order.pastries.join(' + ')}` : '');

      const status = document.createElement('span');
      status.className = 'track-item-status' + (ready ? ' ready' : '');
      status.textContent = STATUS_TEXT[order.status] || '';

      row.appendChild(name);
      row.appendChild(status);
      els.trackItems.appendChild(row);
    });

    els.trackIcon.classList.toggle('ready', allReady);
    els.trackIcon.textContent = allReady ? '☕' : '✓';
    if (allReady && navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }

  function showTracking(orders) {
    activeOrders = orders;
    sessionStorage.setItem('activeOrderIds', JSON.stringify(orders.map((o) => o.id)));
    renderTracking();
    els.orderForm.hidden = true;
    els.trackingView.hidden = false;
  }

  function showBuilder() {
    activeOrders = [];
    sessionStorage.removeItem('activeOrderIds');
    els.trackingView.hidden = true;
    els.orderForm.hidden = false;
  }

  socket.on('order:updated', (order) => {
    const idx = activeOrders.findIndex((o) => o.id === order.id);
    if (idx >= 0) {
      activeOrders[idx] = order;
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

  function drinkSummaryLine(item) {
    const parts = [];
    if (item.size) parts.push(item.size);
    if (item.temperature) parts.push(item.temperature);
    if (item.milk && item.milk !== 'None') parts.push(item.milk + ' milk');
    if (item.drink) parts.push(item.drink);
    let line = parts.join(' ');
    if (item.extraShots > 0) line += `, +${item.extraShots} shot${item.extraShots > 1 ? 's' : ''}`;
    if (item.syrups.length) line += `, ${item.syrups.join(' + ')} flavor`;
    return line;
  }

  function isDrinkComplete(item) {
    return Boolean(item.drink && item.size && item.milk && item.temperature);
  }

  function snapshotCurrentDrink() {
    return {
      drink: currentOrder.drink,
      size: currentOrder.size,
      milk: currentOrder.milk,
      extraShots: currentOrder.extraShots,
      syrups: [...currentOrder.syrups],
      temperature: currentOrder.temperature,
    };
  }

  function renderCart() {
    els.cartList.innerHTML = '';
    cart.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'cart-row';

      const text = document.createElement('span');
      text.textContent = `${index + 1}. ${drinkSummaryLine(item)}`;

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'cart-remove';
      removeBtn.textContent = '✕';
      removeBtn.setAttribute('aria-label', 'Remove this drink');
      removeBtn.addEventListener('click', () => {
        cart.splice(index, 1);
        renderCart();
        updateSummary();
      });

      row.appendChild(text);
      row.appendChild(removeBtn);
      els.cartList.appendChild(row);
    });
  }

  function updateSummary() {
    const currentReady = isDrinkComplete(currentOrder);
    const allItems = currentReady ? [...cart, currentOrder] : cart;

    if (allItems.length === 0) {
      els.summary.textContent = 'Choose a drink to get started.';
    } else {
      const lines = allItems.map((item, i) => `${i + 1}. ${drinkSummaryLine(item)}`);
      let text = lines.join('\n');
      if (currentOrder.pastries.length) text += `\nWith: ${currentOrder.pastries.join(' + ')}`;
      els.summary.textContent = text;
    }

    els.addDrinkBtn.disabled = !currentReady;

    const total = allItems.length;
    els.submitBtn.disabled = total === 0;
    els.submitBtn.textContent = total > 1 ? `Send Order (${total} drinks)` : 'Send Order';
  }

  function resetDrinkFields() {
    currentOrder.drink = null;
    currentOrder.size = null;
    currentOrder.milk = null;
    currentOrder.extraShots = 0;
    currentOrder.syrups = [];
    currentOrder.temperature = null;
    document.querySelectorAll('.option-btn.selected').forEach((b) => {
      if (b.dataset.group !== 'pastries') b.classList.remove('selected');
    });
    els.shotsCount.textContent = '0';
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

  els.addDrinkBtn.addEventListener('click', () => {
    if (!isDrinkComplete(currentOrder)) return;
    cart.push(snapshotCurrentDrink());
    resetDrinkFields();
    renderCart();
    updateSummary();
  });

  function resetForm() {
    resetDrinkFields();
    currentOrder.pastries = [];
    cart.length = 0;
    document.querySelectorAll('.option-btn.selected').forEach((b) => b.classList.remove('selected'));
    els.customerName.value = '';
    els.notes.value = '';
    renderCart();
    updateSummary();
  }

  async function submitOrder() {
    els.errorBanner.hidden = true;

    const currentReady = isDrinkComplete(currentOrder);
    const items = currentReady ? [...cart, snapshotCurrentDrink()] : [...cart];
    if (items.length === 0) return;

    els.submitBtn.disabled = true;

    const payload = {
      items,
      pastries: currentOrder.pastries,
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
      const createdOrders = await res.json();
      showTracking(createdOrders);
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
    const savedRaw = sessionStorage.getItem('activeOrderIds');
    if (!savedRaw) return;
    let savedIds;
    try {
      savedIds = JSON.parse(savedRaw);
    } catch (err) {
      savedIds = null;
    }
    if (!Array.isArray(savedIds) || savedIds.length === 0) return;

    try {
      const res = await fetch('/api/orders');
      const orders = await res.json();
      const found = orders.filter((o) => savedIds.includes(o.id));
      if (found.length) {
        showTracking(found);
      } else {
        sessionStorage.removeItem('activeOrderIds');
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
