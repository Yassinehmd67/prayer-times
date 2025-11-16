// src/routes/admin.js
// ====================
// نقطة نهاية إدارية بسيطة لإنشاء/قراءة/تحديث مفاتيح الاشتراك.
// محمية بكلمة سرّ ADMIN_PASSWORD من env.
//
// الآن نعتمد 3 خطط افتراضية:
//   free  -> 1000 طلب شهريًا
//   plus  -> 20000 طلب شهريًا
//   pro   -> 50000 طلب شهريًا
//
// الاستخدام المقترح:
// 1) إنشاء مفتاح:
//    POST /api/admin
//    Headers:
//      X-Admin-Password: <ADMIN_PASSWORD>
//      Content-Type: application/json
//    Body:
//    {
//      "action": "create_key",
//      "plan": "pro",              // free | plus | pro
//      "monthly_quota": 60000,     // اختياري: لو تركته، سيأخذ القيمة الافتراضية من الجدول
//      "expires_at": "2025-12-31"  // اختياري: لو تركته فارغًا، plus/pro = شهر، free = بدون انتهاء
//    }
//
// 2) قراءة بيانات مفتاح:
//    {
//      "action": "get_key",
//      "key": "pt_xxx..."
//    }
//
// 3) تحديث مفتاح:
//    {
//      "action": "update_key",
//      "key": "pt_xxx...",
//      "plan": "plus",
//      "monthly_quota": 30000,
//      "expires_at": "2026-01-31"
//    }

const APIKEY_PREFIX = "apikey:";

// جدول الخطط الافتراضي
const PLAN_DEFAULTS = {
  free: { monthly_quota: 1000 },
  plus: { monthly_quota: 20000 },
  pro: { monthly_quota: 50000 },
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

// التحقق من أن الطلب من الأدمين
function isAdmin(request, env) {
  // ⚠️ تنبيه: هذا الكود مناسب للتجارب المحلية فقط
  // نتحقق من كلمة السر مباشرة من الهيدر
  const header = request.headers.get("x-admin-password");
  if (header && header === "yassineADMIN@#1234567") {
    return true;
  }

  // دعم بديل: Authorization: Bearer ...
  const auth = request.headers.get("authorization") || "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    const token = auth.slice(7).trim();
    if (token === "yassineADMIN@#1234567") {
      return true;
    }
  }

  return false;
}

async function readJsonBody(request) {
  try {
    const text = await request.text();
    if (!text) return {};
    return JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON body.");
  }
}

// توليد مفتاح جديد عشوائيًا
function generateApiKey() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return "pt_" + hex;
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

async function saveApiKeyRecord(env, apiKey, record) {
  if (!env.PRAYER_KV) {
    throw new Error("PRAYER_KV is not configured.");
  }
  await env.PRAYER_KV.put(APIKEY_PREFIX + apiKey, JSON.stringify(record));
}

export async function handleAdmin(request, env, ctx) {
  try {
    if (request.method !== "POST") {
      return jsonResponse({ ok: false, error: "Only POST is allowed." }, 405);
    }

    if (!isAdmin(request, env)) {
      return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
    }

    const body = await readJsonBody(request);
    const action = (body.action || "").trim();

    if (!action) {
      return jsonResponse(
        { ok: false, error: "Missing 'action' in body." },
        400
      );
    }

    // 1) CREATE KEY
    if (action === "create_key") {
      const now = new Date();

      // الخطة (نجعلها lowerCase للدلاله على free/plus/pro)
      const plan = (body.plan || "pro").toLowerCase();

      // الكوتا الافتراضية من جدول الخطط
      let defaultProQuota = 50000;
      if (env.DEFAULT_PRO_QUOTA) {
        const parsed = parseInt(env.DEFAULT_PRO_QUOTA, 10);
        if (Number.isFinite(parsed) && parsed > 0) {
          defaultProQuota = parsed;
        }
      }

      // نحدّد monthlyQuota بالترتيب:
      // 1) إن أرسلتها في body
      // 2) إن كانت موجودة في PLAN_DEFAULTS للخطة
      // 3) غير ذلك: نستخدم defaultProQuota
      let monthlyQuota;
      if (
        typeof body.monthly_quota === "number" &&
        body.monthly_quota > 0
      ) {
        monthlyQuota = body.monthly_quota;
      } else if (PLAN_DEFAULTS[plan]?.monthly_quota) {
        monthlyQuota = PLAN_DEFAULTS[plan].monthly_quota;
      } else {
        monthlyQuota = plan === "free" ? 1000 : defaultProQuota;
      }

      // تاريخ الانتهاء (اختياري)
      let expires_at = null;
      if (body.expires_at) {
        const d = new Date(body.expires_at);
        if (!isNaN(d.getTime())) {
          expires_at = d.toISOString();
        }
      } else {
        // لو لم يحدد expires_at:
        // - free: لا تاريخ انتهاء (null)
        // - plus/pro: افتراضيًا 30 يوم من الآن
        if (plan === "plus" || plan === "pro") {
          const d = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          expires_at = d.toISOString();
        } else {
          expires_at = null;
        }
      }

      const apiKey = generateApiKey();

      const record = {
        key: apiKey,
        plan,
        monthly_quota: monthlyQuota,
        created_at: now.toISOString(),
        expires_at,
      };

      await saveApiKeyRecord(env, apiKey, record);

      return jsonResponse(
        {
          ok: true,
          api_key: apiKey,
          plan,
          monthly_quota: monthlyQuota,
          expires_at,
        },
        200
      );
    }

    // 2) GET KEY
    if (action === "get_key") {
      const apiKey = (body.key || "").trim();
      if (!apiKey) {
        return jsonResponse(
          { ok: false, error: "Missing 'key' field." },
          400
        );
      }
      const record = await getApiKeyRecord(env, apiKey);
      if (!record) {
        return jsonResponse(
          { ok: false, error: "Key not found." },
          404
        );
      }
      return jsonResponse({ ok: true, record }, 200);
    }

    // 3) UPDATE KEY
    if (action === "update_key") {
      const apiKey = (body.key || "").trim();
      if (!apiKey) {
        return jsonResponse(
          { ok: false, error: "Missing 'key' field." },
          400
        );
      }
      const record = await getApiKeyRecord(env, apiKey);
      if (!record) {
        return jsonResponse(
          { ok: false, error: "Key not found." },
          404
        );
      }

      if (body.plan) {
        record.plan = String(body.plan).toLowerCase();
      }
      if (
        typeof body.monthly_quota === "number" &&
        body.monthly_quota > 0
      ) {
        record.monthly_quota = body.monthly_quota;
      }
      if (body.expires_at !== undefined) {
        if (body.expires_at === null || body.expires_at === "") {
          record.expires_at = null;
        } else {
          const d = new Date(body.expires_at);
          if (!isNaN(d.getTime())) {
            record.expires_at = d.toISOString();
          }
        }
      }

      await saveApiKeyRecord(env, apiKey, record);

      return jsonResponse({ ok: true, record }, 200);
    }

    return jsonResponse({ ok: false, error: "Unknown action." }, 400);
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
