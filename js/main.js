const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const VIEW_W = canvas.width;
const VIEW_H = canvas.height;

const START_LIVES = 3;

let level, levelIndex, player, enemies, mushrooms, particles, popups, bumps;
let score, coinCount, lives, timeLeft, highScore;
let levelStartScore, levelStartCoins, timeBonus;
let state, stateTimer, camX, time;
// state: title | playing | paused | dead | levelclear | gameover | victory

// ---------- Kỷ lục ----------
function loadHigh() {
  try { return parseInt(localStorage.getItem('mario_high'), 10) || 0; } catch (e) { return 0; }
}
function updateHigh() {
  if (score > highScore) {
    highScore = score;
    try { localStorage.setItem('mario_high', String(score)); } catch (e) { /* bỏ qua */ }
  }
}

// ---------- Khởi tạo ----------
function startLevel() {
  level = createLevel(levelIndex);
  player = createPlayer(level.spawn);
  enemies = level.enemies.map(e => createEnemy(e.tx, e.type));
  mushrooms = [];
  particles = [];
  popups = [];
  bumps = [];
  levelStartScore = score;
  levelStartCoins = coinCount;
  timeLeft = level.time;
  camX = 0;
  state = 'playing';
  stateTimer = 0;
}

function newGame() {
  levelIndex = 0;
  score = 0;
  coinCount = 0;
  lives = START_LIVES;
  startLevel();
}

function retryLevel() {
  score = levelStartScore;
  coinCount = levelStartCoins;
  startLevel();
}

// ---------- Hiệu ứng ----------
function addPopup(x, y, text, color = '#fff') {
  popups.push({ x, y, text, color, life: 0.9 });
}

function addDebris(tx, ty) {
  for (let i = 0; i < 4; i++) {
    particles.push({
      x: tx * TILE + 8 + (i % 2) * 16, y: ty * TILE + 8 + (i >> 1) * 16,
      vx: (i % 2 ? 1 : -1) * (60 + Math.random() * 80), vy: -250 - Math.random() * 150,
      life: 1, size: 9, color: '#e8a040'
    });
  }
}

function addDust(x, y) {
  for (let i = 0; i < 6; i++) {
    particles.push({
      x, y, vx: (Math.random() - 0.5) * 220, vy: -60 - Math.random() * 120,
      life: 0.5, size: 5, color: '#f5f5f5'
    });
  }
}

function addCoin(x, y) {
  coinCount++;
  score += 10;
  Sound.play('coin');
  if (x !== undefined) addPopup(x, y, '+10', '#ffd700');
  if (coinCount % 100 === 0) {
    lives++;
    Sound.play('oneup');
    addPopup(player.x, player.y - 20, '1UP!', '#7CFC00');
  }
}

// ---------- Va chạm với bản đồ ----------
function boxHitsSolid(b) {
  const l = Math.floor(b.x / TILE), r = Math.floor((b.x + b.w - 0.01) / TILE);
  const t = Math.floor(b.y / TILE), bt = Math.floor((b.y + b.h - 0.01) / TILE);
  for (let ty = t; ty <= bt; ty++)
    for (let tx = l; tx <= r; tx++)
      if (level.isSolid(tx, ty)) return true;
  return false;
}

function bumpBlock(tx, ty) {
  const c = level.grid[ty][tx];
  if (c === '?') {
    level.grid[ty][tx] = 'U';
    bumps.push({ tx, ty, t: 0.15 });
    addCoin(tx * TILE + 6, ty * TILE - 6);
  } else if (c === 'M') {
    level.grid[ty][tx] = 'U';
    bumps.push({ tx, ty, t: 0.15 });
    mushrooms.push(createMushroom(tx, ty));
    Sound.play('appear');
  } else if (c === 'B') {
    if (player.big) {
      level.grid[ty][tx] = '.';
      addDebris(tx, ty);
      score += 50;
      Sound.play('brick');
    } else {
      bumps.push({ tx, ty, t: 0.15 });
      Sound.play('bump');
    }
  } else {
    Sound.play('bump');
  }
}

