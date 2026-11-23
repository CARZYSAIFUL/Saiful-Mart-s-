// Saiful Mart frontend.
// IMPORTANT: this file calls ONLY Netlify Functions (/.netlify/functions/*).
// It NEVER calls dropbazarbd.com directly and NEVER contains an API token.
// The token lives server-side in the Netlify env var DROPBAZAR_API_TOKEN.

const API = '/.netlify/functions';
const state = { products: [], categories: [], cart: [], categoryId: '', search: '', demoMode: false };
try { state.cart = JSON.parse(localStorage.getItem('saiful_cart') || '[]'); } catch { state.cart = []; }

const $ = (id) => document.getElementById(id);
const taka = (n) => '৳' + Number(n || 0).toLocaleString('en-US');

function saveCart() {
  localStorage.setItem('saiful_cart', JSON.stringify(state.cart));
  $('cartCount').textContent = state.cart.reduce((s, i) => s + i.qty, 0);
}

function deliveryCharge(subtotal, districtName) {
  if (subtotal >= 2000) return 0; // Free delivery over ৳2000
  return (districtName || '').toLowerCase().includes('dhaka') ? 60 : 120;
}

async function api(path, opts) {
  const res = await fetch(API + path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message_en || ('Error ' + res.status));
  return data;
}

async function loadProducts() {
  $('grid').innerHTML = '<p class="loading">Product load hocche...</p>';
  try {
    const params = new URLSearchParams();
    if (state.categoryId) params.set('category_id', state.categoryId);
    if (state.search) params.set('search', state.search);
    const data = await api('/products' + (params.toString() ? '?' + params.toString() : ''));
    state.products = data.data || [];
    state.demoMode = !!data.demo_mode;
    $('demoBanner').hidden = !state.demoMode;
    if (data.categories) state.categories = data.categories;
    renderCats();
    renderGrid();
  } catch (e) {
    $('grid').innerHTML = '<p class="loading">Product load hoy nai: ' + escapeHtml(e.message) + '</p>';
  }
}

function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

function renderCats() {
  const cats = [{ id: '', name: 'Sob' }, ...state.categories];
  $('cats').innerHTML = cats.map((c) =>
    '<button type="button" data-id="' + c.id + '" class="' + (String(state.categoryId) === String(c.id) ? 'active' : '') + '">' + escapeHtml(c.name) + '</button>'
  ).join('');
  $('cats').querySelectorAll('button').forEach((b) => b.onclick = () => { state.categoryId = b.dataset.id; loadProducts(); });
}

function renderGrid() {
  if (!state.products.length) { $('grid').innerHTML = '<p class="loading">Kono product pawa jay nai.</p>'; return; }
  $('grid').innerHTML = state.products.map((p) => {
    const price = p.selling_price || p.suggested_price || p.price;
    return '<article class="card">' +
      '<img src="' + escapeHtml(p.thumbnail || '') + '" alt="' + escapeHtml(p.title || '') + '" loading="lazy" onerror="this.style.display=\'none\'">' +
      '<div class="body"><h3>' + escapeHtml(p.title || '') + '</h3>' +
      (state.demoMode ? '<span class="demo-tag">DEMO — no token</span>' : '') +
      '<div class="price">' + taka(price) + (p.suggested_price && p.suggested_price !== price ? ' <s>' + taka(p.suggested_price) + '</s>' : '') + '</div>' +
      '<button type="button" class="btn" data-add="' + p.id + '">🛒 Cart-e add korun</button></div></article>';
  }).join('');
  $('grid').querySelectorAll('[data-add]').forEach((b) => b.onclick = () => addToCart(Number(b.dataset.add)));
}

function addToCart(id) {
  const p = state.products.find((x) => Number(x.id) === id);
  if (!p) return;
  const line = state.cart.find((x) => x.id === id);
  if (line) line.qty += 1;
  else state.cart.push({ id: p.id, title: p.title, price: p.selling_price || p.suggested_price || p.price, cost_price: p.price, qty: 1 });
  saveCart(); renderCart();
  $('notice').hidden = false;
  $('notice').textContent = '✅ "' + p.title + '" cart-e add hoyeche!';
  setTimeout(() => { $('notice').hidden = true; }, 2500);
}

function renderCart() {
  const box = $('cartItems');
  if (!state.cart.length) { box.innerHTML = '<p>Cart khali.</p>'; $('cartTotal').textContent = ''; return; }
  const subtotal = state.cart.reduce((s, i) => s + i.price * i.qty, 0);
  box.innerHTML = state.cart.map((i, idx) =>
    '<div class="cart-line"><span>' + escapeHtml(i.title) + ' × ' + i.qty + '</span><span>' + taka(i.price * i.qty) + ' <button type="button" data-rm="' + idx + '">✕</button></span></div>'
  ).join('');
  $('cartTotal').textContent = 'Subtotal: ' + taka(subtotal) + ' (delivery checkout-e hisab hobe)';
  box.querySelectorAll('[data-rm]').forEach((b) => b.onclick = () => { state.cart.splice(Number(b.dataset.rm), 1); saveCart(); renderCart(); });
}

