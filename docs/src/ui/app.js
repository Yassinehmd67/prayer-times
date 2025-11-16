// ui/app.js — منطق واجهة التطبيق الكامل
import { updatePrayerMeta } from "./meta.js";
import {
  computePrayerTimes,
  DEFAULT_METHOD,
  getMethodById,
  computeMonth,
} from "../lib/calc.js";

const API_BASE = "https://prayer-times-api.yassinehmd67.workers.dev";
const STORAGE_KEY = "pt_api_key";
const CUSTOM_METHOD_STORAGE_KEY = "pt_custom_method";

// عناصر DOM — API/key
const apiKeyInput = document.getElementById("api-key-input");
const saveKeyBtn = document.getElementById("save-key-btn");
const planLabel = document.getElementById("plan-label");
const usageInfo = document.getElementById("usage-info");

// الموقع
const locationForm = document.getElementById("location-form");
const locationQueryInput = document.getElementById("location-query");
const locationSubmitBtn = document.getElementById("location-submit-btn");

const coordsForm = document.getElementById("coords-form");
const latInput = document.getElementById("lat-input");
const lonInput = document.getElementById("lon-input");

const fetchElevBtn = document.getElementById("fetch-elev-btn");
const fetchWeatherBtn = document.getElementById("fetch-weather-btn");

const geoResultDiv = document.getElementById("geo-result");
const elevResultDiv = document.getElementById("elev-result");
const weatherResultDiv = document.getElementById("weather-result");
const debugOutput = document.getElementById("debug-output");

// مواقيت + الطريقة
const computeTimesBtn = document.getElementById("compute-times-btn");
const dateLabel = document.getElementById("date-label");
const prayerMetaDiv = document.getElementById("prayer-meta");

const timeFajr = document.getElementById("time-fajr");
const timeSunrise = document.getElementById("time-sunrise");
const timeDhuhr = document.getElementById("time-dhuhr");
const timeAsr = document.getElementById("time-asr");
const timeMaghrib = document.getElementById("time-maghrib");
const timeIsha = document.getElementById("time-isha");

const methodSelect = document.getElementById("method-select");

// عناصر الطريقة المخصّصة
const customPanel = document.getElementById("custom-method-panel");
const customFajrInput = document.getElementById("custom-fajr-angle");
const customIshaAngleInput = document.getElementById("custom-isha-angle");
const customIshaFixedInput = document.getElementById("custom-isha-fixed");
const customAsrMethodSelect = document.getElementById("custom-asr-method");
const customHighLatSelect = document.getElementById("custom-highlat");

// عناصر التصدير
const exportYearInput = document.getElementById("export-year");
const exportMonthSelect = document.getElementById("export-month");
const exportCsvBtn = document.getElementById("export-csv-btn");
const exportJsonBtn = document.getElementById("export-json-btn");
const exportIcsBtn = document.getElementById("export-ics-btn");
const exportStatusDiv = document.getElementById("export-status");

// حالة التطبيق
const state = {
  apiKey: null,
  locationQuery: "",
  lat: null,
  lon: null,
  elevation_m: null,
  weather: null,
  usage: null,
  prayerTimes: null,
  methodId: "mwl",
  customMethod: {
    fajrAngle: 18,
    ishaAngle: 17,
    ishaFixedMinutes: null,
    asrMethod: "standard",
    highLatRule: "middle_of_night",
  },
};

// ============== أدوات عامة ==============

