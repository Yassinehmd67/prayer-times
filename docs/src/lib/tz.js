// lib/tz.js — أدوات بسيطة للمنطقة الزمنية

// فرق التوقيت عن UTC بوحدة الدقائق (من الجهاز)
export function getLocalTzOffsetMinutes() {
  return -new Date().getTimezoneOffset();
}

// اسم تقريبي للمنطقة الزمنية من Intl API
export function getLocalTimeZoneName() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Local";
  } catch {
    return "Local";
  }
}
