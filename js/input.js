// Đọc bàn phím: giữ trạng thái phím + ghi nhận lần nhấn mới (để nhảy / chơi lại)
const Input = {
  down: {},
  pressed: {},

  init() {
    window.addEventListener('keydown', (e) => {
      const k = e.code;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(k)) e.preventDefault();
      if (!this.down[k]) this.pressed[k] = true;
      this.down[k] = true;
    });
    window.addEventListener('keyup', (e) => {
      this.down[e.code] = false;
    });
    window.addEventListener('blur', () => { this.down = {}; });
  },

  left()  { return this.down.ArrowLeft || this.down.KeyA; },
  right() { return this.down.ArrowRight || this.down.KeyD; },
  jumpHeld() { return this.down.Space || this.down.ArrowUp || this.down.KeyW; },
  jumpPressed() { return this.pressed.Space || this.pressed.ArrowUp || this.pressed.KeyW; },
  restartPressed() { return this.pressed.KeyR; },

  // gọi cuối mỗi frame
  endFrame() { this.pressed = {}; }
};
