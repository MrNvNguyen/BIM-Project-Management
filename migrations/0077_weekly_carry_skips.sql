-- Việc đã xóa khỏi tuần này không được chuyển lại từ tuần trước.
CREATE TABLE IF NOT EXISTS weekly_plan_carry_skips (
  plan_id INTEGER NOT NULL,
  source_item_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (plan_id, source_item_id)
);
