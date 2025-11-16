# prayer-times Worker

بوابة API لمشروع حساب المواقيت.

## المسارات الحالية

- `GET /health` — فحص صحة الـ Worker.
- `GET /api/geocode?q=` — وكيل Nominatim مع كاش.
- `GET /api/elevation?lat=&lon=` — وكيل Open-Meteo Elevation.
- `GET /api/weather?lat=&lon=` — وكيل Open-Meteo Forecast.
- `GET /api/usage` — يعرض حالة الخطة والاستهلاك (يتطلب Bearer API key).
- `POST /admin/keys` وغيرها — إدارة مفاتيح API (Basic Auth مع ADMIN_PASSWORD).

## ملاحظات

- بيانات المفاتيح والاستهلاك والكاش محفوظة في PRAYER_KV.
- الحساب الفلكي يتم حالياً في الواجهة (frontend/src/lib/calc.js).
