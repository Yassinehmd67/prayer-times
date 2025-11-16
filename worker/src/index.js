// src/index.js
// =============
// نقطة الدخول الرئيسية للـ Worker.
// يوجه المسارات إلى الـ handlers المختلفة (geocode, elevation, weather, usage, admin).

import { handleGeocode } from "./routes/geocode.js";
import { handleElevation } from "./routes/elevation.js";
import { handleWeather } from "./routes/weather.js";
import { handleUsage } from "./routes/usage.js";
import { handleAdmin } from "./routes/admin.js";

// CORS بسيط (يسمح من أي Origin) — مناسب للتجارب و GitHub Pages
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
    headers,
  });
}

// ردّ خاص لطلبات OPTIONS (preflight)
function handleOptions(request) {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, X-Admin-Password",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (request.method === "OPTIONS") {
      return handleOptions(request);
    }

    // مسارات API
    if (pathname === "/api/geocode") {
      const res = await handleGeocode(request, env, ctx);
      return withCors(res, request);
    }

    if (pathname === "/api/elevation") {
      const res = await handleElevation(request, env, ctx);
      return withCors(res, request);
    }

    if (pathname === "/api/weather") {
      const res = await handleWeather(request, env, ctx);
      return withCors(res, request);
    }

    if (pathname === "/api/usage") {
      const res = await handleUsage(request, env, ctx);
      return withCors(res, request);
    }

    if (pathname === "/api/admin") {
      const res = await handleAdmin(request, env, ctx);
      return withCors(res, request);
    }

    // صفحة بسيطة للمسار الجذر
    if (pathname === "/" || pathname === "/health") {
      const info = {
        app: env.APP_NAME || "prayer-times",
        version: env.APP_VERSION || "0.1.0",
        message: "Prayer Times API worker is running.",
      };
      const res = new Response(JSON.stringify(info), {
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
      return withCors(res, request);
    }

    const res = new Response("Not found", { status: 404 });
    return withCors(res, request);
  },
};