function bumpOffset(tx, ty) {
  for (const b of bumps) {
    if (b.tx === tx && b.ty === ty) return -Math.sin((1 - b.t / 0.15) * Math.PI) * 7;
  }
  return 0;
}

// ---------- Lớn lên / bị thương / chết ----------
function growPlayer() {
  const dy = BIG_H - player.h;
  const test = { x: player.x, y: player.y - dy, w: player.w, h: BIG_H };
  if (boxHitsSolid(test)) {
    // không đủ chỗ để lớn lên: chỉ cộng điểm
    score += 1000;
    addPopup(player.x, player.y - 10, '+1000', '#ff69b4');
  } else {
    player.y -= dy;
    player.h = BIG_H;
    player.big = true;
    score += 1000;
    addPopup(player.x, player.y - 10, '+1000', '#ff69b4');
  }
  Sound.play('powerup');
}

function hurtPlayer() {
  if (player.invincible > 0) return;
  if (player.big) {
    player.big = false;
    player.y += BIG_H - SMALL_H;
    player.h = SMALL_H;
    player.invincible = 2;
    Sound.play('hurt');
  } else {
    killPlayer();
  }
}

function killPlayer() {
  state = 'dead';
  stateTimer = 0;
  player.vx = 0;
  player.vy = -520;
  Sound.play('die');
}

function afterDeath() {
  lives--;
  if (lives <= 0) {
    updateHigh();
    state = 'gameover';
    stateTimer = 0;
  } else {
    retryLevel();
  }
}

// ---------- Cập nhật ----------
function updateEffects(dt) {
  for (const p of particles) {
    p.vy += GRAVITY * 0.6 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
  }
  particles = particles.filter(p => p.life > 0);
  for (const p of popups) { p.y -= 40 * dt; p.life -= dt; }
  popups = popups.filter(p => p.life > 0);
  for (const b of bumps) b.t -= dt;
  bumps = bumps.filter(b => b.t > 0);
}

function updatePlaying(dt) {
  timeLeft -= dt;
  if (timeLeft <= 0) { timeLeft = 0; killPlayer(); return; }
  if (player.invincible > 0) player.invincible -= dt;

  const res = updatePlayer(player, dt, level);
  if (res.hitHead && res.headTile) bumpBlock(res.headTile.tx, res.headTile.ty);

  enemies.forEach(e => updateEnemy(e, dt, level));
  mushrooms.forEach(m => updateMushroom(m, dt, level));

  // Xu
  for (const c of level.coins) {
    if (c.got) continue;
    const box = { x: c.tx * TILE + 8, y: c.ty * TILE + 8, w: 16, h: 16 };
    if (overlap(player, box)) {
      c.got = true;
      addCoin();
    }
  }

  // Nấm
  for (const m of mushrooms) {
    if (m.alive && overlap(player, m)) {
      m.alive = false;
      if (player.big) {
        score += 1000;
        addPopup(player.x, player.y - 10, '+1000', '#ff69b4');
        Sound.play('powerup');
      } else {
        growPlayer();
      }
    }
  }
  mushrooms = mushrooms.filter(m => m.alive);

  // Kẻ địch: nhảy lên đầu thì diệt (trừ loại gai), chạm bên hông thì bị thương
  for (const e of enemies) {
    if (!e.alive || !overlap(player, e)) continue;
    const feet = player.y + player.h;
    if (!e.spiky && player.vy > 0 && feet - e.y < 16) {
      e.alive = false;
      e.squashTimer = 0.4;
      player.vy = -420;
      score += 100;
      addPopup(e.x, e.y - 8, '+100');
      addDust(e.x + e.w / 2, e.y + e.h);
      Sound.play('stomp');
    } else {
      hurtPlayer();
      if (state === 'dead') return;
    }
  }

  // Rơi xuống hố
  if (player.y > level.height + 60) { killPlayer(); return; }

  // Chạm cờ
  if (overlap(player, level.flag)) {
    timeBonus = Math.floor(timeLeft) * 5;
    score += 500 + timeBonus;
    updateHigh();
    state = 'levelclear';
    stateTimer = 0;
    Sound.play('win');
  }

  // Camera cuộn ngang
  camX = player.x + player.w / 2 - VIEW_W / 2;
  camX = Math.max(0, Math.min(level.width - VIEW_W, camX));
}

