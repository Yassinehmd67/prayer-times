// src/routes/weather.js
// ======================
// نقطة نهاية لجلب بيانات الطقس (درجة الحرارة، الضغط...)
// - تستخدم Open-Meteo Weather API (مجاني، بدون مفتاح).
// - تخزن النتائج في KV مع TTL (مثلًا 3 ساعات أو 6 ساعات).
//
// GET /api/weather?lat=..&lon=..&hourly=temperature_2m,pressure_msl
//
// الردّ:
//   {
//     ok: true/false,
//     cached: bool,
//     data: { ... ردّ Open-Meteo ... }
//   }

import { parseBearer, incrementUsage } from "./usage.js";

const KV_PREFIX = "weather:";

// نصنع مفتاح بسيط للـ KV يعتمد على (lat, lon, hourly)
function makeKey(lat, lon, hourly) {
  const latStr = lat.toFixed(4);
  const lonStr = lon.toFixed(4);
  const hourlyStr = (hourly || "").trim().toLowerCase();
  return `${KV_PREFIX}${latStr},${lonStr},${hourlyStr}`;
}

/**
 * استدعاء Open-Meteo Weather API
 *   https://api.open-meteo.com/v1/forecast?latitude=..&longitude=..&hourly=..
 */
async function fetchWeather(lat, lon, hourly) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));

  // hourly params
  if (hourly && hourly.trim()) {
    url.searchParams.set("hourly", hourly.trim());
  } else {
    // افتراضيًا لو لم يحدد: نأخذ حرارة وضغط
    url.searchParams.set("hourly", "temperature_2m,pressure_msl");
  }

  // نطلب timezone الجغرافي التلقائي
  url.searchParams.set("timezone", "auto");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Weather provider HTTP ${res.status}`);
  }

  const data = await res.json();
  if (!data) {
    return null;
  }

  return data;
}

export async function handleWeather(request, env, ctx) {
  try {
    const url = new URL(request.url);
    const latStr = url.searchParams.get("lat");
    const lonStr = url.searchParams.get("lon");
    const hourlyParam = url.searchParams.get("hourly") || "";

    if (!latStr || !lonStr) {
      return jsonResponse(
        {
          ok: false,
          error: "Missing 'lat' or 'lon' query parameters.",
        },
        400
      );
    }

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return jsonResponse(
        {
          ok: false,
          error: "Invalid 'lat' or 'lon' values.",
        },
        400
      );
    }

    const kvKey = makeKey(lat, lon, hourlyParam);

    // 1) محاولة استخدام الكاش من KV
    if (env.PRAYER_KV) {
      const cachedStr = await env.PRAYER_KV.get(kvKey);
      if (cachedStr) {
        try {
          const parsed = JSON.parse(cachedStr);
          if (parsed && parsed.data) {
            // نزيد الاستهلاك حتى لو من الكاش
            const apiKey = parseBearer(request);
            await incrementUsage(env, apiKey, 1);

            return jsonResponse({
              ok: true,
              cached: true,
              data: parsed.data,
            });
          }
        } catch {
          // لو الكاش فاسد نتجاهله
        }
      }
    }

    // 2) جلب من مزوّد الطقس
    const data = await fetchWeather(lat, lon, hourlyParam);
    if (!data) {
      return jsonResponse(
        {
          ok: false,
          cached: false,
          error: "No weather data from provider.",
        },
        404
      );
    }

    // 3) تخزين في KV مع TTL (مثلاً 3 ساعات = 10800 ثانية)
    if (env.PRAYER_KV) {
      const payload = { data };
      ctx.waitUntil(
        env.PRAYER_KV.put(kvKey, JSON.stringify(payload), {
          expirationTtl: 60 * 60 * 3, // 3 ساعات
        })
      );
    }

    // 4) تسجيل الاستهلاك بعد طلب ناجح
    const apiKey = parseBearer(request);
    await incrementUsage(env, apiKey, 1);

    return jsonResponse({
      ok: true,
      cached: false,
      data,
    });
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

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