function saveApiKey(key) {
  state.apiKey = key || null;
  if (state.apiKey) {
    localStorage.setItem(STORAGE_KEY, state.apiKey);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function loadApiKey() {
  const key = localStorage.getItem(STORAGE_KEY);
  if (key) {
    state.apiKey = key;
    apiKeyInput.value = key;
  }
}

function loadCustomMethodFromStorage() {
  try {
    const raw = localStorage.getItem(CUSTOM_METHOD_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    state.customMethod = {
      fajrAngle:
        typeof parsed.fajrAngle === "number" ? parsed.fajrAngle : 18,
      ishaAngle:
        typeof parsed.ishaAngle === "number" ? parsed.ishaAngle : 17,
      ishaFixedMinutes:
        typeof parsed.ishaFixedMinutes === "number"
          ? parsed.ishaFixedMinutes
          : null,
      asrMethod: parsed.asrMethod === "hanafi" ? "hanafi" : "standard",
      highLatRule: parsed.highLatRule || "middle_of_night",
    };
  } catch {
    // تجاهل الخطأ
  }
}

function saveCustomMethodToStorage() {
  try {
    localStorage.setItem(
      CUSTOM_METHOD_STORAGE_KEY,
      JSON.stringify(state.customMethod)
    );
  } catch {
    // نتجاهل أي خطأ في التخزين
  }
}

async function apiFetch(path, options = {}) {
  const headers = options.headers || {};
  headers["Content-Type"] = "application/json";
  if (state.apiKey) {
    headers["Authorization"] = `Bearer ${state.apiKey}`;
  }
  const res = await fetch(API_BASE + path, { ...options, headers });

  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (!res.ok) {
    const err =
      json && json.error ? json.error : `HTTP ${res.status} ${res.statusText}`;
    throw new Error(err);
  }
  return json;
}

function updateDebugOutput() {
  const view = {
    apiKey: state.apiKey ? state.apiKey.slice(0, 8) + "..." : null,
    lat: state.lat,
    lon: state.lon,
    elevation_m: state.elevation_m,
    methodId: state.methodId,
    customMethod:
      state.customMethod && state.methodId === "custom"
        ? state.customMethod
        : undefined,
    usage: state.usage,
    weather_brief: state.weather
      ? {
          has_hourly: !!state.weather.data?.hourly,
          timezone: state.weather.data?.timezone,
        }
      : null,
    prayerTimes: state.prayerTimes
      ? {
          fajr: state.prayerTimes.fajr?.text,
          sunrise: state.prayerTimes.sunrise?.text,
          dhuhr: state.prayerTimes.dhuhr?.text,
          asr: state.prayerTimes.asr?.text,
          maghrib: state.prayerTimes.maghrib?.text,
          isha: state.prayerTimes.isha?.text,
          methodName: state.prayerTimes.meta?.methodName,
          highLatRule: state.prayerTimes.meta?.highLatRule,
        }
      : null,
  };
  debugOutput.textContent = JSON.stringify(view, null, 2);
}

function setLoading(button, loading) {
  if (!button) return;
  if (loading) {
    button.disabled = true;
    button.dataset.oldText = button.textContent;
    button.textContent = "⏳ جاري...";
  } else {
    button.disabled = false;
    if (button.dataset.oldText) {
      button.textContent = button.dataset.oldText;
      delete button.dataset.oldText;
    }
  }
}

function highlightCurrentPlan(planId) {
  const normalized = (planId || "free").toLowerCase();
  const cards = document.querySelectorAll(".pricing-card[data-plan]");
  cards.forEach((card) => {
    card.classList.remove("current-plan");
    const cardPlan = (card.getAttribute("data-plan") || "").toLowerCase();
    if (cardPlan === normalized) {
      card.classList.add("current-plan");
    }
  });
}

// ============== API Key ==============

async function refreshUsage() {
  // لا يوجد مفتاح => نفترض خطة free
  if (!state.apiKey) {
    planLabel.textContent = "free";
    usageInfo.textContent = "لا يوجد مفتاح API مُخزَّن حاليًا.";
    state.usage = null;
    highlightCurrentPlan("free");
    updateDebugOutput();
    return;
  }

  try {
    const data = await apiFetch("/api/usage");
    state.usage = data;

    const plan = (data.plan || "free").toLowerCase();
    planLabel.textContent = plan;

    const used = data.used ?? "?";
    const quota = data.monthly_quota ?? "?";
    const expires_at = data.expires_at || null;

    let msg = `المستخدم: الخطة ${plan}, استهلاك هذا الشهر: ${used}/${quota}.`;
    if (expires_at) {
      msg += ` ينتهي الاشتراك في: ${expires_at} (بعد ${data.days_left} يومًا تقريبًا).`;
    }
    usageInfo.textContent = msg;

    // ✅ إبراز بطاقة الخطة الحالية
    highlightCurrentPlan(plan);
  } catch (err) {
    planLabel.textContent = "free";
    usageInfo.textContent =
      "تعذر قراءة حالة المفتاح: " + (err.message || String(err));
    state.usage = null;
    // في حالة الخطأ نرجع افتراضياً إلى free
    highlightCurrentPlan("free");
  } finally {
    updateDebugOutput();
  }
}

// ============== الموقع (geocode) ==============

locationForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const q = locationQueryInput.value.trim();
  if (!q) return;

  geoResultDiv.textContent = "";
  elevResultDiv.textContent = "";
  weatherResultDiv.textContent = "";
  setLoading(locationSubmitBtn, true);

  try {
    const data = await apiFetch(`/api/geocode?q=${encodeURIComponent(q)}`);
    if (!data.ok || !data.result) {
      geoResultDiv.textContent = "لم يتم العثور على نتائج.";
      return;
    }

    const { lat, lon, display_name } = data.result;
    state.locationQuery = q;
    state.lat = lat;
    state.lon = lon;

    latInput.value = String(lat);
    lonInput.value = String(lon);

    geoResultDiv.innerHTML = `
      <div>📍 <strong>${display_name}</strong></div>
      <div class="small">lat: ${lat}, lon: ${lon}</div>
      <div class="small muted">${data.cached ? "من الكاش" : "من المزود مباشرة"}</div>
    `;
  } catch (err) {
    geoResultDiv.textContent = "خطأ في جلب الإحداثيات: " + err.message;
  } finally {
    setLoading(locationSubmitBtn, false);
    updateDebugOutput();
    autoComputeIfPossible();
  }
});

coordsForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const lat = parseFloat(latInput.value);
  const lon = parseFloat(lonInput.value);

  // لو الإدخال غير صالح، نمسح الموقع والمواقيت حتى لا تبقى نتائج قديمة مضلِّلة
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    state.lat = null;
    state.lon = null;
    state.locationQuery = "";
    state.prayerTimes = null;

    geoResultDiv.textContent =
      "يرجى إدخال قيم صحيحة لخط العرض والطول (درجة عشرية).";
    renderPrayerTimes();
    updateDebugOutput();
    return;
  }

  state.lat = lat;
  state.lon = lon;
  state.locationQuery = "manual";

  geoResultDiv.innerHTML = `
    <div>📍 تم اعتماد إحداثيات يدوية.</div>
    <div class="small">lat: ${lat}, lon: ${lon}</div>
  `;

  updateDebugOutput();
  autoComputeIfPossible();
});

