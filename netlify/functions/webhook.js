// POST /.netlify/functions/webhook
// DropBazar webhook receiver. Events: order.placed, order.status_changed,
// order.payment_status_changed.
// Signature: X-Webhook-Signature: t=<ts>,v1=<hex> where
// v1 = HMAC-SHA256(t + "." + raw_body, DROPBAZAR_WEBHOOK_SECRET).
// Verify the signature when the secret is set. Log ONLY event type + order id
// (never secrets, never the full body). Always answer 200 fast (within 10s),
// otherwise DropBazar retries up to 5 times.
const crypto = require('crypto');
const { json } = require('./_lib');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, {});
  if (event.httpMethod !== 'POST') return json(405, { success: false, error: 'POST method use korun.' });

  const rawBody = event.body || '';
  const secret = process.env.DROPBAZAR_WEBHOOK_SECRET;
  const sigHeader = event.headers['x-webhook-signature'] || event.headers['X-Webhook-Signature'] || '';

  if (secret) {
    // Format: t=<ts>,v1=<hex>
    const parts = Object.fromEntries(sigHeader.split(',').map((p) => p.split('=')));
    const ts = parts.t, v1 = parts.v1;
    if (!ts || !v1) return json(400, { success: false, error: 'Webhook signature missing.' });
    const expected = crypto.createHmac('sha256', secret).update(ts + '.' + rawBody).digest('hex');
    const a = Buffer.from(v1, 'utf8'), b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return json(401, { success: false, error: 'Webhook signature vul.' });
    }
  }

  let payload = {};
  try { payload = JSON.parse(rawBody); } catch { payload = {}; }
  const eventType = payload.event || payload.type || 'unknown';
  const orderId = (payload.data && (payload.data.id || payload.data.order_number)) || payload.order_id || 'unknown';
  // Safe log: event type + order id only.
  console.log('[webhook]', eventType, 'order:', orderId);

  return json(200, { success: true, received: true, event: eventType });
};
