// Cloudflare Worker: API bảng xếp hạng (D1) + phục vụ game tĩnh từ thư mục public/.
//
//   GET  /api/health   -> { ok: true }
//   GET  /api/scores   -> { scores: [{ name, score, levels, created_at }, ...] }  (top 10)
//   POST /api/scores   -> body { name, score, levels }  => 201 { ok: true }
//
// Lưu ý: điểm do trình duyệt gửi lên nên KHÔNG thể chống gian lận hoàn toàn;
// Worker chỉ kiểm tra dữ liệu hợp lệ và chặn các giá trị vô lý.

import { validateScore } from './validation.js';

const MAX_BODY_BYTES = 1024;
const TOP_N = 10;

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store'
};

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...JSON_HEADERS, ...extra } });
}

async function handleScores(request, env) {
  if (request.method === 'GET') {
    const { results } = await env.DB
      .prepare('SELECT name, score, levels, created_at FROM scores ORDER BY score DESC, created_at ASC LIMIT ?')
      .bind(TOP_N)
      .all();
    return json({ scores: results });
  }

  if (request.method === 'POST') {
    const text = await request.text();
    if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
      return json({ error: 'Dữ liệu quá lớn' }, 413);
    }
    let body;
    try { body = JSON.parse(text); } catch { return json({ error: 'JSON không hợp lệ' }, 400); }

    const checked = validateScore(body);
    if (checked.error) return json({ error: checked.error }, 400);

    const { name, score, levels } = checked.value;
    await env.DB
      .prepare('INSERT INTO scores (name, score, levels) VALUES (?, ?, ?)')
      .bind(name, score, levels)
      .run();
    return json({ ok: true }, 201);
  }

  return json({ error: 'Method không được hỗ trợ' }, 405, { Allow: 'GET, POST' });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    try {
      if (pathname === '/api/health') return json({ ok: true });
      if (pathname === '/api/scores') return await handleScores(request, env);
      if (pathname.startsWith('/api/')) return json({ error: 'Không tìm thấy' }, 404);
    } catch (err) {
      console.error('API error:', err);
      return json({ error: 'Lỗi máy chủ' }, 500);
    }

    // Mọi đường dẫn khác: phục vụ file tĩnh của game
    return env.ASSETS.fetch(request);
  }
};
