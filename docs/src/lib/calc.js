// =========================================
// calc.js — حساب المواقيت فلكيًا في المتصفح
// =========================================
//
// - يعتمد تقريب NOAA لميل الشمس ومعادلة الزمن.
// - يدعم طرق حساب مشهورة (MWL, Umm al-Qura, ISNA, Egypt, Karachi).
// - يدعم قواعد للعروض العليا (high latitude rules):
//   * none             → بدون تعديل خاص
//   * middle_of_night  → نصف الليل
//   * seventh_of_night → سبع الليل
//   * angle_based      → نسبة من الليل حسب الزاوية (angle/60)
//
// - يحتوي أيضًا على دالة computeMonth لحساب مواقيت شهر كامل.
// =========================================

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

function d2r(d) {
  return d * DEG2RAD;
}
function r2d(r) {
  return r * RAD2DEG;
}
function normalizeAngleDeg(a) {
  let x = a % 360;
  if (x < 0) x += 360;
  return x;
}

function formatTimeFromMinutes(baseUtcDate, minutesUtc, tzOffsetMinutes) {
  if (minutesUtc == null || !Number.isFinite(minutesUtc)) return null;
  const ms = minutesUtc * 60 * 1000;
  const date = new Date(baseUtcDate.getTime() + ms + tzOffsetMinutes * 60 * 1000);

  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  return { date, text: `${h}:${m}` };
}

function getYMD(date) {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

// -----------------------------
// اليوم اليولياني + إحداثيات الشمس
// -----------------------------

function julianDayFromDate(dateUtc) {
  const y = dateUtc.getUTCFullYear();
  const m = dateUtc.getUTCMonth() + 1;
  const d = dateUtc.getUTCDate() + 0.0;

  let Y = y;
  let M = m;
  if (M <= 2) {
    Y -= 1;
    M += 12;
  }
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const JD =
    Math.floor(365.25 * (Y + 4716)) +
    Math.floor(30.6001 * (M + 1)) +
    d +
    B -
    1524.5;

  return JD;
}

// ميل الشمس + معادلة الزمن (NOAA تقريبًا)
function solarCoordinates(jd) {
  const T = (jd - 2451545.0) / 36525;

  const L0 = normalizeAngleDeg(
    280.46646 + 36000.76983 * T + 0.0003032 * T * T
  );
  const M =
    357.52911 + 35999.05029 * T - 0.0001537 * T * T - 0.00000048 * T * T * T;
  const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;

  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(d2r(M)) +
    (0.019993 - 0.000101 * T) * Math.sin(d2r(2 * M)) +
    0.000289 * Math.sin(d2r(3 * M));

  const lambda = L0 + C;
  const epsilon =
    23.439291 - 0.0130042 * T - 0.0000001639 * T * T + 0.0000005036 * T * T * T;

  const sinDelta = Math.sin(d2r(epsilon)) * Math.sin(d2r(lambda));
  const delta = Math.asin(sinDelta);

  const y = Math.tan(d2r(epsilon / 2)) ** 2;
  const E =
    (4 * RAD2DEG) *
    (y * Math.sin(2 * d2r(L0)) -
      2 * e * Math.sin(d2r(M)) +
      4 * e * y * Math.sin(d2r(M)) * Math.cos(2 * d2r(L0)) -
      0.5 * y * y * Math.sin(4 * d2r(L0)) -
      1.25 * e * e * Math.sin(2 * d2r(M)));

  return {
    declination: delta, // راديان
    equationOfTimeMinutes: E, // دقائق
  };
}

// زاوية الساعة لارتفاع معيّن
function hourAngleForAltitude(latRad, decRad, altRad) {
  const sinH = Math.sin(altRad);
  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);
  const sinDec = Math.sin(decRad);
  const cosDec = Math.cos(decRad);

  const cosH = (sinH - sinLat * sinDec) / (cosLat * cosDec);
  if (cosH < -1 || cosH > 1) {
    return null;
  }
  return Math.acos(cosH); // |H| بالراديان
}

// -----------------------------
// إعدادات الطرق (Method Presets)
// -----------------------------

// highLatRule:
//   "none" | "middle_of_night" | "seventh_of_night" | "angle_based"
export const DEFAULT_METHOD = {
  id: "mwl",
  name: "رابطة العالم الإسلامي (MWL)",
  fajrAngle: 18,
  ishaAngle: 17,
  ishaFixedMinutes: null,
  asrMethod: "standard", // "standard" (مثل)، "hanafi" (مثليْن)
  sunriseAngle: 0.833,
  highLatRule: "middle_of_night",
};

