// lib/geo.js — دوال مساعدة للتعامل مع /api/geocode

const API_BASE = "http://127.0.0.1:8787";

export async function geocode(query) {
  const res = await fetch(
    `${API_BASE}/api/geocode?q=${encodeURIComponent(query)}`
  );
  const json = await res.json();
  if (!res.ok || !json.ok) {
    throw new Error(json.error || "Geocode failed");
  }
  return json;
}