// ============== الارتفاع والطقس ==============

fetchElevBtn.addEventListener("click", async () => {
  if (state.lat == null || state.lon == null) {
    elevResultDiv.textContent = "يرجى تحديد الموقع أولاً.";
    return;
  }
  elevResultDiv.textContent = "";
  setLoading(fetchElevBtn, true);

  try {
    const data = await apiFetch(
      `/api/elevation?lat=${encodeURIComponent(
        state.lat
      )}&lon=${encodeURIComponent(state.lon)}`
    );
    if (!data.ok || data.elevation_m == null) {
      elevResultDiv.textContent = "لم يتم العثور على بيانات ارتفاع مناسبة.";
      return;
    }

    state.elevation_m = data.elevation_m;
    elevResultDiv.innerHTML = `
      <div>⛰️ الارتفاع التقريبي: <strong>${data.elevation_m.toFixed(
        1
      )} متر</strong></div>
      <div class="small muted">${
        data.cached ? "من الكاش" : "من المزود مباشرة"
      }</div>
    `;
  } catch (err) {
    elevResultDiv.textContent = "خطأ في جلب الارتفاع: " + err.message;
  } finally {
    setLoading(fetchElevBtn, false);
    updateDebugOutput();
    autoComputeIfPossible();
  }
});

fetchWeatherBtn.addEventListener("click", async () => {
  if (state.lat == null || state.lon == null) {
    weatherResultDiv.textContent = "يرجى تحديد الموقع أولاً.";
    return;
  }
  weatherResultDiv.textContent = "";
  setLoading(fetchWeatherBtn, true);

  try {
    const data = await apiFetch(
      `/api/weather?lat=${encodeURIComponent(
        state.lat
      )}&lon=${encodeURIComponent(
        state.lon
      )}&hourly=temperature_2m,pressure_msl`
    );

    state.weather = data;

    const hourly = data.data?.hourly;
    let msg = "تم جلب بيانات الطقس.";
    if (hourly && hourly.time && hourly.temperature_2m) {
      const firstIndex = 0;
      const tStr = hourly.time[firstIndex];
      const temp = hourly.temperature_2m[firstIndex];
      const pressure =
        hourly.pressure_msl && hourly.pressure_msl[firstIndex] != null
          ? hourly.pressure_msl[firstIndex]
          : null;

      msg = `أول قياس: ${tStr} — حرارة ≈ ${temp}°C${
        pressure != null ? `، ضغط ≈ ${pressure} hPa` : ""
      }`;
    }

    weatherResultDiv.innerHTML = `
      <div>🌦️ ${msg}</div>
      <div class="small muted">المنطقة الزمنية للبيانات: ${
        data.data?.timezone || "غير معروفة"
      }</div>
    `;
  } catch (err) {
    weatherResultDiv.textContent = "خطأ في جلب الطقس: " + err.message;
  } finally {
    setLoading(fetchWeatherBtn, false);
    updateDebugOutput();
  }
});

