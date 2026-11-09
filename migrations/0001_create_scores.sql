-- Bảng xếp hạng điểm cao
CREATE TABLE IF NOT EXISTS scores (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  score      INTEGER NOT NULL CHECK (score >= 0),
  levels     INTEGER NOT NULL DEFAULT 0,          -- số màn đã hoàn thành
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_scores_score ON scores (score DESC, created_at ASC);
