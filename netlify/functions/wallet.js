// GET /.netlify/functions/wallet
// DropBazar: GET /wallet — reseller wallet balance.
// ADMIN ONLY: this endpoint is for the store owner, not for customers.
// The frontend does not call it. Keep it behind Netlify's token check only.
const { json, getToken, tokenMissing, dropbazar, dropbazarError } = require('./_lib');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, {});
  if (!getToken()) return tokenMissing();
  const result = await dropbazar('/wallet');
  if (!result.ok) return dropbazarError(result);
  return json(200, { success: true, demo_mode: false, data: (result.data && result.data.data) || result.data });
};
