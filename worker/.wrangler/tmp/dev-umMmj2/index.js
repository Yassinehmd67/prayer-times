var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-oi4exc/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// src/routes/usage.js
var APIKEY_PREFIX = "apikey:";
var USAGE_PREFIX = "usage:";
function parseBearer(request) {
  const auth = request.headers.get("authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) return null;
  const token = auth.slice(7).trim();
  return token || null;
}
__name(parseBearer, "parseBearer");
async function getApiKeyRecord(env, apiKey) {
  if (!env.PRAYER_KV) {
    throw new Error("PRAYER_KV is not configured.");
  }
  const raw = await env.PRAYER_KV.get(APIKEY_PREFIX + apiKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
__name(getApiKeyRecord, "getApiKeyRecord");
function currentMonthId(now) {
  const y = now.getUTCFullYear();
  const m = (now.getUTCMonth() + 1).toString().padStart(2, "0");
  return `${y}-${m}`;
}
__name(currentMonthId, "currentMonthId");
async function getUsageForKey(env, apiKey, monthId) {
  if (!env.PRAYER_KV) {
    throw new Error("PRAYER_KV is not configured.");
  }
  const raw = await env.PRAYER_KV.get(`${USAGE_PREFIX}${apiKey}:${monthId}`);
  if (!raw) return { used: 0 };
  try {
    const obj = JSON.parse(raw);
    if (typeof obj.used === "number" && obj.used >= 0) {
      return { used: obj.used };
    }
    return { used: 0 };
  } catch {
    return { used: 0 };
  }
}
__name(getUsageForKey, "getUsageForKey");
async function incrementUsage(env, apiKey, amount = 1) {
  if (!apiKey) return;
  if (!env.PRAYER_KV) return;
  try {
    const now = /* @__PURE__ */ new Date();
    const monthId = currentMonthId(now);
    const key = `${USAGE_PREFIX}${apiKey}:${monthId}`;
    let used = 0;
    const raw = await env.PRAYER_KV.get(key);
    if (raw) {
      try {
        const obj = JSON.parse(raw);
        if (typeof obj.used === "number" && obj.used >= 0) {
          used = obj.used;
        }
      } catch {
      }
    }
    used += amount;
    await env.PRAYER_KV.put(key, JSON.stringify({ used }));
  } catch (e) {
    console.error("incrementUsage error:", e);
  }
}
__name(incrementUsage, "incrementUsage");
async function handleUsage(request, env, ctx) {
  try {
    const apiKey = parseBearer(request);
    if (!apiKey) {
      const freeQuota = 1e3;
      return jsonResponse(
        {
          ok: true,
          plan: "free",
          used: 0,
          monthly_quota: freeQuota,
          remaining: freeQuota,
          expires_at: null,
          days_left: null
        },
        200
      );
    }
    const keyRecord = await getApiKeyRecord(env, apiKey);
    if (!keyRecord) {
      return jsonResponse({ ok: false, error: "Invalid API key" }, 401);
    }
    const now = /* @__PURE__ */ new Date();
    const monthId = currentMonthId(now);
    const usage = await getUsageForKey(env, apiKey, monthId);
    const plan = keyRecord.plan || "pro";
    let defaultProQuota = 5e4;
    if (env.DEFAULT_PRO_QUOTA) {
      const parsed = parseInt(env.DEFAULT_PRO_QUOTA, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        defaultProQuota = parsed;
      }
    }
    const monthlyQuota = Number.isFinite(keyRecord.monthly_quota) ? keyRecord.monthly_quota : defaultProQuota;
    const used = Math.max(0, usage.used);
    const remaining = Math.max(0, monthlyQuota - used);
    let expires_at = keyRecord.expires_at || null;
    let days_left = null;
    if (expires_at) {
      const expDate = new Date(expires_at);
      if (!isNaN(expDate.getTime())) {
        const diffMs = expDate.getTime() - now.getTime();
        const rawDays = diffMs / (1e3 * 60 * 60 * 24);
        days_left = Math.max(0, Math.floor(rawDays));
      } else {
        expires_at = null;
      }
    }
    return jsonResponse(
      {
        ok: true,
        plan,
        used,
        monthly_quota: monthlyQuota,
        remaining,
        expires_at,
        days_left
      },
      200
    );
  } catch (err) {
    return jsonResponse(
      {
        ok: false,
        error: err.message || String(err)
      },
      500
    );
  }
}
__name(handleUsage, "handleUsage");
function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}
__name(jsonResponse, "jsonResponse");

// src/routes/geocode.js
var KV_PREFIX = "geo:";
function normalizeQuery(q) {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}
__name(normalizeQuery, "normalizeQuery");
async function fetchFromProvider(originalQuery) {
  const query = originalQuery.trim();
  async function attempt(lang) {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.searchParams.set("name", query);
    url.searchParams.set("count", "5");
    url.searchParams.set("language", lang);
    url.searchParams.set("format", "json");
    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json"
      }
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
  __name(attempt, "attempt");
  let result = await attempt("ar");
  if (!result) {
    result = await attempt("en");
  }
  return result;
}
__name(fetchFromProvider, "fetchFromProvider");
async function handleGeocode(request, env, ctx) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") || "";
    if (!q.trim()) {
      return jsonResponse2(
        { ok: false, error: "Missing 'q' query parameter." },
        400
      );
    }
    const normalized = normalizeQuery(q);
    const kvKey = KV_PREFIX + normalized;
    if (env.PRAYER_KV) {
      const cachedStr = await env.PRAYER_KV.get(kvKey);
      if (cachedStr) {
        try {
          const parsed = JSON.parse(cachedStr);
          if (parsed) {
            const apiKey2 = parseBearer(request);
            await incrementUsage(env, apiKey2, 1);
            return jsonResponse2({
              ok: true,
              cached: true,
              result: parsed
            });
          }
        } catch {
        }
      }
    }
    const result = await fetchFromProvider(q);
    if (!result) {
      return jsonResponse2(
        {
          ok: false,
          cached: false,
          error: "No results from geocoding provider. \u062D\u0627\u0648\u0644 \u0643\u062A\u0627\u0628\u0629 \u0627\u0633\u0645 \u0623\u0648\u0636\u062D (\u0645\u062B\u0644\u0627\u064B: 'Tanger, Morocco' \u0623\u0648 '\u0637\u0646\u062C\u0629 \u0627\u0644\u0645\u063A\u0631\u0628')."
        },
        404
      );
    }
    if (env.PRAYER_KV) {
      ctx.waitUntil(
        env.PRAYER_KV.put(kvKey, JSON.stringify(result), {
          expirationTtl: 60 * 60 * 24 * 30
        })
      );
    }
    const apiKey = parseBearer(request);
    await incrementUsage(env, apiKey, 1);
    return jsonResponse2({
      ok: true,
      cached: false,
      result
    });
  } catch (err) {
    return jsonResponse2(
      {
        ok: false,
        error: err.message || String(err)
      },
      500
    );
  }
}
__name(handleGeocode, "handleGeocode");
function jsonResponse2(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}
__name(jsonResponse2, "jsonResponse");

