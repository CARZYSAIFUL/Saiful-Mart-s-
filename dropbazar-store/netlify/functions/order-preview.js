// POST /.netlify/functions/order-preview
// Body: { customer_name, customer_mobile, customer_address, district_id, thana, cart_items: [{product_id, quantity, reseller_price, variant?}], adv_charge? }
// DropBazar: POST /orders/preview — totals only, NO order is created.
const { json, getToken, tokenMissing, dropbazar, dropbazarError } = require('./_lib');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, {});
  if (event.httpMethod !== 'POST') return json(405, { success: false, error: 'POST method use korun.' });
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { success: false, error: 'JSON body thik nai.' }); }

  if (!getToken()) {
    // Mock preview: compute totals locally so checkout can be tested end-to-end.
    const items = Array.isArray(body.cart_items) ? body.cart_items : [];
    if (!items.length) return json(400, { success: false, error: 'Cart khali. Age product add korun.', demo_mode: true });
    const subtotal = items.reduce((s, it) => s + Number(it.reseller_price || 0) * Number(it.quantity || 1), 0);
    const district = String(body.district || body.district_name || '').toLowerCase();
    const delivery = subtotal >= 2000 ? 0 : district.includes('dhaka') ? 60 : 120;
    return json(200, {
      success: true, demo_mode: true,
      demo_note: 'DEMO — no token: eta asol order na, shudhu total-er hisab. Real order dite token bosate hobe.',
      data: { subtotal, delivery_charge: delivery, total: subtotal + delivery },
    });
  }

  const result = await dropbazar('/orders/preview', { method: 'POST', body });
  if (!result.ok) return dropbazarError(result);
  return json(200, { success: true, demo_mode: false, data: (result.data && result.data.data) || result.data });
};
