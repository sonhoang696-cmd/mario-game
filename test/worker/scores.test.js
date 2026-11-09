import { env, exports } from 'cloudflare:workers';
import { beforeEach, describe, expect, it } from 'vitest';
import { MAX_LEVELS, MAX_NAME_LENGTH, MAX_SCORE, sanitizeName, validateScore } from '../../src/validation.js';

const call = (path, init) => exports.default.fetch(new Request('http://example.com' + path, init));
const post = (body) =>
  call('/api/scores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  });

beforeEach(async () => {
  await env.DB.prepare('DELETE FROM scores').run();
});

describe('GET /api/health', () => {
  it('trả về ok', async () => {
    const res = await call('/api/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});

describe('POST + GET /api/scores (D1)', () => {
  it('bảng xếp hạng ban đầu rỗng', async () => {
    const res = await call('/api/scores');
    expect(res.status).toBe(200);
    expect((await res.json()).scores).toEqual([]);
  });

  it('lưu điểm hợp lệ vào D1 và đọc lại được', async () => {
    const res = await post({ name: 'Mario', score: 1234, levels: 2 });
    expect(res.status).toBe(201);

    const { scores } = await (await call('/api/scores')).json();
    expect(scores).toHaveLength(1);
    expect(scores[0]).toMatchObject({ name: 'Mario', score: 1234, levels: 2 });
  });

  it('sắp xếp điểm cao trước và chỉ trả về top 10', async () => {
    for (let i = 1; i <= 12; i++) {
      expect((await post({ name: 'P' + i, score: i * 100, levels: 1 })).status).toBe(201);
    }
    const { scores } = await (await call('/api/scores')).json();
    expect(scores).toHaveLength(10);
    expect(scores[0].score).toBe(1200);
    expect(scores[9].score).toBe(300);
    const sorted = [...scores].sort((a, b) => b.score - a.score);
    expect(scores.map(s => s.score)).toEqual(sorted.map(s => s.score));
  });

  it('làm sạch tên trước khi lưu (chống chèn thẻ HTML)', async () => {
    await post({ name: '  <b>Luigi</b>  ', score: 10, levels: 0 });
    const { scores } = await (await call('/api/scores')).json();
    expect(scores[0].name).toBe('bLuigi/b');
  });

  it('chống SQL injection (dùng prepared statement)', async () => {
    const res = await post({ name: "x'); DROP TABLE scores;--", score: 5, levels: 0 });
    expect(res.status).toBe(201);
    const { scores } = await (await call('/api/scores')).json();
    expect(scores).toHaveLength(1);
  });
});

describe('POST /api/scores - dữ liệu không hợp lệ', () => {
  it.each([
    ['thiếu tên', { score: 10, levels: 0 }],
    ['tên rỗng', { name: '   ', score: 10, levels: 0 }],
    ['điểm âm', { name: 'A', score: -1, levels: 0 }],
    ['điểm là số thập phân', { name: 'A', score: 1.5, levels: 0 }],
    ['điểm là chuỗi', { name: 'A', score: '100', levels: 0 }],
    ['điểm vượt giới hạn', { name: 'A', score: MAX_SCORE + 1, levels: 0 }],
    ['số màn vượt giới hạn', { name: 'A', score: 10, levels: MAX_LEVELS + 1 }],
    ['số màn âm', { name: 'A', score: 10, levels: -1 }]
  ])('từ chối: %s', async (_label, body) => {
    const res = await post(body);
    expect(res.status).toBe(400);
    expect(typeof (await res.json()).error).toBe('string');
  });

  it('từ chối JSON hỏng', async () => {
    expect((await post('{not json')).status).toBe(400);
  });

  it('từ chối body quá lớn', async () => {
    const res = await post({ name: 'A', score: 10, levels: 0, junk: 'x'.repeat(2000) });
    expect(res.status).toBe(413);
  });

  it('không ghi gì vào D1 khi bị từ chối', async () => {
    await post({ name: 'A', score: -5, levels: 0 });
    const { results } = await env.DB.prepare('SELECT COUNT(*) AS n FROM scores').all();
    expect(results[0].n).toBe(0);
  });
});

describe('định tuyến', () => {
  it('405 với method không hỗ trợ', async () => {
    const res = await call('/api/scores', { method: 'DELETE' });
    expect(res.status).toBe(405);
    expect(res.headers.get('Allow')).toBe('GET, POST');
  });

  it('404 với API không tồn tại', async () => {
    expect((await call('/api/khong-co')).status).toBe(404);
  });

  it('phục vụ trang game tĩnh ở đường dẫn gốc', async () => {
    const res = await call('/');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('Mario');
  });
});

describe('hàm kiểm tra dữ liệu', () => {
  it('sanitizeName cắt độ dài và bỏ ký tự điều khiển', () => {
    expect(sanitizeName('a'.repeat(50))).toHaveLength(MAX_NAME_LENGTH);
    expect(sanitizeName('A\u0000B\nC')).toBe('ABC');
    expect(sanitizeName(123)).toBe('');
  });

  it('validateScore trả về giá trị đã làm sạch', () => {
    expect(validateScore({ name: ' Bo ', score: 7, levels: 1 })).toEqual({
      value: { name: 'Bo', score: 7, levels: 1 }
    });
    expect(validateScore(null).error).toBeTruthy();
  });
});
