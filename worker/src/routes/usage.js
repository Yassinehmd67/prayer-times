// src/routes/usage.js
// ====================
// نقطة نهاية لقراءة حالة الاشتراك واستهلاك المستخدم.
//
// بالإضافة إلى دوال مساعدة مشتركة:
// - parseBearer(request)
// - incrementUsage(env, apiKey, amount)

const APIKEY_PREFIX = "apikey:";
const USAGE_PREFIX = "usage:";

// نجعلها مُصدَّرة ليستفيد منها باقي المسارات
export function parseBearer(request) {
  const auth = request.headers.get("authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) return null;
  const token = auth.slice(7).trim();
  return token || null;
}

async function getApiKeyRecord(env, apiKey) {
  if (!env.PRAYER_KV) {
    throw new Error("PRAYER_KV is not configured.");
  }
  const raw = await env.PRAYER_KV.get(APIKEY_PREFIX + apiKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function currentMonthId(now) {
  const y = now.getUTCFullYear();
  const m = (now.getUTCMonth() + 1).toString().padStart(2, "0");
  return `${y}-${m}`;
}

async function getUsageForKey(env, apiKey, monthId) {
  if (!env.PRAYER_KV) {
    throw new Error("PRAYER_KV is not configured.");
  }
  const raw = await env.PRAYER_KV.get(`${USAGE_PREFIX}${apiKey}:${monthId}`);
  if (!raw) return { used: 0 };
  try {
    const obj = JSON.parse(raw);
    if (typeof obj.used === "number" && obj.used >= 0) {
      return { used: obj.used };
    }
    return { used: 0 };
  } catch {
    return { used: 0 };
  }
}

// 🔹 دالة مشتركة: زيادة الاستهلاك لمفتاح معيّن
export async function incrementUsage(env, apiKey, amount = 1) {
  if (!apiKey) return; // بدون مفتاح لا نعدّ شيء (free لا تُسجَّل)
  if (!env.PRAYER_KV) return;

  try {
    const now = new Date();
    const monthId = currentMonthId(now);
    const key = `${USAGE_PREFIX}${apiKey}:${monthId}`;

    let used = 0;
    const raw = await env.PRAYER_KV.get(key);
    if (raw) {
      try {
        const obj = JSON.parse(raw);
        if (typeof obj.used === "number" && obj.used >= 0) {
          used = obj.used;
        }
      } catch {
        // تجاهل لو فسد JSON
      }
    }

    used += amount;
    await env.PRAYER_KV.put(key, JSON.stringify({ used }));
  } catch (e) {
    // لا نكسر الـ API لو فشل تسجيل الاستهلاك
    console.error("incrementUsage error:", e);
  }
}

export async function handleUsage(request, env, ctx) {
  try {
    const apiKey = parseBearer(request);

    // بدون مفتاح: نُرجع خطة FREE افتراضية
    if (!apiKey) {
      const freeQuota = 1000;
      return jsonResponse(
        {
          ok: true,
          plan: "free",
          used: 0,
          monthly_quota: freeQuota,
          remaining: freeQuota,
          expires_at: null,
          days_left: null,
        },
        200
      );
    }

    // بمفتاح: نقرأ بياناته من KV
    const keyRecord = await getApiKeyRecord(env, apiKey);
    if (!keyRecord) {
      return jsonResponse({ ok: false, error: "Invalid API key" }, 401);
    }

    const now = new Date();
    const monthId = currentMonthId(now);
    const usage = await getUsageForKey(env, apiKey, monthId);

    const plan = keyRecord.plan || "pro";

    // نستخدم monthly_quota المخزّنة مع المفتاح، أو DEFAULT_PRO_QUOTA من env
    let defaultProQuota = 50000;
    if (env.DEFAULT_PRO_QUOTA) {
      const parsed = parseInt(env.DEFAULT_PRO_QUOTA, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        defaultProQuota = parsed;
      }
    }

    const monthlyQuota = Number.isFinite(keyRecord.monthly_quota)
      ? keyRecord.monthly_quota
      : defaultProQuota;

    const used = Math.max(0, usage.used);
    const remaining = Math.max(0, monthlyQuota - used);

    let expires_at = keyRecord.expires_at || null;
    let days_left = null;

    if (expires_at) {
      const expDate = new Date(expires_at);
      if (!isNaN(expDate.getTime())) {
        const diffMs = expDate.getTime() - now.getTime();
        const rawDays = diffMs / (1000 * 60 * 60 * 24);
        days_left = Math.max(0, Math.floor(rawDays));
      } else {
        expires_at = null;
      }
    }

    return jsonResponse(
      {
        ok: true,
        plan,
        used,
        monthly_quota: monthlyQuota,
        remaining,
        expires_at,
        days_left,
      },
      200
    );
  } catch (err) {
    return jsonResponse(
      {
        ok: false,
        error: err.message || String(err),
      },
      500
    );
  }
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
