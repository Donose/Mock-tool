document.addEventListener("DOMContentLoaded", () => {
  const statusEl = document.getElementById("status");
  const countEl = document.getElementById("mockCount");
  const globalToggle = document.getElementById("globalToggle");
  const uatToggle = document.getElementById("uatToggle");
  const prodToggle = document.getElementById("prodToggle");

  // Load initial states
  chrome.storage.local.get(["mockConnected", "mockCount", "redirectDomains", "mockingEnabled"], (result) => {
    const connected = result.mockConnected === true;
    statusEl.textContent = connected ? "✅ Connected" : "❌ Not connected";
    statusEl.className = connected ? "connected" : "disconnected";
    countEl.textContent = typeof result.mockCount === "number" ? result.mockCount : "–";

    const activeEnv = result.redirectDomains?.[0] || "uat";
    uatToggle.checked = activeEnv === "uat";
    prodToggle.checked = activeEnv === "prod";

    const enabled = result.mockingEnabled !== false; // default ON
    globalToggle.checked = enabled;
  });

  // Global ON/OFF toggle
  globalToggle.addEventListener("change", () => {
    const mockingEnabled = globalToggle.checked;
    chrome.storage.local.set({ mockingEnabled });
  });

  // Environment toggles
  uatToggle.addEventListener("change", () => {
    chrome.storage.local.set({ redirectDomains: ["uat"] });
  });

  prodToggle.addEventListener("change", () => {
    chrome.storage.local.set({ redirectDomains: ["prod"] });
  });

  // Auto-refresh UI every second
  setInterval(() => {
    chrome.storage.local.get(["mockConnected", "mockCount"], (result) => {
      const connected = result.mockConnected === true;
      statusEl.textContent = connected ? "✅ Connected" : "❌ Not connected";
      statusEl.className = connected ? "connected" : "disconnected";
      countEl.textContent = typeof result.mockCount === "number" ? result.mockCount : "–";
    });
  }, 1000);
});
