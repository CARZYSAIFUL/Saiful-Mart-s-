// GET /.netlify/functions/products?category_id=&search=&page=&per_page=
// Lists products from DropBazar (GET /products) or SAMPLE products in mock mode.
const { json, getToken, dropbazar, dropbazarError, mockProductsResponse, withSellingPrice } = require('./_lib');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, {});
  const q = event.queryStringParameters || {};
  if (!getToken()) return json(200, mockProductsResponse(q));

  const params = new URLSearchParams();
  if (q.category_id) params.set('category_id', q.category_id);
  if (q.search) params.set('search', q.search);
  if (q.page) params.set('page', q.page);
  if (q.per_page) params.set('per_page', Math.min(Number(q.per_page) || 20, 100));
  const qs = params.toString();

  const result = await dropbazar('/products' + (qs ? '?' + qs : ''));
  if (!result.ok) return dropbazarError(result);

  // DropBazar returns {success, data: [...]} — add selling_price to each product.
  const data = result.data || {};
  const list = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
  return json(200, {
    success: true,
    demo_mode: false,
    data: list.map(withSellingPrice),
    meta: data.meta || null,
  });
};
