// Ô lưới: '#' đất, 'B' gạch, '?' hộp xu, 'M' hộp nấm, 'U' hộp đã dùng, '.' trống
const LEVEL_ROWS = 15;

// Mỗi màn: số cột, thời gian, màu trời, các hố và hàm dựng (đặt gạch, xu, kẻ địch...)
const LEVEL_DEFS = [
  {
    name: 'Đồng cỏ', cols: 90, time: 200,
    sky: '#5c94fc', cloud: '#fff', night: false,
    gaps: [[30, 32], [55, 57]],
    build(h) {
      h.bricks(12, 10, 4);  h.coinRow(12, 9, 4);
      h.coinRow(6, 12, 3);
      h.set(8, 9, '?');  h.set(9, 9, 'B');  h.set(10, 9, 'M');
      h.bricks(22, 10, 3);  h.bricks(26, 7, 3);  h.coinRow(26, 6, 3);
      h.coinRow(30, 10, 3);                       // xu bay phía trên hố 1
      h.stairUp(40, 4);
      h.set(46, 9, '?');
      h.bricks(48, 10, 5);  h.coinRow(48, 9, 5);
      h.coinRow(55, 10, 3);                       // xu bay phía trên hố 2
      h.bricks(64, 10, 3);  h.bricks(68, 7, 4);  h.coinRow(68, 6, 4);
      h.stairDown(76, 4);
      [18, 36, 50, 60, 66, 72].forEach(tx => h.enemy(tx));
      h.enemy(84, 'spiky');
    }
  },
  {
    name: 'Hoàng hôn', cols: 100, time: 220,
    sky: '#e8795a', cloud: '#ffd9b3', night: false,
    gaps: [[18, 20], [34, 37], [52, 54], [70, 73]],
    build(h) {
      h.set(6, 9, '?');  h.coinRow(6, 12, 3);
      h.bricks(10, 10, 3);  h.coinRow(10, 9, 3);
      h.coinRow(18, 10, 3);
      h.set(23, 9, 'B');  h.set(24, 9, 'M');  h.set(25, 9, 'B');
      h.bricks(35, 10, 2);  h.coinRow(35, 9, 2);   // bậc đá giữa hố 2
      h.stairUp(40, 3);
      h.bricks(46, 9, 3);  h.bricks(50, 6, 3);  h.coinRow(50, 5, 3);
      h.coinRow(52, 10, 3);
      h.set(58, 9, '?');
      h.bricks(62, 10, 4);  h.set(66, 9, 'M');
      h.bricks(71, 10, 2);  h.coinRow(71, 9, 2);
      h.stairUp(78, 4);  h.stairDown(82, 4);  h.coinRow(80, 7, 2);
      [12, 27, 44, 58, 66, 88].forEach(tx => h.enemy(tx));
      [30, 60, 64, 92].forEach(tx => h.enemy(tx, 'spiky'));
    }
  },
  {
    name: 'Đêm trăng', cols: 110, time: 240,
    sky: '#10163a', cloud: '#3a4272', night: true,
    gaps: [[16, 19], [40, 43], [60, 67], [84, 87]],
    build(h) {
      h.set(5, 9, '?');  h.set(7, 9, 'B');  h.set(8, 9, 'M');
      h.bricks(10, 10, 3);  h.coinRow(10, 9, 3);
      h.bricks(17, 10, 2);  h.coinRow(17, 9, 2);   // bậc đá giữa hố 1
      h.bricks(24, 9, 4);  h.coinRow(24, 8, 4);
      h.stairUp(30, 3);  h.stairDown(33, 3);  h.coinRow(31, 9, 3);
      h.bricks(41, 10, 2);  h.coinRow(41, 9, 2);
      h.set(46, 9, '?');  h.set(47, 9, 'B');  h.set(48, 9, 'M');
      h.bricks(61, 10, 2);  h.bricks(65, 10, 2);   // đá nhảy qua vực dài
      h.coinRow(61, 9, 2);  h.coinRow(65, 9, 2);  h.coinRow(63, 8, 2);
      h.bricks(72, 9, 3);  h.set(77, 9, '?');
      h.bricks(85, 10, 2);
      h.stairUp(94, 4);  h.stairDown(98, 4);
      [12, 26, 38, 52, 72, 78, 90].forEach(tx => h.enemy(tx));
      [22, 36, 54, 74, 92, 104].forEach(tx => h.enemy(tx, 'spiky'));
    }
  }
];
const LEVEL_COUNT = LEVEL_DEFS.length;

function createLevel(index) {
  const def = LEVEL_DEFS[index];
  const cols = def.cols;
  const grid = [];
  for (let y = 0; y < LEVEL_ROWS; y++) grid.push(new Array(cols).fill('.'));

  const coins = [];
  const enemies = [];
  const set = (x, y, c) => { if (grid[y] && x >= 0 && x < cols) grid[y][x] = c; };

  // Mặt đất (hàng 13-14), có các hố
  for (let x = 0; x < cols; x++) {
    if (def.gaps.some(([a, b]) => x >= a && x <= b)) continue;
    set(x, 13, '#');
    set(x, 14, '#');
  }

  const helpers = {
    set,
    bricks: (x, y, len) => { for (let i = 0; i < len; i++) set(x + i, y, 'B'); },
    coinRow: (x, y, len) => { for (let i = 0; i < len; i++) coins.push({ tx: x + i, ty: y, got: false }); },
    stairUp: (x0, n) => { for (let i = 0; i < n; i++) for (let y = 12 - i; y <= 12; y++) set(x0 + i, y, '#'); },
    stairDown: (x0, n) => { for (let i = 0; i < n; i++) for (let y = 12 - i; y <= 12; y++) set(x0 + (n - 1 - i), y, '#'); },
    enemy: (tx, type = 'goomba') => enemies.push({ tx, type })
  };
  def.build(helpers);

  // Cờ ở cuối màn
  const flag = { x: (cols - 4) * TILE + 12, y: 8 * TILE, w: 8, h: 5 * TILE };

  return {
    name: def.name, time: def.time, sky: def.sky, cloud: def.cloud, night: def.night,
    grid, coins, enemies, flag,
    cols, rows: LEVEL_ROWS,
    width: cols * TILE,
    height: LEVEL_ROWS * TILE,
    spawn: { x: 2 * TILE, y: 12 * TILE },

    isSolid(tx, ty) {
      if (tx < 0 || tx >= cols) return true;        // tường ở hai đầu màn
      if (ty < 0 || ty >= LEVEL_ROWS) return false; // rơi xuống vực
      return grid[ty][tx] !== '.';
    }
  };
}
