document.addEventListener("DOMContentLoaded", () => {
  const statusEl     = document.getElementById("status");
  const countEl      = document.getElementById("mockCount");
  const globalToggle = document.getElementById("globalToggle");
  const uatToggle    = document.getElementById("uatToggle");
  const prodToggle   = document.getElementById("prodToggle");

  function refreshUI({ mockCount, redirectDomains = ["prod"], mockingEnabled = true, endpointSummary = {} }) {
    if (countEl) countEl.textContent = Number.isInteger(mockCount) ? mockCount : "–";
    const env = redirectDomains[0];
    if (uatToggle) uatToggle.checked  = env === "uat";
    if (prodToggle) prodToggle.checked = env === "prod";
    if (globalToggle) globalToggle.checked = mockingEnabled !== false;

    const mockListEl = document.getElementById("mockList");
    if (mockListEl) {
      mockListEl.innerHTML = "";
      for (const [endpoint, count] of Object.entries(endpointSummary)) {
        const row = document.createElement("div");
        row.textContent = `${endpoint} (${count})`;
        mockListEl.appendChild(row);
      }
    }
  }

  chrome.storage.local.get(
    ["mockCount", "redirectDomains", "mockingEnabled", "endpointSummary"],
    refreshUI
  );

  chrome.storage.onChanged.addListener((changes) => {
    const updated = {};
    if (changes.mockCount)       updated.mockCount       = changes.mockCount.newValue;
    if (changes.redirectDomains) updated.redirectDomains = changes.redirectDomains.newValue;
    if (changes.mockingEnabled)  updated.mockingEnabled  = changes.mockingEnabled.newValue;
    if (changes.endpointSummary) updated.endpointSummary = changes.endpointSummary.newValue;
    if (Object.keys(updated).length) refreshUI(updated);
  });

  function onToggleChange(key, value) {
    chrome.storage.local.set({ [key]: value }, () => {
      chrome.runtime.sendMessage("syncNow");
    });
  }

  if (globalToggle) {
    globalToggle.addEventListener("change", () =>
      onToggleChange("mockingEnabled", globalToggle.checked)
    );
  }
  if (uatToggle) {
    uatToggle.addEventListener("change", () =>
      onToggleChange("redirectDomains", ["uat"])
    );
  }
  if (prodToggle) {
    prodToggle.addEventListener("change", () =>
      onToggleChange("redirectDomains", ["prod"])
    );
  }

  async function checkHealth() {
    const { mockingEnabled = true } = await chrome.storage.local.get("mockingEnabled");
    if (!mockingEnabled) {
      if (statusEl) {
        statusEl.textContent = "⚪ Disabled";
        statusEl.className   = "disconnected";
      }
      return;
    }

    try {
      const res = await fetch("https://localhost:4000/__health");
      const ok  = res.ok;
      if (statusEl) {
        statusEl.textContent = ok ? "✅ Connected" : "❌ Not connected";
        statusEl.className   = ok ? "connected"     : "disconnected";
      }
    } catch {
      if (statusEl) {
        statusEl.textContent = "❌ Not connected";
        statusEl.className   = "disconnected";
      }
    }
  }

  checkHealth();
  setInterval(checkHealth, 3000);
});