// ============== الطريقة المخصّصة ==============

function applyCustomMethodToInputs() {
  const cm = state.customMethod;
  if (customFajrInput) customFajrInput.value = cm.fajrAngle;
  if (customIshaAngleInput) customIshaAngleInput.value = cm.ishaAngle;
  if (customIshaFixedInput)
    customIshaFixedInput.value =
      cm.ishaFixedMinutes != null ? cm.ishaFixedMinutes : "";
  if (customAsrMethodSelect) customAsrMethodSelect.value = cm.asrMethod;
  if (customHighLatSelect) customHighLatSelect.value = cm.highLatRule;
}

function readCustomMethodFromInputs() {
  const fajrAngle = parseFloat(customFajrInput.value);
  const ishaAngle = parseFloat(customIshaAngleInput.value);
  const ishaFixedStr = customIshaFixedInput.value.trim();
  const ishaFixed = ishaFixedStr === "" ? null : parseInt(ishaFixedStr, 10);
  const asrMethod =
    customAsrMethodSelect.value === "hanafi" ? "hanafi" : "standard";
  const highLatRule = customHighLatSelect.value || "middle_of_night";

  state.customMethod = {
    fajrAngle: Number.isFinite(fajrAngle) ? fajrAngle : 18,
    ishaAngle: Number.isFinite(ishaAngle) ? ishaAngle : 17,
    ishaFixedMinutes: Number.isFinite(ishaFixed) ? ishaFixed : null,
    asrMethod,
    highLatRule,
  };
  saveCustomMethodToStorage();
  updateDebugOutput();
}

function getCurrentMethod() {
  if (state.methodId === "custom") {
    const cm = state.customMethod;
    return {
      id: "custom",
      name: "طريقة مخصّصة",
      fajrAngle: cm.fajrAngle,
      ishaAngle: cm.ishaAngle,
      ishaFixedMinutes: cm.ishaFixedMinutes,
      asrMethod: cm.asrMethod,
      sunriseAngle: DEFAULT_METHOD.sunriseAngle,
      highLatRule: cm.highLatRule,
    };
  }
  return getMethodById(state.methodId) || DEFAULT_METHOD;
}

