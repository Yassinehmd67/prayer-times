// src/ui/meta.js
// دوال مساعدة لعرض معلومات إضافية عن الحساب الفلكي (meta) في الواجهة.

/**
 * وصف قاعدة العروض العليا بالعربية.
 */
export function describeHighLatRule(rule) {
  switch (rule) {
    case "middle_of_night":
      return "نصف الليل (تقسيم الليل إلى نصفين وتوزيع الفجر/العشاء على ذلك)";
    case "seventh_of_night":
      return "سبع الليل (تقسيم الليل إلى أسباع وتحديد الفجر/العشاء وفق سبع الليل)";
    case "angle_based":
      return "قاعدة الزاوية (angle-based) حيث يُستعمل معامل الزاوية/60 لليل القصير";
    case "none":
      return "بدون قاعدة خاصة للعروض العليا (قد لا تكون النتائج منضبطة في الشمال/الجنوب البعيد)";
    default:
      return "قاعدة عروض عليا افتراضية من إعدادات المكتبة.";
  }
}

/**
 * تحديث السطر أسفل جدول المواقيت (#prayer-meta)
 * اعتمادًا على meta القادمة من دالة الحساب.
 */
export function updatePrayerMeta(meta) {
  const metaEl = document.getElementById("prayer-meta");
  if (!metaEl) return;

  if (!meta) {
    metaEl.textContent = "لم تتوفر معلومات إضافية عن الحساب الفلكي.";
    return;
  }

  const parts = [];

  if (meta.methodName) {
    parts.push(`طريقة الحساب: ${meta.methodName}`);
  }

  if (meta.highLatRule) {
    const desc = describeHighLatRule(meta.highLatRule);
    parts.push(`قاعدة العروض العليا: ${desc}`);
  }

  if (meta.asrMethod) {
    const asrText =
      meta.asrMethod === "hanafi"
        ? "العصر بحسب الحنفية (مثلي الظل)"
        : "العصر بحسب الجمهور (مثل الظل)";
    parts.push(asrText);
  }

  if (parts.length === 0) {
    metaEl.textContent =
      "تم الحساب حسب الإعدادات الحالية، بدون تفاصيل إضافية مسجّلة.";
  } else {
    metaEl.textContent = parts.join(" — ");
  }
}
