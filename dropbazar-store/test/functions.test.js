// Local test — mock mode only (NO token set, NO real DropBazar calls).
// Run: npm test
const assert = require('assert');
const crypto = require('crypto');

delete process.env.DROPBAZAR_API_TOKEN;
delete process.env.DROPBAZAR_WEBHOOK_SECRET;

const products = require('../netlify/functions/products');
const product = require('../netlify/functions/product');
const districts = require('../netlify/functions/districts');
const preview = require('../netlify/functions/order-preview');
const place = require('../netlify/functions/place-order');
const statusFn = require('../netlify/functions/order-status');
const wallet = require('../netlify/functions/wallet');
const webhook = require('../netlify/functions/webhook');

const ev = (method, query, body) => ({
  httpMethod: method, queryStringParameters: query || {},
  body: body ? JSON.stringify(body) : null, headers: {},
});
const parse = (r) => JSON.parse(r.body);

(async () => {
  // products — mock, 6 samples, demo flag
  let r = parse(await products.handler(ev('GET')));
  assert.strictEqual(r.success, true); assert.strictEqual(r.demo_mode, true);
  assert.strictEqual(r.data.length, 6, 'mock products = 6');
  assert.ok(r.data.every((p) => typeof p.selling_price === 'number'), 'selling_price present');
  console.log('PASS products: 6 sample products, demo_mode=true, selling_price set');

  // products search + category filter
  r = parse(await products.handler(ev('GET', { search: 'earbuds' })));
  assert.strictEqual(r.data.length, 1); assert.ok(r.data[0].title.includes('Earbuds'));
  console.log('PASS products search: earbuds -> 1 result');
  r = parse(await products.handler(ev('GET', { category_id: '2' })));
  assert.strictEqual(r.data.length, 2, 'fashion category = 2');
  console.log('PASS products category filter: category 2 -> 2 results');

  // product detail
  r = parse(await product.handler(ev('GET', { id: '9001' })));
  assert.strictEqual(r.data.id, 9001); assert.strictEqual(r.demo_mode, true);
  console.log('PASS product detail: id 9001 found in mock mode');
  r = parse(await product.handler(ev('GET', {})));
  assert.strictEqual(r.success, false, 'missing id -> error');
  console.log('PASS product detail: missing id -> 400-style error');

  // districts + thanas
  r = parse(await districts.handler(ev('GET')));
  assert.ok(r.data.some((d) => d.name === 'Dhaka'));
  console.log('PASS districts: Dhaka present, count=' + r.data.length);
  r = parse(await districts.handler(ev('GET', { district_id: '2' })));
  assert.ok(r.data.some((t) => t.name === 'Kapasia'));
  console.log('PASS thanas: Gazipur thanas include Kapasia');

  // order preview — mock totals: subtotal 650*2=1300, Dhaka delivery 60, total 1360
  const cart = { customer_name: 'Test', customer_mobile: '01700000000', customer_address: 'Test', district: 'Dhaka', cart_items: [{ product_id: 9001, quantity: 2, reseller_price: 650 }] };
  r = parse(await preview.handler(ev('POST', null, cart)));
  assert.strictEqual(r.demo_mode, true);
  assert.strictEqual(r.data.subtotal, 1300); assert.strictEqual(r.data.delivery_charge, 60); assert.strictEqual(r.data.total, 1360);
  console.log('PASS order-preview mock: subtotal 1300 + delivery 60 = total 1360 (Dhaka)');
  // free delivery over 2000
  const cart2 = { ...cart, cart_items: [{ product_id: 9001, quantity: 4, reseller_price: 650 }] };
  r = parse(await preview.handler(ev('POST', null, cart2)));
  assert.strictEqual(r.data.delivery_charge, 0, 'free delivery over 2000');
  console.log('PASS order-preview mock: subtotal 2600 -> free delivery');

  // place-order in mock mode must REFUSE (no real order without token)
  r = parse(await place.handler(ev('POST', null, cart)));
  assert.strictEqual(r.success, false); assert.strictEqual(r.code, 'TOKEN_MISSING');
  console.log('PASS place-order mock: refused with TOKEN_MISSING (no real order)');

  // order-status mock
  r = parse(await statusFn.handler(ev('GET', { id: '123' })));
  assert.strictEqual(r.demo_mode, true); assert.strictEqual(r.data.status, 'pending');
  console.log('PASS order-status mock: pending demo status');

  // wallet without token -> TOKEN_MISSING error
  r = parse(await wallet.handler(ev('GET')));
  assert.strictEqual(r.code, 'TOKEN_MISSING');
  console.log('PASS wallet: no token -> TOKEN_MISSING');

  // webhook without secret -> accepts, returns 200, logs event+order only
  const wh = { event: 'order.placed', data: { id: 123, order_number: 'DB-1' } };
  r = parse(await webhook.handler({ httpMethod: 'POST', body: JSON.stringify(wh), headers: {} }));
  assert.strictEqual(r.success, true); assert.strictEqual(r.event, 'order.placed');
  console.log('PASS webhook no-secret: 200, event=order.placed');

  // webhook WITH secret: bad signature -> 401; good signature -> 200
  process.env.DROPBAZAR_WEBHOOK_SECRET = 'test-secret';
  const raw = JSON.stringify(wh); const ts = String(Math.floor(Date.now() / 1000));
  const good = crypto.createHmac('sha256', 'test-secret').update(ts + '.' + raw).digest('hex');
  r = parse(await webhook.handler({ httpMethod: 'POST', body: raw, headers: { 'x-webhook-signature': 't=' + ts + ',v1=badbad' } }));
  assert.strictEqual(r.success, false, 'bad signature must fail');
  console.log('PASS webhook secret: bad signature -> 401-style error');
  r = parse(await webhook.handler({ httpMethod: 'POST', body: raw, headers: { 'x-webhook-signature': 't=' + ts + ',v1=' + good } }));
  assert.strictEqual(r.success, true);
  console.log('PASS webhook secret: good HMAC-SHA256 signature -> 200');

  console.log('\nALL TESTS PASSED (mock mode, no token, no real API calls)');
})().catch((e) => { console.error('FAIL:', e.message); process.exit(1); });