// ربط تغييرات الطريقة المخصّصة
if (customFajrInput) {
  customFajrInput.addEventListener("change", readCustomMethodFromInputs);
}
if (customIshaAngleInput) {
  customIshaAngleInput.addEventListener("change", readCustomMethodFromInputs);
}
if (customIshaFixedInput) {
  customIshaFixedInput.addEventListener("change", readCustomMethodFromInputs);
}
if (customAsrMethodSelect) {
  customAsrMethodSelect.addEventListener("change", readCustomMethodFromInputs);
}
if (customHighLatSelect) {
  customHighLatSelect.addEventListener("change", readCustomMethodFromInputs);
}

// ============== اختيار طريقة الحساب ==============

methodSelect.addEventListener("change", () => {
  state.methodId = methodSelect.value || "mwl";

  if (state.methodId === "custom") {
    if (customPanel) customPanel.style.display = "block";
  } else {
    if (customPanel) customPanel.style.display = "none";
  }

  autoComputeIfPossible();
  updateDebugOutput();
});

// ============== حساب مواقيت اليوم ==============

function renderPrayerTimes() {
  const t = state.prayerTimes;
  if (!t) {
    timeFajr.textContent = "--:--";
    timeSunrise.textContent = "--:--";
    timeDhuhr.textContent = "--:--";
    timeAsr.textContent = "--:--";
    timeMaghrib.textContent = "--:--";
    timeIsha.textContent = "--:--";
    prayerMetaDiv.textContent = "لم يتم حساب المواقيت بعد.";
    return;
  }

  timeFajr.textContent = t.fajr?.text || "--:--";
  timeSunrise.textContent = t.sunrise?.text || "--:--";
  timeDhuhr.textContent = t.dhuhr?.text || "--:--";
  timeAsr.textContent = t.asr?.text || "--:--";
  timeMaghrib.textContent = t.maghrib?.text || "--:--";
  timeIsha.textContent = t.isha?.text || "--:--";

  // ✅ استخدام دالة meta المشتركة لعرض تفاصيل الطريقة/العروض العليا إلخ
  if (t.meta) {
    updatePrayerMeta(t.meta);
  } else {
    prayerMetaDiv.textContent =
      "تم حساب المواقيت، لكن لم تتوفر معلومات إضافية (meta).";
  }
}

// دالة مساعدة لاختيار إزاحة التوقيت المناسبة للموقع
function getTzOffsetMinutesForCurrentLocation() {
  // 1) إن كانت بيانات الطقس موجودة وبها utc_offset_seconds من Open-Meteo
  const fromWeather = state.weather?.data?.utc_offset_seconds;
  if (typeof fromWeather === "number" && Number.isFinite(fromWeather)) {
    return fromWeather / 60; // تحويل من ثوانٍ إلى دقائق
  }

  // 2) احتياطًا: نرجع للمنطقة الزمنية للجهاز
  const now = new Date();
  return -now.getTimezoneOffset();
}

function computeTimesForToday() {
  if (state.lat == null || state.lon == null) {
    alert("يرجى تحديد الموقع أولاً (إحداثيات أو مدينة).");
    return;
  }

  const today = new Date();
  const tzOffsetMinutes = getTzOffsetMinutesForCurrentLocation();
  const elevation = state.elevation_m ?? 0;
  const method = getCurrentMethod();

  const result = computePrayerTimes(
    today,
    { lat: state.lat, lon: state.lon, elevation },
    {
      tzOffsetMinutes,
      method,
    }
  );

  state.prayerTimes = result;

  const y = result.meta.date.year;
  const m = result.meta.date.month.toString().padStart(2, "0");
  const d = result.meta.date.day.toString().padStart(2, "0");
  dateLabel.textContent = `${y}-${m}-${d}`;

  renderPrayerTimes();
  updateDebugOutput();
}

