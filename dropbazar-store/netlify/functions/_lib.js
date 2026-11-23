// Shared helpers for Saiful Mart x DropBazarBD Netlify Functions.
// SECURITY: the DropBazar token lives ONLY in process.env.DROPBAZAR_API_TOKEN.
// It is NEVER hardcoded here, NEVER sent to the frontend, NEVER logged.
// Frontend calls ONLY /.netlify/functions/* — never dropbazarbd.com directly.

const BASE = 'https://dropbazarbd.com/api/v1';

// ---- Selling-price markup (edit this one number only) ----
// Selling price = suggested_price + MARKUP_TAKA.
// Default 0 = sell exactly at DropBazar's suggested_price.
// Example: set to 50 to add ৳50 profit on every product.
// Do NOT set a selling price below the cost price — DropBazar rejects it (422).
const MARKUP_TAKA = 0;

function sellingPrice(product) {
  const suggested = Number(product.suggested_price || product.price || 0);
  const cost = Number(product.price || 0);
  return Math.max(suggested + MARKUP_TAKA, cost);
}

function withSellingPrice(p) {
  return { ...p, selling_price: sellingPrice(p) };
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    },
    body: JSON.stringify(body),
  };
}

function error(statusCode, message_bn, message_en, extra = {}) {
  return json(statusCode, { success: false, error: message_bn, message_en, ...extra });
}

// Missing-token error — tells the deployer exactly what to do, in Bangla + English.
function tokenMissing() {
  return error(
    503,
    'API token bosano hoy nai. Netlify Site settings > Environment variables-e giye DROPBAZAR_API_TOKEN add korun (DropBazar Dashboard → API ইন্টিগ্রেশন theke copy kora token). Token kokhono chat-e ba code-e diben na.',
    'DROPBAZAR_API_TOKEN is not set. Add it in Netlify Site settings > Environment variables (copy it from DropBazar Dashboard → API ইন্টিগ্রেশন). Never share the token in chat or code.',
    { code: 'TOKEN_MISSING', demo_mode: true }
  );
}

function getToken() {
  const t = process.env.DROPBAZAR_API_TOKEN;
  return t && t.trim() ? t.trim() : null;
}

// Call DropBazar Partner API server-side only.
async function dropbazar(path, { method = 'GET', body = null } = {}) {
  const token = getToken();
  if (!token) return { ok: false, status: 503, data: null, tokenMissing: true };
  const res = await fetch(BASE + path, {
    method,
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { data = null; }
  return { ok: res.ok, status: res.status, data };
}

// Pass a DropBazar error through, translated into Bangla where we know the cause.
function dropbazarError(result) {
  const s = result.status;
  if (s === 401) return error(401, 'Token vul ba meyad sesh. DropBazar Dashboard → API ইন্টিগ্রেশন theke notun token niye Netlify-te bosan.', 'Invalid or expired token.');
  if (s === 403) return error(403, 'Account approve hoy nai, ba ei kajer permission nai. DropBazar support-e jogajog korun.', 'Account not approved or no permission for this action.');
  if (s === 404) return error(404, 'Product/order pawa jay nai.', 'Not found.');
  if (s === 422) {
    const msg = result.data && (result.data.message || (result.data.errors && JSON.stringify(result.data.errors))) || '';
    return error(422, 'Order-ta neya jay nai: ' + (msg || 'selling price cost price-er niche, ba variant/size dite hobe.'), 'Validation failed. ' + msg, { upstream: result.data });
  }
  if (s === 429) return error(429, 'Onek beshi request hoye geche. 1 minute wait kore abar try korun.', 'Rate limit exceeded. Wait a minute and try again.');
  return error(s || 502, 'DropBazar server theke vul asche. Ektu pore abar try korun.', 'Upstream error from DropBazar.');
}

// ---- MOCK MODE (no token set) ----
// Clearly-labelled SAMPLE products so the store can be previewed locally
// and on Netlify before a real token is added. NEVER real orders in mock mode.
const MOCK_CATEGORIES = [
  { id: 1, name: 'Electronics', product_count: 2 },
  { id: 2, name: 'Fashion', product_count: 2 },
  { id: 3, name: 'Home & Living', product_count: 1 },
  { id: 4, name: 'Beauty', product_count: 1 },
];

const MOCK_PRODUCTS = [
  { id: 9001, title: 'Wireless Earbuds (SAMPLE)', category_id: 1, category: 'Electronics', thumbnail: 'https://picsum.photos/seed/saiful-earbuds/600/600', price: 450, suggested_price: 650, stock: 12 },
  { id: 9002, title: 'Power Bank 10000mAh (SAMPLE)', category_id: 1, category: 'Electronics', thumbnail: 'https://picsum.photos/seed/saiful-powerbank/600/600', price: 700, suggested_price: 950, stock: 8 },
  { id: 9003, title: 'Cotton T-Shirt — Black (SAMPLE)', category_id: 2, category: 'Fashion', thumbnail: 'https://picsum.photos/seed/saiful-tshirt/600/600', price: 280, suggested_price: 450, stock: 20 },
  { id: 9004, title: 'Sunglasses UV400 (SAMPLE)', category_id: 2, category: 'Fashion', thumbnail: 'https://picsum.photos/seed/saiful-glasses/600/600', price: 220, suggested_price: 380, stock: 15 },
  { id: 9005, title: 'LED Desk Lamp (SAMPLE)', category_id: 3, category: 'Home & Living', thumbnail: 'https://picsum.photos/seed/saiful-lamp/600/600', price: 550, suggested_price: 800, stock: 6 },
  { id: 9006, title: 'Vitamin C Serum 30ml (SAMPLE)', category_id: 4, category: 'Beauty', thumbnail: 'https://picsum.photos/seed/saiful-serum/600/600', price: 380, suggested_price: 600, stock: 10 },
];

const MOCK_DISTRICTS = [
  { id: 1, name: 'Dhaka', thanas: ['Mirpur', 'Uttara', 'Dhanmondi', 'Gulshan', 'Mohammadpur'] },
  { id: 2, name: 'Gazipur', thanas: ['Gazipur Sadar', 'Kapasia', 'Tongi', 'Sreepur'] },
  { id: 3, name: 'Chattogram', thanas: ['Chattogram Sadar', 'Pahartali', 'Halishahar'] },
  { id: 4, name: 'Khulna', thanas: ['Khulna Sadar', 'Sonadanga'] },
  { id: 5, name: 'Rajshahi', thanas: ['Rajshahi Sadar', 'Boalia'] },
];

function mockProductsResponse(query = {}) {
  let list = MOCK_PRODUCTS.map(withSellingPrice);
  if (query.category_id) list = list.filter((p) => String(p.category_id) === String(query.category_id));
  if (query.search) {
    const q = String(query.search).toLowerCase();
    list = list.filter((p) => p.title.toLowerCase().includes(q));
  }
  return { success: true, demo_mode: true, demo_note: 'DEMO — no token: sample products only. Real order jabe na.', data: list, categories: MOCK_CATEGORIES };
}

module.exports = {
  BASE, MARKUP_TAKA, sellingPrice, withSellingPrice,
  json, error, tokenMissing, getToken, dropbazar, dropbazarError,
  MOCK_CATEGORIES, MOCK_PRODUCTS, MOCK_DISTRICTS, mockProductsResponse,
};
