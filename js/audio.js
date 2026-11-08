// Âm thanh tạo bằng WebAudio (không cần file mp3). Phải khởi tạo sau lần bấm phím/chạm đầu tiên.
const Sound = {
  ctx: null,
  muted: false,

  init() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) this.ctx = new AC();
      } catch (e) { /* trình duyệt không hỗ trợ: bỏ qua */ }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  toggleMute() { this.muted = !this.muted; },

  tone(freq, dur, type = 'square', vol = 0.07, slideTo = null, delay = 0) {
    const c = this.ctx;
    if (!c || this.muted) return;
    const t0 = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  },

  arpeggio(notes, step = 0.09, type = 'square') {
    notes.forEach((f, i) => this.tone(f, step * 1.6, type, 0.07, null, i * step));
  },

  play(name) {
    switch (name) {
      case 'jump':    this.tone(320, 0.16, 'square', 0.06, 700); break;
      case 'coin':    this.tone(988, 0.07); this.tone(1319, 0.2, 'square', 0.07, null, 0.07); break;
      case 'stomp':   this.tone(260, 0.12, 'square', 0.09, 80); break;
      case 'bump':    this.tone(160, 0.08, 'triangle', 0.12); break;
      case 'brick':   this.tone(120, 0.18, 'sawtooth', 0.09, 40); break;
      case 'appear':  this.tone(300, 0.28, 'triangle', 0.1, 700); break;
      case 'powerup': this.arpeggio([523, 659, 784, 1047, 1319], 0.07); break;
      case 'hurt':    this.tone(500, 0.35, 'sawtooth', 0.08, 120); break;
      case 'die':     this.arpeggio([392, 330, 262, 196, 131], 0.16, 'triangle'); break;
      case 'win':     this.arpeggio([523, 659, 784, 1047, 784, 1047, 1319], 0.1); break;
      case 'oneup':   this.arpeggio([659, 784, 1319, 1047, 1175, 1568], 0.08); break;
      case 'pause':   this.tone(440, 0.08, 'square', 0.06); break;
    }
  }
};
