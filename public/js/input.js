// Đọc bàn phím + nút cảm ứng: giữ trạng thái phím + ghi nhận lần nhấn mới (để nhảy / chơi lại)
const Input = {
  down: {},
  pressed: {},

  press(code) {
    if (!this.down[code]) this.pressed[code] = true;
    this.down[code] = true;
    Sound.init();
  },
  release(code) {
    this.down[code] = false;
  },

  init() {
    window.addEventListener('keydown', (e) => {
      if (e.target && e.target.tagName === 'INPUT') return;   // đang gõ tên: không điều khiển game
      const k = e.code;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(k)) e.preventDefault();
      this.press(k);
    });
    window.addEventListener('keyup', (e) => this.release(e.code));
    window.addEventListener('blur', () => { this.down = {}; });

    // Nút cảm ứng trên điện thoại
    document.querySelectorAll('#touch button').forEach((btn) => {
      const code = btn.dataset.key;
      const on = (e) => { e.preventDefault(); this.press(code); };
      const off = (e) => { e.preventDefault(); this.release(code); };
      btn.addEventListener('pointerdown', on);
      btn.addEventListener('pointerup', off);
      btn.addEventListener('pointercancel', off);
      btn.addEventListener('pointerleave', off);
    });

    // Chạm vào khung game = bấm Enter (bắt đầu / tiếp tục)
    document.getElementById('game').addEventListener('pointerdown', () => {
      this.press('Enter');
      this.release('Enter');
    });
  },

  left()  { return this.down.ArrowLeft || this.down.KeyA; },
  right() { return this.down.ArrowRight || this.down.KeyD; },
  jumpHeld() { return this.down.Space || this.down.ArrowUp || this.down.KeyW; },
  jumpPressed() { return this.pressed.Space || this.pressed.ArrowUp || this.pressed.KeyW; },
  startPressed() { return this.pressed.Enter || this.pressed.Space; },
  pausePressed() { return this.pressed.KeyP || this.pressed.Escape; },
  mutePressed() { return this.pressed.KeyM; },
  restartPressed() { return this.pressed.KeyR; },

  // gọi cuối mỗi frame
  endFrame() { this.pressed = {}; }
};
