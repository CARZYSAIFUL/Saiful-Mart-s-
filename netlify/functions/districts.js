// GET /.netlify/functions/districts
// GET /.netlify/functions/districts?district_id=1  (thanas for one district)
// DropBazar: GET /districts and GET /districts/{id}/thanas.
const { json, getToken, dropbazar, dropbazarError, MOCK_DISTRICTS } = require('./_lib');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, {});
  const q = event.queryStringParameters || {};

  if (!getToken()) {
    if (q.district_id) {
      const d = MOCK_DISTRICTS.find((x) => String(x.id) === String(q.district_id));
      return json(200, { success: true, demo_mode: true, data: d ? d.thanas.map((name, i) => ({ id: i + 1, name })) : [] });
    }
    return json(200, { success: true, demo_mode: true, data: MOCK_DISTRICTS.map((d) => ({ id: d.id, name: d.name })) });
  }

  if (q.district_id) {
    const result = await dropbazar('/districts/' + encodeURIComponent(q.district_id) + '/thanas');
    if (!result.ok) return dropbazarError(result);
    return json(200, { success: true, demo_mode: false, data: (result.data && result.data.data) || result.data });
  }
  const result = await dropbazar('/districts');
  if (!result.ok) return dropbazarError(result);
  return json(200, { success: true, demo_mode: false, data: (result.data && result.data.data) || result.data });
};
