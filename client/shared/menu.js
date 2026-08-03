async function fetchMenu() {
  const res = await fetch('/api/menu');
  if (!res.ok) throw new Error('Failed to load menu');
  return res.json();
}
