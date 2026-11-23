// GET /.netlify/functions/order-status?id=<order id or order_number>
// DropBazar: GET /orders/{id} — details + tracking.
// Status mapping (DropBazar docs): placed→pending; processing→accepted/collected/booked/packed;
// shipped→courier_pending; delivered→delivered/courier_delivered/partial_delivered;
// returned→courier_returned; cancelled→cancelled/courier_cancelled; refunded→refunded.
const { json, getToken, dropbazar, dropbazarError } = require('./_lib');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, {});
  const q = event.queryStringParameters || {};
  if (!q.id) return json(400, { success: false, error: 'Order id dite hobe. /order-status?id=123 er moto.' });
  if (!getToken()) {
    return json(200, {
      success: true, demo_mode: true,
      demo_note: 'DEMO — no token: asol order status dekha jabe na.',
      data: { id: q.id, order_number: 'DEMO-' + q.id, status: 'pending', order_process: 'pending' },
    });
  }
  const result = await dropbazar('/orders/' + encodeURIComponent(q.id));
  if (!result.ok) return dropbazarError(result);
  return json(200, { success: true, demo_mode: false, data: (result.data && result.data.data) || result.data });
};
