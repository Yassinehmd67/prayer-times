# KV Schema — prayer-times

هذا الملف يشرح المفاتيح المستخدمة في PRAYER_KV:

- `key:<API_KEY>`  
  قيمة JSON:
  ```json
  {
    "plan": "pro | free | org",
    "quota_monthly": 50000,
    "created_at": "ISO",
    "expires_at": "ISO",
    "is_active": true,
    "notes": "string"
  }
