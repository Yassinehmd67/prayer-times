// src/routes/elevation.js
// =======================
// نقطة نهاية لجلب الارتفاع عن سطح البحر (متر) من إحداثيات lat/lon.
// - تستخدم Open-Meteo Elevation API (مجاني، بدون مفتاح).
// - تخزن النتائج في KV مع TTL (مثلاً 30 يوم).
//
// GET /api/elevation?lat=..&lon=..
//
// الردّ:
//   {
//     ok: true/false,
//     cached: bool,
//     elevation_m: number | null
//   }

import { parseBearer, incrementUsage } from "./usage.js";

const KV_PREFIX = "elev:";

// نصنع مفتاح بسيط في KV يعتمد على lat/lon مقربة لأربع منازل عشرية
function makeKey(lat, lon) {
  const latStr = lat.toFixed(4);
  const lonStr = lon.toFixed(4);
  return KV_PREFIX + latStr + "," + lonStr;
}

/**
 * استدعاء مزود الارتفاع الخارجي (Open-Meteo Elevation)
 *   https://api.open-meteo.com/v1/elevation?latitude=..&longitude=..
 */
async function fetchElevation(lat, lon) {
  const url = new URL("https://api.open-meteo.com/v1/elevation");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Elevation provider HTTP ${res.status}`);
  }

  const data = await res.json();

  // صيغة الرد القياسية من Open-Meteo Elevation:
  // { elevation: [123.4], latitude: [...], longitude: [...] }
  if (!data || !Array.isArray(data.elevation) || data.elevation.length === 0) {
    return null;
  }

  const value = data.elevation[0];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return value;
}

/**
 * handler الرئيسي
 * يفترض أن index.js يستدعي:
 *   handleElevation(request, env, ctx)
 */
export async function handleElevation(request, env, ctx) {
  try {
    const url = new URL(request.url);
    const latStr = url.searchParams.get("lat");
    const lonStr = url.searchParams.get("lon");

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

    const kvKey = makeKey(lat, lon);

    // 1) محاولة من الكاش (KV)
    if (env.PRAYER_KV) {
      const cachedStr = await env.PRAYER_KV.get(kvKey);
      if (cachedStr) {
        try {
          const parsed = JSON.parse(cachedStr);
          if (typeof parsed.elevation_m === "number") {
            const apiKey = parseBearer(request);
            await incrementUsage(env, apiKey, 1);

            return jsonResponse({
              ok: true,
              cached: true,
              elevation_m: parsed.elevation_m,
            });
          }
        } catch {
          // لو الكاش غير صالح نتجاهله
        }
      }
    }

    // 2) جلب من المزود الخارجي
    const elevationValue = await fetchElevation(lat, lon);
    if (elevationValue == null) {
      return jsonResponse(
        {
          ok: false,
          cached: false,
          elevation_m: null,
          error: "No elevation data from provider.",
        },
        404
      );
    }

    // 3) تخزين في KV مع TTL (30 يوم)
    if (env.PRAYER_KV) {
      const payload = { elevation_m: elevationValue };
      ctx.waitUntil(
        env.PRAYER_KV.put(kvKey, JSON.stringify(payload), {
          expirationTtl: 60 * 60 * 24 * 30, // 30 يوم
        })
      );
    }

    // 4) تسجيل الاستهلاك بعد طلب ناجح
    const apiKey = parseBearer(request);
    await incrementUsage(env, apiKey, 1);

    return jsonResponse({
      ok: true,
      cached: false,
      elevation_m: elevationValue,
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

// دالة مساعدة لإرجاع JSON
function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
