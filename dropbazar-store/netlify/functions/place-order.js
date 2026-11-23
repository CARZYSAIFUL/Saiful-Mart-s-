// POST /.netlify/functions/place-order
// Body: { customer_name, customer_mobile, customer_address, district_id, thana, cart_items: [{product_id, quantity, reseller_price, variant?}], adv_charge? }
// DropBazar: POST /orders — returns 201 {id, order_number, external_order_id}.
// external_order_id is generated here as SM-<timestamp> and is the idempotency key:
// re-submitting the same one returns the original order with duplicate:true.
const { json, getToken, dropbazar, dropbazarError } = require('./_lib');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, {});
  if (event.httpMethod !== 'POST') return json(405, { success: false, error: 'POST method use korun.' });
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { success: false, error: 'JSON body thik nai.' }); }

  if (!body.customer_name || !body.customer_mobile || !body.customer_address) {
    return json(422, { success: false, error: 'Naam, mobile number ar address — tintai dite hobe.' });
  }
  if (!Array.isArray(body.cart_items) || !body.cart_items.length) {
    return json(422, { success: false, error: 'Cart khali. Age product add korun.' });
  }
  // Selling price must never be below cost price — DropBazar rejects it (422).
  for (const it of body.cart_items) {
    if (it.cost_price != null && Number(it.reseller_price) < Number(it.cost_price)) {
      return json(422, { success: false, error: 'Selling price cost price-er niche hote parbe na.' });
    }
  }

  if (!getToken()) {
    return json(503, {
      success: false, demo_mode: true,
      error: 'DEMO mode-e asol order deya jay na. Real order dite Netlify-te DROPBAZAR_API_TOKEN bosate hobe.',
      message_en: 'Mock mode: cannot place a real order without a token.',
      code: 'TOKEN_MISSING',
    });
  }

  const external_order_id = body.external_order_id || ('SM-' + Date.now());
  const payload = { ...body, external_order_id };
  const result = await dropbazar('/orders', { method: 'POST', body: payload });
  if (!result.ok) return dropbazarError(result);
  const data = (result.data && result.data.data) || result.data;
  return json(201, { success: true, demo_mode: false, data });
};
