const ENEMY_SPEED = 60;
const SPIKY_SPEED = 85;

// type: 'goomba' (nhảy lên đầu để diệt) | 'spiky' (có gai, chạm là bị thương)
function createEnemy(tx, type = 'goomba') {
  const speed = type === 'spiky' ? SPIKY_SPEED : ENEMY_SPEED;
  return {
    type, speed, spiky: type === 'spiky',
    x: tx * TILE + 2, y: 12 * TILE + 4, w: 28, h: 28,
    vx: -speed, vy: 0,
    onGround: false,
    alive: true,
    squashTimer: 0   // hiển thị bị dẹp một chút rồi biến mất
  };
}

function updateEnemy(e, dt, level) {
  if (!e.alive) {
    e.squashTimer -= dt;
    return;
  }
  const dir = e.vx < 0 ? -1 : 1;
  e.vy = Math.min(e.vy + GRAVITY * dt, MAX_FALL);
  const res = moveEntity(e, dt, level);
  if (res.hitX) e.vx = -dir * e.speed;           // đụng tường thì quay đầu
  else if (e.vx === 0) e.vx = dir * e.speed;
  if (e.y > level.height + 100) e.alive = false; // rơi xuống hố
}

// Nấm: trồi ra từ hộp 'M', chạy ngang, ăn vào thì lớn lên
function createMushroom(tx, ty) {
  return { x: tx * TILE + 2, y: (ty - 1) * TILE + 4, w: 28, h: 28, vx: 90, vy: 0, onGround: false, alive: true };
}

function updateMushroom(m, dt, level) {
  if (!m.alive) return;
  const dir = m.vx < 0 ? -1 : 1;
  m.vy = Math.min(m.vy + GRAVITY * dt, MAX_FALL);
  const res = moveEntity(m, dt, level);
  if (res.hitX) m.vx = -dir * 90;
  else if (m.vx === 0) m.vx = dir * 90;
  if (m.y > level.height + 100) m.alive = false;
}
