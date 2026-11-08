const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const VIEW_W = canvas.width;
const VIEW_H = canvas.height;

let level, player, enemies, score, coinCount, state, camX, time;

function reset() {
  level = createLevel();
  player = createPlayer(level.spawn);
  enemies = level.enemies.map(e => createEnemy(e.tx));
  score = 0;
  coinCount = 0;
  state = 'playing';   // playing | win | lose
  camX = 0;
}

// ---------- Cập nhật ----------
function update(dt) {
  if (state !== 'playing') return;

  updatePlayer(player, dt, level);
  enemies.forEach(e => updateEnemy(e, dt, level));

  // Xu
  for (const c of level.coins) {
    if (c.got) continue;
    const box = { x: c.tx * TILE + 8, y: c.ty * TILE + 8, w: 16, h: 16 };
    if (overlap(player, box)) {
      c.got = true;
      coinCount++;
      score += 10;
    }
  }

  // Kẻ địch: nhảy lên đầu thì diệt, chạm bên hông thì thua
  for (const e of enemies) {
    if (!e.alive || !overlap(player, e)) continue;
    const feet = player.y + player.h;
    if (player.vy > 0 && feet - e.y < 16) {
      e.alive = false;
      e.squashTimer = 0.4;
      player.vy = -420;
      score += 100;
    } else {
      state = 'lose';
    }
  }

  // Rơi xuống hố
  if (player.y > level.height + 60) state = 'lose';

  // Chạm cờ
  if (overlap(player, level.flag)) {
    state = 'win';
    score += 500;
  }

  // Camera cuộn ngang
  camX = player.x + player.w / 2 - VIEW_W / 2;
  camX = Math.max(0, Math.min(level.width - VIEW_W, camX));
}