// src/routes/elevation.js
var KV_PREFIX2 = "elev:";
function makeKey(lat, lon) {
  const latStr = lat.toFixed(4);
  const lonStr = lon.toFixed(4);
  return KV_PREFIX2 + latStr + "," + lonStr;
}
__name(makeKey, "makeKey");
async function fetchElevation(lat, lon) {
  const url = new URL("https://api.open-meteo.com/v1/elevation");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json"
    }
  });
  if (!res.ok) {
    throw new Error(`Elevation provider HTTP ${res.status}`);
  }
  const data = await res.json();
  if (!data || !Array.isArray(data.elevation) || data.elevation.length === 0) {
    return null;
  }
  const value = data.elevation[0];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  return value;
}
__name(fetchElevation, "fetchElevation");
async function handleElevation(request, env, ctx) {
  try {
    const url = new URL(request.url);
    const latStr = url.searchParams.get("lat");
    const lonStr = url.searchParams.get("lon");
    if (!latStr || !lonStr) {
      return jsonResponse3(
        {
          ok: false,
          error: "Missing 'lat' or 'lon' query parameters."
        },
        400
      );
    }
    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return jsonResponse3(
        {
          ok: false,
          error: "Invalid 'lat' or 'lon' values."
        },
        400
      );
    }
    const kvKey = makeKey(lat, lon);
    if (env.PRAYER_KV) {
      const cachedStr = await env.PRAYER_KV.get(kvKey);
      if (cachedStr) {
        try {
          const parsed = JSON.parse(cachedStr);
          if (typeof parsed.elevation_m === "number") {
            const apiKey2 = parseBearer(request);
            await incrementUsage(env, apiKey2, 1);
            return jsonResponse3({
              ok: true,
              cached: true,
              elevation_m: parsed.elevation_m
            });
          }
        } catch {
        }
      }
    }
    const elevationValue = await fetchElevation(lat, lon);
    if (elevationValue == null) {
      return jsonResponse3(
        {
          ok: false,
          cached: false,
          elevation_m: null,
          error: "No elevation data from provider."
        },
        404
      );
    }
    if (env.PRAYER_KV) {
      const payload = { elevation_m: elevationValue };
      ctx.waitUntil(
        env.PRAYER_KV.put(kvKey, JSON.stringify(payload), {
          expirationTtl: 60 * 60 * 24 * 30
          // 30 يوم
        })
      );
    }
    const apiKey = parseBearer(request);
    await incrementUsage(env, apiKey, 1);
    return jsonResponse3({
      ok: true,
      cached: false,
      elevation_m: elevationValue
    });
  } catch (err) {
    return jsonResponse3(
      {
        ok: false,
        error: err.message || String(err)
      },
      500
    );
  }
}
__name(handleElevation, "handleElevation");
function jsonResponse3(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}
__name(jsonResponse3, "jsonResponse");

