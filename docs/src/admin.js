// docs/src/admin.js — واجهة الأدمين للـ API

const API_BASE = "https://prayer-times-api.yassinehmd67.workers.dev";

// عناصر DOM
const adminPasswordInput = document.getElementById("admin-password");
const outputPre = document.getElementById("admin-output");

// إنشاء مفتاح
const createPlanSelect = document.getElementById("create-plan");
const createQuotaInput = document.getElementById("create-quota");
const createExpiresInput = document.getElementById("create-expires");
const createKeyBtn = document.getElementById("create-key-btn");

// قراءة مفتاح
const getKeyInput = document.getElementById("get-key-input");
const getKeyBtn = document.getElementById("get-key-btn");

// تحديث مفتاح
const updateKeyInput = document.getElementById("update-key-input");
const updatePlanSelect = document.getElementById("update-plan");
const updateQuotaInput = document.getElementById("update-quota");
const updateExpiresInput = document.getElementById("update-expires");
const updateKeyBtn = document.getElementById("update-key-btn");

// أداة مساعدة
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

function logResponse(obj) {
  try {
    outputPre.textContent = JSON.stringify(obj, null, 2);
  } catch {
    outputPre.textContent = String(obj);
  }
}

// استدعاء /api/admin
async function adminFetch(body, buttonForLoading) {
  const password = (adminPasswordInput.value || "").trim();
  if (!password) {
    alert("يرجى إدخال كلمة مرور الأدمين أولاً.");
    throw new Error("Missing admin password");
  }

  setLoading(buttonForLoading, true);
  try {
    const res = await fetch(`${API_BASE}/api/admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Password": password,
      },
      body: JSON.stringify(body || {}),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const msg =
        data && data.error
          ? data.error
          : `HTTP ${res.status} ${res.statusText}`;
      throw new Error(msg);
    }

    logResponse(data);
    return data;
  } finally {
    setLoading(buttonForLoading, false);
  }
}

// ========== إنشاء مفتاح جديد ==========
createKeyBtn.addEventListener("click", async () => {
  const plan = (createPlanSelect.value || "pro").toLowerCase();
  const quotaStr = createQuotaInput.value.trim();
  const expiresStr = createExpiresInput.value.trim();

  const body = {
    action: "create_key",
    plan,
  };

  if (quotaStr !== "") {
    const quotaNum = parseInt(quotaStr, 10);
    if (!Number.isFinite(quotaNum) || quotaNum <= 0) {
      alert("الرجاء إدخال كوتا شهرية صحيحة (عدد موجب) أو ترك الخانة فارغة.");
      return;
    }
    body.monthly_quota = quotaNum;
  }

  if (expiresStr !== "") {
    body.expires_at = expiresStr; // مثال: 2025-12-31
  }

  try {
    await adminFetch(body, createKeyBtn);
  } catch (err) {
    logResponse({ ok: false, error: err.message || String(err) });
    alert("حدث خطأ أثناء إنشاء المفتاح. راجع التفاصيل في الأسفل.");
  }
});

// ========== قراءة بيانات مفتاح ==========
getKeyBtn.addEventListener("click", async () => {
  const key = getKeyInput.value.trim();
  if (!key) {
    alert("يرجى إدخال مفتاح API أولاً.");
    return;
  }

  const body = {
    action: "get_key",
    key,
  };

  try {
    await adminFetch(body, getKeyBtn);
  } catch (err) {
    logResponse({ ok: false, error: err.message || String(err) });
    alert("حدث خطأ أثناء جلب بيانات المفتاح.");
  }
});

// ========== تحديث مفتاح ==========
updateKeyBtn.addEventListener("click", async () => {
  const key = updateKeyInput.value.trim();
  if (!key) {
    alert("يرجى إدخال المفتاح المراد تعديله.");
    return;
  }

  const body = {
    action: "update_key",
    key,
  };

  const plan = updatePlanSelect.value.trim();
  const quotaStr = updateQuotaInput.value.trim();
  const expiresStr = updateExpiresInput.value.trim();

  if (plan !== "") {
    body.plan = plan.toLowerCase();
  }

  if (quotaStr !== "") {
    const quotaNum = parseInt(quotaStr, 10);
    if (!Number.isFinite(quotaNum) || quotaNum <= 0) {
      alert("الرجاء إدخال كوتا شهرية صحيحة (عدد موجب) أو ترك الخانة فارغة.");
      return;
    }
    body.monthly_quota = quotaNum;
  }

  if (expiresStr !== "") {
    if (expiresStr.toLowerCase() === "none") {
      body.expires_at = null;
    } else {
      body.expires_at = expiresStr;
    }
  }

  try {
    await adminFetch(body, updateKeyBtn);
  } catch (err) {
    logResponse({ ok: false, error: err.message || String(err) });
    alert("حدث خطأ أثناء تعديل المفتاح.");
  }
});

// قيمة افتراضية للـ output
logResponse({ ok: true, message: "جاهز لاستقبال أوامر الأدمين." });
