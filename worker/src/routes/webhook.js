// worker/src/routes/webhook.js
/**
 * /webhook/payment — لاستقبال Webhooks من مزوّد الدفع (مستقبلاً)
 * الآن: نرجع 200 مع رسالة بسيطة فقط.
 */

import { jsonResponse, handleOptions } from "../utils.js";

export async function handleWebhook(request, env) {
  const opt = handleOptions(request);
  if (opt) return opt;

  // في المستقبل: نتحقق من التوقيع، نحدّث حالة المفتاح، إلخ.
  return jsonResponse(
    {
      ok: true,
      message: "Webhook endpoint placeholder. Not implemented yet.",
    },
    200
  );
}
