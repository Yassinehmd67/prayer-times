
---

### 7️⃣ `worker/schema/d1.sql`

مجرّد هيكل أولي لو احتجت D1 لاحقًا:

```sql
-- D1 schema (اختياري) لمشروع prayer-times

CREATE TABLE IF NOT EXISTS api_keys (
  api_key TEXT PRIMARY KEY,
  plan TEXT NOT NULL DEFAULT 'pro',
  quota_monthly INTEGER NOT NULL DEFAULT 50000,
  created_at TEXT NOT NULL,
  expires_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS usage_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  api_key TEXT NOT NULL,
  period TEXT NOT NULL, -- YYYY-MM
  amount INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