async function loadDistricts() {
  try {
    const data = await api('/districts');
    const sel = $('districtSelect');
    (data.data || []).forEach((d) => {
      const o = document.createElement('option');
      o.value = d.id; o.textContent = d.name; o.dataset.name = d.name;
      sel.appendChild(o);
    });
  } catch (e) { /* districts optional in demo — checkout still works */ }
}

$('districtSelect').addEventListener('change', async (e) => {
  const id = e.target.value;
  const sel = $('thanaSelect');
  sel.innerHTML = '<option value="">Load hocche...</option>';
  if (!id) { sel.innerHTML = '<option value="">Age district bechun</option>'; return; }
  try {
    const data = await api('/districts?district_id=' + encodeURIComponent(id));
    sel.innerHTML = '<option value="">Thana bechun (optional)</option>' +
      (data.data || []).map((t) => '<option value="' + escapeHtml(t.name) + '">' + escapeHtml(t.name) + '</option>').join('');
  } catch { sel.innerHTML = '<option value="">Thana load hoy nai — khali rakhun</option>'; }
});

function cartPayload(form) {
  const districtSel = $('districtSelect');
  const districtName = districtSel.selectedOptions[0] ? districtSel.selectedOptions[0].dataset.name || districtSel.selectedOptions[0].textContent : '';
  return {
    customer_name: form.customer_name.value.trim(),
    customer_mobile: form.customer_mobile.value.trim(),
    customer_address: form.customer_address.value.trim(),
    district_id: form.district_id.value || undefined,
    district: districtName,
    thana: form.thana.value || undefined,
    cart_items: state.cart.map((i) => ({ product_id: i.id, quantity: i.qty, reseller_price: i.price, cost_price: i.cost_price })),
  };
}

$('previewBtn').addEventListener('click', async () => {
  const form = $('checkoutForm');
  if (!state.cart.length) { $('checkoutMsg').textContent = 'Cart khali.'; return; }
  $('checkoutMsg').textContent = 'Total hisab hocche...';
  try {
    const data = await api('/order-preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cartPayload(form)) });
    const d = data.data || {};
    const subtotal = d.subtotal ?? state.cart.reduce((s, i) => s + i.price * i.qty, 0);
    const delivery = d.delivery_charge ?? deliveryCharge(subtotal, cartPayload(form).district);
    $('previewBox').innerHTML = 'Subtotal: <b>' + taka(subtotal) + '</b><br>Delivery: <b>' + taka(delivery) + '</b><br>Total (COD): <b>' + taka(d.total ?? (subtotal + delivery)) + '</b>' + (data.demo_mode ? '<br><small>DEMO preview — asol order na.</small>' : '');
    $('checkoutMsg').textContent = '';
  } catch (e) {
    $('checkoutMsg').textContent = '❌ ' + e.message;
  }
});

$('checkoutForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('[type="submit"]');
  btn.disabled = true;
  $('checkoutMsg').textContent = 'Order pathano hocche...';
  try {
    const payload = cartPayload(e.target);
    // Step 1: preview first (DropBazar rule), Step 2: place the order.
    await api('/order-preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await api('/place-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const d = data.data || {};
    state.cart = []; saveCart(); renderCart();
    $('checkoutModal').hidden = true;
    $('successText').innerHTML = 'Order number: <b>' + escapeHtml(d.order_number || d.id || '—') + '</b><br>Amra call kore confirm korbo. Dhonnobad! 🙏';
    $('successModal').hidden = false;
    $('checkoutMsg').textContent = '';
  } catch (err) {
    $('checkoutMsg').textContent = '❌ ' + err.message + ' (429 hole 1 minute wait kore abar try korun.)';
  } finally { btn.disabled = false; }
});

// Drawer / modal wiring
$('cartBtn').onclick = () => { renderCart(); $('cartDrawer').hidden = false; };
$('closeCart').onclick = () => { $('cartDrawer').hidden = true; };
$('checkoutBtn').onclick = () => { if (!state.cart.length) return; $('cartDrawer').hidden = true; $('checkoutModal').hidden = false; };
$('closeCheckout').onclick = () => { $('checkoutModal').hidden = true; };
$('closeSuccess').onclick = () => { $('successModal').hidden = true; };
let searchTimer;
$('search').addEventListener('input', (e) => { clearTimeout(searchTimer); searchTimer = setTimeout(() => { state.search = e.target.value.trim(); loadProducts(); }, 400); });

saveCart(); loadDistricts(); loadProducts();
