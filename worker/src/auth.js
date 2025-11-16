/**
 * ==========================================
 * auth.js — التحقق من مفاتيح API و صلاحيات المسؤول
 * ==========================================
 */

import { extractApiKey, jsonResponse } from "./utils.js";

/** أسماء المفاتيح في KV */
const KV_KEYS = {
  key: (apiKey) => `key:${apiKey}`,                      // بيانات المفتاح
  usage: (apiKey, ym) => `usage:${apiKey}:${ym}`,        // عدّاد استخدام شهري
  coupon: (code) => `coupon:${code}`,                    // (اختياري) قسائم
};

/** قراءة JSON من KV مع fallback null */
async function kvGetJSON(kv, key) {
  const raw = await kv.get(key);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

/** كتابة JSON إلى KV */
async function kvPutJSON(kv, key, value, options) {
  return kv.put(key, JSON.stringify(value), options);
}

/**
 * تحميل سجلّ مفتاح API من KV
 * الشكل المتوقع:
 * {
 *   plan: "pro"|"free"|"org",
 *   quota_monthly: number,
 *   created_at: "ISO",
 *   expires_at: "ISO",
 *   is_active: boolean,
 *   notes?: string
 * }
 */
export async function getKeyRecord(env, apiKey) {
  if (!apiKey) return null;
  return kvGetJSON(env.PRAYER_KV, KV_KEYS.key(apiKey));
}

/** حفظ/تحديث سجل مفتاح API في KV */
export async function saveKeyRecord(env, apiKey, record) {
  if (!apiKey || !record) throw new Error("Missing apiKey or record");
  await kvPutJSON(env.PRAYER_KV, KV_KEYS.key(apiKey), record);
  return record;
}

/**
 * التحقق من صلاحية المفتاح:
 * - موجود
 * - مفعّل is_active
 * - لم ينتهِ expires_at
 * يعيد كائن قياسي للاستخدام داخل المسارات.
 */
export async function verifyApiKey(env, apiKey, { requireActive = true } = {}) {
  const rec = await getKeyRecord(env, apiKey);
  if (!rec) {
    return { ok: false, status: 401, error: "Invalid API key", code: "INVALID_KEY" };
  }
  if (requireActive && rec.is_active === false) {
    return { ok: false, status: 403, error: "Key disabled", code: "KEY_DISABLED", record: rec };
  }
  if (rec.expires_at) {
    const now = new Date();
    const exp = new Date(rec.expires_at);
    if (now > exp) {
      return { ok: false, status: 403, error: "Subscription expired", code: "KEY_EXPIRED", record: rec };
    }
  }
  return { ok: true, status: 200, record: rec };
}

/**
 * واجهة مريحة للمسارات المحمية:
 * - تستخرج Bearer من رأس Authorization
 * - تتحقق من المفتاح وتعيد Response عند الفشل
 * - عند النجاح تعيد { apiKey, record }
 */
export async function requireApiAuth(request, env) {
  const apiKey = extractApiKey(request);
  if (!apiKey) {
    return {
      authorized: false,
      response: jsonResponse({ ok: false, error: "Missing Bearer token" }, 401, {
        "WWW-Authenticate": 'Bearer realm="api", error="invalid_token"',
      }),
    };
  }

  const v = await verifyApiKey(env, apiKey, { requireActive: true });
  if (!v.ok) {
    return {
      authorized: false,
      response: jsonResponse({ ok: false, error: v.error, code: v.code }, v.status),
    };
  }

  return { authorized: true, apiKey, record: v.record };
}

/**
 * التحقق الإداري (لوحة المسؤول):
 * - Basic Auth عبر رأس Authorization: Basic base64(user:pass)
 * - نستخدم كلمة المرور فقط من Secret ADMIN_PASSWORD
 * - اسم المستخدم يمكن أن يكون أي قيمة ثابتة (مثلاً "admin")
 */
export function requireAdminAuth(request, env) {
  const hdr = request.headers.get("authorization") || "";
  if (!hdr.toLowerCase().startsWith("basic ")) {
    return {
      authorized: false,
      response: new Response("Unauthorized", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="admin"',
        },
      }),
    };
  }
  const b64 = hdr.slice(6).trim();
  let decoded = "";
  try {
    decoded = atob(b64);
  } catch {
    return { authorized: false, response: new Response("Unauthorized", { status: 401 }) };
  }
  const [user, pass] = decoded.split(":");
  // نتحقق فقط من كلمة المرور المخزنة كسِرّ
  if (!env.ADMIN_PASSWORD || pass !== env.ADMIN_PASSWORD) {
    return { authorized: false, response: new Response("Forbidden", { status: 403 }) };
  }
  return { authorized: true, user: user || "admin" };
}

/**
 * أدوات مساعدة إضافية للاستخدام لاحقًا من المسارات
 */

/** الحصول/زيادة عدّاد الاستخدام الشهري لمفتاح */
export async function getMonthlyUsage(env, apiKey, ym) {
  const key = KV_KEYS.usage(apiKey, ym);
  const raw = await env.PRAYER_KV.get(key);
  return raw ? parseInt(raw, 10) || 0 : 0;
}

export async function incrementMonthlyUsage(env, apiKey, ym, delta = 1) {
  const key = KV_KEYS.usage(apiKey, ym);
  // بدون عمليات ذرية في KV، نقرأ ثم نكتب (يكفي مبدئيًا، ويمكن لاحقًا استخدام D1)
  const current = await getMonthlyUsage(env, apiKey, ym);
  const next = current + delta;
  await env.PRAYER_KV.put(key, String(next));
  return next;
}

/** تنسيق سنة-شهر مثل "2025-11" */
export function ymNow(date = new Date()) {
  return date.toISOString().slice(0, 7);
}