function update(dt) {
  time += dt;
  if (state === 'playing') {
    updatePlaying(dt);
  } else if (state === 'dead') {
    stateTimer += dt;
    player.vy += GRAVITY * dt;   // bay lên rồi rơi xuống, không va chạm
    player.y += player.vy * dt;
    if (stateTimer > 1.8) afterDeath();
  } else {
    stateTimer += dt;
  }
  if (state !== 'paused' && state !== 'title') updateEffects(dt);
}

// ---------- Điều khiển trạng thái ----------
function handleInput() {
  if (Input.mutePressed()) Sound.toggleMute();

  if (Input.restartPressed() && state !== 'title') {
    newGame();
    Input.pressed = {};
    return;
  }

  switch (state) {
    case 'title':
      if (Input.startPressed()) { newGame(); Input.pressed = {}; }
      break;
    case 'playing':
      if (Input.pausePressed()) { state = 'paused'; Sound.play('pause'); }
      break;
    case 'paused':
      if (Input.pausePressed() || Input.startPressed()) { state = 'playing'; Sound.play('pause'); Input.pressed = {}; }
      break;
    case 'levelclear':
      if (stateTimer > 0.8 && Input.startPressed()) {
        levelIndex++;
        if (levelIndex >= LEVEL_COUNT) {
          state = 'victory';
          stateTimer = 0;
        } else {
          startLevel();
        }
        Input.pressed = {};
      }
      break;
    case 'gameover':
    case 'victory':
      if (stateTimer > 0.8 && Input.startPressed()) { newGame(); Input.pressed = {}; }
      break;
  }
}

// ---------- Vẽ ----------
function drawBackground() {
  ctx.fillStyle = level.sky;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  if (level.night) {
    // sao nhấp nháy + trăng
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 40; i++) {
      const sx = (i * 197 + 31) % VIEW_W;
      const sy = (i * 83 + 17) % 260;
      if (Math.sin(time * 2 + i) > -0.6) ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.fillStyle = '#f4f1c9';
    ctx.beginPath(); ctx.arc(680, 80, 32, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = level.sky;
    ctx.beginPath(); ctx.arc(694, 72, 28, 0, Math.PI * 2); ctx.fill();
  }

  // mây (cuộn chậm hơn bản đồ cho có chiều sâu)
  ctx.fillStyle = level.cloud;
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

function drawQuestionBlock(x, y) {
  ctx.fillStyle = '#f8b800';
  ctx.fillRect(x, y, TILE, TILE);
  ctx.strokeStyle = '#7a4a00';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, TILE - 2, TILE - 2);
  ctx.lineWidth = 1;
  ctx.fillStyle = 'rgba(255,255,255,' + (0.25 + 0.2 * Math.sin(time * 6)) + ')';
  ctx.fillRect(x + 3, y + 3, TILE - 6, 5);
  ctx.fillStyle = '#7a3a00';
  ctx.font = 'bold 22px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('?', x + TILE / 2, y + 24);
}

function drawTiles() {
  const first = Math.max(0, Math.floor(camX / TILE));
  const last = Math.min(level.cols - 1, Math.floor((camX + VIEW_W) / TILE));
  for (let ty = 0; ty < level.rows; ty++) {
    for (let tx = first; tx <= last; tx++) {
      const c = level.grid[ty][tx];
      if (c === '.') continue;
      const x = tx * TILE - camX;
      const y = ty * TILE + (bumps.length ? bumpOffset(tx, ty) : 0);
      if (c === '#') {
        ctx.fillStyle = '#c84c0c';
        ctx.fillRect(x, y, TILE, TILE);
        if (ty === 0 || !level.isSolid(tx, ty - 1)) {
          ctx.fillStyle = level.night ? '#2d7a3a' : '#3cb043';
          ctx.fillRect(x, y, TILE, 8);
        }
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
      } else if (c === '?' || c === 'M') {
        drawQuestionBlock(x, y);
      } else if (c === 'U') {
        ctx.fillStyle = '#8a6a4a';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.strokeStyle = '#4a3420';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, TILE - 2, TILE - 2);
        ctx.lineWidth = 1;
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
    if (x < -50 || x > VIEW_W + 50) continue;
    if (e.alive) {
      const body = e.spiky ? '#b02020' : '#8b4513';
      ctx.fillStyle = body;
      ctx.fillRect(x, e.y, e.w, e.h - 6);
      if (e.spiky) {
        // gai nhọn trên lưng
        ctx.fillStyle = '#eee';
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(x + i * 7, e.y);
          ctx.lineTo(x + i * 7 + 3.5, e.y - 9);
          ctx.lineTo(x + i * 7 + 7, e.y);
          ctx.fill();
        }
      }
      ctx.fillStyle = '#f5cba7';
      ctx.fillRect(x + 4, e.y + e.h - 8, e.w - 8, 8);
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + 5, e.y + 7, 7, 7);
      ctx.fillRect(x + e.w - 12, e.y + 7, 7, 7);
      ctx.fillStyle = e.spiky ? '#f00' : '#000';
      ctx.fillRect(x + 8, e.y + 9, 3, 4);
      ctx.fillRect(x + e.w - 11, e.y + 9, 3, 4);
    } else if (e.squashTimer > 0) {
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(x, e.y + e.h - 8, e.w, 8);
    }
  }
}

