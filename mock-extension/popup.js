// popup.js

document.addEventListener("DOMContentLoaded", () => {
  const statusEl     = document.getElementById("status");
  const countEl      = document.getElementById("mockCount");
  const globalToggle = document.getElementById("globalToggle");
  const uatToggle    = document.getElementById("uatToggle");
  const prodToggle   = document.getElementById("prodToggle");

  // Update mockCount and toggle UI
  function refreshUI({ mockCount, redirectDomains = ["prod"], mockingEnabled = true }) {
    countEl.textContent = Number.isInteger(mockCount) ? mockCount : "–";
    const env = redirectDomains[0];
    uatToggle.checked  = env === "uat";
    prodToggle.checked = env === "prod";
    globalToggle.checked = mockingEnabled !== false;
  }

  // Initial load
  chrome.storage.local.get(
    ["mockCount", "redirectDomains", "mockingEnabled"],
    refreshUI
  );

  // Live update when storage changes
  chrome.storage.onChanged.addListener((changes) => {
    const updated = {};
    if (changes.mockCount)       updated.mockCount       = changes.mockCount.newValue;
    if (changes.redirectDomains) updated.redirectDomains = changes.redirectDomains.newValue;
    if (changes.mockingEnabled)  updated.mockingEnabled  = changes.mockingEnabled.newValue;
    if (Object.keys(updated).length) refreshUI(updated);
  });

  // When toggles change, write storage and trigger an immediate sync
  function onToggleChange(key, value) {
    chrome.storage.local.set({ [key]: value }, () => {
      chrome.runtime.sendMessage("syncNow");
    });
  }

  globalToggle.addEventListener("change", () =>
    onToggleChange("mockingEnabled", globalToggle.checked)
  );
  uatToggle.addEventListener("change", () =>
    onToggleChange("redirectDomains", ["uat"])
  );
  prodToggle.addEventListener("change", () =>
    onToggleChange("redirectDomains", ["prod"])
  );

  async function checkHealth() {
    // read the toggle state
    const { mockingEnabled = true } = await chrome.storage.local.get("mockingEnabled");
    if (!mockingEnabled) {
      // don’t hit the server when disabled
      statusEl.textContent = "⚪ Disabled";
      statusEl.className   = "disconnected";
      return;
    }

    try {
      const res = await fetch("https://localhost:4000/__health");
      const ok  = res.ok;
      statusEl.textContent = ok ? "✅ Connected" : "❌ Not connected";
      statusEl.className   = ok ? "connected"     : "disconnected";
    } catch {
      statusEl.textContent = "❌ Not connected";
      statusEl.className   = "disconnected";
    }
  }

  // run immediately and then every second
  checkHealth();
  setInterval(checkHealth, 3000);
});
