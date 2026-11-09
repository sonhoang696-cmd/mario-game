import { describe, expect, it } from 'vitest';
import { loadGame } from '../helpers/loadGame.js';

const G = loadGame();
const { TILE, GRAVITY, MAX_FALL } = G;

// Bản đồ phẳng nhỏ: đất ở hàng 13-14
function flatLevel(extra = () => {}) {
  const level = G.createLevel(0);
  for (let y = 0; y < level.rows; y++) for (let x = 0; x < level.cols; x++) level.grid[y][x] = '.';
  for (let x = 0; x < level.cols; x++) { level.grid[13][x] = '#'; level.grid[14][x] = '#'; }
  extra(level);
  return level;
}

function step(e, level, seconds) {
  const dt = 1 / 60;
  let last;
  for (let t = 0; t < seconds; t += dt) {
    e.vy = Math.min(e.vy + GRAVITY * dt, MAX_FALL);
    last = G.moveEntity(e, dt, level);
  }
  return last;
}

describe('moveEntity (va chạm với bản đồ)', () => {
  it('rơi xuống và đứng yên trên mặt đất', () => {
    const level = flatLevel();
    const e = { x: 100, y: 100, w: 24, h: 30, vx: 0, vy: 0, onGround: false };
    step(e, level, 2);
    expect(e.onGround).toBe(true);
    expect(e.y).toBe(13 * TILE - e.h);
  });

  it('bị chặn bởi tường bên phải', () => {
    const level = flatLevel(l => { l.grid[12][10] = '#'; });
    const e = { x: 9 * TILE, y: 12 * TILE + 2, w: 24, h: 30, vx: 300, vy: 0, onGround: true };
    const res = G.moveEntity(e, 0.1, level);
    expect(res.hitX).toBe(true);
    expect(e.x).toBe(10 * TILE - e.w);
  });

  it('đội đầu vào gạch ở trên và báo đúng ô bị đụng', () => {
    const level = flatLevel(l => { l.grid[9][5] = 'B'; });
    // người chơi ở ngay dưới ô (5,9), đang bay lên
    const e = { x: 5 * TILE + 4, y: 10 * TILE + 4, w: 24, h: 30, vx: 0, vy: -400, onGround: false };
    const res = G.moveEntity(e, 1 / 30, level);
    expect(res.hitHead).toBe(true);
    expect(res.headTile.tx).toBe(5);
    expect(res.headTile.ty).toBe(9);
    expect(e.vy).toBe(0);
  });

  it('chọn đúng ô gạch gần tâm khi đầu chạm hai ô cùng lúc', () => {
    const level = flatLevel(l => { l.grid[9][5] = 'B'; l.grid[9][6] = 'B'; });
    // thân nằm lệch về phía ô 6 (tâm x ≈ 6*32 + 8)
    const e = { x: 6 * TILE - 4, y: 10 * TILE + 4, w: 24, h: 30, vx: 0, vy: -400, onGround: false };
    const res = G.moveEntity(e, 1 / 30, level);
    expect(res.headTile.tx).toBe(6);
  });

  it('overlap nhận biết hai hộp chồng nhau', () => {
    expect(G.overlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 })).toBe(true);
    expect(G.overlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 20, y: 0, w: 10, h: 10 })).toBe(false);
  });
});

describe('người chơi', () => {
  function runPlayer({ right = false, jump = false, seconds }) {
    const level = flatLevel();
    const p = G.createPlayer({ x: 3 * TILE, y: 13 * TILE - 30 });
    G.Input.r = right;
    G.Input.jumpHeld_ = jump;
    let startY = p.y, minY = p.y, maxX = p.x;
    const dt = 1 / 60;
    for (let t = 0; t < seconds; t += dt) {
      // chỉ "bấm" nhảy ở frame đầu tiên
      G.Input.jumpPressed_ = jump && t < dt;
      G.updatePlayer(p, dt, level);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
    }
    G.Input.r = G.Input.jumpHeld_ = G.Input.jumpPressed_ = false;
    return { p, rise: startY - minY, dx: maxX - 3 * TILE };
  }

  it('chạy sang phải khi giữ phím', () => {
    const { dx } = runPlayer({ right: true, seconds: 1 });
    expect(dx).toBeGreaterThan(150);
  });

  it('nhảy cao khoảng 4 ô (đủ vượt tường 3-4 ô)', () => {
    const { rise } = runPlayer({ jump: true, seconds: 1.2 });
    expect(rise).toBeGreaterThanOrEqual(3.5 * TILE);
    expect(rise).toBeLessThan(5 * TILE);
  });

  it('nhảy xa đủ vượt hố rộng 4 ô', () => {
    const { dx } = runPlayer({ right: true, jump: true, seconds: 0.8 });
    expect(dx).toBeGreaterThan(4 * TILE + 24);
  });
});
