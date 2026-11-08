// Va chạm AABB với bản đồ ô lưới. Xử lý trục X trước rồi tới trục Y.
const TILE = 32;
const GRAVITY = 1800;      // px/s^2
const MAX_FALL = 900;      // px/s

function moveEntity(e, dt, level) {
  const res = { hitX: false, hitHead: false, headTile: null };

  // --- trục X ---
  e.x += e.vx * dt;
  let l = Math.floor(e.x / TILE);
  let r = Math.floor((e.x + e.w - 0.01) / TILE);
  let t = Math.floor(e.y / TILE);
  let b = Math.floor((e.y + e.h - 0.01) / TILE);
  for (let ty = t; ty <= b && !res.hitX; ty++) {
    for (let tx = l; tx <= r; tx++) {
      if (level.isSolid(tx, ty)) {
        if (e.vx > 0) e.x = tx * TILE - e.w;
        else if (e.vx < 0) e.x = (tx + 1) * TILE;
        e.vx = 0;
        res.hitX = true;
        break;
      }
    }
  }

  // --- trục Y ---
  e.y += e.vy * dt;
  e.onGround = false;
  l = Math.floor(e.x / TILE);
  r = Math.floor((e.x + e.w - 0.01) / TILE);
  t = Math.floor(e.y / TILE);
  b = Math.floor((e.y + e.h - 0.01) / TILE);
  const cx = e.x + e.w / 2;
  let done = false;
  for (let ty = t; ty <= b && !done; ty++) {
    // chọn ô đặc gần tâm nhân vật nhất (để biết đầu đụng trúng ô nào)
    let hitTx = -1, best = Infinity;
    for (let tx = l; tx <= r; tx++) {
      if (level.isSolid(tx, ty)) {
        const d = Math.abs(tx * TILE + TILE / 2 - cx);
        if (d < best) { best = d; hitTx = tx; }
      }
    }
    if (hitTx >= 0) {
      if (e.vy > 0) {
        e.y = ty * TILE - e.h;
        e.onGround = true;
      } else if (e.vy < 0) {
        e.y = (ty + 1) * TILE;
        res.hitHead = true;
        res.headTile = { tx: hitTx, ty };
      }
      e.vy = 0;
      done = true;
    }
  }
  return res;
}

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