computeTimesBtn.addEventListener("click", () => {
  computeTimesForToday();
});

function autoComputeIfPossible() {
  if (state.lat != null && state.lon != null) {
    computeTimesForToday();
  }
}

// ============== تصدير شهر كامل (CSV / JSON / ICS) ==============

function buildMonthFileName(year, month, ext) {
  const mm = String(month).padStart(2, "0");
  return `prayer-times-${year}-${mm}.${ext}`;
}

function downloadBlob(content, mimeType, fileName) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportMonthToCSV(monthResult) {
  const { days } = monthResult;
  const header =
    "date,fajr,sunrise,dhuhr,asr,maghrib,isha,methodId,methodName,highLatRule\n";

  const lines = days.map((d) => {
    const meta = d.meta;
    const y = meta.date.year;
    const m = String(meta.date.month).padStart(2, "0");
    const day = String(meta.date.day).padStart(2, "0");
    const dateStr = `${y}-${m}-${day}`;

    const fajr = d.fajr?.text || "";
    const sunrise = d.sunrise?.text || "";
    const dhuhr = d.dhuhr?.text || "";
    const asr = d.asr?.text || "";
    const maghrib = d.maghrib?.text || "";
    const isha = d.isha?.text || "";
    const methodId = meta.methodId || "";
    const methodName = meta.methodName || "";
    const highLatRule = meta.highLatRule || "";

    const row = [
      dateStr,
      fajr,
      sunrise,
      dhuhr,
      asr,
      maghrib,
      isha,
      methodId,
      methodName,
      highLatRule,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",");

    return row;
  });

  return header + lines.join("\n");
}

function exportMonthToJSON(monthResult) {
  return JSON.stringify(monthResult, null, 2);
}

// تحويل Date إلى سلسلة بصيغة iCal UTC (YYYYMMDDTHHmmssZ)
function toICSDateTimeUTC(dateObj) {
  const iso = dateObj.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return iso;
}

