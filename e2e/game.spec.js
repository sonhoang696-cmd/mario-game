import { expect, test } from '@playwright/test';

// Lấy giá trị biến toàn cục của game (khai báo bằng let ở main.js)
const read = (page, expr) => page.evaluate(expr);

test.beforeEach(async ({ page }) => {
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') page.errors.push(m.text()); });
  await page.goto('/');
  await page.waitForFunction(() => typeof state !== 'undefined');
});

test('trang tải được, hiện màn hình tiêu đề và không có lỗi JS', async ({ page }) => {
  await expect(page).toHaveTitle(/Mario/);
  await expect(page.locator('#game')).toBeVisible();
  expect(await read(page, 'state')).toBe('title');
  expect(page.errors).toEqual([]);
});

test('nhấn Enter bắt đầu chơi, chạy và nhảy được', async ({ page }) => {
  await page.locator('body').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('Enter');
  await expect.poll(() => read(page, 'state')).toBe('playing');

  const x0 = await read(page, 'player.x');
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(500);
  await page.keyboard.up('ArrowRight');
  expect(await read(page, 'player.x')).toBeGreaterThan(x0 + 50);

  const y0 = await read(page, 'player.y');
  await page.keyboard.down('Space');
  await page.waitForTimeout(150);
  expect(await read(page, 'player.y')).toBeLessThan(y0 - 10);
  await page.keyboard.up('Space');
  expect(page.errors).toEqual([]);
});

test('phím P tạm dừng và chơi tiếp', async ({ page }) => {
  await page.keyboard.press('Enter');
  await expect.poll(() => read(page, 'state')).toBe('playing');
  await page.keyboard.press('p');
  await expect.poll(() => read(page, 'state')).toBe('paused');
  await page.keyboard.press('p');
  await expect.poll(() => read(page, 'state')).toBe('playing');
});

test('đội đầu vào hộp ? ra xu, hộp M ra nấm, ăn nấm thì lớn lên', async ({ page }) => {
  await page.keyboard.press('Enter');
  await expect.poll(() => read(page, 'state')).toBe('playing');

  // Đứng dưới hộp xu (8,9) rồi nhảy
  await page.evaluate(() => { player.x = 8 * TILE + 4; player.y = 12 * TILE; player.vx = 0; });
  await page.waitForTimeout(100);
  await page.keyboard.down('Space');
  await page.waitForTimeout(250);
  await page.keyboard.up('Space');
  await expect.poll(() => read(page, 'level.grid[9][8]')).toBe('U');
  expect(await read(page, 'coinCount')).toBeGreaterThanOrEqual(1);

  // Hộp nấm (10,9)
  await page.evaluate(() => { player.x = 10 * TILE + 4; player.y = 12 * TILE; player.vx = 0; });
  await page.waitForTimeout(100);
  await page.keyboard.down('Space');
  await page.waitForTimeout(250);
  await page.keyboard.up('Space');
  await expect.poll(() => read(page, 'mushrooms.length')).toBe(1);

  // Ăn nấm
  await page.evaluate(() => { player.x = mushrooms[0].x; player.y = mushrooms[0].y - 4; });
  await expect.poll(() => read(page, 'player.big')).toBe(true);
});

test('hết mạng thì gửi điểm lên bảng xếp hạng D1', async ({ page, request }) => {
  const name = 'E2E' + Date.now().toString().slice(-6);
  await page.fill('#player-name', name);
  await page.keyboard.press('Escape');            // bỏ focus vào ô nhập khỏi ảnh hưởng game
  await page.locator('#game').click();             // chạm màn hình = bắt đầu
  await expect.poll(() => read(page, 'state')).toBe('playing');

  await page.evaluate(() => { score = 4321; lives = 1; killPlayer(); });
  await expect.poll(() => read(page, 'state'), { timeout: 8000 }).toBe('gameover');

  await expect.poll(async () => {
    const res = await request.get('/api/scores');
    const { scores } = await res.json();
    return scores.some((s) => s.name === name && s.score === 4321);
  }, { timeout: 8000 }).toBe(true);
});

test('API từ chối điểm không hợp lệ', async ({ request }) => {
  const res = await request.post('/api/scores', { data: { name: 'Hacker', score: 99999999, levels: 3 } });
  expect(res.status()).toBe(400);
});
