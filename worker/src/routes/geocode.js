// src/routes/geocode.js
// =====================
// نقطة نهاية لجلب الإحداثيات من اسم مكان (Geocoding)
// - تستخدم Open-Meteo Geocoding API (مجاني، بدون مفتاح).
// - تحفظ النتائج في KV مع TTL شهر.
// - تدعم أسماء عربية أو لاتينية قدر الإمكان.
//
// GET /api/geocode?q=اسم_المكان
//
// الردّ:
//   {
//     ok: true/false,
//     cached: bool,
//     result: { lat, lon, display_name }
//   }

import { parseBearer, incrementUsage } from "./usage.js";

const KV_PREFIX = "geo:";

// نستخدم هذا فقط لمفتاح الـ KV، لا نغيّر النص المُرسَل إلى المزود
function normalizeQuery(q) {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * استدعاء مزود الـ Geocoding الخارجي (Open-Meteo)
 * نحاول أولاً language=ar ثم language=en لو لم نجد شيئًا.
 */
async function fetchFromProvider(originalQuery) {
  const query = originalQuery.trim();

  async function attempt(lang) {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.searchParams.set("name", query);
    url.searchParams.set("count", "5"); // نطلب حتى 5 نتائج ونأخذ الأولى
    url.searchParams.set("language", lang);
    url.searchParams.set("format", "json");

    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Geocode provider HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data || !Array.isArray(data.results) || data.results.length === 0) {
      return null;
    }

    const item = data.results[0];

    const lat = typeof item.latitude === "number" ? item.latitude : null;
    const lon = typeof item.longitude === "number" ? item.longitude : null;
    if (lat == null || lon == null) {
      return null;
    }

    const parts = [];
    if (item.name) parts.push(item.name);
    if (item.admin1) parts.push(item.admin1);
    if (item.country) parts.push(item.country);
    const display_name = parts.join(", ") || query;

    return { lat, lon, display_name };
  }

  // نحاول بالعربية أولًا، ثم بالإنجليزية
  let result = await attempt("ar");
  if (!result) {
    result = await attempt("en");
  }
  return result;
}

export async function handleGeocode(request, env, ctx) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") || "";

    if (!q.trim()) {
      return jsonResponse(
        { ok: false, error: "Missing 'q' query parameter." },
        400
      );
    }

    const normalized = normalizeQuery(q);
    const kvKey = KV_PREFIX + normalized;

    // 1) محاولة من الكاش (KV)
    if (env.PRAYER_KV) {
      const cachedStr = await env.PRAYER_KV.get(kvKey);
      if (cachedStr) {
        try {
          const parsed = JSON.parse(cachedStr);
          if (parsed) {
            // زيادة الاستهلاك حتى لو من الكاش
            const apiKey = parseBearer(request);
            await incrementUsage(env, apiKey, 1);

            return jsonResponse({
              ok: true,
              cached: true,
              result: parsed,
            });
          }
        } catch {
          // لو الكاش فاسد نتجاهله
        }
      }
    }

    // 2) جلب من المزود الخارجي بالنص الأصلي (بدون normalize)
    const result = await fetchFromProvider(q);
    if (!result) {
      return jsonResponse(
        {
          ok: false,
          cached: false,
          error:
            "No results from geocoding provider. حاول كتابة اسم أوضح (مثلاً: 'Tanger, Morocco' أو 'طنجة المغرب').",
        },
        404
      );
    }

    // 3) تخزين في KV مع TTL (30 يوم)
    if (env.PRAYER_KV) {
      ctx.waitUntil(
        env.PRAYER_KV.put(kvKey, JSON.stringify(result), {
          expirationTtl: 60 * 60 * 24 * 30,
        })
      );
    }

    // 4) تسجيل الاستهلاك بعد طلب ناجح من المزود
    const apiKey = parseBearer(request);
    await incrementUsage(env, apiKey, 1);

    return jsonResponse({
      ok: true,
      cached: false,
      result,
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