// ---------- Vẽ ----------
function drawBackground() {
  ctx.fillStyle = '#5c94fc';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // mây (cuộn chậm hơn bản đồ cho có chiều sâu)
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 12; i++) {
    const cx = ((i * 260 - camX * 0.5) % (VIEW_W + 200) + VIEW_W + 200) % (VIEW_W + 200) - 100;
    const cy = 50 + (i % 3) * 40;
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.arc(cx + 22, cy - 8, 22, 0, Math.PI * 2);
    ctx.arc(cx + 46, cy, 18, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTiles() {
  const first = Math.max(0, Math.floor(camX / TILE));
  const last = Math.min(LEVEL_COLS - 1, Math.floor((camX + VIEW_W) / TILE));
  for (let ty = 0; ty < LEVEL_ROWS; ty++) {
    for (let tx = first; tx <= last; tx++) {
      const c = level.grid[ty][tx];
      if (c === '.') continue;
      const x = tx * TILE - camX, y = ty * TILE;
      if (c === '#') {
        ctx.fillStyle = '#c84c0c';
        ctx.fillRect(x, y, TILE, TILE);
        if (ty === 13 || level.grid[ty - 1][tx] === '.') {
          ctx.fillStyle = '#3cb043';
          ctx.fillRect(x, y, TILE, 8);
        }
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
      } else {
        ctx.fillStyle = '#e8a040';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.strokeStyle = '#7a3a00';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, TILE - 2, TILE - 2);
        ctx.beginPath();
        ctx.moveTo(x, y + TILE / 2); ctx.lineTo(x + TILE, y + TILE / 2);
        ctx.moveTo(x + TILE / 2, y); ctx.lineTo(x + TILE / 2, y + TILE / 2);
        ctx.stroke();
        ctx.lineWidth = 1;
      }
    }
  }
}

function drawCoins() {
  for (const c of level.coins) {
    if (c.got) continue;
    const x = c.tx * TILE + TILE / 2 - camX;
    if (x < -20 || x > VIEW_W + 20) continue;
    const y = c.ty * TILE + TILE / 2 + Math.sin(time * 4 + c.tx) * 2;
    const squeeze = Math.abs(Math.cos(time * 3 + c.tx));
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.ellipse(x, y, 4 + 6 * squeeze, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b8860b';
    ctx.stroke();
  }
}

function drawFlag() {
  const f = level.flag;
  const x = f.x - camX;
  ctx.fillStyle = '#ddd';
  ctx.fillRect(x, f.y, f.w, f.h);
  ctx.fillStyle = '#2ecc71';
  ctx.beginPath();
  ctx.moveTo(x + f.w, f.y + 6);
  ctx.lineTo(x + f.w + 32, f.y + 20);
  ctx.lineTo(x + f.w, f.y + 34);
  ctx.fill();
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.arc(x + f.w / 2, f.y, 7, 0, Math.PI * 2);
  ctx.fill();
}

function drawEnemies() {
  for (const e of enemies) {
    const x = e.x - camX;
    if (e.alive) {
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(x, e.y, e.w, e.h - 6);
      ctx.fillStyle = '#f5cba7';
      ctx.fillRect(x + 4, e.y + e.h - 8, e.w - 8, 8);
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + 5, e.y + 7, 7, 7);
      ctx.fillRect(x + e.w - 12, e.y + 7, 7, 7);
      ctx.fillStyle = '#000';
      ctx.fillRect(x + 8, e.y + 9, 3, 4);
      ctx.fillRect(x + e.w - 11, e.y + 9, 3, 4);
    } else if (e.squashTimer > 0) {
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(x, e.y + e.h - 8, e.w, 8);
    }
  }
}

function drawPlayer() {
  const p = player;
  const x = Math.round(p.x - camX), y = Math.round(p.y);
  ctx.fillStyle = '#2040d0';            // quần yếm
  ctx.fillRect(x + 2, y + 16, p.w - 4, 14);
  ctx.fillStyle = '#e02020';            // áo
  ctx.fillRect(x, y + 12, p.w, 8);
  ctx.fillStyle = '#f5cba7';            // mặt
  ctx.fillRect(x + 3, y + 3, p.w - 6, 11);
  ctx.fillStyle = '#e02020';            // mũ
  ctx.fillRect(x + 1, y, p.w - 2, 6);
  ctx.fillRect(p.facing > 0 ? x + p.w - 6 : x - 2, y + 4, 8, 3);
  ctx.fillStyle = '#000';               // mắt
  ctx.fillRect(p.facing > 0 ? x + p.w - 10 : x + 6, y + 7, 3, 4);
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'left';
  const t1 = 'Điểm: ' + score;
  const t2 = 'Xu: ' + coinCount + '/' + level.coins.length;
  ctx.strokeText(t1, 16, 30); ctx.fillText(t1, 16, 30);
  ctx.strokeText(t2, 16, 56); ctx.fillText(t2, 16, 56);
  ctx.lineWidth = 1;
}

function drawOverlay() {
  if (state === 'playing') return;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 48px Arial';
  ctx.fillText(state === 'win' ? 'CHIẾN THẮNG!' : 'GAME OVER', VIEW_W / 2, VIEW_H / 2 - 10);
  ctx.font = '22px Arial';
  ctx.fillText('Điểm: ' + score + '   Xu: ' + coinCount, VIEW_W / 2, VIEW_H / 2 + 28);
  ctx.fillText('Nhấn R để chơi lại', VIEW_W / 2, VIEW_H / 2 + 62);
}

function draw() {
  drawBackground();
  drawTiles();
  drawCoins();
  drawFlag();
  drawEnemies();
  drawPlayer();
  drawHUD();
  drawOverlay();
}

// ---------- Vòng lặp ----------
let last = performance.now();
time = 0;

function frame(now) {
  const dt = Math.min((now - last) / 1000, 1 / 30);  // chặn dt quá lớn khi tab bị treo
  last = now;
  time += dt;

  if (Input.restartPressed()) reset();
  update(dt);
  draw();
  Input.endFrame();
  requestAnimationFrame(frame);
}

Input.init();
reset();
requestAnimationFrame(frame);
