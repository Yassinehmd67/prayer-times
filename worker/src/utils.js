/**
 * ==========================================
 * utils.js — أدوات مساعدة عامة للـ Worker
 * ==========================================
 */

/**
 * رؤوس CORS العامة
 * تُستخدم للسماح للواجهة (GitHub Pages) بالوصول إلى الـ API
 */
export function corsHeaders(origin = "*") {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

/**
 * ردّ جاهز بصيغة JSON
 */
export function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      ...corsHeaders(),
      ...headers,
    },
  });
}

/**
 * ردّ بسيط 404
 */
export function notFound(message = "Not Found") {
  return jsonResponse({ ok: false, error: message }, 404);
}

/**
 * ردّ خطأ عام 500
 */
export function serverError(error) {
  console.error("Server error:", error);
  return jsonResponse({ ok: false, error: "Internal Server Error" }, 500);
}

/**
 * معالج خيارات (OPTIONS) لطلبات preflight
 */
export function handleOptions(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders(),
      status: 204,
    });
  }
  return null;
}

/**
 * استخراج المفتاح من رأس Authorization: Bearer <KEY>
 */
export function extractApiKey(request) {
  const auth = request.headers.get("authorization") || "";
  const parts = auth.split(" ");
  if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
    return parts[1];
  }
  return null;
}

/**
 * حساب الفرق بالأيام بين تاريخين
 */
export function daysBetween(date1, date2) {
  const diffMs = Math.abs(date1 - date2);
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * الحصول على التاريخ الحالي بتنسيق ISO بدون ميلي ثانية
 */
export function nowIso() {
  return new Date().toISOString().split(".")[0] + "Z";
}

/**
 * التحقق من أن الطلب JSON
 */
export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}