// src/routes/weather.js
var KV_PREFIX3 = "weather:";
function makeKey2(lat, lon, hourly) {
  const latStr = lat.toFixed(4);
  const lonStr = lon.toFixed(4);
  const hourlyStr = (hourly || "").trim().toLowerCase();
  return `${KV_PREFIX3}${latStr},${lonStr},${hourlyStr}`;
}
__name(makeKey2, "makeKey");
async function fetchWeather(lat, lon, hourly) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  if (hourly && hourly.trim()) {
    url.searchParams.set("hourly", hourly.trim());
  } else {
    url.searchParams.set("hourly", "temperature_2m,pressure_msl");
  }
  url.searchParams.set("timezone", "auto");
  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json"
    }
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
__name(fetchWeather, "fetchWeather");
async function handleWeather(request, env, ctx) {
  try {
    const url = new URL(request.url);
    const latStr = url.searchParams.get("lat");
    const lonStr = url.searchParams.get("lon");
    const hourlyParam = url.searchParams.get("hourly") || "";
    if (!latStr || !lonStr) {
      return jsonResponse4(
        {
          ok: false,
          error: "Missing 'lat' or 'lon' query parameters."
        },
        400
      );
    }
    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return jsonResponse4(
        {
          ok: false,
          error: "Invalid 'lat' or 'lon' values."
        },
        400
      );
    }
    const kvKey = makeKey2(lat, lon, hourlyParam);
    if (env.PRAYER_KV) {
      const cachedStr = await env.PRAYER_KV.get(kvKey);
      if (cachedStr) {
        try {
          const parsed = JSON.parse(cachedStr);
          if (parsed && parsed.data) {
            const apiKey2 = parseBearer(request);
            await incrementUsage(env, apiKey2, 1);
            return jsonResponse4({
              ok: true,
              cached: true,
              data: parsed.data
            });
          }
        } catch {
        }
      }
    }
    const data = await fetchWeather(lat, lon, hourlyParam);
    if (!data) {
      return jsonResponse4(
        {
          ok: false,
          cached: false,
          error: "No weather data from provider."
        },
        404
      );
    }
    if (env.PRAYER_KV) {
      const payload = { data };
      ctx.waitUntil(
        env.PRAYER_KV.put(kvKey, JSON.stringify(payload), {
          expirationTtl: 60 * 60 * 3
          // 3 ساعات
        })
      );
    }
    const apiKey = parseBearer(request);
    await incrementUsage(env, apiKey, 1);
    return jsonResponse4({
      ok: true,
      cached: false,
      data
    });
  } catch (err) {
    return jsonResponse4(
      {
        ok: false,
        error: err.message || String(err)
      },
      500
    );
  }
}
__name(handleWeather, "handleWeather");
function jsonResponse4(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}
__name(jsonResponse4, "jsonResponse");

