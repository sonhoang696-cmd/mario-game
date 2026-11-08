const RUN_SPEED = 230;
const JUMP_SPEED = 700;

function createPlayer(spawn) {
  return {
    x: spawn.x, y: spawn.y, w: 24, h: 30,
    vx: 0, vy: 0,
    onGround: false,
    facing: 1,
    coyote: 0,       // cho phép nhảy trễ một chút sau khi rời mép
    jumpBuffer: 0    // nhớ lệnh nhảy bấm sớm một chút trước khi chạm đất
  };
}

function updatePlayer(p, dt, level) {
  // Chạy: tăng/giảm tốc cho mượt
  const dir = (Input.right() ? 1 : 0) - (Input.left() ? 1 : 0);
  const accel = p.onGround ? 1800 : 1000;
  if (dir !== 0) {
    p.vx += dir * accel * dt;
    p.vx = Math.max(-RUN_SPEED, Math.min(RUN_SPEED, p.vx));
    p.facing = dir;
  } else {
    const drop = (p.onGround ? 1600 : 500) * dt;
    if (Math.abs(p.vx) <= drop) p.vx = 0; else p.vx -= Math.sign(p.vx) * drop;
  }

  // Nhảy
  p.coyote = p.onGround ? 0.1 : p.coyote - dt;
  p.jumpBuffer = Input.jumpPressed() ? 0.12 : p.jumpBuffer - dt;
  if (p.jumpBuffer > 0 && p.coyote > 0) {
    p.vy = -JUMP_SPEED;
    p.coyote = 0;
    p.jumpBuffer = 0;
  }
  // Thả phím sớm thì nhảy thấp hơn
  if (!Input.jumpHeld() && p.vy < -250) p.vy = -250;

  // Trọng lực
  p.vy = Math.min(p.vy + GRAVITY * dt, MAX_FALL);

  moveEntity(p, dt, level);
}
