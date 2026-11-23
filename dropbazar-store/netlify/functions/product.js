// GET /.netlify/functions/product?id=4460
// One product in full detail from DropBazar (GET /products/{id}).
const { json, getToken, dropbazar, dropbazarError, MOCK_PRODUCTS, withSellingPrice } = require('./_lib');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, {});
  const q = event.queryStringParameters || {};
  const id = q.id;
  if (!id) return json(400, { success: false, error: 'Product id dite hobe. /product?id=4460 er moto.', message_en: 'Product id is required.' });

  if (!getToken()) {
    const p = MOCK_PRODUCTS.find((x) => String(x.id) === String(id));
    if (!p) return json(404, { success: false, error: 'Sample product pawa jay nai.', demo_mode: true });
    return json(200, { success: true, demo_mode: true, demo_note: 'DEMO — no token: sample product only.', data: { ...withSellingPrice(p), gallery: [p.thumbnail], variants: [] } });
  }

  const result = await dropbazar('/products/' + encodeURIComponent(id));
  if (!result.ok) return dropbazarError(result);
  const data = result.data || {};
  const p = data.data || data;
  return json(200, { success: true, demo_mode: false, data: withSellingPrice(p) });
};