// src/routes/admin.js
var APIKEY_PREFIX2 = "apikey:";
var PLAN_DEFAULTS = {
  free: { monthly_quota: 1e3 },
  plus: { monthly_quota: 2e4 },
  pro: { monthly_quota: 5e4 }
};
function jsonResponse5(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}
__name(jsonResponse5, "jsonResponse");
function isAdmin(request, env) {
  const header = request.headers.get("x-admin-password");
  if (header && header === "yassineADMIN@#1234567") {
    return true;
  }
  const auth = request.headers.get("authorization") || "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    const token = auth.slice(7).trim();
    if (token === "yassineADMIN@#1234567") {
      return true;
    }
  }
  return false;
}
__name(isAdmin, "isAdmin");
async function readJsonBody(request) {
  try {
    const text = await request.text();
    if (!text) return {};
    return JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON body.");
  }
}
__name(readJsonBody, "readJsonBody");
function generateApiKey() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  return "pt_" + hex;
}
__name(generateApiKey, "generateApiKey");
async function getApiKeyRecord2(env, apiKey) {
  if (!env.PRAYER_KV) {
    throw new Error("PRAYER_KV is not configured.");
  }
  const raw = await env.PRAYER_KV.get(APIKEY_PREFIX2 + apiKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
__name(getApiKeyRecord2, "getApiKeyRecord");
async function saveApiKeyRecord(env, apiKey, record) {
  if (!env.PRAYER_KV) {
    throw new Error("PRAYER_KV is not configured.");
  }
  await env.PRAYER_KV.put(APIKEY_PREFIX2 + apiKey, JSON.stringify(record));
}
__name(saveApiKeyRecord, "saveApiKeyRecord");
async function handleAdmin(request, env, ctx) {
  try {
    if (request.method !== "POST") {
      return jsonResponse5({ ok: false, error: "Only POST is allowed." }, 405);
    }
    if (!isAdmin(request, env)) {
      return jsonResponse5({ ok: false, error: "Unauthorized" }, 401);
    }
    const body = await readJsonBody(request);
    const action = (body.action || "").trim();
    if (!action) {
      return jsonResponse5(
        { ok: false, error: "Missing 'action' in body." },
        400
      );
    }
    if (action === "create_key") {
      const now = /* @__PURE__ */ new Date();
      const plan = (body.plan || "pro").toLowerCase();
      let defaultProQuota = 5e4;
      if (env.DEFAULT_PRO_QUOTA) {
        const parsed = parseInt(env.DEFAULT_PRO_QUOTA, 10);
        if (Number.isFinite(parsed) && parsed > 0) {
          defaultProQuota = parsed;
        }
      }
      let monthlyQuota;
      if (typeof body.monthly_quota === "number" && body.monthly_quota > 0) {
        monthlyQuota = body.monthly_quota;
      } else if (PLAN_DEFAULTS[plan]?.monthly_quota) {
        monthlyQuota = PLAN_DEFAULTS[plan].monthly_quota;
      } else {
        monthlyQuota = plan === "free" ? 1e3 : defaultProQuota;
      }
      let expires_at = null;
      if (body.expires_at) {
        const d = new Date(body.expires_at);
        if (!isNaN(d.getTime())) {
          expires_at = d.toISOString();
        }
      } else {
        if (plan === "plus" || plan === "pro") {
          const d = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1e3);
          expires_at = d.toISOString();
        } else {
          expires_at = null;
        }
      }
      const apiKey = generateApiKey();
      const record = {
        key: apiKey,
        plan,
        monthly_quota: monthlyQuota,
        created_at: now.toISOString(),
        expires_at
      };
      await saveApiKeyRecord(env, apiKey, record);
      return jsonResponse5(
        {
          ok: true,
          api_key: apiKey,
          plan,
          monthly_quota: monthlyQuota,
          expires_at
        },
        200
      );
    }
    if (action === "get_key") {
      const apiKey = (body.key || "").trim();
      if (!apiKey) {
        return jsonResponse5(
          { ok: false, error: "Missing 'key' field." },
          400
        );
      }
      const record = await getApiKeyRecord2(env, apiKey);
      if (!record) {
        return jsonResponse5(
          { ok: false, error: "Key not found." },
          404
        );
      }
      return jsonResponse5({ ok: true, record }, 200);
    }
    if (action === "update_key") {
      const apiKey = (body.key || "").trim();
      if (!apiKey) {
        return jsonResponse5(
          { ok: false, error: "Missing 'key' field." },
          400
        );
      }
      const record = await getApiKeyRecord2(env, apiKey);
      if (!record) {
        return jsonResponse5(
          { ok: false, error: "Key not found." },
          404
        );
      }
      if (body.plan) {
        record.plan = String(body.plan).toLowerCase();
      }
      if (typeof body.monthly_quota === "number" && body.monthly_quota > 0) {
        record.monthly_quota = body.monthly_quota;
      }
      if (body.expires_at !== void 0) {
        if (body.expires_at === null || body.expires_at === "") {
          record.expires_at = null;
        } else {
          const d = new Date(body.expires_at);
          if (!isNaN(d.getTime())) {
            record.expires_at = d.toISOString();
          }
        }
      }
      await saveApiKeyRecord(env, apiKey, record);
      return jsonResponse5({ ok: true, record }, 200);
    }
    return jsonResponse5({ ok: false, error: "Unknown action." }, 400);
  } catch (err) {
    return jsonResponse5(
      {
        ok: false,
        error: err.message || String(err)
      },
      500
    );
  }
}
__name(handleAdmin, "handleAdmin");

// src/index.js
function withCors(response, request) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Admin-Password"
  );
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
__name(withCors, "withCors");
function handleOptions(request) {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Admin-Password",
      "Access-Control-Max-Age": "86400"
    }
  });
}
__name(handleOptions, "handleOptions");
var src_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    if (request.method === "OPTIONS") {
      return handleOptions(request);
    }
    if (pathname === "/api/geocode") {
      const res2 = await handleGeocode(request, env, ctx);
      return withCors(res2, request);
    }
    if (pathname === "/api/elevation") {
      const res2 = await handleElevation(request, env, ctx);
      return withCors(res2, request);
    }
    if (pathname === "/api/weather") {
      const res2 = await handleWeather(request, env, ctx);
      return withCors(res2, request);
    }
    if (pathname === "/api/usage") {
      const res2 = await handleUsage(request, env, ctx);
      return withCors(res2, request);
    }
    if (pathname === "/api/admin") {
      const res2 = await handleAdmin(request, env, ctx);
      return withCors(res2, request);
    }
    if (pathname === "/" || pathname === "/health") {
      const info = {
        app: env.APP_NAME || "prayer-times",
        version: env.APP_VERSION || "0.1.0",
        message: "Prayer Times API worker is running."
      };
      const res2 = new Response(JSON.stringify(info), {
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
      return withCors(res2, request);
    }
    const res = new Response("Not found", { status: 404 });
    return withCors(res, request);
  }
};

// ../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-oi4exc/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-oi4exc/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
