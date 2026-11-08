// Bản đồ ô lưới: '#' đất, 'B' gạch, '.' trống
const LEVEL_COLS = 90;
const LEVEL_ROWS = 15;

function createLevel() {
  const grid = [];
  for (let y = 0; y < LEVEL_ROWS; y++) grid.push(new Array(LEVEL_COLS).fill('.'));

  const set = (x, y, c) => { if (grid[y] && x >= 0 && x < LEVEL_COLS) grid[y][x] = c; };
  const coins = [];
  const enemies = [];

  // Mặt đất (hàng 13-14), có hai cái hố
  const gaps = [[30, 32], [55, 57]];
  for (let x = 0; x < LEVEL_COLS; x++) {
    if (gaps.some(([a, b]) => x >= a && x <= b)) continue;
    set(x, 13, '#');
    set(x, 14, '#');
  }

  // Dãy gạch lơ lửng
  const bricks = (x, y, len) => { for (let i = 0; i < len; i++) set(x + i, y, 'B'); };
  const coinRow = (x, y, len) => { for (let i = 0; i < len; i++) coins.push({ tx: x + i, ty: y, got: false }); };

  bricks(12, 10, 4);  coinRow(12, 9, 4);
  coinRow(6, 12, 3);
  bricks(22, 10, 3);  bricks(26, 7, 3);  coinRow(26, 6, 3);
  coinRow(30, 10, 3);                                  // xu bay phía trên hố 1
  bricks(48, 10, 5);  coinRow(48, 9, 5);
  coinRow(55, 10, 3);                                  // xu bay phía trên hố 2
  bricks(64, 10, 3);  bricks(68, 7, 4);  coinRow(68, 6, 4);

  // Bậc thang
  for (let i = 0; i < 4; i++) for (let y = 12 - i; y <= 12; y++) set(40 + i, y, '#');
  for (let i = 0; i < 4; i++) for (let y = 12 - i; y <= 12; y++) set(76 + (3 - i), y, '#');

  // Kẻ địch (cột)
  [18, 36, 50, 60, 66, 72].forEach(tx => enemies.push({ tx }));

  // Cờ ở cuối màn
  const flag = { x: 86 * TILE + 12, y: 8 * TILE, w: 8, h: 5 * TILE };

  return {
    grid, coins, enemies, flag,
    width: LEVEL_COLS * TILE,
    height: LEVEL_ROWS * TILE,
    spawn: { x: 2 * TILE, y: 12 * TILE },

    isSolid(tx, ty) {
      if (tx < 0 || tx >= LEVEL_COLS) return true;  // tường ở hai đầu màn
      if (ty < 0 || ty >= LEVEL_ROWS) return false; // rơi xuống vực
      const c = grid[ty][tx];
      return c === '#' || c === 'B';
    }
  };
}