function drawMushrooms() {
  for (const m of mushrooms) {
    const x = m.x - camX, y = m.y;
    ctx.fillStyle = '#f5cba7';
    ctx.fillRect(x + 6, y + 14, m.w - 12, m.h - 14);
    ctx.fillStyle = '#e02020';
    ctx.beginPath();
    ctx.arc(x + m.w / 2, y + 14, 14, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x + 8, y + 9, 3.5, 0, Math.PI * 2);
    ctx.arc(x + m.w - 8, y + 9, 3.5, 0, Math.PI * 2);
    ctx.arc(x + m.w / 2, y + 4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 10, y + 18, 2, 5);
    ctx.fillRect(x + m.w - 12, y + 18, 2, 5);
  }
}

function drawPlayer() {
  const p = player;
  if (p.invincible > 0 && Math.floor(p.invincible * 12) % 2 === 0) return;  // nhấp nháy khi bất tử
  const x = Math.round(p.x - camX), y = Math.round(p.y);
  const o = p.h - SMALL_H;             // 0 nếu nhỏ, 16 nếu lớn
  ctx.fillStyle = '#2040d0';           // quần yếm
  ctx.fillRect(x + 2, y + 16 + o / 2, p.w - 4, 14 + o / 2);
  ctx.fillStyle = '#e02020';           // áo
  ctx.fillRect(x, y + 12, p.w, 8 + o / 2);
  ctx.fillStyle = '#f5cba7';           // mặt
  ctx.fillRect(x + 3, y + 3, p.w - 6, 11);
  ctx.fillStyle = '#e02020';           // mũ
  ctx.fillRect(x + 1, y, p.w - 2, 6);
  ctx.fillRect(p.facing > 0 ? x + p.w - 6 : x - 2, y + 4, 8, 3);
  ctx.fillStyle = '#000';              // mắt
  ctx.fillRect(p.facing > 0 ? x + p.w - 10 : x + 6, y + 7, 3, 4);
  // giày: bước chân khi chạy
  const step = (p.onGround && Math.abs(p.vx) > 20) ? Math.sin(time * 22) * 3 : 0;
  ctx.fillStyle = '#5a2d0c';
  ctx.fillRect(x + 1 + step, y + p.h - 4, 9, 4);
  ctx.fillRect(x + p.w - 10 - step, y + p.h - 4, 9, 4);
}

