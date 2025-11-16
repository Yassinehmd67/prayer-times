// lib/api.js — غلاف عام لاستدعاءات الـ API (اختياري)

const API_BASE = "http://127.0.0.1:8787";

export async function apiFetch(path, options = {}, apiKey = null) {
  const headers = options.headers || {};
  headers["Content-Type"] = "application/json";
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

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
