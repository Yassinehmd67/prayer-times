// worker/src/routes/prayer.js
/**
 * /api/prayer — حساب المواقيت من جهة السيرفر (مستقبلي)
 * الآن: مجرد stub يشرح أنه غير مفعل بعد.
 */

import { jsonResponse, handleOptions } from "../utils.js";

export async function handlePrayer(request, env) {
  const opt = handleOptions(request);
  if (opt) return opt;

  if (request.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  return jsonResponse(
    {
      ok: false,
      error:
        "Server-side prayer computation is not implemented yet. Use frontend calc.js for now.",
    },
    501
  );
}
