// worker/src/cache.js
/**
 * cache.js — طبقة كاش بسيطة فوق KV
 */

export async function cacheGetJSON(kv, key) {
  if (!kv) return null;
  const raw = await kv.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function cachePutJSON(kv, key, value, ttlSeconds) {
  if (!kv) return;
  const opts = {};
  if (ttlSeconds && Number.isFinite(ttlSeconds)) {
    opts.expirationTtl = ttlSeconds;
  }
  await kv.put(key, JSON.stringify(value), opts);
}
