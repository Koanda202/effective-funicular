(async function () {
  try {
    const res = await fetch('/api/qr-url');
    const { url } = await res.json();
    document.getElementById('fallback-url').textContent = url;
  } catch (err) {
    document.getElementById('fallback-url').textContent = window.location.origin + '/order';
  }
})();
