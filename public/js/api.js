// Gọi API bảng xếp hạng (Cloudflare Worker + D1). Mọi lỗi đều bị nuốt để game vẫn chạy được
// khi mở trực tiếp bằng file:// hoặc khi mất mạng.
const Api = {
  online() {
    return location.protocol === 'http:' || location.protocol === 'https:';
  },

  async topScores() {
    if (!this.online()) return null;
    try {
      const res = await fetch('/api/scores', { cache: 'no-store' });
      if (!res.ok) return null;
      return (await res.json()).scores;
    } catch (e) {
      return null;
    }
  },

  async submitScore(name, score, levels) {
    if (!this.online() || score <= 0) return false;
    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, score, levels })
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  }
};
