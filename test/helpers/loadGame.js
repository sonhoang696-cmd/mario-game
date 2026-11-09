// Nạp các file JS của game (script thường, không phải ES module) vào một sandbox Node
// để test logic mà không cần trình duyệt.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const jsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../public/js');

export function loadGame() {
  // Giả lập bàn phím để điều khiển nhân vật trong test
  const Input = {
    l: false, r: false, jumpHeld_: false, jumpPressed_: false,
    left() { return this.l; },
    right() { return this.r; },
    jumpHeld() { return this.jumpHeld_; },
    jumpPressed() { return this.jumpPressed_; }
  };
  const Sound = { play() {}, init() {} };

  const context = vm.createContext({ Input, Sound, Math, console });
  for (const file of ['physics.js', 'level.js', 'enemy.js', 'player.js']) {
    vm.runInContext(fs.readFileSync(path.join(jsDir, file), 'utf8'), context, { filename: file });
  }
  const api = vm.runInContext(
    `({ TILE, GRAVITY, MAX_FALL, RUN_SPEED, JUMP_SPEED, SMALL_H, BIG_H, LEVEL_ROWS, LEVEL_COUNT,
        moveEntity, overlap, createLevel, createEnemy, updateEnemy, createMushroom,
        createPlayer, updatePlayer })`,
    context
  );
  return { ...api, Input };
}