function drawEffects() {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2));
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - camX, p.y, p.size, p.size);
  }
  ctx.globalAlpha = 1;
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#000';
  for (const p of popups) {
    ctx.fillStyle = p.color;
    ctx.strokeText(p.text, p.x - camX, p.y);
    ctx.fillText(p.text, p.x - camX, p.y);
  }
  ctx.lineWidth = 1;
}

function hudText(text, x, y, align) {
  ctx.textAlign = align;
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.font = 'bold 20px Arial';
  hudText('Điểm: ' + score, 16, 30, 'left');
  hudText('Xu: ' + coinCount, 16, 56, 'left');
  hudText('Kỷ lục: ' + Math.max(highScore, score), 16, 82, 'left');
  hudText('Màn ' + Math.min(levelIndex + 1, LEVEL_COUNT) + '/' + LEVEL_COUNT + ' - ' + level.name, VIEW_W - 16, 30, 'right');
  hudText('Mạng: ' + '♥'.repeat(Math.max(0, lives)), VIEW_W - 16, 56, 'right');
  ctx.fillStyle = timeLeft < 30 ? '#ff6b6b' : '#fff';
  hudText('Giờ: ' + Math.ceil(timeLeft), VIEW_W - 16, 82, 'right');
  ctx.lineWidth = 1;
  if (Sound.muted) {
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    hudText('🔇 tắt tiếng (M)', VIEW_W / 2, 20, 'center');
  }
}

function panel(title, lines, titleColor = '#fff') {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = titleColor;
  ctx.font = 'bold 48px Arial';
  ctx.fillText(title, VIEW_W / 2, VIEW_H / 2 - 40);
  ctx.fillStyle = '#fff';
  ctx.font = '22px Arial';
  lines.forEach((t, i) => ctx.fillText(t, VIEW_W / 2, VIEW_H / 2 + 5 + i * 32));
}

function drawOverlay() {
  switch (state) {
    case 'title':
      panel('MARIO ĐƠN GIẢN 2', [
        'Nhấn Enter / Space (hoặc chạm màn hình) để bắt đầu',
        '3 màn chơi  •  3 mạng  •  Ăn nấm để lớn lên',
        'Kỷ lục: ' + highScore
      ], '#ffd700');
      break;
    case 'paused':
      panel('TẠM DỪNG', ['Nhấn P hoặc Enter để chơi tiếp']);
      break;
    case 'levelclear':
      panel('HOÀN THÀNH MÀN ' + (levelIndex + 1) + '!', [
        'Điểm: ' + score + '   Thưởng thời gian: +' + timeBonus,
        stateTimer > 0.8 ? (levelIndex + 1 < LEVEL_COUNT ? 'Nhấn Enter để sang màn tiếp theo' : 'Nhấn Enter để xem kết quả') : ''
      ], '#7CFC00');
      break;
    case 'gameover':
      panel('GAME OVER', [
        'Điểm: ' + score + '   Kỷ lục: ' + highScore,
        'Nhấn Enter để chơi lại'
      ], '#ff6b6b');
      break;
    case 'victory':
      panel('BẠN ĐÃ THẮNG CẢ ' + LEVEL_COUNT + ' MÀN!', [
        'Điểm: ' + score + '   Kỷ lục: ' + highScore,
        'Nhấn Enter để chơi lại'
      ], '#ffd700');
      break;
  }
}

function draw() {
  drawBackground();
  drawTiles();
  drawCoins();
  drawFlag();
  drawMushrooms();
  drawEnemies();
  drawPlayer();
  drawEffects();
  drawHUD();
  drawOverlay();
}

// ---------- Vòng lặp ----------
let last = performance.now();
time = 0;

function frame(now) {
  const dt = Math.min((now - last) / 1000, 1 / 30);  // chặn dt quá lớn khi tab bị treo
  last = now;

  handleInput();
  update(dt);
  draw();
  Input.endFrame();
  requestAnimationFrame(frame);
}

highScore = loadHigh();
Input.init();
score = 0; coinCount = 0; lives = START_LIVES; levelIndex = 0;
startLevel();
state = 'title';
requestAnimationFrame(frame);