function escapeICSText(text) {
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

// توليد ملف iCal يحتوي حدثًا لكل صلاة لكل يوم
function exportMonthToICS(monthResult) {
  const { year, month, days } = monthResult;

  const lines = [];
  lines.push("BEGIN:VCALENDAR");
  lines.push("PRODID:-//prayer-times-tool//ar//EN");
  lines.push("VERSION:2.0");
  lines.push("CALSCALE:GREGORIAN");
  lines.push("METHOD:PUBLISH");

  const dtStamp = toICSDateTimeUTC(new Date());

  const prayerNames = [
    { key: "fajr", title: "Fajr" },
    { key: "sunrise", title: "Sunrise" },
    { key: "dhuhr", title: "Dhuhr" },
    { key: "asr", title: "Asr" },
    { key: "maghrib", title: "Maghrib" },
    { key: "isha", title: "Isha" },
  ];

  days.forEach((d) => {
    const meta = d.meta;
    const y = meta.date.year;
    const m = meta.date.month;
    const day = meta.date.day;
    const methodName = meta.methodName || "Prayer Times";
    const highLatRule = meta.highLatRule || "none";

    prayerNames.forEach((p) => {
      const obj = d[p.key];
      if (!obj || !obj.date) return;

      const dtStartUtc = toICSDateTimeUTC(obj.date);
      // نضع مدة افتراضية 30 دقيقة لكل حدث
      const dtEndUtc = toICSDateTimeUTC(
        new Date(obj.date.getTime() + 30 * 60 * 1000)
      );

      lines.push("BEGIN:VEVENT");
      lines.push(
        `UID:${y}${String(m).padStart(2, "0")}${String(day).padStart(
          2,
          "0"
        )}-${p.key}@prayer-times`
      );
      lines.push(`DTSTAMP:${dtStamp}`);
      lines.push(`DTSTART:${dtStartUtc}`);
      lines.push(`DTEND:${dtEndUtc}`);
      lines.push(
        `SUMMARY:${escapeICSText(p.title)} (${escapeICSText(methodName)})`
      );
      lines.push(
        `DESCRIPTION:${escapeICSText(
          `Prayer: ${p.title}, Method: ${methodName}, HighLatRule: ${highLatRule}`
        )}`
      );
      lines.push("END:VEVENT");
    });
  });

  lines.push("END:VCALENDAR");

  return lines.join("\r\n");
}

function handleExportClick(format) {
  if (state.lat == null || state.lon == null) {
    alert("يرجى تحديد الموقع أولاً (إحداثيات أو مدينة) قبل التصدير.");
    return;
  }

  const year = parseInt(exportYearInput.value, 10);
  const month = parseInt(exportMonthSelect.value, 10);

  if (!Number.isFinite(year) || year < 1900 || year > 2100) {
    alert("يرجى إدخال سنة صحيحة بين 1900 و 2100.");
    return;
  }
  if (!Number.isFinite(month) || month < 1 || month > 12) {
    alert("يرجى اختيار شهر صحيح من القائمة.");
    return;
  }

  // استعمال نفس منطق المنطقة الزمنية للموقع الحالي
  const tzOffsetMinutes = getTzOffsetMinutesForCurrentLocation();
  const elevation = state.elevation_m ?? 0;
  const method = getCurrentMethod();

  const monthResult = computeMonth(
    year,
    month,
    { lat: state.lat, lon: state.lon, elevation },
    { tzOffsetMinutes, method }
  );

  let fileName;
  if (format === "csv") {
    fileName = buildMonthFileName(year, month, "csv");
    const csv = exportMonthToCSV(monthResult);
    downloadBlob(csv, "text/csv;charset=utf-8", fileName);
  } else if (format === "json") {
    fileName = buildMonthFileName(year, month, "json");
    const json = exportMonthToJSON(monthResult);
    downloadBlob(json, "application/json;charset=utf-8", fileName);
  } else if (format === "ics") {
    fileName = buildMonthFileName(year, month, "ics");
    const ics = exportMonthToICS(monthResult);
    downloadBlob(ics, "text/calendar;charset=utf-8", fileName);
  }

  exportStatusDiv.textContent = `تم توليد الملف ${fileName} وحفظه عبر المتصفح.`;
}

if (exportCsvBtn) {
  exportCsvBtn.addEventListener("click", () => handleExportClick("csv"));
}
if (exportJsonBtn) {
  exportJsonBtn.addEventListener("click", () => handleExportClick("json"));
}
if (exportIcsBtn) {
  exportIcsBtn.addEventListener("click", () => handleExportClick("ics"));
}

// ============== حفظ المفتاح ==============

saveKeyBtn.addEventListener("click", async () => {
  const key = apiKeyInput.value.trim();
  if (!key) {
    saveApiKey(null);
    await refreshUsage();
    alert("تم مسح المفتاح من التخزين المحلي.");
    return;
  }

  saveApiKey(key);
  await refreshUsage();
  alert("تم حفظ المفتاح في هذا المتصفح.");
});

// ============== init ==============

function init() {
  loadApiKey();
  loadCustomMethodFromStorage();
  applyCustomMethodToInputs();

  // افتراض البداية طريقة MWL
  methodSelect.value = state.methodId;
  if (customPanel) customPanel.style.display = "none";

  // ضبط سنة التصدير الحالية افتراضياً
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth() + 1;
  if (exportYearInput) exportYearInput.value = y;
  if (exportMonthSelect) exportMonthSelect.value = String(m);

  refreshUsage();
  updateDebugOutput();

  const dStr = String(today.getDate()).padStart(2, "0");
  const mStr = String(m).padStart(2, "0");
  dateLabel.textContent = `${y}-${mStr}-${dStr}`;
}

export function initApp() {
  init();
}
