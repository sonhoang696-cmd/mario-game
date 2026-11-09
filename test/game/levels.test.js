import { describe, expect, it } from 'vitest';
import { loadGame } from '../helpers/loadGame.js';

const G = loadGame();
const { TILE, GRAVITY, MAX_FALL } = G;

const MAX_GAP = 4;          // hố rộng nhất mà người chơi có thể nhảy qua (ô)
const MAX_STEP_UP = 3;      // chênh lệch độ cao giữa hai cột liền kề tối đa (ô)

const solid = (level, x, y) => level.isSolid(x, y);

// Độ cao cột x tính từ hàng 12 trở lên (số ô đặc liên tiếp)
function columnHeight(level, x) {
  let h = 0;
  for (let y = 12; y >= 0 && solid(level, x, y); y--) h++;
  return h;
}

// Cột x có chỗ đặt chân không: đất, hoặc gạch bậc đá ở hàng 9-11
function hasSupport(level, x) {
  if (solid(level, x, 13)) return true;
  for (let y = 9; y <= 11; y++) if (solid(level, x, y)) return true;
  return false;
}

describe('có đủ 3 màn', () => {
  it('LEVEL_COUNT = 3', () => expect(G.LEVEL_COUNT).toBe(3));
});

for (let i = 0; i < G.LEVEL_COUNT; i++) {
  const level = G.createLevel(i);

  describe(`Màn ${i + 1}: ${level.name}`, () => {
    it('kích thước bản đồ nhất quán', () => {
      expect(level.grid).toHaveLength(G.LEVEL_ROWS);
      for (const row of level.grid) expect(row).toHaveLength(level.cols);
      expect(level.width).toBe(level.cols * TILE);
    });

    it('chỉ chứa ký tự ô hợp lệ', () => {
      for (const row of level.grid) for (const c of row) expect('.#B?MU').toContain(c);
    });

    it('chỗ xuất hiện đứng trên đất và không kẹt trong tường', () => {
      const tx = Math.floor(level.spawn.x / TILE);
      expect(solid(level, tx, 13)).toBe(true);
      expect(solid(level, tx, 12)).toBe(false);
    });

    it('cờ nằm trong bản đồ, trên đất liền', () => {
      const fx = Math.floor(level.flag.x / TILE);
      expect(fx).toBeLessThan(level.cols);
      expect(solid(level, fx, 13)).toBe(true);
      // cờ không bị chôn trong gạch
      for (let y = Math.floor(level.flag.y / TILE); y < 13; y++) expect(solid(level, fx, y)).toBe(false);
    });

    it('không có hố nào rộng quá khả năng nhảy', () => {
      let run = 0, worst = 0;
      for (let x = 0; x < level.cols; x++) {
        run = hasSupport(level, x) ? 0 : run + 1;
        worst = Math.max(worst, run);
      }
      expect(worst).toBeLessThanOrEqual(MAX_GAP);
    });

    it('không có bậc/tường cao quá khả năng nhảy', () => {
      for (let x = 1; x < level.cols; x++) {
        const diff = columnHeight(level, x) - columnHeight(level, x - 1);
        expect(diff).toBeLessThanOrEqual(MAX_STEP_UP);
      }
    });

    it('xu không nằm trong ô đặc', () => {
      expect(level.coins.length).toBeGreaterThan(0);
      for (const c of level.coins) expect(solid(level, c.tx, c.ty)).toBe(false);
    });

    it('hộp ? và M nằm ở độ cao đội đầu được (hàng 6-10)', () => {
      for (let y = 0; y < level.rows; y++) {
        for (let x = 0; x < level.cols; x++) {
          const c = level.grid[y][x];
          if (c === '?' || c === 'M') {
            expect(y).toBeGreaterThanOrEqual(6);
            expect(y).toBeLessThanOrEqual(10);
            // phía trên hộp phải trống để nấm/xu có chỗ hiện ra
            expect(solid(level, x, y - 1)).toBe(false);
          }
        }
      }
    });

    it('kẻ địch đứng trên đất, không bị kẹt, không ở trong hố', () => {
      expect(level.enemies.length).toBeGreaterThan(0);
      for (const spec of level.enemies) {
        expect(solid(level, spec.tx, 13), `kẻ địch tại cột ${spec.tx} phải có đất`).toBe(true);
        const e = G.createEnemy(spec.tx, spec.type);
        e.vx = 0;                                    // đứng yên để thử rơi thẳng xuống
        for (let k = 0; k < 60; k++) {
          e.vy = Math.min(e.vy + GRAVITY / 60, MAX_FALL);
          G.moveEntity(e, 1 / 60, level);
        }
        expect(e.onGround, `kẻ địch tại cột ${spec.tx} phải đứng được`).toBe(true);
        expect(e.y).toBeLessThan(level.height);
      }
    });

    it('kẻ địch loại gai chỉ xuất hiện đúng loại hợp lệ', () => {
      for (const spec of level.enemies) expect(['goomba', 'spiky']).toContain(spec.type);
    });
  });
}

describe('độ khó tăng dần', () => {
  it('màn sau dài hơn và nhiều gai hơn màn đầu', () => {
    const first = G.createLevel(0), last = G.createLevel(G.LEVEL_COUNT - 1);
    expect(last.cols).toBeGreaterThan(first.cols);
    const spikes = l => l.enemies.filter(e => e.type === 'spiky').length;
    expect(spikes(last)).toBeGreaterThan(spikes(first));
  });
});