export const METHOD_PRESETS = {
  mwl: {
    ...DEFAULT_METHOD,
    id: "mwl",
    name: "رابطة العالم الإسلامي (MWL)",
    fajrAngle: 18,
    ishaAngle: 17,
    ishaFixedMinutes: null,
    highLatRule: "middle_of_night",
  },
  makkah: {
    ...DEFAULT_METHOD,
    id: "makkah",
    name: "أم القرى - مكة المكرمة",
    // فجر زاوية، عشاء 90 دقيقة بعد المغرب (مقاربة شائعة)
    fajrAngle: 18.5,
    ishaAngle: 0,
    ishaFixedMinutes: 90,
    highLatRule: "middle_of_night",
  },
  isna: {
    ...DEFAULT_METHOD,
    id: "isna",
    name: "ISNA - أمريكا الشمالية",
    fajrAngle: 15,
    ishaAngle: 15,
    ishaFixedMinutes: null,
    highLatRule: "angle_based",
  },
  egypt: {
    ...DEFAULT_METHOD,
    id: "egypt",
    name: "الهيئة المصرية العامة للمساحة",
    fajrAngle: 19.5,
    ishaAngle: 17.5,
    ishaFixedMinutes: null,
    highLatRule: "seventh_of_night",
  },
  karachi: {
    ...DEFAULT_METHOD,
    id: "karachi",
    name: "جامعة العلوم الإسلامية - كراتشي",
    fajrAngle: 18,
    ishaAngle: 18,
    ishaFixedMinutes: null,
    highLatRule: "seventh_of_night",
  },
};

export function getMethodById(id) {
  if (!id) return DEFAULT_METHOD;
  const m = METHOD_PRESETS[id.toLowerCase()];
  return m || DEFAULT_METHOD;
}

// -----------------------------
// قواعد العروض العليا (High Lat)
// -----------------------------

function computeNightLengthMinutes(sunriseMinutes, maghribMinutes) {
  if (
    sunriseMinutes == null ||
    maghribMinutes == null ||
    !Number.isFinite(sunriseMinutes) ||
    !Number.isFinite(maghribMinutes)
  ) {
    return null;
  }
  const dayMinutes = 24 * 60;
  return dayMinutes - maghribMinutes + sunriseMinutes;
}

function applyHighLatAdjustments(
  method,
  sunriseMinutes,
  maghribMinutes,
  fajrMinutes,
  ishaMinutes
) {
  const rule = method.highLatRule || "none";
  if (rule === "none") {
    return { fajrMinutes, ishaMinutes };
  }

  const nightLength = computeNightLengthMinutes(sunriseMinutes, maghribMinutes);
  if (!nightLength || nightLength <= 0) {
    return { fajrMinutes, ishaMinutes };
  }

  let fajr = fajrMinutes;
  let isha = ishaMinutes;

  function portionForFajr() {
    switch (rule) {
      case "middle_of_night":
        return 1 / 2;
      case "seventh_of_night":
        return 1 / 7;
      case "angle_based":
        return (method.fajrAngle || 18) / 60;
      default:
        return 0;
    }
  }

  function portionForIsha() {
    switch (rule) {
      case "middle_of_night":
        return 1 / 2;
      case "seventh_of_night":
        return 1 / 7;
      case "angle_based":
        if (method.ishaFixedMinutes != null) return 0;
        return (method.ishaAngle || 17) / 60;
      default:
        return 0;
    }
  }

  if (fajr == null || !Number.isFinite(fajr)) {
    const portion = portionForFajr();
    if (portion > 0) {
      fajr = sunriseMinutes - portion * nightLength;
    }
  }

  if (
    (isha == null || !Number.isFinite(isha)) &&
    method.ishaFixedMinutes == null
  ) {
    const portion = portionForIsha();
    if (portion > 0) {
      isha = maghribMinutes + portion * nightLength;
    }
  }

  return { fajrMinutes: fajr, ishaMinutes: isha };
}

// -----------------------------
// الدالة الرئيسية لحساب اليوم
// -----------------------------

