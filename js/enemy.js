const ENEMY_SPEED = 60;

function createEnemy(tx) {
  return {
    x: tx * TILE + 2, y: 12 * TILE + 4, w: 28, h: 28,
    vx: -ENEMY_SPEED, vy: 0,
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
  if (res.hitX) e.vx = -dir * ENEMY_SPEED;       // đụng tường thì quay đầu
  else if (e.vx === 0) e.vx = dir * ENEMY_SPEED;
  if (e.y > level.height + 100) e.alive = false; // rơi xuống hố
}
