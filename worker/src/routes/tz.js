// worker/src/routes/tz.js
/**
 * /api/tz — مسار مستقبلي لمعرفة المنطقة الزمنية من الإحداثيات
 * حالياً: غير مُنفّذ، نرجع رسالة توضيحية.
 */

import { jsonResponse, handleOptions } from "../utils.js";

export async function handleTz(request, env) {
  const opt = handleOptions(request);
  if (opt) return opt;

  if (request.method !== "GET") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  return jsonResponse(
    {
      ok: false,
      error: "Timezone lookup not implemented yet. Use client timezone.",
    },
    501
  );
}