export function computePrayerTimes(dateLocal, coords, options = {}) {
  const { lat, lon, elevation = 0 } = coords;
  const {
    tzOffsetMinutes = -dateLocal.getTimezoneOffset(),
    method = DEFAULT_METHOD,
  } = options;

  const { year, month, day } = getYMD(dateLocal);
  const baseUtcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));

  const jd = julianDayFromDate(baseUtcDate);
  const { declination: dec, equationOfTimeMinutes: E } = solarCoordinates(jd);

  const latRad = d2r(lat);
  const decRad = dec;

  // الظهر الشمسي بالUTC (دقائق)
  const solarNoonMinutesUtc = 720 - 4 * lon - E;

  // الشروق/الغروب: نعوّض الارتفاع
  const sunriseAngle = method.sunriseAngle ?? DEFAULT_METHOD.sunriseAngle;
  const h0 =
    sunriseAngle + 0.0347 * Math.sqrt(Math.max(elevation, 0)); // درجات
  const altSunriseSunset = -h0;

  function timeForAltitude(altDeg, beforeNoon = false) {
    const altRad = d2r(altDeg);
    const H = hourAngleForAltitude(latRad, decRad, altRad);
    if (H == null) return null;
    const deltaMinutes = r2d(H) * 4;
    return beforeNoon
      ? solarNoonMinutesUtc - deltaMinutes
      : solarNoonMinutesUtc + deltaMinutes;
  }

  // الظهر
  const dhuhrUtcMinutes = solarNoonMinutesUtc;

  // الشروق والمغرب
  const sunriseUtcMinutes = timeForAltitude(altSunriseSunset, true);
  const maghribUtcMinutes = timeForAltitude(altSunriseSunset, false);

  // الفجر
  let fajrUtcMinutes = timeForAltitude(-method.fajrAngle, true);

  // العشاء
  let ishaUtcMinutes = null;
  if (method.ishaFixedMinutes != null && maghribUtcMinutes != null) {
    ishaUtcMinutes = maghribUtcMinutes + method.ishaFixedMinutes;
  } else {
    ishaUtcMinutes = timeForAltitude(-method.ishaAngle, false);
  }

  // العصر: مثل/مثليْن
  let asrUtcMinutes = null;
  {
    const factor = method.asrMethod === "hanafi" ? 2 : 1;
    const t = Math.abs(latRad - decRad);
    const hAsr = Math.atan(1 / (factor + Math.tan(t)));
    const altAsrDeg = r2d(hAsr);
    asrUtcMinutes = timeForAltitude(altAsrDeg, false);
  }

  // تطبيق قواعد العروض العليا
  const adjusted = applyHighLatAdjustments(
    method,
    sunriseUtcMinutes,
    maghribUtcMinutes,
    fajrUtcMinutes,
    ishaUtcMinutes
  );
  fajrUtcMinutes = adjusted.fajrMinutes;
  ishaUtcMinutes = adjusted.ishaMinutes;

  // تحويل إلى أوقات محلية
  const fajr = formatTimeFromMinutes(baseUtcDate, fajrUtcMinutes, tzOffsetMinutes);
  const sunrise = formatTimeFromMinutes(
    baseUtcDate,
    sunriseUtcMinutes,
    tzOffsetMinutes
  );
  const dhuhr = formatTimeFromMinutes(
    baseUtcDate,
    dhuhrUtcMinutes,
    tzOffsetMinutes
  );
  const asr = formatTimeFromMinutes(baseUtcDate, asrUtcMinutes, tzOffsetMinutes);
  const maghrib = formatTimeFromMinutes(
    baseUtcDate,
    maghribUtcMinutes,
    tzOffsetMinutes
  );
  const isha = formatTimeFromMinutes(baseUtcDate, ishaUtcMinutes, tzOffsetMinutes);

  return {
    meta: {
      date: { year, month, day },
      lat,
      lon,
      elevation,
      tzOffsetMinutes,
      methodId: method.id || "custom",
      methodName: method.name || "غير معرّفة",
      highLatRule: method.highLatRule || "none",
    },
    fajr,
    sunrise,
    dhuhr,
    asr,
    maghrib,
    isha,
  };
}

// -----------------------------
// حساب شهر كامل (computeMonth)
// -----------------------------

/**
 * حساب مواقيت شهر كامل
 * @param {number} year  - السنة (مثلاً 2025)
 * @param {number} month - الشهر 1..12
 * @param {Object} coords - { lat, lon, elevation }
 * @param {Object} options - { tzOffsetMinutes, method }
 * @returns {{year:number, month:number, days:Array}}
 */
export function computeMonth(year, month, coords, options = {}) {
  const daysInMonth = new Date(year, month, 0).getDate(); // الشهر 1..12
  const results = [];

  const baseOptions = { ...options };
  if (baseOptions.tzOffsetMinutes == null) {
    // إن لم يُحدّد، نأخذ من أول يوم
    const tmpDate = new Date(year, month - 1, 1);
    baseOptions.tzOffsetMinutes = -tmpDate.getTimezoneOffset();
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateLocal = new Date(year, month - 1, day);
    const r = computePrayerTimes(dateLocal, coords, baseOptions);
    results.push(r);
  }

  return {
    year,
    month,
    days: results,
  };
}
