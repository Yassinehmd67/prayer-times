// worker/src/metering.js
/**
 * metering.js — عدّاد الاستعمال الشهري
 * يمكن استدعاؤه من أي route لزيادة الاستهلاك.
 */

import { incrementMonthlyUsage, ymNow } from "./auth.js";

export async function recordUsage(env, apiKey, delta = 1, date = new Date()) {
  if (!apiKey) return null;
  const period = ymNow(date);
  const used = await incrementMonthlyUsage(env, apiKey, period, delta);
  return { period, used };
}
